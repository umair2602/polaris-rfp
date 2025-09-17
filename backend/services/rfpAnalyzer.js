// services/RFPAnalyzer.js
const pdf = require("pdf-parse");
const OpenAI = require("openai");
const axios = require("axios");
const cheerio = require("cheerio");
const SpecializedExtractors = require("./specializedExtractors");

class RFPAnalyzer {
  constructor() {
    // Lazy: allow running without OpenAI key (AI features will be disabled)
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

    // Initialize specialized extractors
    this.specializedExtractors = new SpecializedExtractors(this.openai);

    // Regexes / helpers used across methods
    this.dateRegexes = [
      // e.g. January 1, 2025
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      // e.g. 01/02/2025 or 1-2-25
      /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
      // e.g. 1 January 2025
      /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*,?\s+\d{4}\b/gi,
    ];
    this.moneyRegex =
      /\b(?:USD|US\$|\$|£|€)\s?\d{1,3}(?:[,\d{3}]*)(?:\.\d{1,2})?\b/g;
    this.emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    this.phoneRegex =
      /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
    this.percentRegex = /\b\d{1,3}\s?%/g;
    this.sectionHeaderRegex = /^\s{0,3}[A-Z][A-Za-z0-9 \-]{2,60}:\s*$/m;
  }

  // ------------------------------
  // PDF / URL text extraction
  // ------------------------------
  async extractTextFromPDF(buffer) {
    try {
      const data = await pdf(buffer);
      let text = data.text || "";

      // Normalize newlines and whitespace
      text = text.replace(/\r\n|\r/g, "\n");
      // Remove repeated blank lines
      text = text.replace(/\n{3,}/g, "\n\n");
      // Trim trailing/leading spaces on each line
      text = text
        .split("\n")
        .map((l) => l.trim())
        .join("\n");
      // Remove common page footer/header artifacts using heuristics
      text = this._removeRepeatHeadersAndFooters(text);
      // Collapse multiple spaces into single space, but preserve newlines
      text = text.replace(/[ \t]{2,}/g, " ");
      // Trim
      text = text.trim();
      return text;
    } catch (err) {
      throw new Error(`PDF extraction failed: ${err.message || err}`);
    }
  }

