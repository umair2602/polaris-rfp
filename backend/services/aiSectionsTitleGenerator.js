const OpenAI = require('openai');

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Generate ONLY proposal section titles based on the specific RFP context using OpenAI
 * Returns an array of strings (section titles) with no content
 * Always prepends the compulsory titles: "Title" and "Cover Letter"
 */
async function generateSectionTitles(rfp) {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const systemPrompt = `You are an expert proposal architect. Given an RFP document, analyze it thoroughly and propose a set of section TITLES that are contextually appropriate for a compelling, professional proposal responding to that specific RFP.

CRITICAL RULES:
- You MUST return a valid JSON array of strings and nothing else
- Each string in the array is a section title
- Do NOT include any explanations, descriptions, or additional text
- Do NOT include section content or bullet points
- Do NOT include numbering in the titles
- Titles must be tailored specifically to the RFP's domain, scope, deliverables, and constraints

Analyze the RFP document carefully to understand:
- Industry/domain (e.g., IT, construction, consulting, healthcare, research)
- Project type and scope
- Key requirements and deliverables mentioned
- Client expectations and evaluation criteria
- Specific challenges or constraints mentioned

Create section titles that:
- Directly address what the RFP is asking for
- Show deep understanding of the project requirements
- Use professional business/procurement language
- Are specific to the project context (not generic)
- Cover 6-12 sections based on what's relevant for this RFP

Examples of how to tailor titles by domain:
- IT Projects: Focus on technical architecture, system integration, security frameworks, data migration, etc.
- Consulting: Emphasize diagnostic approaches, change management, stakeholder engagement, implementation strategies, etc.
- Construction: Highlight site preparation, safety compliance, construction methods, materials sourcing, etc.
- Research: Cover research design, data collection protocols, analysis frameworks, validation methods, etc.
- Marketing: Include market analysis, campaign strategy, brand positioning, performance metrics, etc.
- Healthcare: Address clinical protocols, regulatory compliance, patient safety, quality assurance, etc.

IMPORTANT: Generate section titles that are SPECIFIC to the actual RFP content and requirements. Do not use generic titles.

RESPONSE FORMAT: Return a JSON array of strings, where each string is a section title.
Example structure: ["Title 1", "Title 2", "Title 3", ...]

Return ONLY the JSON array, nothing else.`;

  const userPrompt = `Analyze this RFP and generate contextually relevant section titles for the proposal response.

RFP DETAILS:
- Title: ${rfp.title}
- Client: ${rfp.clientName}
- Project Type: ${rfp.projectType || 'Not specified'}
- Key Requirements: ${Array.isArray(rfp.keyRequirements) ? rfp.keyRequirements.join(', ') : (rfp.keyRequirements || 'Not specified')}
- Deliverables: ${Array.isArray(rfp.deliverables) ? rfp.deliverables.join(', ') : (rfp.deliverables || 'Not specified')}
- Budget Range: ${rfp.budgetRange || 'Not specified'}
- Submission Deadline: ${rfp.submissionDeadline || 'Not specified'}
- Location: ${rfp.location || 'Not specified'}

${rfp.rawText ? `FULL RFP DOCUMENT TEXT:\n${rfp.rawText}` : ''}

Generate section titles that are:
1. DIRECTLY derived from the RFP content and requirements above
2. Address the specific deliverables and evaluation criteria mentioned
3. Reflect the actual project scope and challenges described
4. Use terminology and language from the RFP document when appropriate
5. Show deep understanding of what this particular client is asking for
6. Follow industry standards for this specific project type
7. Are contextually relevant (not generic proposal sections)

ANALYZE the RFP content carefully and create titles that a proposal evaluator would expect to see for THIS specific project.

Return ONLY a JSON array of section title strings.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = (completion.choices?.[0]?.message?.content || "").trim();

    // Parse the JSON response
    const parsed = JSON.parse(raw);
    
    // Handle different possible JSON structures
    let titles = [];
    
    if (Array.isArray(parsed)) {
      titles = parsed;
    } else if (parsed.titles && Array.isArray(parsed.titles)) {
      titles = parsed.titles;
    } else if (parsed.sections && Array.isArray(parsed.sections)) {
      titles = parsed.sections;
    } else if (parsed.section_titles && Array.isArray(parsed.section_titles)) {
      titles = parsed.section_titles;
    } else {
      // If it's an object with keys, try to extract values
      const values = Object.values(parsed);
      if (values.length > 0 && Array.isArray(values[0])) {
        titles = values[0];
      }
    }
    
    const cleaned = sanitizeSectionTitlesArray(titles);

    // Always ensure compulsory titles at the very beginning
    const compulsory = ["Title", "Cover Letter"];
    const existing = new Set(cleaned.map(t => t.toLowerCase()));
    const ordered = [...compulsory.filter(t => !existing.has(t.toLowerCase())), ...cleaned];
    // If the AI already included them but not at the top, re-order with unique preservation
    const finalSeen = new Set();
    const final = [];
    for (const t of [...compulsory, ...ordered]) {
      const k = t.toLowerCase();
      if (finalSeen.has(k)) continue;
      finalSeen.add(k);
      final.push(t);
    }

    return final.slice(0, 20);
    
  } catch (error) {
    console.error("AI section title generation failed:", error);
    throw new Error(`AI section title generation failed: ${error.message}`);
  }
}

/**
 * Sanitize and deduplicate section titles
 */
function sanitizeSectionTitlesArray(arr) {
  if (!Array.isArray(arr)) {
    console.warn("Expected array but got:", typeof arr);
    return [];
  }
  
  const seen = new Set();
  const titles = [];

  for (const item of arr) {
    if (typeof item !== 'string') continue;
    
    // Clean the title
    const title = item
      .replace(/^\d+\s*[).:-]\s*/g, '') // strip leading numbering
      .replace(/^\*+\s*/g, '') // strip bullet symbols
      .replace(/^[-•]\s*/g, '') // strip dash/bullet prefixes
      .trim();

    if (!title) continue;
    if (title.length > 120) continue; // avoid paragraphs
    if (title.length < 3) continue; // too short
    
    // Check for duplicates (case-insensitive)
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    
    seen.add(key);
    titles.push(title);
  }

  // Limit to reasonable number of sections
  return titles.slice(0, 20);
}

/**
 * Main export function - generates contextual section titles using OpenAI only
 */
async function generateContextualSectionTitles(rfp) {
  try {
    const titles = await generateSectionTitles(rfp);
    
    // Validate we got titles
    if (!titles || titles.length === 0) {
      throw new Error("OpenAI returned no section titles");
    }
    
    console.log(`Generated ${titles.length} contextual section titles`);
    return titles;
    
  } catch (error) {
    console.error("Section title generation error:", error);
    throw new Error(`Failed to generate section titles: ${error.message}`);
  }
}

module.exports = {
  generateSectionTitles,
  generateContextualSectionTitles,
  sanitizeSectionTitlesArray,
};


