// services/RFPAnalyzer.js
const pdf = require("pdf-parse");
const OpenAI = require("openai");
const cheerio = require("cheerio");
const axios = require("axios");

class RFPAnalyzer {
  constructor() {
    // Lazy: allow running without OpenAI key (AI features will be disabled)
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  // ------------------------------
  // PDF text extraction (simplified)
  // ------------------------------
  async extractTextFromPDF(buffer) {
    try {
      const data = await pdf(buffer);
      let text = data.text || "";

      // Basic text cleaning
      text = text.replace(/\r\n|\r/g, "\n");
      text = text.replace(/\n{3,}/g, "\n\n");
      text = text
        .split("\n")
        .map((l) => l.trim())
        .join("\n");
      text = text.replace(/[ \t]{2,}/g, " ");
      text = text.trim();
      
      return text;
    } catch (err) {
      throw new Error(`PDF extraction failed: ${err.message || err}`);
    }
  }

  // ------------------------------
  // Web URL text extraction
  // ------------------------------
  async extractTextFromURL(url) {
    try {
      console.log("Fetching content from URL:", url);
      
      // Fetch the web page
      const response = await axios.get(url, {
        // timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Load HTML into Cheerio
      const $ = cheerio.load(response.data);

      // Remove unwanted elements (scripts, styles, navigation, etc.)
      $('script, style, nav, header, footer, .nav, .navigation, .menu, .sidebar, .ads, .advertisement, .cookie-banner, .popup, .modal').remove();

      // Extract text content from main content areas
      let text = '';
      
      // Try to find main content areas first
      const mainSelectors = [
        'main',
        'article', 
        '.content',
        '.main-content',
        '.post-content',
        '.entry-content',
        '#content',
        '#main',
        '.container .row',
        '.page-content'
      ];

      let mainContent = '';
      for (const selector of mainSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          mainContent = element.text();
          break;
        }
      }

      // If no main content found, extract from body
      if (!mainContent.trim()) {
        mainContent = $('body').text();
      }

      // Clean up the text
      text = mainContent
        .replace(/\r\n|\r/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0) // Remove empty lines
        .join("\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();

      console.log(`Extracted ${text.length} characters from URL`);
      return text;
    } catch (err) {
      throw new Error(`URL extraction failed: ${err.message || err}`);
    }
  }

  // ------------------------------
  // AI-based structured data extraction
  // ------------------------------
  async extractStructuredDataWithAI(text) {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    const systemPrompt = `
You are an expert RFP (Request for Proposal) analyzer. Extract structured data from RFP text and return it in the exact JSON format specified below.

Extract the following information from the RFP text:

{
  "title": "string - The main title of the proposal/RFP",
  "clientName": "string - Name of the client/organization requesting the proposal",
  "submissionDeadline": "string - Deadline for proposal submission (or 'Not mentioned in the document' if not found)",
  "budgetRange": "string - Budget range mentioned (or 'Not mentioned in the document' if not found)",
  "projectType": "string - One of: 'software_development', 'strategic_communications', 'financial_modeling', or 'general'",
  "keyRequirements": ["array of strings - Key requirements and specifications"],
  "evaluationCriteria": ["array of strings - Evaluation criteria and scoring methods"],
  "deliverables": ["array of strings - Expected deliverables and outcomes"],
  "timeline": "string - Project timeline and milestones (or 'Not mentioned in the document' if not found)",
  "projectScope": "string - Detailed project scope and objectives",
  "contactInformation": "string - Contact details (emails, phones, names)",
  "location": "string - Project location or client location",
  "specialRequirements": ["array of strings - Special requirements like certifications, compliance, etc."],
  "additionalInfo": ["array of strings - Any additional important information"]
}

Rules:
- Extract information exactly as written in the document
- If information is not found, use "Not mentioned in the document" for strings or empty arrays for arrays
- For projectType, choose the most appropriate category based on the content
- For arrays, extract all relevant items as separate strings
- Be comprehensive but accurate - don't invent information
- Return only valid JSON, no additional text or commentary`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.0,
        max_tokens: 2000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `RFP Text:\n\n${text}` },
        ],
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : raw;

      return JSON.parse(jsonText);
    } catch (err) {
      throw new Error(`AI extraction failed: ${err.message || err}`);
    }
  }

  // ------------------------------
  // Main analyzeRFP method (simplified)
  // ------------------------------
  async analyzeRFP(input, source = "uploaded_rfp.pdf") {
    try {
      let text = '';
      let extractionMethod = '';

      // Detect input type and extract text accordingly
      if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
        // Input is a URL
        console.log("Detected URL input, extracting text from web page...");
        text = await this.extractTextFromURL(input);
        extractionMethod = "web-scraping";
        source = input; // Use URL as source
      } else if (Buffer.isBuffer(input)) {
        // Input is a PDF buffer
        console.log("Detected PDF buffer, extracting text from PDF...");
        text = await this.extractTextFromPDF(input);
        extractionMethod = "pdf-parsing";
      } else {
        throw new Error("Invalid input type. Expected URL string or PDF buffer.");
      }

      if (!text || text.length < 50) {
        throw new Error("Content appears empty or unreadable.");
      }

      console.log("Starting AI analysis...");
      
      // Use AI to extract structured data
      const extractedData = await this.extractStructuredDataWithAI(text);
      
      console.log("AI analysis completed successfully");

      // Create result compatible with existing RFP model
      const result = {
        _id: undefined, // left empty - populate in DB layer
        title: extractedData.title || "Not mentioned in the document",
        clientName: extractedData.clientName || "Not mentioned in the document",
        submissionDeadline: extractedData.submissionDeadline || "Not mentioned in the document",
        budgetRange: extractedData.budgetRange || "Not mentioned in the document",
        projectType: extractedData.projectType || "general",
        keyRequirements: extractedData.keyRequirements || [],
        evaluationCriteria: extractedData.evaluationCriteria || [],
        deliverables: extractedData.deliverables || [],
        timeline: extractedData.timeline || "Not mentioned in the document",
        projectScope: extractedData.projectScope || "Not mentioned in the document",
        contactInformation: extractedData.contactInformation || "Not mentioned in the document",
        location: extractedData.location || "Not mentioned in the document",
        additionalInfo: extractedData.additionalInfo || [],
        specialRequirements: extractedData.specialRequirements || [],
        rawText: text,
        parsedSections: {
          textLength: text.length,
          aiEnhanced: true,
          extractionMethod: extractionMethod,
          source: source,
          analyzedAt: new Date(),
        },
      };

      // Ensure arrays are properly formatted
      const ensureArray = (a) => {
        if (!a) return ["Not mentioned in the document"];
        if (!Array.isArray(a)) return [String(a)];
        return a.length ? a : ["Not mentioned in the document"];
      };

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

}

module.exports = new RFPAnalyzer();