  async extractTextFromURL(url) {
    try {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(url)) {
        throw new Error("Invalid URL format. Provide an http/https URL.");
      }

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        maxContentLength: 50 * 1024 * 1024,
        validateStatus: (s) => s >= 200 && s < 400,
      });

      const $ = cheerio.load(response.data);

      // Remove noisy nodes
      $(
        "script, style, noscript, nav, header, footer, aside, .sidebar, .ad, .advertisement"
      ).remove();

      // Try prioritized selectors
      const selectors = [
        "main",
        '[role="main"]',
        ".main-content",
        "#main-content",
        ".content",
        "#content",
        ".post-content",
        ".entry-content",
        "article",
      ];

      let text = "";
      for (const sel of selectors) {
        const el = $(sel);
        if (el.length && el.text().trim().length > 200) {
          text = el.text();
          break;
        }
      }

      if (!text) {
        text = $("body").text();
      }

      // Clean and normalize
      text = text.replace(/\r\n|\r/g, "\n");
      text = text.replace(/\n{3,}/g, "\n\n");
      text = text
        .split("\n")
        .map((l) => l.trim())
        .join("\n");
      text = text.replace(/[ \t]{2,}/g, " ").trim();

      if (text.length < 100) {
        throw new Error(
          "Insufficient content extracted from URL -- may be dynamic or protected."
        );
      }

      return text;
    } catch (err) {
      if (err.code === "ENOTFOUND") {
        throw new Error("Unable to reach the URL. Check connectivity.");
      } else if (err.response) {
        throw new Error(
          `HTTP ${err.response.status}: ${err.response.statusText}`
        );
      }
      throw new Error(`URL extraction failed: ${err.message || err}`);
    }
  }

  extractTitleFromURL(url) {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, "");
      const parts = u.pathname.split("/").filter(Boolean);
      const last = parts.pop() || "rfp";
      return `${host} - ${last}`.replace(/[-_]/g, " ");
    } catch (err) {
      return "RFP from URL";
    }
  }

  // ------------------------------
  // Helper: remove repeated header / footer lines
  // ------------------------------
  _removeRepeatHeadersAndFooters(text) {
    // Heuristic: find lines that appear across multiple pages and remove them
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 10) return text;

    const freq = {};
    // consider first 6 and last 6 lines as possible headers/footers candidates
    const candidates = [
      ...lines.slice(0, Math.min(6, lines.length)),
      ...lines.slice(-Math.min(6, lines.length)),
    ];
    candidates.forEach((ln) => (freq[ln] = (freq[ln] || 0) + 1));

    const repeated = new Set(
      Object.keys(freq).filter((k) => freq[k] > 1 && k.length > 3)
    );
    if (repeated.size === 0) return text;

    // Remove repeated exact lines globally
    const cleaned = text
      .split("\n")
      .filter((l) => !repeated.has(l.trim()))
      .join("\n");
    return cleaned;
  }

  // ------------------------------
  // Chunking utility
  // ------------------------------
  _chunkText(text, maxChars = 6000) {
    // Try to preserve paragraph boundaries
    const paragraphs = text.split("\n\n");
    const chunks = [];
    let buffer = "";

    for (const p of paragraphs) {
      if ((buffer + "\n\n" + p).length <= maxChars) {
        buffer = buffer ? buffer + "\n\n" + p : p;
      } else {
        if (buffer) chunks.push(buffer);
        if (p.length > maxChars) {
          // large paragraph — split by sentences
          for (let i = 0; i < p.length; i += maxChars) {
            chunks.push(p.slice(i, i + maxChars));
          }
          buffer = "";
        } else {
          buffer = p;
        }
      }
    }
    if (buffer) chunks.push(buffer);
    return chunks;
  }

  // ------------------------------
  // Heuristic extraction (regex-based)
  // ------------------------------
  extractHeuristics(text) {
    const heuristics = {};

    // Dates: try to find likely submission deadline first (look around keywords)
    const lower = text.toLowerCase();
    let foundDeadline = null;
    const deadlineKeywords = [
      "submission deadline",
      "submit by",
      "due by",
      "proposal due",
      "deadline",
      "closing date",
      "submissions due",
    ];
    for (const kw of deadlineKeywords) {
      const idx = lower.indexOf(kw);
      if (idx !== -1) {
        // search in a window after the keyword
        const window = text.slice(Math.max(0, idx - 200), idx + 200);
        for (const reg of this.dateRegexes) {
          const m = window.match(reg);
          if (m && m.length) {
            foundDeadline = m[0];
            break;
          }
        }
        if (foundDeadline) break;
      }
    }
    // fallback: any date in document
    if (!foundDeadline) {
      for (const reg of this.dateRegexes) {
        const m = text.match(reg);
        if (m && m.length) {
          foundDeadline = m[0];
          break;
        }
      }
    }

    heuristics.submissionDeadline = foundDeadline || null;

    // Money
    const monies = (text.match(this.moneyRegex) || []).map((s) => s.trim());
    heuristics.budgetRange = monies.length
      ? [...new Set(monies)].join(" / ")
      : null;

    // Emails & phones
    const emails = (text.match(this.emailRegex) || []).map((s) => s.trim());
    const phones = (text.match(this.phoneRegex) || []).map((s) => s.trim());
    heuristics.contactEmails = emails.length
      ? [...new Set(emails)].slice(0, 5)
      : [];
    heuristics.contactPhones = phones.length
      ? [...new Set(phones)].slice(0, 5)
      : [];

    // Percentages (useful for evaluation criteria)
    heuristics.percentages = (text.match(this.percentRegex) || []).slice(0, 10);

    // Location heuristic: look for "Town of", "City of", or state abbreviation patterns
    const locMatch = text.match(
      /\b(?:Town|City|County|Municipality|State|Village) of [A-Z][A-Za-z ,'-]{2,60}/i
    );
    heuristics.location = locMatch ? locMatch[0] : null;

    // Titles (common RFP title lines)
    const titleMatch = text
      .split("\n")
      .find(
        (l) =>
          l &&
          l.length > 10 &&
          l.length < 120 &&
          /proposal|request for proposal|rfp|scope of work/i.test(l)
      );
    heuristics.possibleTitle = titleMatch || null;

    // Section headers detection (like Requirements, Deliverables)
    const lines = text.split("\n");
    const headersFound = [];
    for (const l of lines) {
      const t = l.trim();
      const lowerT = t.toLowerCase();
      if (
        /^(requirements|deliverables|evaluation criteria|scope of work|project scope|timeline|budget|submission)/i.test(
          lowerT
        )
      ) {
        headersFound.push(t);
      }
    }
    heuristics.detectedSections = [...new Set(headersFound)].slice(0, 10);

    return heuristics;
  }

  // ------------------------------
  // AI analysis per chunk (strict JSON schema)
  // ------------------------------
  async analyzeChunkWithAI(chunk, projectType = "general", attempt = 0) {
    if (!this.openai) return null;

    // system prompt enforces exact keys and "Not mentioned in the document" behavior
    const systemPrompt = `
You are a strict extractor. The user will provide a chunk of RFP text. 
Extract EXACTLY the following JSON object (no extra text, no commentary):

{
  "title": {
    "documentTitle": "string",
    "submittedBy": "string",
    "submittedTo": "string",
    "submissionDate": "string",
    "contact": {
      "name": "string",
      "email": "string",
      "phone": "string"
    }
  },
  "Key Personnel": {
    "Person Name - Role": ["responsibility/experience bullets as strings"]
  },
  "Project Understanding and Approach": {
    "overview": "string",
    "needs": ["string"],
    "approach": ["string"]
  },
  "Methodology (By Phase)": {
    "Phase 1: ...": ["deliverables"],
    "Phase 2: ...": ["deliverables"],
    "etc.": ["..."]
  },
  "Project Schedule": {
    "Months 1–2": "description",
    "Months 3–4": "description",
    "etc.": "..."
  },
  "Budget": {
    "total": "string",
    "Phase 1": {
      "roles": {"Role": "Cost"},
      "subtotal": "string"
    },
    "Phase 2": {
      "roles": {"Role": "Cost"},
      "subtotal": "string"
    }
  }
}

Rules:
- If a field is not present in this chunk, use "Not mentioned in the document" or an empty array/object.
- Do NOT invent data; only extract verbatim.
- Output must be valid JSON only (no markdown).`;

    const userPrompt = `Project Type Hint: ${projectType}\n\nRFP Chunk:\n\n${chunk}`;

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI call timeout")), 15000)
      );

      // Use chat completions (SDK interface used elsewhere in your code)
      const completionPromise = this.openai.chat.completions.create({
        model: "gpt-4o-mini", // fallback to your available model if you want change it
        temperature: 0.0,
        max_tokens: 1200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const completion = await Promise.race([
        completionPromise,
        timeoutPromise,
      ]);

      const raw = completion.choices?.[0]?.message?.content?.trim() || "";
      // Extract JSON substring
      const jsonMatch = raw.match(/\{[\s\S]*\}$/);
      const jsonText = jsonMatch ? jsonMatch[0] : raw;

      const parsed = JSON.parse(jsonText);

      // Ensure proper structure for new schema
      if (!parsed.title) parsed.title = {};
      if (!parsed["Key Personnel"]) parsed["Key Personnel"] = {};
      if (!parsed["Project Understanding and Approach"])
        parsed["Project Understanding and Approach"] = {};
      if (!parsed["Methodology (By Phase)"])
        parsed["Methodology (By Phase)"] = {};
      if (!parsed["Project Schedule"]) parsed["Project Schedule"] = {};
      if (!parsed["Budget"]) parsed["Budget"] = {};

      // Ensure contact object structure
      if (!parsed.title.contact) parsed.title.contact = {};

      // Ensure arrays for array fields
      if (parsed["Project Understanding and Approach"]) {
        const pua = parsed["Project Understanding and Approach"];
        if (!Array.isArray(pua.needs)) pua.needs = [];
        if (!Array.isArray(pua.approach)) pua.approach = [];
      }

      return parsed;
    } catch (err) {
      // If AI fails, return null and let heuristics fill later
      console.warn(
        `AI chunk parse failed (attempt ${attempt + 1}):`,
        err?.message || err
      );
      return null;
    }
  }

  // ------------------------------
  // Top-level analyzeWithAI: chunks + merge
  // ------------------------------
  async analyzeWithAI(fullText, projectType = "general", fileName = "RFP.pdf") {
    if (!this.openai) return null;

    // Limit to first 3 chunks to prevent timeout (max ~18k characters)
    const chunks = this._chunkText(fullText, 6000).slice(0, 3);
    console.log(`Processing ${chunks.length} chunks for AI analysis`);

    const merged = {
      title: {
        documentTitle: "Not mentioned in the document",
        submittedBy: "Not mentioned in the document",
        submittedTo: "Not mentioned in the document",
        submissionDate: "Not mentioned in the document",
        contact: {
          name: "Not mentioned in the document",
          email: "Not mentioned in the document",
          phone: "Not mentioned in the document",
        },
      },
      "Key Personnel": {},
      "Project Understanding and Approach": {
        overview: "Not mentioned in the document",
        needs: [],
        approach: [],
      },
      "Methodology (By Phase)": {},
      "Project Schedule": {},
      Budget: {},
    };

    // Process chunks in parallel for better performance
    const chunkPromises = chunks.map((chunk, i) => {
      console.log(`Starting chunk ${i + 1}/${chunks.length}`);
      return this.analyzeChunkWithAI(chunk, projectType, i);
    });

    const chunkResults = await Promise.allSettled(chunkPromises);

    for (let i = 0; i < chunkResults.length; i++) {
      const result = chunkResults[i];
      if (result.status === "rejected" || !result.value) {
        console.log(`Chunk ${i + 1} failed, skipping`);
        continue;
      }

      const aiResult = result.value;

      // Merge arrays (unique)
      const mergeUnique = (a, b) => {
        const set = new Set(a.concat(b.filter(Boolean)));
        return Array.from(set);
      };

      // Merge title information
      if (aiResult.title) {
        const title = aiResult.title;
        if (
          title.documentTitle &&
          title.documentTitle !== "Not mentioned in the document"
        ) {
          merged.title.documentTitle = title.documentTitle;
        }
        if (
          title.submittedBy &&
          title.submittedBy !== "Not mentioned in the document"
        ) {
          merged.title.submittedBy = title.submittedBy;
        }
        if (
          title.submittedTo &&
          title.submittedTo !== "Not mentioned in the document"
        ) {
          merged.title.submittedTo = title.submittedTo;
        }
        if (
          title.submissionDate &&
          title.submissionDate !== "Not mentioned in the document"
        ) {
          merged.title.submissionDate = title.submissionDate;
        }
        if (title.contact) {
          if (
            title.contact.name &&
            title.contact.name !== "Not mentioned in the document"
          ) {
            merged.title.contact.name = title.contact.name;
          }
          if (
            title.contact.email &&
            title.contact.email !== "Not mentioned in the document"
          ) {
            merged.title.contact.email = title.contact.email;
          }
          if (
            title.contact.phone &&
            title.contact.phone !== "Not mentioned in the document"
          ) {
            merged.title.contact.phone = title.contact.phone;
          }
        }
      }

      // Merge Key Personnel
      if (aiResult["Key Personnel"]) {
        Object.assign(merged["Key Personnel"], aiResult["Key Personnel"]);
      }

      // Merge Project Understanding and Approach
      if (aiResult["Project Understanding and Approach"]) {
        const pua = aiResult["Project Understanding and Approach"];
        if (pua.overview && pua.overview !== "Not mentioned in the document") {
          merged["Project Understanding and Approach"].overview = pua.overview;
        }
        if (pua.needs && Array.isArray(pua.needs)) {
          merged["Project Understanding and Approach"].needs.push(...pua.needs);
        }
        if (pua.approach && Array.isArray(pua.approach)) {
          merged["Project Understanding and Approach"].approach.push(
            ...pua.approach
          );
        }
      }

      // Merge Methodology
      if (aiResult["Methodology (By Phase)"]) {
        Object.assign(
          merged["Methodology (By Phase)"],
          aiResult["Methodology (By Phase)"]
        );
      }

      // Merge Project Schedule
      if (aiResult["Project Schedule"]) {
        Object.assign(merged["Project Schedule"], aiResult["Project Schedule"]);
      }

      // Merge Budget
      if (aiResult["Budget"]) {
        Object.assign(merged["Budget"], aiResult["Budget"]);
      }
    }

    return merged;
  }

  // ------------------------------
  // Project type classifier (improved)
  // ------------------------------
  classifyProjectType(text) {
    if (!text || typeof text !== "string") return "general";
    const mapping = {
      software_development: [
        "software",
        "application",
        "website",
        "web application",
        "api",
        "backend",
        "frontend",
        "mobile app",
        "cms",
        "portal",
        "hosting",
        "cloud",
      ],
      strategic_communications: [
        "communications",
        "branding",
        "marketing",
        "outreach",
        "social media",
        "public relations",
        "stakeholder",
        "messaging",
        "campaign",
      ],
      financial_modeling: [
        "financial model",
        "economic analysis",
        "fiscal analysis",
        "roi",
        "cost benefit",
        "investment analysis",
        "budget analysis",
      ],
    };

    const scores = {};
    const lower = text.toLowerCase();
    for (const key of Object.keys(mapping)) {
      scores[key] = mapping[key].reduce(
        (s, w) => s + (lower.includes(w) ? 1 : 0),
        0
      );
    }
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return best && best[1] > 0 ? best[0] : "general";
  }

  // ------------------------------
  // Final analyzeRFP: combines everything and returns standard shape
  // ------------------------------
  async analyzeRFP(input, source = "uploaded_rfp.pdf") {
    try {
      let text;
      let title = source?.replace?.(/\.pdf$/i, "") || "RFP";
      // Load text (url or pdf buffer)
      if (typeof input === "string" && /^https?:\/\//i.test(input)) {
        text = await this.extractTextFromURL(input);
        title = this.extractTitleFromURL(input);
      } else {
        text = await this.extractTextFromPDF(input);
        // keep title from source param when available
      }

      if (!text || text.length < 50) {
        throw new Error("Content appears empty or unreadable.");
      }

      // Pre-run heuristics
      const heur = this.extractHeuristics(text);
      const projectType = this.classifyProjectType(text);

      // AI enhanced parse (if available)
      console.log("Starting AI analysis...");
      const aiParsed = await this.analyzeWithAI(text, projectType, source);
      console.log(
        "AI analysis completed:",
        aiParsed ? "Success" : "Failed - using heuristics"
      );

      // Merge strategy: prefer AI for semantic fields; fallback to heuristics where AI missing
      const normalizeString = (v) => {
        if (!v) return "Not mentioned in the document";
        if (typeof v === "string" && v.trim().length > 0) return v.trim();
        return "Not mentioned in the document";
      };

      // Use AI parsed data if available, otherwise fall back to heuristics
      const aiData = aiParsed || {
        title: {
          documentTitle: normalizeString(title || heur.possibleTitle),
          submittedBy: "Not mentioned in the document",
          submittedTo: "Not mentioned in the document",
          submissionDate: normalizeString(
            heur.submissionDeadline || "Not mentioned in the document"
          ),
          contact: {
            name: "Not mentioned in the document",
            email: "Not mentioned in the document",
            phone: "Not mentioned in the document",
          },
        },
        "Key Personnel": {},
        "Project Understanding and Approach": {
          overview: "Not mentioned in the document",
          needs: this.extractRequirementsFallback(text),
          approach: [],
        },
        "Methodology (By Phase)": {},
        "Project Schedule": {},
        Budget: {},
      };

      // Extract budget section text for specialized AI analysis
      const budgetStart = text.toLowerCase().indexOf("budget");
      if (budgetStart !== -1) {
        const budgetSection = text
          .slice(budgetStart)
          .split(
            /(?:Key Personnel|Methodology|Schedule|Evaluation|Submission)/i
          )[0];

        // Try AI budget extraction first
        const aiBudget = await this.specializedExtractors.analyzeBudgetWithAI(
          budgetSection
        );
        if (aiBudget) {
          aiData.Budget = aiBudget;
        } else {
          // Fallback to pattern matching if AI fails
          const budgetTable = this.extractBudgetTable(text);
          if (
            budgetTable &&
            (budgetTable.total || Object.keys(budgetTable.phases).length > 0)
          ) {
            aiData.Budget = budgetTable;
          }
        }
      }

      // Extract Key Personnel section
      const kpStart = text.toLowerCase().indexOf("key personnel");
      if (kpStart !== -1) {
        const kpSection = text
          .slice(kpStart)
          .split(/(?:Methodology|Budget|Schedule|Evaluation|Submission)/i)[0];

        const aiPersonnel =
          await this.specializedExtractors.analyzePersonnelWithAI(kpSection);
        if (aiPersonnel && aiPersonnel["Key Personnel"]) {
          aiData["Key Personnel"] = aiPersonnel["Key Personnel"];
        }
      }

      // Extract Methodology section
      const methStart = text.toLowerCase().indexOf("methodology");
      if (methStart !== -1) {
        const methSection = text
          .slice(methStart)
          .split(/(?:Budget|Schedule|Evaluation|Submission|Key Personnel)/i)[0];

        const aiMethodology =
          await this.specializedExtractors.analyzeMethodologyWithAI(
            methSection
          );
        if (aiMethodology && aiMethodology["Methodology (By Phase)"]) {
          aiData["Methodology (By Phase)"] =
            aiMethodology["Methodology (By Phase)"];
        }
      }

      // Extract Project Schedule section
      const schStart = text.toLowerCase().indexOf("project schedule");
      if (schStart !== -1) {
        const schSection = text
          .slice(schStart)
          .split(
            /(?:Budget|Methodology|Evaluation|Submission|Key Personnel)/i
          )[0];

        const aiSchedule =
          await this.specializedExtractors.analyzeScheduleWithAI(schSection);
        if (aiSchedule && aiSchedule["Project Schedule"]) {
          aiData["Project Schedule"] = aiSchedule["Project Schedule"];
        }
      }

      // Create result compatible with existing RFP model
      const result = {
        _id: undefined, // left empty - populate in DB layer
        title:
          aiData.title?.documentTitle ||
          normalizeString(title || heur.possibleTitle),
        clientName:
          aiData.title?.submittedTo ||
          normalizeString(heur.clientName || "Unknown Client"),
        submissionDeadline:
          aiData.title?.submissionDate ||
          normalizeString(
            heur.submissionDeadline || "Not mentioned in the document"
          ),
        budgetRange: normalizeString(
          heur.budgetRange || "Not mentioned in the document"
        ),
        projectType: projectType || "general",
        keyRequirements:
          aiData["Project Understanding and Approach"]?.needs ||
          this.extractRequirementsFallback(text),
        evaluationCriteria: [],
        deliverables: [],
        timeline: normalizeString("Not mentioned in the document"),
        projectScope:
          aiData["Project Understanding and Approach"]?.overview ||
          normalizeString("Not mentioned in the document"),
        contactInformation: aiData.title?.contact
          ? `${aiData.title.contact.name} - ${aiData.title.contact.email} - ${aiData.title.contact.phone}`
          : normalizeString("Not mentioned in the document"),
        location: normalizeString(
          heur.location || "Not mentioned in the document"
        ),
        additionalInfo: [],
        specialRequirements: [],
        rawText: text,
        parsedSections: {
          textLength: text.length,
          aiEnhanced: !!aiParsed,
          extractionMethod: aiParsed ? "AI-enhanced" : "Pattern-based",
          heuristics: heur,
          fileName: source,
          analyzedAt: new Date(),
          // Store the full AI data in parsedSections for future use
          aiData: aiData,
        },
      };

      // Ensure arrays are non-empty or populated with 'Not mentioned' placeholders
      const ensureArray = (a) => {
        if (!a) return ["Not mentioned in the document"];
        if (!Array.isArray(a)) return [String(a)];
        return a.length ? a : ["Not mentioned in the document"];
      };

      // Ensure arrays are properly formatted
      result.keyRequirements = ensureArray(result.keyRequirements);
      result.evaluationCriteria = ensureArray(result.evaluationCriteria);
      result.deliverables = ensureArray(result.deliverables);
      result.additionalInfo = ensureArray(result.additionalInfo);
      result.specialRequirements = ensureArray(result.specialRequirements);

      return result;
    } catch (err) {
      throw new Error(`RFP analysis failed: ${err.message || err}`);
    }
  }

  // ------------------------------
  // Fallback extractors used when AI misses
  // ------------------------------
  extractRequirementsFallback(text) {
    const lines = text.split("\n");
    const keywords = [
      "must",
      "shall",
      "require",
      "should",
      "deliverable",
      "objective",
      "mandatory",
      "responsible",
      "provide",
      "implement",
      "develop",
      "ensure",
    ];
    const results = [];

    for (const raw of lines) {
      const line = raw.trim();
      if (line.length < 20 || line.length > 500) continue;
      // bullet or numbered or contains a keyword
      if (
        /^[\u2022\-\*\•\d]+\s+/.test(line) ||
        keywords.some((k) => line.toLowerCase().includes(k))
      ) {
        results.push(line.replace(/^[\u2022\-\*\•\d\.\)\s]+/, "").trim());
      }
    }
    return results.length
      ? results.slice(0, 20)
      : ["Not mentioned in the document"];
  }

  extractDeliverablesFallback(text) {
    const lines = text.split("\n");
    const deliverableKeywords = [
      "deliverable",
      "outcome",
      "product",
      "milestone",
      "deliver",
      "provide",
      "submission",
      "report",
      "plan",
      "documentation",
    ];
    const results = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (line.length < 20 || line.length > 500) continue;
      if (
        /^[\u2022\-\*\•\d]+\s+/.test(line) ||
        deliverableKeywords.some((k) => line.toLowerCase().includes(k))
      ) {
        results.push(line.replace(/^[\u2022\-\*\•\d\.\)\s]+/, "").trim());
      }
    }
    return results.length
      ? results.slice(0, 20)
      : ["Not mentioned in the document"];
  }

  extractEvaluationCriteriaFallback(text, percentages = []) {
    const lines = text.split("\n");
    const results = [];

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (
        line.match(/(evaluation|criteria|score|weight|points)/i) ||
        line.match(/\d+\s?%/)
      ) {
        results.push(line);
      }
    }

    // include any percentages found in the document if no explicit criteria lines
    if (!results.length && percentages && percentages.length) {
      results.push(...percentages);
    }

    return results.length
      ? results.slice(0, 12)
      : ["Not mentioned in the document"];
  }

  extractSpecialRequirements(text) {
    const specialKeywords = [
      "accessibility",
      "ada",
      "508",
      "wcag",
      "security",
      "compliance",
      "certification",
      "insurance",
      "bonding",
      "license",
      "clearance",
      "background check",
    ];
    const lines = text.split("\n");
    const found = [];
    for (const l of lines) {
      const t = l.trim();
      if (t.length < 20 || t.length > 300) continue;
      if (specialKeywords.some((k) => t.toLowerCase().includes(k))) {
        found.push(t);
      }
    }
    return found.length
      ? found.slice(0, 10)
      : ["Not mentioned in the document"];
  }

  extractLocation(text) {
    // try to extract "Town of X" or "City of Y"
    const m = text.match(
      /\b(?:Town|City|County|Village|Municipality) of [A-Z][A-Za-z '\-]{2,60}/i
    );
    if (m && m[0]) return m[0];
    // Try "State: X" or "Location: X"
    const m2 = text.match(
      /\b(Location|Address|Site):\s*([A-Z][A-Za-z0-9 ,.'\-]{2,80})/i
    );
    if (m2 && m2[2]) return m2[2];
    return "Not mentioned in the document";
  }

  extractProjectScope(text) {
    const lines = text.split("\n");
    const scopeKeywords = [
      "scope of work",
      "project scope",
      "scope",
      "overview",
      "purpose",
      "objectives",
    ];
    const found = [];
    for (const l of lines) {
      const t = l.trim();
      if (t.length < 40 || t.length > 500) continue;
      if (scopeKeywords.some((k) => t.toLowerCase().includes(k))) {
        found.push(t);
      }
    }
    // fallback: first 2 paragraphs as project summary
    if (!found.length) {
      const paragraphs = text
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean);
      if (paragraphs.length) {
        return paragraphs.slice(0, 2).join(" ");
      }
      return "Not mentioned in the document";
    }
    return found.slice(0, 3).join(" ");
  }

  extractBudgetTable(text) {
    const budget = { phases: {}, total: null };

    // Find the Budget section
    const budgetStart = text.toLowerCase().indexOf("budget");
    if (budgetStart === -1) return budget;

    // Slice from Budget heading to next major section
    const budgetSection = text.slice(budgetStart, budgetStart + 2000); // look ahead 2000 chars

    // Try to capture total line
    const totalMatch = budgetSection.match(/total\s*\$?([\d,\.]+)/i);
    if (totalMatch) {
      budget.total = `$${totalMatch[1].replace(/,/g, "")}`;
    }

    // Split into lines
    const lines = budgetSection
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let currentPhase = null;

    for (const line of lines) {
      // Detect Phase headers
      const phaseMatch = line.match(/Phase\s+\d+[:\-]?\s*(.+)?/i);
      if (phaseMatch) {
        currentPhase = phaseMatch[0];
        budget.phases[currentPhase] = { roles: {}, subtotal: null };
        continue;
      }

      // Detect role rows: "Project Manager $5 140 $7,70"
      if (currentPhase) {
        const roleMatch = line.match(
          /([A-Za-z ]+)\s+\$?(\d+)\s+(\d+)\s+\$?([\d,]+)/
        );
        if (roleMatch) {
          const [, role, rate, hours, cost] = roleMatch;
          budget.phases[currentPhase].roles[role.trim()] = {
            hourlyRate: `$${rate}`,
            hours: hours,
            cost: `$${cost.replace(/,/g, "")}`,
          };
          continue;
        }

        // Detect Subtotal
        const subtotalMatch = line.match(/subtotal.*\$?([\d,\.]+)/i);
        if (subtotalMatch) {
          budget.phases[currentPhase].subtotal = `$${subtotalMatch[1].replace(
            /,/g,
            ""
          )}`;
        }
      }
    }

    return budget;
  }

  _buildContactString(heur) {
    const parts = [];
    if (heur.contactEmails && heur.contactEmails.length)
      parts.push(`email: ${heur.contactEmails.join(", ")}`);
    if (heur.contactPhones && heur.contactPhones.length)
      parts.push(`phone: ${heur.contactPhones.join(", ")}`);
    return parts.length ? parts.join(" | ") : "Not mentioned in the document";
  }
}

module.exports = new RFPAnalyzer();
