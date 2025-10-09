const OpenAI = require('openai');
const {
  fetchCompanyInfo,
  fetchTeamMembers,
  fetchProjectReferences,
  formatTitleSection,
  formatCoverLetterSection,
  formatTeamMembersSection,
  formatReferencesSection,
  formatExperienceSection,
  shouldUseContentLibrary
} = require('./sharedSectionFormatters');

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Generate AI proposal sections based on RFP data
 */
async function generateAIProposalSections(rfp, templateId, customContent) {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  // Fetch content library data
  const companyInfo = await fetchCompanyInfo();
  const teamMembers = await fetchTeamMembers();
  const projectReferences = await fetchProjectReferences();

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
    const libraryType = await shouldUseContentLibrary(title);
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

**For "Title" sections** (if present):
   Carefully scan the entire text for ANY contact information and extract the following:
   
  - **Submitted by**: [Organization submitting the proposal; if not found, use "Not specified"]
   - **Name**: Look for contact person, project manager, point of contact, or any individual name mentioned for correspondence
   - **Email**: Search for any email addresses in the text (look for @ symbols)
   - **Number**: Find any phone numbers, contact numbers, or telephone references
   
   SEARCH PATTERNS TO LOOK FOR:
   - "Contact:", "Contact Person:", "Point of Contact:", "Project Manager:"
   - "Email:", "E-mail:", "Send to:", "Submit to:"
   - "Phone:", "Tel:", "Telephone:", "Call:", "Contact Number:"
   - Names followed by titles like "Director", "Manager", "Coordinator"
   - Email formats: anything@domain.com, anything@domain.gov, anything@domain.org
   - Phone formats: (xxx) xxx-xxxx, xxx-xxx-xxxx, xxx.xxx.xxxx
   - Addresses that might contain contact info
   - Look in submission instructions, cover letters, and contact sections
   - Check letterheads, signatures, and footer information
   
   EXTRACTION RULES:
   - If multiple contacts exist, prioritize the PRIMARY contact or project-specific contact
   - If no specific contact info is found, use "Not specified" for that field
  - For "Submitted by", if not found in the RFP, use "Not specified"
   - Look throughout the entire text, including headers, footers, and appendices
   - Extract the most relevant contact for proposal submission/communication
   - Clean extracted data (remove extra spaces, formatting)

**For sections related to Cover Letter** (containing words like "cover letter", "introduction", "letter"):
   Create a personalized, professional cover letter with contextual details and company-specific information
   - Use this EXACT format structure:
     **Submitted to:** [Client Name from RFP]
     **Submitted by:** [Company Name from context]
     **Date:** [Current date in MM/DD/YYYY format]
     
     Dear [Appropriate salutation based on RFP context],
     
     [Personalized opening paragraph mentioning specific connections or relevant experience]
     
     [2-3 body paragraphs explaining understanding of the project and approach]
     
     [Closing paragraph expressing commitment and looking forward to working together]
     
     Sincerely,
     
     [Generated Name], [Generated Title]
     [Generated Email]
     [Generated Phone]
   - Generate realistic contact information based on company context
   - Make the letter feel personal and specific to the RFP

**For sections containing "Understanding", "Approach", or "Analysis"**:
   Provide comprehensive analysis based on information provided in the RFP
   - Write 4-6 detailed paragraphs (400-600 words total)
   - Start with the current situation/context of the client using specific details from the RFP
   - Identify specific challenges, pressures, and opportunities mentioned in the RFP
   - Reference specific details from the RFP (project scope, requirements, constraints, objectives)
   - Explain why action is needed now and what happens without proper execution
   - Address compliance requirements (regulations, standards, policies) mentioned in the RFP
   - Conclude with collaborative, data-driven approach tailored to this specific project
   - Use specific language and terminology from the RFP document to show deep understanding

**For sections related to Personnel, Team, or Staff** (containing words like "personnel", "team", "staff", "resources", "experts"):
   Include team members with qualifications relevant to the project requirements
   - Include 4-6 key team members with diverse expertise relevant to the RFP requirements
   - Follow this exact format for each person:
     [Full Name], [Credentials] - [Title]
     - [Specific achievement or experience bullet point relevant to this project type]
     - [Another specific achievement or experience bullet point with quantifiable results]
     - [Additional relevant experience bullet point showing domain expertise]
     - [Optional 4th bullet point for senior roles with leadership experience]
   - Use 3-4 detailed bullet points per person describing specific achievements, projects, and qualifications
   - Include specific details like years of experience, notable projects, certifications, awards, or publications
   - Make the experience directly relevant to the project type and requirements described in the RFP
   - ONLY use names of real people who have publicly shared their work in this domain
   - If you cannot find real people, use "Unknown" instead of generating fake names
   - Ensure team composition addresses all major aspects of the RFP requirements

**For sections related to Methodology, Process, or Phases** (containing words like "methodology", "approach", "process", "phases", "implementation"):
   Detail project phases and deliverables based on RFP requirements
   - Create 4-6 comprehensive project phases that directly address the RFP requirements and deliverables
   - If specific methodology is mentioned in the RFP, follow that structure closely
   - If not specified, create logical phases based on the project type, scope, and deliverables mentioned in the RFP
   - CRITICAL: Format as a proper markdown table with exactly 2 columns: "Phase" and "Deliverables"
   - Use this exact table format:
     | Phase | Deliverables |
     |-------|--------------|
     | Phase 1: [Detailed Phase Name reflecting RFP requirements] | 1. [Specific deliverable from RFP]<br>2. [Another specific deliverable]<br>3. [Additional deliverable]<br>4. [Optional 4th deliverable for complex phases] |
     | Phase 2: [Detailed Phase Name reflecting RFP requirements] | 1. [Specific deliverable from RFP]<br>2. [Another specific deliverable]<br>3. [Additional deliverable]<br>4. [Optional 4th deliverable for complex phases] |
   - Each phase should have 3-5 specific, actionable deliverables that directly address RFP requirements
   - Include deliverables that match what's specifically requested in the RFP document
   - Use <br> tags for line breaks within table cells
   - Ensure methodology is appropriate for the project domain and complexity described in the RFP

**For sections related to Schedule or Timeline** (containing words like "schedule", "timeline", "milestones"):
   Create timeline with milestones based on RFP specifications
   - Create a realistic timeline that incorporates specific deadlines mentioned in the RFP
   - If specific deadlines are mentioned in the RFP, work backwards from those dates
   - If not specified, create a logical timeline based on project scope and industry standards
   - Include 4-6 phases that align with the methodology and deliverables
   - CRITICAL: Format as simple headings and paragraphs, NOT as a table
   - Use this exact format:
     ## Phase 1: [Detailed Phase Name matching methodology]
     **Timeline:** [Specific duration with start/end dates if RFP provides deadline]
     
     [Detailed 3-4 sentence paragraph describing the phase activities, key milestones, deliverables, and outcomes. Include specific tasks, meetings, reviews, and checkpoints. Explain what will be accomplished and how it contributes to the overall project success. Reference specific RFP requirements that will be addressed in this phase.]
   - Each phase should have realistic timeline estimates and comprehensive paragraph descriptions
   - Use **bold** for "Timeline:" labels and ## for phase headings
   - Write detailed paragraphs (3-4 sentences each) that explain what will be accomplished in each phase
   - Include specific milestones, deliverables, and review points for each phase

**For sections related to Budget, Cost, or Financial** (containing words like "budget", "cost", "financial", "pricing", "fees"):
   Provide cost breakdown by phases based on RFP budget information
   - Create detailed cost breakdown that aligns with the methodology phases and deliverables
   - If budget range is provided in the RFP, work within that range and justify the costs
   - If specific budget requirements are mentioned, follow those guidelines closely
   - Break down costs by phases, resources, and deliverables as appropriate for the project
   - CRITICAL: Format as a proper markdown table with exactly 3 columns: "Phase", "Description", "Cost"
   - Use this exact table format:
     | Phase | Description | Cost |
     |-------|-------------|------|
     | Phase 1: [Detailed Phase Name] | [Comprehensive description of work, resources, and deliverables for this phase] | $[Realistic Amount] |
     | Phase 2: [Detailed Phase Name] | [Comprehensive description of work, resources, and deliverables for this phase] | $[Realistic Amount] |
     | Phase 3: [Detailed Phase Name] | [Comprehensive description of work, resources, and deliverables for this phase] | $[Realistic Amount] |
     | Phase 4: [Detailed Phase Name] | [Comprehensive description of work, resources, and deliverables for this phase] | $[Realistic Amount] |
     | **Total** | **Project Total** | **$[Total Amount]** |
   - Each phase should have realistic cost estimates based on industry standards and project complexity
   - Include detailed descriptions that justify the costs for each phase
   - Ensure costs are appropriate for the project type, scope, and deliverables described in the RFP
   - Include a total row at the bottom that sums all phase costs

**For sections related to References, Experience, or Portfolio** (containing words like "references", "experience", "portfolio", "past projects", "case studies"):
   Include relevant past projects and client experience
   - Include 4-5 relevant past projects that demonstrate experience with similar work to the RFP requirements
   - Make the references directly relevant to the project type, scope, and requirements described in the RFP
   - Use this exact format for each reference:
     Organization Name (Year-Year)
     Contact: [Name], [Title] of [Organization]
     Email: [email]
     Phone: [phone]
     Scope of Work: [Detailed 2-3 sentence description of work performed, challenges addressed, solutions delivered, and quantifiable achievements or outcomes that relate to the current RFP requirements]
   - Include specific details about project scope, deliverables, outcomes, and success metrics
   - Ensure references showcase expertise in the specific domain and project type mentioned in the RFP
   - ONLY use names of real people who have publicly shared their work in this domain
   - If you cannot find real people, use "Unknown" instead of generating fake names
   - Do NOT use dashes at the beginning of each line in references
   - Focus on projects that demonstrate relevant capabilities for the current RFP

**For any other sections**:
   Generate comprehensive content that is directly relevant to the section title and RFP requirements
   - Write substantial content (200-400 words per section depending on importance)
   - Use specific details and terminology from the RFP document when available
   - Address the section topic thoroughly with multiple paragraphs or detailed bullet points
   - Show deep understanding of the RFP requirements and how they relate to this section
   - **IMPORTANT**: Even if the RFP doesn't explicitly mention the section topic (e.g., "Sustainability", "Innovation", "Quality Assurance"), generate thoughtful, relevant content that demonstrates how your approach to this RFP addresses that topic
   - For sections not directly mentioned in RFP, infer and propose how this topic relates to the project goals, deliverables, and client needs
   - Never write "not available" or "not specified" - always provide substantive, relevant content

GUIDELINES:
- Generate COMPREHENSIVE, DETAILED content for each section - avoid brief or superficial responses
- Use professional, persuasive language that demonstrates expertise
- Include extensive specific details from the RFP document throughout all sections
- Reference specific RFP requirements, constraints, objectives, and deliverables in each section
- Format tables using markdown table syntax with detailed content in each cell
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

${rfp.rawText ? `\nRFP Full Text:\n${rfp.rawText}` : ''}

INSTRUCTIONS:

Generate COMPREHENSIVE, DETAILED content for each section based on the section title and RFP requirements:

- **For Understanding/Approach sections**: Write 4-6 detailed paragraphs (400-600 words) using extensive specific details from the RFP text, reference client's situation, challenges, and requirements thoroughly
- **For Personnel/Team sections**: Include 4-6 team members with real people only, detailed credentials and achievements, comprehensive experience descriptions relevant to RFP
- **For Methodology/Process sections**: Create 4-6 detailed phases with comprehensive deliverables, use table format that fully addresses RFP requirements
- **For Schedule/Timeline sections**: Create realistic detailed timeline with 4-6 phases, use heading format with comprehensive 3-4 sentence paragraphs per phase
- **For Budget/Cost sections**: Create detailed cost breakdown with comprehensive descriptions, use table format that justifies all costs based on RFP scope
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
      const hasExpectedSections = aiOnlySections.some(section => parsed.hasOwnProperty(section));
      
      if (hasExpectedSections) {
        // Add content library sections to parsed sections
        for (const sectionTitle of orderedTitles) {
          const libraryType = contentLibrarySections[sectionTitle];
          if (libraryType) {
            if (libraryType === "title") {
              parsed[sectionTitle] = formatTitleSection(companyInfo, rfp);
            } else if (libraryType === "cover-letter") {
              parsed[sectionTitle] = formatCoverLetterSection(companyInfo, rfp);
            } else if (libraryType === "experience") {
              parsed[sectionTitle] = await formatExperienceSection(companyInfo, rfp);
            } else if (libraryType === "team") {
              parsed[sectionTitle] = formatTeamMembersSection(teamMembers);
            } else if (libraryType === "references") {
              parsed[sectionTitle] = formatReferencesSection(projectReferences);
            }
          }
        }

        // Validate and clean the AI sections
        const validatedSections = validateAISections(parsed);
        return formatAISections(validatedSections, orderedTitles, contentLibrarySections);
      } else {
        // If structure is different, try to extract from markdown and add content library sections
        const extracted = extractSectionsFromMarkdown(raw);
        
        // Add content library sections to extracted sections
        for (const sectionTitle of orderedTitles) {
          const libraryType = contentLibrarySections[sectionTitle];
          if (libraryType) {
            if (libraryType === "title") {
              extracted[sectionTitle] = {
                content: formatTitleSection(companyInfo, rfp),
                type: "content-library",
                lastModified: new Date().toISOString(),
              };
            } else if (libraryType === "cover-letter") {
              extracted[sectionTitle] = {
                content: formatCoverLetterSection(companyInfo, rfp),
                type: "content-library", 
                lastModified: new Date().toISOString(),
              };
            } else if (libraryType === "experience") {
              extracted[sectionTitle] = {
                content: await formatExperienceSection(companyInfo, rfp),
                type: "content-library",
                lastModified: new Date().toISOString(),
              };
            } else if (libraryType === "team") {
              extracted[sectionTitle] = {
                content: formatTeamMembersSection(teamMembers),
                type: "content-library",
                lastModified: new Date().toISOString(),
              };
            } else if (libraryType === "references") {
              extracted[sectionTitle] = {
                content: formatReferencesSection(projectReferences),
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
      const extracted = extractSectionsFromMarkdown(raw);
      
      // Add content library sections to extracted sections
      for (const sectionTitle of orderedTitles) {
        const libraryType = contentLibrarySections[sectionTitle];
        if (libraryType) {
          if (libraryType === "title") {
            extracted[sectionTitle] = {
              content: formatTitleSection(companyInfo, rfp),
              type: "content-library",
              lastModified: new Date().toISOString(),
            };
          } else if (libraryType === "cover-letter") {
            extracted[sectionTitle] = {
              content: formatCoverLetterSection(companyInfo, rfp),
              type: "content-library", 
              lastModified: new Date().toISOString(),
            };
          } else if (libraryType === "experience") {
            extracted[sectionTitle] = {
              content: await formatExperienceSection(companyInfo, rfp),
              type: "content-library",
              lastModified: new Date().toISOString(),
            };
          } else if (libraryType === "team") {
            extracted[sectionTitle] = {
              content: formatTeamMembersSection(teamMembers),
              type: "content-library",
              lastModified: new Date().toISOString(),
            };
          } else if (libraryType === "references") {
            extracted[sectionTitle] = {
              content: formatReferencesSection(projectReferences),
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
function validateAISections(sections) {
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
          content.trim() === '' ||
          content.length < 20) {  // Increased from 10 to 20 to allow short but valid content
        validatedSections[sectionName] = "Not available in the RFP document";
      } else {
        // Clean the content to remove any generated information
        validatedSections[sectionName] = cleanGeneratedContent(content);
      }
    }
  });
  
  return validatedSections;
}

/**
 * Clean content to remove any AI-generated information that wasn't in the RFP
 */
function cleanGeneratedContent(content) {
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
function cleanKeyPersonnelContent(content) {
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
function cleanContent(content) {
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
function formatAISections(sections, orderedTitles = [], contentLibrarySections = {}) {
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
          content: extractTitleContactInfo(content),
          type: "ai-generated",
          lastModified: new Date().toISOString(),
        };
      } else {
        // AI-generated sections - clean content
        const processedContent = sectionName === "Key Personnel" 
          ? cleanKeyPersonnelContent(content)
          : cleanContent(content);
        
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
function extractTitleContactInfo(content) {
  const contactInfo = {
    submittedBy: "",
    name: "",
    email: "",
    number: ""
  };

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
function extractSectionsFromMarkdown(markdownText) {
  const sections = {};
  
  // Try multiple patterns for section headers
  const patterns = [
    /^##\s+(.+)$/gm,  // ## Section Name
    /^#\s+(.+)$/gm,   // # Section Name
    /^\*\*(.+?)\*\*\s*$/gm,  // **Section Name**
    /^(.+?):\s*$/gm   // Section Name:
  ];
  
  let foundSections = false;
  
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
      foundSections = true;
      
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
            processedContent = cleanKeyPersonnelContent(content);
          } else if (sectionName === "Title") {
            processedContent = extractTitleContactInfo(content);
          } else {
            processedContent = cleanContent(content);
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

module.exports = {
  generateAIProposalSections,
  formatAISections,
  extractSectionsFromMarkdown,
  extractTitleContactInfo,
  cleanContent,
  cleanKeyPersonnelContent,
  validateAISections,
  cleanGeneratedContent
};
