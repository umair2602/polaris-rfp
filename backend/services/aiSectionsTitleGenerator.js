const OpenAI = require('openai');

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Generate proposal section titles based on predefined base sections and RFP analysis
 * Returns an array of strings (section titles) with no content
 * Always includes "Title" and "Cover Letter", then analyzes RFP for other relevant sections
 */
async function generateSectionTitles(rfp) {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  // Base section structure that serves as the foundation
  const baseSections = [
    "Title",
    "Cover Letter", 
    "Technical Approach and Methodology",
    "Key Personnel and Experience",
    "Budget Estimate",
    "Project Timeline", 
    "References"
  ];

  const systemPrompt = `You are an expert proposal architect. You have a predefined set of base proposal sections, and your job is to analyze the RFP document to determine which sections are relevant and should be included in the proposal.

BASE SECTIONS AVAILABLE:
- Title (ALWAYS include)
- Cover Letter (ALWAYS include)
- Technical Approach and Methodology
- Key Personnel and Experience  
- Budget Estimate
- Project Timeline
- References

ANALYSIS TASK:
1. Always include "Title" and "Cover Letter" sections
2. For each other base section, determine if the RFP contains relevant information that would support that section
3. If the RFP mentions specific technical requirements, methodologies, or approaches → include "Technical Approach and Methodology"
4. If the RFP mentions team qualifications, key personnel requirements, or experience requirements → include "Key Personnel and Experience"
5. If the RFP mentions budget, cost estimates, or pricing requirements → include "Budget Estimate"  
6. If the RFP mentions project phases, deadlines, milestones, or timeline requirements → include "Project Timeline"
7. If the RFP mentions past work examples, references, or case studies → include "References"
8. Additionally, identify if the RFP requires any UNIQUE sections not covered by the base sections and add those

CRITICAL RULES:
- You MUST return a valid JSON array of strings and nothing else
- Each string in the array is a section title
- Always include "Title" and "Cover Letter" first
- Only include other base sections if the RFP provides supporting content for them
- Be flexible - add additional unique sections if the RFP requires them (e.g., "Compliance & Quality Assurance", "Risk Management", "Innovation Strategy", etc.)
- Do NOT include numbering in the titles
- Keep titles professional and clear

RESPONSE FORMAT: Return a JSON array of strings, where each string is a section title.
Example: ["Title", "Cover Letter", "Technical Approach and Methodology", "Budget Estimate", "Unique Section Based on RFP"]

Return ONLY the JSON array, nothing else.`;

  const userPrompt = `Analyze this RFP and determine which base sections are relevant, plus identify any unique sections needed.

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

ANALYSIS INSTRUCTIONS:
1. START with "Title" and "Cover Letter" (always required)

2. ANALYZE the RFP for each base section:
   - Technical content/methodology mentioned? → Include "Technical Approach and Methodology"
   - Personnel/team/qualifications mentioned? → Include "Key Personnel and Experience"  
   - Budget/cost/pricing mentioned? → Include "Budget Estimate"
   - Timeline/schedule/phases mentioned? → Include "Project Timeline"
   - References/past work/case studies mentioned? → Include "References"

3. IDENTIFY unique requirements in this RFP that need additional sections:
   - Compliance/regulatory requirements → Add appropriate compliance section
   - Quality assurance/testing → Add quality section  
   - Risk management → Add risk section
   - Innovation/technology → Add innovation section
   - Sustainability/environmental → Add sustainability section
   - Training/support → Add training section
   - Any other unique RFP requirements

4. ORDER sections logically (Title first, Cover Letter second, then technical sections, then administrative sections)

Return a JSON array of section titles that are specifically relevant to THIS RFP based on its actual content and requirements.`;

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

    // Ensure Title and Cover Letter are always first and present
    const compulsory = ["Title", "Cover Letter"];
    const finalSections = [];
    const seenSections = new Set();

    // Add compulsory sections first
    for (const section of compulsory) {
      finalSections.push(section);
      seenSections.add(section.toLowerCase());
    }

    // Add remaining sections, avoiding duplicates
    for (const section of cleaned) {
      const lowerSection = section.toLowerCase();
      if (!seenSections.has(lowerSection)) {
        finalSections.push(section);
        seenSections.add(lowerSection);
      }
    }

    // Limit to reasonable number (but allow some flexibility for complex RFPs)
    return finalSections.slice(0, 15);
    
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

  // Base sections for reference (to maintain consistency)
  const baseSections = [
    "Title",
    "Cover Letter", 
    "Technical Approach and Methodology",
    "Key Personnel and Experience",
    "Budget Estimate",
    "Project Timeline", 
    "References"
  ];

  for (const item of arr) {
    if (typeof item !== 'string') continue;
    
    // Clean the title
    let title = item
      .replace(/^\d+\s*[).:-]\s*/g, '') // strip leading numbering
      .replace(/^\*+\s*/g, '') // strip bullet symbols
      .replace(/^[-•]\s*/g, '') // strip dash/bullet prefixes
      .trim();

    if (!title) continue;
    if (title.length > 120) continue; // avoid paragraphs
    if (title.length < 3) continue; // too short
    
    // Normalize base section titles to maintain consistency
    const lowerTitle = title.toLowerCase();
    const matchingBase = baseSections.find(base => 
      base.toLowerCase() === lowerTitle || 
      lowerTitle.includes(base.toLowerCase().split(' ')[0]) // partial match for flexibility
    );
    
    if (matchingBase) {
      title = matchingBase; // Use the standardized base section name
    }
    
    // Check for duplicates (case-insensitive)
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    
    seen.add(key);
    titles.push(title);
  }

  return titles;
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


