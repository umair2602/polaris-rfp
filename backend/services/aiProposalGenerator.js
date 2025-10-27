const OpenAI = require('openai');
const { getSectionGuidelines } = require('../utils/promptGuidelines');
const SharedSectionFormatters = require('./sharedSectionFormatters');

class AIProposalGenerator {
  // Lazy OpenAI initialization
  static get openai() {
    if (!this._openaiInitialized) {
      this._openai = process.env.OPENAI_API_KEY
        ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        : null;
      this._openaiInitialized = true;
    }
    return this._openai;
  }

  /**
   * Generate AI proposal sections based on RFP data
   */
  static async generateAIProposalSections(rfp, templateId, customContent) {
    const openai = this.openai;
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    // Fetch content library data
    const companyInfo = await SharedSectionFormatters.fetchCompanyInfo();
    const teamMembers = await SharedSectionFormatters.fetchTeamMembers();
    const projectReferences = await SharedSectionFormatters.fetchProjectReferences();

    // Build dynamic section titles using RFP's stored titles
    const storedTitles = Array.isArray(rfp.sectionTitles) ? rfp.sectionTitles : [];
    const compulsory = ["Title", "Cover Letter"];
    const seen = new Set();
    const orderedTitles = [];
    [...compulsory, ...storedTitles].forEach((t) => {
      const k = String(t || '').trim();
      const key = k.toLowerCase();
      if (!k || seen.has(key)) return;
      seen.add(key);
      orderedTitles.push(k);
    });

    // Identify sections that should use content library
    const contentLibrarySections = {};
    for (const title of orderedTitles) {
      const libraryType = await SharedSectionFormatters.shouldUseContentLibrary(title);
      if (libraryType) {
        contentLibrarySections[title] = libraryType;
      }
    }

    // Filter out content library sections from AI generation
    const aiOnlySections = orderedTitles.filter(
      (title) => !contentLibrarySections[title]
    );

    console.log("Content library sections:", contentLibrarySections);
    console.log("AI-only sections:", aiOnlySections);

    const dynamicList = aiOnlySections.map((t, i) => `${i + 1}. **${t}**`).join('\n');

    const systemPrompt = `
You are an expert proposal writer. Generate a comprehensive proposal based on the RFP document provided. 
Structure the proposal with the following sections and format them as markdown:

NOTE: Some sections will be handled separately using content library data. Generate content ONLY for the following sections:

${dynamicList}

CRITICAL: Use EXACTLY these section titles as JSON keys, in this order:
${JSON.stringify(aiOnlySections)}

SECTION GUIDELINES:
${getSectionGuidelines()}

GUIDELINES:
- Generate COMPREHENSIVE, DETAILED content for each section - avoid brief or superficial responses
- Use professional, persuasive language that demonstrates expertise
- Include extensive specific details from the RFP document throughout all sections
- Reference specific RFP requirements, constraints, objectives, and deliverables in each section
- **CRITICAL: For Methodology/Process/Phases sections, you MUST use proper markdown table format with 2 columns (Phase | Deliverables). Use <br> tags for line breaks within cells**
- **CRITICAL: For Budget/Cost sections, you MUST use proper markdown table format with 5 columns (Phase | Role | Hourly Rate | Hours | Cost)**
- Use bullet points for lists but ensure each point is substantial and detailed
- Make content highly relevant to the project type, scope, and complexity described in the RFP
- Ensure each section is comprehensive and thorough - prioritize depth over brevity
- Use **bold** for emphasis and *italics* for important details
- Adapt language and examples to match the RFP's project type and industry context
- Draw extensively from the RFP raw text to create content that shows deep document analysis
- Each section should feel substantial and valuable to proposal evaluators
- **CRITICAL**: For sections not explicitly mentioned in the RFP, demonstrate how your expertise in that area will benefit the project - DO NOT say "not available" or similar phrases

IMPORTANT: The AI should intelligently detect section types based on keywords in the section titles and apply appropriate formatting automatically. No need for hardcoded section names.

CRITICAL: Return the sections as a JSON object with EXACTLY the above section titles as keys and content as values.
For the "Title" key, return contact info as a multi-line string with exactly these fields:
Submitted by: [Company]
Name: [Name]
Email: [Email]
Number: [Phone]

Each section must be a separate key-value pair in the JSON object.`;

    const userPrompt = `
RFP Information:
- Title: ${rfp.title}
- Client: ${rfp.clientName}
- Project Type: ${rfp.projectType}
- Budget Range: ${rfp.budgetRange || 'Not specified'}
- Submission Deadline: ${rfp.submissionDeadline || 'Not specified'}
- Location: ${rfp.location || 'Not specified'}
- Key Requirements: ${rfp.keyRequirements?.join(', ') || 'Not specified'}
- Deliverables: ${rfp.deliverables?.join(', ') || 'Not specified'}
- Contact Information: ${rfp.contactInformation || 'Not specified'}

${rfp.attachments && rfp.attachments.length > 0 ? `
RFP Attachments (${rfp.attachments.length} files):
${rfp.attachments.map((att, idx) => {
  let info = `${idx + 1}. ${att.originalName} (${att.fileType.toUpperCase()}, ${(att.fileSize / 1024).toFixed(1)} KB)`;
  if (att.description) info += ` - ${att.description}`;
  if (att.textContent && att.textContent.trim().length > 0) {
    info += `\n   Content: ${att.textContent.substring(0, 5000)}${att.textContent.length > 5000 ? '... (truncated)' : ''}`;
  }
  return info;
}).join('\n\n')}

Note: The RFP includes these attached documents with their extracted content above. Use this information to create a comprehensive and detailed proposal that addresses all requirements from both the main RFP and the attachments.
` : ''}

${rfp.rawText ? `\nRFP Full Text:\n${rfp.rawText}` : ''}

INSTRUCTIONS:

Generate COMPREHENSIVE, DETAILED content for each section based on the section title and RFP requirements:

- **For Understanding/Approach sections**: Write 4-6 detailed paragraphs (400-600 words) using extensive specific details from the RFP text, reference client's situation, challenges, and requirements thoroughly
- **For Personnel/Team sections**: Include 4-6 team members with real people only, detailed credentials and achievements, comprehensive experience descriptions relevant to RFP
- **For Methodology/Process sections**: Create 4-6 detailed phases with comprehensive deliverables. **CRITICAL: MUST use markdown table format with exactly 2 columns: Phase and Deliverables. Use HTML <br> tags for line breaks within table cells. The table must start with header row with pipe separators, followed by separator row with dashes, then data rows. Each phase should have 3-5 numbered deliverables separated by <br> tags.**
- **For Schedule/Timeline sections**: Create realistic detailed timeline with 4-6 phases, use heading format with comprehensive 3-4 sentence paragraphs per phase
- **For Budget/Cost sections**: Create detailed cost breakdown with comprehensive descriptions. **CRITICAL: MUST use markdown table format with exactly 5 columns: Phase, Role, Hourly Rate, Hours, and Cost ($). Include subtotal rows and final total.**
- **For References/Experience sections**: Include 4-5 highly relevant past projects with detailed scope descriptions that relate to current RFP
- **For Cover Letter sections**: Use formal letter format with comprehensive, personalized content that addresses RFP specifics
- **For any other sections**: Generate substantial content (200-400 words) that thoroughly addresses the section topic using RFP details

CRITICAL REQUIREMENTS:
- Each section must be SUBSTANTIAL and COMPREHENSIVE - avoid brief responses
- Use extensive details from the RFP document throughout all sections
- Apply appropriate formatting rules based on section content type detection
- Demonstrate deep analysis and understanding of the RFP requirements
- Generate content that would impress proposal evaluators with its thoroughness and relevance

Generate a comprehensive proposal with all sections formatted as markdown, using the information provided in the RFP data.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 16000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const raw = completion.choices[0].message.content.trim();
      
      // Try to parse as JSON first
      try {
        // Clean the response to extract JSON
        let jsonText = raw;
        
        // Look for JSON object in the response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
        
        const parsed = JSON.parse(jsonText);
        
        // Validate that we have the expected AI sections
        const hasExpectedSections = aiOnlySections.some(section => Object.prototype.hasOwnProperty.call(parsed, section));
        
        if (hasExpectedSections) {
          // Add content library sections to parsed sections
          for (const sectionTitle of orderedTitles) {
            const libraryType = contentLibrarySections[sectionTitle];
            if (libraryType) {
              if (libraryType === "title") {
                parsed[sectionTitle] = SharedSectionFormatters.formatTitleSection(companyInfo, rfp);
              } else if (libraryType === "cover-letter") {
                parsed[sectionTitle] = SharedSectionFormatters.formatCoverLetterSection(companyInfo, rfp);
              } else if (libraryType === "experience") {
                parsed[sectionTitle] = await SharedSectionFormatters.formatExperienceSection(companyInfo, rfp);
              } else if (libraryType === "team") {
                parsed[sectionTitle] = SharedSectionFormatters.formatTeamMembersSection(teamMembers);
              } else if (libraryType === "references") {
                parsed[sectionTitle] = SharedSectionFormatters.formatReferencesSection(projectReferences);
              }
            }
          }

          // Validate and clean the AI sections
          const validatedSections = this.validateAISections(parsed);
          return this.formatAISections(validatedSections, orderedTitles, contentLibrarySections);
        } else {
          // If structure is different, try to extract from markdown and add content library sections
          const extracted = this.extractSectionsFromMarkdown(raw);
          
          // Add content library sections to extracted sections
          for (const sectionTitle of orderedTitles) {
            const libraryType = contentLibrarySections[sectionTitle];
            if (libraryType) {
              if (libraryType === "title") {
                extracted[sectionTitle] = {
                  content: SharedSectionFormatters.formatTitleSection(companyInfo, rfp),
                  type: "content-library",
                  lastModified: new Date().toISOString(),
                };
              } else if (libraryType === "cover-letter") {
                extracted[sectionTitle] = {
                  content: SharedSectionFormatters.formatCoverLetterSection(companyInfo, rfp),
                  type: "content-library", 
                  lastModified: new Date().toISOString(),
                };
              } else if (libraryType === "experience") {
                extracted[sectionTitle] = {
                  content: await SharedSectionFormatters.formatExperienceSection(companyInfo, rfp),
                  type: "content-library",
                  lastModified: new Date().toISOString(),
                };
              } else if (libraryType === "team") {
                extracted[sectionTitle] = {
                  content: SharedSectionFormatters.formatTeamMembersSection(teamMembers),
                  type: "content-library",
                  lastModified: new Date().toISOString(),
                };
              } else if (libraryType === "references") {
                extracted[sectionTitle] = {
                  content: SharedSectionFormatters.formatReferencesSection(projectReferences),
                  type: "content-library",
                  lastModified: new Date().toISOString(),
                };
              }
            }
          }
          
          return extracted;
        }
      } catch (jsonError) {
        // If not JSON, try to extract sections from markdown and add content library sections
        const extracted = this.extractSectionsFromMarkdown(raw);
        
        // Add content library sections to extracted sections
        for (const sectionTitle of orderedTitles) {
          const libraryType = contentLibrarySections[sectionTitle];
          if (libraryType) {
            if (libraryType === "title") {
              extracted[sectionTitle] = {
                content: SharedSectionFormatters.formatTitleSection(companyInfo, rfp),
                type: "content-library",
                lastModified: new Date().toISOString(),
              };
            } else if (libraryType === "cover-letter") {
              extracted[sectionTitle] = {
                content: SharedSectionFormatters.formatCoverLetterSection(companyInfo, rfp),
                type: "content-library", 
                lastModified: new Date().toISOString(),
              };
            } else if (libraryType === "experience") {
              extracted[sectionTitle] = {
                content: await SharedSectionFormatters.formatExperienceSection(companyInfo, rfp),
                type: "content-library",
                lastModified: new Date().toISOString(),
              };
            } else if (libraryType === "team") {
              extracted[sectionTitle] = {
                content: SharedSectionFormatters.formatTeamMembersSection(teamMembers),
                type: "content-library",
                lastModified: new Date().toISOString(),
              };
            } else if (libraryType === "references") {
              extracted[sectionTitle] = {
                content: SharedSectionFormatters.formatReferencesSection(projectReferences),
                type: "content-library",
                lastModified: new Date().toISOString(),
              };
            }
          }
        }
        
        return extracted;
      }
    } catch (error) {
      console.error("AI proposal generation failed:", error);
      throw new Error(`AI proposal generation failed: ${error.message}`);
    }
  }

  /**
   * Validate AI-generated sections to ensure they only contain RFP-based information
   */
  static validateAISections(sections) {
    const validatedSections = {};
    
    // Validate each section - no boundaries, process all sections dynamically
    Object.entries(sections).forEach(([sectionName, content]) => {
      if (sectionName === "Title") {
        // Title section should always be preserved as-is for contact extraction
        validatedSections[sectionName] = content;
      } else {
        // Check if content is genuinely empty or too short to be useful
        // Be less aggressive - only mark as "not available" if truly lacking content
        if (!content || 
            String(content).trim() === '' ||
            String(content).length < 20) {  // Increased from 10 to 20 to allow short but valid content
          validatedSections[sectionName] = "Not available in the RFP document";
        } else {
          // Clean the content to remove any generated information
          validatedSections[sectionName] = this.cleanGeneratedContent(String(content));
        }
      }
    });
    
    return validatedSections;
  }

  /**
   * Clean content to remove any AI-generated information that wasn't in the RFP
   */
  static cleanGeneratedContent(content) {
    if (!content || typeof content !== 'string') {
      return "Not available in the RFP document";
    }
    
    // Check for common AI-generated patterns that should be removed
    const aiGeneratedPatterns = [
      /\[Name\]/gi,
      /\[Title\]/gi,
      /\[Credentials\]/gi,
      /\[Email\]/gi,
      /\[Phone\]/gi,
      /\[Organization\]/gi,
      /placeholder/gi,
      /example/gi,
      /sample/gi,
      /dummy/gi,
      /fake/gi,
      /generated/gi
    ];
    
    let cleanedContent = content;
    
    // Remove AI-generated patterns
    aiGeneratedPatterns.forEach(pattern => {
      cleanedContent = cleanedContent.replace(pattern, '');
    });
    
    // If content is too short or contains mostly placeholders, return not available
    if (cleanedContent.trim().length < 20 || 
        cleanedContent.toLowerCase().includes('not available') ||
        cleanedContent.toLowerCase().includes('not specified')) {
      return "Not available in the RFP document";
    }
    
    return cleanedContent.trim();
  }

  /**
   * Clean content specifically for Key Personnel section to remove encoding issues
   */
  static cleanKeyPersonnelContent(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }
    
    return content
      // Remove weird percentage symbols and encoding artifacts
      .replace(/[%Ï]/g, '')
      // Remove brackets around names and credentials
      .replace(/\[([^\]]+)\]/g, '$1')
      // Fix bullet points that might have been corrupted
      .replace(/[●•]/g, '-')
      // Clean up only excessive whitespace, preserve line breaks
      .replace(/[ \t]+/g, ' ')
      // Clean up excessive line breaks but preserve structure
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  }

  /**
   * Clean content to remove duplicate titles and encoding issues
   */
  static cleanContent(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }
    
    return content
      // Remove weird percentage symbols and encoding artifacts
      .replace(/[%Ï]/g, '')
      // Remove brackets around names and credentials
      .replace(/\[([^\]]+)\]/g, '$1')
      // Remove duplicate section titles (common patterns)
      .replace(/^#+\s*[^#\n]+\s*$/gm, '') // Remove markdown headers
      .replace(/^\*\*([^*]+)\*\*\s*$/gm, '') // Remove bold titles
      .replace(/^([A-Z][^:\n]+):\s*$/gm, '') // Remove colon titles
      // Clean up excessive whitespace, preserve line breaks
      .replace(/[ \t]+/g, ' ')
      // Clean up excessive line breaks but preserve structure
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  }

  /**
   * Format AI-generated sections for the database
   */
  static formatAISections(sections, orderedTitles = [], contentLibrarySections = {}) {
    const formattedSections = {};
    
    // Process sections in the correct order
    const sectionsToProcess = orderedTitles.length > 0 ? orderedTitles : Object.keys(sections);
    
    sectionsToProcess.forEach((sectionName) => {
      if (sections[sectionName]) {
        const content = sections[sectionName];
        const isContentLibrary = contentLibrarySections[sectionName];
        
        if (sectionName === "Title" && isContentLibrary) {
          // Title section from content library - already formatted as object
          formattedSections[sectionName] = {
            content: content,
            type: "content-library",
            lastModified: new Date().toISOString(),
          };
        } else if (isContentLibrary) {
          // Other content library sections - use as string content
          formattedSections[sectionName] = {
            content: content,
            type: "content-library",
            lastModified: new Date().toISOString(),
          };
        } else if (sectionName === "Title") {
          // AI-generated Title section - extract contact info
          formattedSections[sectionName] = {
            content: this.extractTitleContactInfo(content),
            type: "ai-generated",
            lastModified: new Date().toISOString(),
          };
        } else {
          // AI-generated sections - clean content
          const processedContent = sectionName === "Key Personnel" 
            ? this.cleanKeyPersonnelContent(content)
            : this.cleanContent(content);
          
          formattedSections[sectionName] = {
            content: processedContent,
            type: "ai-generated",
            lastModified: new Date().toISOString(),
          };
        }
      }
    });
    
    return formattedSections;
  }

  /**
   * Extract contact information from Title section content
   */
  static extractTitleContactInfo(content) {
    const contactInfo = {
      submittedBy: "",
      name: "",
      email: "",
      number: ""
    };

    if (typeof content !== 'string') return contactInfo;

    // Extract Submitted by
    const submittedByMatch = content.match(/Submitted by:\s*(.+?)(?:\n|$)/i);
    if (submittedByMatch) {
      contactInfo.submittedBy = submittedByMatch[1].trim();
    }

    // Extract Name
    const nameMatch = content.match(/Name:\s*(.+?)(?:\n|$)/i);
    if (nameMatch) {
      contactInfo.name = nameMatch[1].trim();
    }

    // Extract Email
    const emailMatch = content.match(/Email:\s*(.+?)(?:\n|$)/i);
    if (emailMatch) {
      contactInfo.email = emailMatch[1].trim();
    }

    // Extract Number
    const numberMatch = content.match(/Number:\s*(.+?)(?:\n|$)/i);
    if (numberMatch) {
      contactInfo.number = numberMatch[1].trim();
    }

    return contactInfo;
  }

  /**
   * Extract sections from markdown text if JSON parsing fails
   */
  static extractSectionsFromMarkdown(markdownText) {
    const sections = {};
    
    // Try multiple patterns for section headers
    const patterns = [
      /^##\s+(.+)$/gm,  // ## Section Name
      /^#\s+(.+)$/gm,   // # Section Name
      /^\*\*(.+?)\*\*\s*$/gm,  // **Section Name**
      /^(.+?):\s*$/gm   // Section Name:
    ];
    
    for (const pattern of patterns) {
      const matches = [];
      let match;
      
      // Reset regex
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(markdownText)) !== null) {
        matches.push({
          name: match[1].trim(),
          index: match.index,
          fullMatch: match[0]
        });
      }
      
      if (matches.length > 0) {
        // Process each section
        for (let i = 0; i < matches.length; i++) {
          const currentMatch = matches[i];
          const nextMatch = matches[i + 1];
          
          const sectionName = currentMatch.name;
          const sectionStart = currentMatch.index + currentMatch.fullMatch.length;
          const sectionEnd = nextMatch ? nextMatch.index : markdownText.length;
          
          const content = markdownText
            .substring(sectionStart, sectionEnd)
            .trim();
          
          if (content && content.length > 10) { // Only add if content is substantial
            // Apply content cleaning to all sections except Key Personnel and Title
            let processedContent;
            if (sectionName === "Key Personnel") {
              processedContent = this.cleanKeyPersonnelContent(content);
            } else if (sectionName === "Title") {
              processedContent = this.extractTitleContactInfo(content);
            } else {
              processedContent = this.cleanContent(content);
            }
              
            sections[sectionName] = {
              content: processedContent,
              type: "ai-generated",
              lastModified: new Date().toISOString(),
            };
          }
        }
        break; // Use the first pattern that finds sections
      }
    }
    
    return sections;
  }
}

module.exports = AIProposalGenerator;
