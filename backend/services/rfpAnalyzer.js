const pdf = require('pdf-parse');
const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');

class RFPAnalyzer {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
  }

  async extractTextFromPDF(buffer) {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  async extractTextFromURL(url) {
    try {
      console.log(`Fetching content from URL: ${url}`);
      
      // Validate URL
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(url)) {
        throw new Error('Invalid URL format. Please provide a valid HTTP or HTTPS URL.');
      }

      // Fetch webpage content
      const response = await axios.get(url, {
        timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        maxContentLength: 50 * 1024 * 1024, // 50MB limit
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Accept only success status codes
        }
      });

      // Parse HTML content
      const $ = cheerio.load(response.data);
      
      // Remove script, style, and other non-content elements
      $('script, style, nav, header, footer, aside, .nav, .header, .footer, .sidebar, .advertisement, .ad').remove();
      
      // Extract text content, prioritizing main content areas
      let text = '';
      
      // Try to find main content areas first
      const contentSelectors = [
        'main', '[role="main"]', '.main-content', '#main-content', 
        '.content', '#content', '.post-content', '.entry-content',
        'article', '.article', '#article'
      ];
      
      let foundMainContent = false;
      for (const selector of contentSelectors) {
        const mainContent = $(selector);
        if (mainContent.length > 0 && mainContent.text().trim().length > 200) {
          text = mainContent.text();
          foundMainContent = true;
          console.log(`Extracted content from selector: ${selector}`);
          break;
        }
      }
      
      // If no main content found, extract from body
      if (!foundMainContent) {
        text = $('body').text();
        console.log('Extracted content from body tag');
      }
      
      // Clean up the extracted text
      text = text
        .replace(/\s+/g, ' ')  // Replace multiple whitespaces with single space
        .replace(/\n\s*\n/g, '\n')  // Remove empty lines
        .trim();
      
      if (text.length < 100) {
        throw new Error('Insufficient content extracted from URL. The webpage might be behind authentication or have dynamic content.');
      }

      console.log(`Successfully extracted ${text.length} characters from URL`);
      return text;

    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        throw new Error('Unable to reach the URL. Please check if the URL is accessible.');
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Request timed out. The webpage took too long to respond.');
      } else if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}. Unable to fetch the webpage.`);
      } else {
        throw new Error(`URL extraction failed: ${error.message}`);
      }
    }
  }

  extractTitleFromURL(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      const pathname = urlObj.pathname.split('/').filter(Boolean).pop() || 'rfp';
      return `${hostname} - ${pathname}`.replace(/[-_]/g, ' ');
    } catch (error) {
      return 'RFP from URL';
    }
  }

  classifyProjectType(text) {
    const textLower = text.toLowerCase();
    
    const keywords = {
      software_development: ['portal', 'website', 'application', 'api', 'database', 'frontend', 'backend', 'web development', 'software', 'system development', 'mobile app', 'cms', 'content management', 'responsive', 'hosting', 'deployment', 'online platform'],
      strategic_communications: ['communications', 'marketing', 'outreach', 'messaging', 'stakeholder', 'public relations', 'campaign', 'branding', 'social media'],
      financial_modeling: ['financial modeling', 'economic analysis', 'fiscal analysis', 'roi calculation', 'investment analysis']
    };

    const scores = {};
    for (const [type, words] of Object.entries(keywords)) {
      scores[type] = words.reduce((score, word) => {
        const regex = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
        const matches = textLower.match(regex);
        return score + (matches ? matches.length : 0);
      }, 0);
    }

    const maxScore = Math.max(...Object.values(scores));
    return maxScore > 0 ? Object.keys(scores).find(key => scores[key] === maxScore) : 'general';
  }

  extractBudgetInfo(text) {
    const budgetPatterns = [
      /\$[\d,]+(?:\.\d{2})?(?:\s*(?:to|-)\s*\$[\d,]+(?:\.\d{2})?)?/gi,
      /budget.*?\$[\d,]+/gi,
      /not to exceed.*?\$[\d,]+/gi,
      /maximum.*?\$[\d,]+/gi,
      /funding.*?\$[\d,]+/gi,
      /cost.*?\$[\d,]+/gi,
      /price.*?\$[\d,]+/gi,
      /amount.*?\$[\d,]+/gi,
      /value.*?\$[\d,]+/gi
    ];

    const budgetKeywords = ['budget', 'cost', 'funding', 'price', 'amount', 'financial', 'monetary'];
    const textLower = text.toLowerCase();
    
    // Check if budget-related keywords exist
    const hasBudgetMention = budgetKeywords.some(keyword => textLower.includes(keyword));
    
    for (const pattern of budgetPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }
    
    // If budget keywords exist but no specific amount found
    if (hasBudgetMention) {
      return 'Budget information present but amount not specified';
    }
    
    return 'Not mentioned in the document';
  }

  extractDeadline(text) {
    const datePatterns = [
      /due.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
      /deadline.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
      /submit.*?by.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
      /(\w+\s+\d{1,2},?\s+\d{4})/gi,
      /proposal.*?due.*?(\w+\s+\d{1,2},?\s+\d{4})/gi,
      /closing.*?date.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi
    ];

    const deadlineKeywords = ['due', 'deadline', 'submit', 'closing', 'expires', 'final date'];
    const textLower = text.toLowerCase();
    
    // Check if deadline-related keywords exist
    const hasDeadlineMention = deadlineKeywords.some(keyword => textLower.includes(keyword));

    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        try {
          const dateStr = matches[0].replace(/due.*?|deadline.*?|submit.*?by.*?|proposal.*?due.*?|closing.*?date.*?/gi, '').trim();
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    // If deadline keywords exist but no specific date found
    if (hasDeadlineMention) {
      return 'Deadline mentioned but date not clearly specified';
    }
    
    return 'Not mentioned in the document';
  }

  extractRequirements(text) {
    const lines = text.split('\n');
    const requirementKeywords = [
      'must', 'shall', 'require', 'need', 'should', 'expect', 
      'deliverable', 'objective', 'goal', 'outcome', 'mandatory',
      'essential', 'critical', 'necessary', 'obligatory', 'compulsory',
      'responsible', 'develop', 'implement', 'provide', 'conduct',
      'establish', 'configure', 'optimize', 'ensure', 'integrate'
    ];
    
    const requirements = [];
    
    // Look for bullet points and structured content
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 15 && trimmedLine.length < 400) {
        const hasKeyword = requirementKeywords.some(keyword => 
          trimmedLine.toLowerCase().includes(keyword)
        );
        // Also check for bullet points or numbered lists
        const isBulletPoint = /^[•\-*]|^\d+\.|^[a-z]\)/i.test(trimmedLine);
        
        if (hasKeyword || isBulletPoint) {
          requirements.push(trimmedLine.replace(/^[•\-*]\s*|^\d+\.\s*|^[a-z]\)\s*/i, '').trim());
        }
      }
    }

    if (requirements.length === 0) {
      return ['Not mentioned in the document'];
    }

    return requirements.slice(0, 15);
  }

  extractEvaluationCriteria(text) {
    const criteria = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('%') || line.toLowerCase().includes('points') || line.toLowerCase().includes('criteria')) {
        if (line.trim().length > 10 && line.trim().length < 150) {
          criteria.push({
            criteria: line.trim(),
            weight: 'TBD'
          });
        }
      }
    }
    
    return criteria.slice(0, 8);
  }

  extractDeliverables(text) {
    const deliverableKeywords = [
      'deliverable', 'outcome', 'product', 'service', 'result', 'milestone',
      'develop', 'create', 'build', 'design', 'implement', 'provide',
      'complete', 'deploy', 'establish', 'configure', 'training', 'documentation'
    ];
    const lines = text.split('\n');
    const deliverables = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 15 && trimmedLine.length < 300) {
        const hasKeyword = deliverableKeywords.some(keyword =>
          trimmedLine.toLowerCase().includes(keyword)
        );
        const isBulletPoint = /^[•\-*]|^\d+\.|^[a-z]\)/i.test(trimmedLine);
        
        if (hasKeyword || isBulletPoint) {
          deliverables.push(trimmedLine.replace(/^[•\-*]\s*|^\d+\.\s*|^[a-z]\)\s*/i, '').trim());
        }
      }
    }

    if (deliverables.length === 0) {
      return ['Not mentioned in the document'];
    }

    return deliverables.slice(0, 12);
  }

  extractSpecialRequirements(text) {
    const specialKeywords = [
      'accessibility', 'ada', '508', 'wcag', 'security', 'compliance',
      'certification', 'insurance', 'bonding', 'license', 'clearance',
      'background check', 'drug test', 'citizenship', 'veteran', 'minority',
      'small business', 'disadvantaged', 'subcontracting', 'local preference'
    ];
    
    const lines = text.split('\n');
    const requirements = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 20 && trimmedLine.length < 300) {
        const hasSpecialKeyword = specialKeywords.some(keyword =>
          trimmedLine.toLowerCase().includes(keyword)
        );
        if (hasSpecialKeyword) {
          requirements.push(trimmedLine);
        }
      }
    }

    if (requirements.length === 0) {
      return ['Not mentioned in the document'];
    }

    return requirements.slice(0, 8);
  }

  extractContactInfo(text) {
    const contactPatterns = [
      /contact.*?[\w\s]+.*?(\w+@\w+\.\w+)/gi,
      /email.*?(\w+@\w+\.\w+)/gi,
      /phone.*?(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/gi,
      /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/gi,
      /questions.*?contact.*?([\w\s]+)/gi
    ];

    const contacts = [];
    for (const pattern of contactPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        contacts.push(...matches.slice(0, 3));
      }
    }

    if (contacts.length === 0) {
      return 'Not mentioned in the document';
    }

    return contacts.slice(0, 5).join('; ');
  }

  extractLocation(text) {
    const locationPatterns = [
      /location.*?([A-Z][a-z]+,?\s+[A-Z]{2})/gi,
      /address.*?([A-Z][a-z]+,?\s+[A-Z]{2})/gi,
      /work.*?performed.*?([A-Z][a-z]+,?\s+[A-Z]{2})/gi,
      /site.*?([A-Z][a-z]+,?\s+[A-Z]{2})/gi,
      /(remote|on-site|hybrid)/gi
    ];

    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }

    const locationKeywords = ['location', 'address', 'site', 'remote', 'on-site', 'office'];
    const textLower = text.toLowerCase();
    
    if (locationKeywords.some(keyword => textLower.includes(keyword))) {
      return 'Location mentioned but details not clearly specified';
    }

    return 'Not mentioned in the document';
  }

  extractProjectScope(text) {
    const scopeKeywords = [
      'scope', 'work', 'services', 'project description', 'overview',
      'background', 'purpose', 'objectives', 'goals', 'intent'
    ];
    
    const lines = text.split('\n');
    const scopeLines = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 30 && trimmedLine.length < 400) {
        const hasKeyword = scopeKeywords.some(keyword =>
          trimmedLine.toLowerCase().includes(keyword)
        );
        if (hasKeyword) {
          scopeLines.push(trimmedLine);
        }
      }
    }

    if (scopeLines.length === 0) {
      return 'Not mentioned in the document';
    }

    return scopeLines.slice(0, 3).join(' ');
  }

  async analyzeWithAI(text, projectType) {
    if (!this.openai) {
      return null;
    }

    try {
      const prompt = `
        You are analyzing an RFP document. Extract ACTUAL information that is present in the text. Look carefully for:
        
        1. Requirements - look for tasks, responsibilities, must/should statements, bullet points
        2. Deliverables - look for what must be delivered, created, developed, implemented
        3. Timeline - look for dates, durations, phases, milestones
        4. Budget - look for dollar amounts, compensation details, pricing requirements
        5. Evaluation criteria - look for how proposals will be judged, scoring, weights
        
        Extract the following in JSON format:
        - key_requirements: Array of main requirements/responsibilities (extract from bullet points, "must" statements, scope of work)
        - deliverables: Array of what must be delivered (look for development tasks, documentation, training)
        - evaluation_criteria: Array of how proposals are evaluated (look for criteria, scoring, weights)
        - timeline: Project timeline (look for specific dates, phases, durations)
        - budget_range: Budget information (dollar amounts, pricing structure, compensation details)
        - submission_deadline: When proposals are due
        - project_scope: Overall project description
        - special_requirements: Compliance, certifications, special conditions
        - contact_information: Email, phone, contact person
        - location: Where work is performed or project location
        - additional_info: Other important details
        
        Only use "Not mentioned in the document" if the information truly does not exist in the text.
        
        RFP Text:
        ${text.substring(0, 8000)}
        
        Project Type: ${projectType}
        
        Return only valid JSON:
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.2
      });

      const response = completion.choices[0].message.content.trim();
      // Clean up response to ensure valid JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      let parsed;
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(response);
      }
      
      // Ensure all array fields in AI response are arrays
      const ensureArray = (field) => {
        if (!field) return [];
        if (typeof field === 'string') return [field];
        if (Array.isArray(field)) return field;
        return [];
      };

      // Ensure string fields are strings, not objects
      const ensureString = (field) => {
        if (!field) return 'Not mentioned in the document';
        if (typeof field === 'string') return field;
        if (typeof field === 'object' && !Array.isArray(field)) {
          // Convert object to readable string
          return Object.entries(field).map(([key, value]) => `${key}: ${value}`).join(', ');
        }
        return String(field);
      };

      if (parsed) {
        parsed.key_requirements = ensureArray(parsed.key_requirements);
        parsed.deliverables = ensureArray(parsed.deliverables);
        parsed.evaluation_criteria = ensureArray(parsed.evaluation_criteria);
        parsed.special_requirements = ensureArray(parsed.special_requirements);
        parsed.additional_info = ensureArray(parsed.additional_info);
        
        // Ensure string fields are strings
        parsed.timeline = ensureString(parsed.timeline);
        parsed.contact_information = ensureString(parsed.contact_information);
        parsed.location = ensureString(parsed.location);
        parsed.project_scope = ensureString(parsed.project_scope);
        parsed.budget_range = ensureString(parsed.budget_range);
        parsed.submission_deadline = ensureString(parsed.submission_deadline);
      }
      
      return parsed;
    } catch (error) {
      console.error('AI analysis failed:', error);
      return null;
    }
  }

  async analyzeRFP(input, source) {
    try {
      let text;
      let title;
      
      // Determine if input is a URL or PDF buffer
      if (typeof input === 'string') {
        // It's a URL
        text = await this.extractTextFromURL(input);
        title = this.extractTitleFromURL(input);
      } else {
        // It's a PDF buffer
        text = await this.extractTextFromPDF(input);
        title = source.replace('.pdf', '');
      }
      
      if (!text || text.length < 100) {
        throw new Error('Content appears to be empty or unreadable');
      }

      // Basic analysis
      const projectType = this.classifyProjectType(text);
      const budgetRange = this.extractBudgetInfo(text);
      const deadline = this.extractDeadline(text);
      const keyRequirements = this.extractRequirements(text);
      const evaluationCriteria = this.extractEvaluationCriteria(text);
      const deliverables = this.extractDeliverables(text);
      const specialRequirements = this.extractSpecialRequirements(text);
      const contactInfo = this.extractContactInfo(text);
      const location = this.extractLocation(text);
      const projectScope = this.extractProjectScope(text);

      // AI enhancement (if available)
      const aiAnalysis = await this.analyzeWithAI(text, projectType);

      // Create comprehensive analysis result
      const result = {
        title: title,
        rawText: text,
        projectType,
        budgetRange: aiAnalysis?.budget_range || budgetRange,
        submissionDeadline: aiAnalysis?.submission_deadline || deadline,
        keyRequirements: aiAnalysis?.key_requirements || keyRequirements,
        evaluationCriteria: aiAnalysis?.evaluation_criteria || evaluationCriteria,
        deliverables: aiAnalysis?.deliverables || deliverables,
        specialRequirements: aiAnalysis?.special_requirements || specialRequirements,
        timeline: aiAnalysis?.timeline || 'Not mentioned in the document',
        projectScope: aiAnalysis?.project_scope || projectScope,
        contactInformation: aiAnalysis?.contact_information || contactInfo,
        location: aiAnalysis?.location || location,
        additionalInfo: aiAnalysis?.additional_info || [],
        parsedSections: {
          textLength: text.length,
          aiEnhanced: !!aiAnalysis,
          extractionMethod: aiAnalysis ? 'AI-enhanced' : 'Pattern-based',
          analysis: aiAnalysis
        }
      };

      // Ensure all arrays have consistent data types and fallback values
      const ensureArray = (field) => {
        if (!field) return ['Not mentioned in the document'];
        if (typeof field === 'string') return [field];
        if (Array.isArray(field)) return field.length === 0 ? ['Not mentioned in the document'] : field;
        return ['Not mentioned in the document'];
      };

      result.keyRequirements = ensureArray(result.keyRequirements);
      result.deliverables = ensureArray(result.deliverables);
      result.evaluationCriteria = ensureArray(result.evaluationCriteria);
      result.specialRequirements = ensureArray(result.specialRequirements);
      result.additionalInfo = ensureArray(result.additionalInfo);

      return result;
    } catch (error) {
      throw new Error(`RFP analysis failed: ${error.message}`);
    }
  }
}

module.exports = new RFPAnalyzer();