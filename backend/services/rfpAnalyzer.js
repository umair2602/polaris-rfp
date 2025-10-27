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
      
      // Check if URL points to a PDF file (by extension or make a HEAD request to check content type)
      const isPdfUrl = url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf?') || url.toLowerCase().includes('.pdf#');
      
      if (isPdfUrl) {
        console.log("Detected PDF URL, downloading and parsing as PDF...");
        
        // Download PDF content
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        // Convert to buffer and extract text using PDF parser
        const pdfBuffer = Buffer.from(response.data);
        return await this.extractTextFromPDF(pdfBuffer);
      }
      
      // For non-PDF URLs, first check content type with a HEAD request
      try {
        const headResponse = await axios.head(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const contentType = headResponse.headers['content-type'] || '';
        if (contentType.includes('application/pdf')) {
          console.log("Detected PDF content type, downloading and parsing as PDF...");
          
          // Download PDF content
          const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          // Convert to buffer and extract text using PDF parser
          const pdfBuffer = Buffer.from(response.data);
          return await this.extractTextFromPDF(pdfBuffer);
        }
      } catch (headError) {
        console.log("HEAD request failed, proceeding with regular HTML extraction:", headError.message);
      }
      
      // Fetch the web page for HTML content
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
  "projectDeadline": "string - Project completion deadline, project end date, or when the work must be finished in USA format MM/DD/YYYY (or 'Not available' if not found)",
  "questionsDeadline": "string - Deadline for submitting questions about the RFP in USA format MM/DD/YYYY (or 'Not available' if not found)",
  "bidMeetingDate": "string - Date of the bid meeting or pre-proposal conference in USA format MM/DD/YYYY (or 'Not available' if not found)",
  "bidRegistrationDate": "string - Deadline for bid registration or vendor registration in USA format MM/DD/YYYY (or 'Not available' if not found)",
  "budgetRange": "string - Budget range mentioned (or 'Not available' if not found)",
  "projectType": "string - Describe the type/category of project (e.g., 'software_development', 'construction', 'marketing', 'consulting', etc.)",
  "keyRequirements": ["array of strings - Key requirements and specifications"],
  "evaluationCriteria": ["array of strings - Evaluation criteria and scoring methods"],
  "deliverables": ["array of strings - Expected deliverables and outcomes"],
  "timeline": "string - Project duration as 'MM/DD/YYYY to MM/DD/YYYY' or '12 months' or 'Not available' if not found",
  "projectScope": "string - Detailed project scope and objectives",
  "contactInformation": "string - Contact details (emails, phones, names)",
  "location": "string - Project location or client location",
  "specialRequirements": ["array of strings - Special requirements like certifications, compliance, etc."],
  "additionalInfo": ["array of strings - Any additional important information"],
  "questionsAndAnswers": ["array of strings - Any Q&A sections found in the RFP, including questions posed by vendors and answers provided by the issuer. Format each Q&A as 'Q: [question text] A: [answer text]'"]
}

Rules:
- Extract information exactly as written in the document
- If information is not found, use "Not available" for strings, false for booleans, or empty arrays for arrays
- For projectDeadline, look specifically for project completion dates, project end dates, delivery deadlines, or when the actual work must be finished - NOT proposal submission deadlines. Format all dates in USA format MM/DD/YYYY
- For questionsDeadline, look for deadlines to submit questions, clarifications, or inquiries about the RFP
- For bidMeetingDate, look for pre-proposal meetings, bid conferences, site visits, or mandatory meetings
- For bidRegistrationDate, look for vendor registration deadlines, qualification deadlines, or pre-registration requirements
- For projectType, describe the type/category of project based on the content. Be specific and descriptive (e.g., 'software_development', 'construction', 'marketing', 'consulting', 'research', etc.). If unclear, use 'general'
- For arrays, extract all relevant items as separate strings
- Be comprehensive but accurate - don't invent information
- Only use "Not available" if the information is truly not present anywhere in the document
- For timeline, extract the overall project duration/period. Format as:
  * "MM/DD/YYYY to MM/DD/YYYY" for date ranges (e.g., "06/10/2024 to 06/10/2025")
  * "12 months" or "6 months" if duration is specified in months
  * Use project start date to project completion/end date when available
  * Normalize all dates to MM/DD/YYYY format
  * Return "Not available" if no timeline information is found
- For "questionsAndAnswers", follow this two-step approach:
  * STEP 1: First, check if the RFP document contains any existing Q&A sections, addenda, clarifications, or pre-bid meeting notes. If found, extract them exactly as written in the format "Q: [question text] A: [answer text]"
  * STEP 2: If NO existing Q&A sections are found in the document, then generate 5-8 relevant and insightful questions and answers based on the specific RFP content. The questions should be natural, context-specific, and address important aspects that vendors would genuinely need clarification on based on what's written (or missing) in this particular RFP.
  * For generated Q&A, provide clear, accurate answers based strictly on information available in the RFP document. If the RFP doesn't contain the answer, acknowledge it appropriately (e.g., "This information is not specified in the RFP").
  * Format all Q&A (both extracted and generated) as "Q: [question text] A: [answer text]"
  * Always return at least some Q&A - either extracted from document OR AI-generated based on RFP content
- Return only valid JSON, no additional text or commentary`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.0,
        max_tokens: 16000,
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
        console.log("Detected URL input, extracting text...");
        text = await this.extractTextFromURL(input);
        
        // Determine extraction method based on URL type
        const isPdfUrl = input.toLowerCase().endsWith('.pdf') || input.toLowerCase().includes('.pdf?') || input.toLowerCase().includes('.pdf#');
        extractionMethod = isPdfUrl ? "pdf-from-url" : "web-scraping";
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
        title: extractedData.title || "Not available",
        clientName: extractedData.clientName || "Not available",
        submissionDeadline: extractedData.projectDeadline || "Not available",
        questionsDeadline: extractedData.questionsDeadline || "Not available",
        bidMeetingDate: extractedData.bidMeetingDate || "Not available",
        bidRegistrationDate: extractedData.bidRegistrationDate || "Not available",
        budgetRange: extractedData.budgetRange || "Not available",
        projectType: extractedData.projectType || "general",
        keyRequirements: extractedData.keyRequirements || [],
        evaluationCriteria: extractedData.evaluationCriteria || [],
        deliverables: extractedData.deliverables || [],
        timeline: extractedData.timeline || "Not available",
        projectScope: extractedData.projectScope || "Not available",
        contactInformation: extractedData.contactInformation || "Not available",
        location: extractedData.location || "Not available",
        additionalInfo: extractedData.additionalInfo || [],
        specialRequirements: extractedData.specialRequirements || [],
        questionsAndAnswers: extractedData.questionsAndAnswers || [],
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
        if (!a) return ["Not available"];
        if (!Array.isArray(a)) return [String(a)];
        return a.length ? a : ["Not available"];
      };

      result.keyRequirements = ensureArray(result.keyRequirements);
      result.evaluationCriteria = ensureArray(result.evaluationCriteria);
      result.deliverables = ensureArray(result.deliverables);
      result.additionalInfo = ensureArray(result.additionalInfo);
      result.specialRequirements = ensureArray(result.specialRequirements);
      result.questionsAndAnswers = ensureArray(result.questionsAndAnswers);

      return result;
    } catch (err) {
      throw new Error(`RFP analysis failed: ${err.message || err}`);
    }
  }

}

module.exports = new RFPAnalyzer();
