// services/RFPAnalyzer.js
const pdf = require("pdf-parse");
const OpenAI = require("openai");

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
      // Extract text from PDF
      const text = await this.extractTextFromPDF(input);

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
          extractionMethod: "AI-only",
          fileName: source,
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
