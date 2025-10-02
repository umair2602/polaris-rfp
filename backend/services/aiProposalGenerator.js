const OpenAI = require('openai');

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
  const dynamicList = orderedTitles.map((t, i) => `${i + 1}. **${t}**`).join('\n');

  const systemPrompt = `
You are an expert proposal writer. Generate a comprehensive proposal based on the RFP document provided. 
Structure the proposal with the following sections and format them as markdown:

${dynamicList}

CRITICAL: Use EXACTLY these section titles as JSON keys, in this order:
${JSON.stringify(orderedTitles)}

1. **Title** - ENHANCED CONTACT INFORMATION EXTRACTION:
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

2. **Cover Letter** - Personalized cover letter with contextual details and company-specific information
3. **Project Understanding and Approach** - Comprehensive analysis based on information provided in the RFP
4. **Key Personnel** - Team members with qualifications relevant to the project requirements
5. **Methodology (By Phase)** - Detailed project phases and deliverables based on RFP requirements
6. **Project Schedule** - Timeline with milestones based on RFP specifications
7. **Budget** - Cost breakdown by phases based on RFP budget information
8. **References** - Relevant past projects and client experience

GUIDELINES:
- Use professional, persuasive language
- Include specific details from the RFP when available
- Format tables using markdown table syntax
- Use bullet points for lists
- Make content relevant to the project type as described in the RFP
- Ensure each section is comprehensive but concise
- Use **bold** for emphasis and *italics* for important details
- Adapt language and examples to match the RFP's project type (e.g., "Software Development", "Financial Analysis", "Strategic Planning", "Consulting", "Engineering", etc.)

For the Project Understanding and Approach section:
- Write 4-6 comprehensive paragraphs (300-500 words total)
- Start with the current situation/context of the client/organization using specific details from the RFP
- Identify specific challenges, pressures, and opportunities mentioned in the RFP
- Reference specific details from the RFP (project scope, requirements, constraints, objectives)
- Explain why action is needed now and what happens without proper execution
- Describe the organization's valuable assets and goals that must be addressed
- Address compliance requirements (regulations, standards, policies) mentioned in the RFP
- Conclude with our collaborative, data-driven approach
- Use specific language from the RFP to show deep understanding
- If specific details are not provided in the RFP, work with the general project description available

For the Cover Letter section:
- Create a personalized, professional cover letter
- Include contextual details like: school connections, recent work in the area, company location, etc.
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
- Include specific details from the RFP when available

For the Key Personnel section:
- Include 3-5 key team members with actual real people who have publicly shared their work in this domain
- Each person should have: Full Name, Credentials (MBA, PhD, etc.), Title
- Follow this exact format for each person:
  [Full Name], [Credentials] - [Title]
  - [Specific achievement or experience bullet point]
  - [Another specific achievement or experience bullet point]
  - [Additional relevant experience bullet point]
- Use 3-5 bullet points per person describing their specific achievements, projects, and qualifications
- Make the experience relevant to the project type as described in the RFP
- Include specific details like years of experience, notable projects, certifications, or awards
- ONLY use names of real people who have publicly shared their work in this specific domain
- If you cannot find real people with relevant experience, use "Unknown" instead of generating fake names
- Do NOT generate or make up names - only use real people or "Unknown"

For the ${orderedTitles.find(t=>/methodology/i.test(t)) || 'Methodology'} section:
- Create detailed project phases based on the deliverables and requirements mentioned in the RFP
- If specific methodology is mentioned in the RFP, follow that structure
- If not specified, create logical phases based on the project type and deliverables
- Include specific deliverables for each phase
- Make it relevant to the project requirements as described in the RFP
- CRITICAL: Format as a proper markdown table with exactly 2 columns: "Phase" and "Deliverables"
- Use this exact table format:
  | Phase | Deliverables |
  |-------|--------------|
  | Phase 1: [Phase Name] | 1. [Deliverable 1]<br>2. [Deliverable 2]<br>3. [Deliverable 3] |
  | Phase 2: [Phase Name] | 1. [Deliverable 1]<br>2. [Deliverable 2]<br>3. [Deliverable 3] |
  | Phase 3: [Phase Name] | 1. [Deliverable 1]<br>2. [Deliverable 2]<br>3. [Deliverable 3] |
  | Phase 4: [Phase Name] | 1. [Deliverable 1]<br>2. [Deliverable 2]<br>3. [Deliverable 3] |
  | Phase 5: [Phase Name] | 1. [Deliverable 1]<br>2. [Deliverable 2]<br>3. [Deliverable 3] |
- Each phase should have 3-5 specific deliverables
- Use <br> tags for line breaks within table cells
- Ensure the table is properly formatted and readable

For the ${orderedTitles.find(t=>/schedule/i.test(t)) || 'Project Schedule'} section:
- Create a realistic timeline based on the project requirements and deliverables
- If specific deadlines are mentioned in the RFP, incorporate those
- If not specified, create a logical timeline based on the project scope
- Include key milestones and deliverables
- CRITICAL: Format as simple headings and paragraphs, NOT as a table
- Use this exact format:
  ## Phase 1: [Phase Name]
  **Timeline:** [Duration]
  
  [Detailed paragraph describing the phase activities, key milestones, and deliverables. Include specific tasks, meetings, deliverables, and outcomes for this phase. Write 2-3 comprehensive sentences that explain what will be accomplished during this phase.]
  
  ## Phase 2: [Phase Name]
  **Timeline:** [Duration]
  
  [Detailed paragraph describing the phase activities, key milestones, and deliverables. Include specific tasks, meetings, deliverables, and outcomes for this phase. Write 2-3 comprehensive sentences that explain what will be accomplished during this phase.]
  
  ## Phase 3: [Phase Name]
  **Timeline:** [Duration]
  
  [Detailed paragraph describing the phase activities, key milestones, and deliverables. Include specific tasks, meetings, deliverables, and outcomes for this phase. Write 2-3 comprehensive sentences that explain what will be accomplished during this phase.]
  
  ## Phase 4: [Phase Name]
  **Timeline:** [Duration]
  
  [Detailed paragraph describing the phase activities, key milestones, and deliverables. Include specific tasks, meetings, deliverables, and outcomes for this phase. Write 2-3 comprehensive sentences that explain what will be accomplished during this phase.]
  
  ## Phase 5: [Phase Name]
  **Timeline:** [Duration]
  
  [Detailed paragraph describing the phase activities, key milestones, and deliverables. Include specific tasks, meetings, deliverables, and outcomes for this phase. Write 2-3 comprehensive sentences that explain what will be accomplished during this phase.]
- Each phase should have realistic timeline and detailed paragraph descriptions
- Use **bold** for "Timeline:" labels
- Use ## for phase headings
- Write comprehensive paragraphs that explain what will be accomplished in each phase

For the ${orderedTitles.find(t=>/budget/i.test(t)) || 'Budget'} section:
- Create a detailed cost breakdown based on the project phases and deliverables
- If budget range is provided in the RFP, work within that range
- If specific budget requirements are mentioned, follow those guidelines
- Break down costs by phases and deliverables
- CRITICAL: Format as a proper markdown table with exactly 3 columns: "Phase", "Description", "Cost"
- Use this exact table format:
  | Phase | Description | Cost |
  |-------|-------------|------|
  | Phase 1: [Phase Name] | [Brief description of work] | $[Amount] |
  | Phase 2: [Phase Name] | [Brief description of work] | $[Amount] |
  | Phase 3: [Phase Name] | [Brief description of work] | $[Amount] |
  | Phase 4: [Phase Name] | [Brief description of work] | $[Amount] |
  | Phase 5: [Phase Name] | [Brief description of work] | $[Amount] |
  | **Total** | **Project Total** | **$[Total Amount]** |
- Each phase should have realistic cost estimates
- Include a total row at the bottom
- Use <br> tags for line breaks within table cells if needed
- Ensure the table is properly formatted and readable

For the References section:
- Include 3-5 relevant past projects that demonstrate experience with similar work
- Use this exact format for each reference:
  Organization Name (Year-Year)
  Contact: [Name], [Title] of [Organization]
  Email: [email]
  Phone: [phone]
  Scope of Work: [Detailed description of work performed and achievements]
- Make the references relevant to the project type and requirements
- ONLY use names of real people who have publicly shared their work in this specific domain
- If you cannot find real people with relevant experience, use "Unknown" instead of generating fake names
- Do NOT generate or make up names - only use real people or "Unknown"
- Focus on people who have publicly documented their work in this field
- Do NOT use dashes at the beginning of each line in references

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

1. **Project Understanding and Approach**: 
   - Use specific details from the RFP text when available (project scope, requirements, constraints, objectives)
   - If specific details are not provided, work with the general project description and requirements
   - Reference the client's specific situation, goals, and needs as described in the Document
   - Address compliance requirements mentioned in the Document
   - Write 4-6 comprehensive paragraphs that demonstrate understanding of the project
   - Adapt language and context to match the project type (e.g., software development, financial analysis, strategic planning, etc.)

2. **Key Personnel**: 
   - ONLY use names of real people who have publicly shared their work in this specific domain
   - If you cannot find real people with relevant experience, use "Unknown" instead of generating fake names
   - Do NOT generate or make up names - only use real people or "Unknown"
   - Focus on people who have publicly documented their work in this field
   - Ensure team members have expertise in the project domain

3. **Methodology (By Phase)**: 
   - Create detailed phases based on the deliverables and requirements mentioned in the RFP
   - If specific methodology is mentioned, follow that structure
   - If not specified, create logical phases based on the project type and deliverables
   - Ensure methodology is appropriate for the project domain

4. **Project Schedule**: 
   - Create a realistic timeline based on the project requirements
   - If specific deadlines are mentioned in the RFP, incorporate those
   - If not specified, create a logical timeline based on the project scope
   - Consider project complexity and industry standards for timeline

5. **Budget**: 
   - Create detailed cost breakdown based on the project phases and deliverables
   - If budget range is provided in the RFP, work within that range
   - If specific budget requirements are mentioned, follow those guidelines
   - Use markdown table format for clear presentation
   - Ensure costs are realistic for the project type and scope

6. **References**: 
   - Include relevant past projects that demonstrate experience with similar work
   - Make the references relevant to the project type and requirements
   - Ensure references showcase expertise in the project domain
   - ONLY use names of real people who have publicly shared their work in this specific domain
   - If you cannot find real people with relevant experience, use "Unknown" instead of generating fake names
   - Do NOT generate or make up names - only use real people or "Unknown"

Generate a comprehensive proposal with all sections formatted as markdown, using the information provided in the RFP data.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 12000,
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
      
      // Validate that we have the expected sections
      const expectedSections = orderedTitles;
      
      // Check if we have the expected structure
      const hasExpectedSections = expectedSections.some(section => parsed.hasOwnProperty(section));
      
      if (hasExpectedSections) {
        // Validate and clean the parsed sections
        const validatedSections = validateAISections(parsed);
        return formatAISections(validatedSections);
      } else {
        // If structure is different, try to extract from markdown
        return extractSectionsFromMarkdown(raw);
      }
    } catch (jsonError) {
      // If not JSON, try to extract sections from markdown
      return extractSectionsFromMarkdown(raw);
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
      // Check if content indicates no information available
      if (!content || 
          content.toLowerCase().includes('not available') ||
          content.toLowerCase().includes('not specified') ||
          content.trim() === '' ||
          content.length < 10) {
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
function formatAISections(sections, companyName = 'Not specified') {
  const formattedSections = {};
  
  // Add Title section first if it exists
  if (sections.Title) {
    formattedSections["Title"] = {
      content: extractTitleContactInfo(sections.Title, companyName),
      type: "ai-generated",
      lastModified: new Date().toISOString(),
    };
  }
  
  // Add Cover Letter section if it exists
  if (sections["Cover Letter"]) {
    formattedSections["Cover Letter"] = {
      content: sections["Cover Letter"],
      type: "ai-generated",
      lastModified: new Date().toISOString(),
    };
  }
  
  // Add remaining AI-generated sections (excluding Title and Cover Letter which were already added)
  Object.entries(sections).forEach(([sectionName, content]) => {
    // Skip Title and Cover Letter (already added)
    if (sectionName !== "Title" &&
        sectionName !== "Cover Letter") {
      
      // Apply content cleaning to all sections except Key Personnel
      const processedContent = sectionName === "Key Personnel" 
        ? cleanKeyPersonnelContent(content)
        : cleanContent(content);
      
      formattedSections[sectionName] = {
        content: processedContent,
        type: "ai-generated",
        lastModified: new Date().toISOString(),
      };
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
  
  // If no sections found with patterns, try to split by common section names
  if (!foundSections) {
    const commonSections = [
      "Project Understanding and Approach",
      "Key Personnel", 
      "Methodology",
      "Project Schedule",
      "Budget",
      "References"
    ];
    
    let currentContent = markdownText;
    
    for (const sectionName of commonSections) {
      const regex = new RegExp(`(${sectionName}[\\s\\S]*?)(?=${commonSections.join('|')}|$)`, 'gi');
      const match = regex.exec(currentContent);
      
      if (match && match[1]) {
        const content = match[1].replace(new RegExp(`^${sectionName}\\s*:?\\s*`, 'i'), '').trim();
        if (content && content.length > 10) {
          // Apply content cleaning to all sections except Key Personnel
          const processedContent = sectionName === "Key Personnel" 
            ? cleanKeyPersonnelContent(content)
            : cleanContent(content);
            
          sections[sectionName] = {
            content: processedContent,
            type: "ai-generated", 
            lastModified: new Date().toISOString(),
          };
        }
      }
    }
  }
  
  // If still no sections found, create a single section with all content
  if (Object.keys(sections).length === 0) {
    sections["Proposal Content"] = {
      content: cleanContent(markdownText),
      type: "ai-generated",
      lastModified: new Date().toISOString(),
    };
  }
  
  // Merge sections with proper ordering: Title first, then AI sections
  const finalSections = {};
  
  // Add Title section first if it exists
  if (sections.Title) {
    finalSections["Title"] = sections.Title;
  }
  
  // Add Cover Letter section if it exists
  if (sections["Cover Letter"]) {
    finalSections["Cover Letter"] = sections["Cover Letter"];
  }
  
  // Add remaining AI sections (excluding Title and Cover Letter)
  Object.entries(sections).forEach(([sectionName, sectionData]) => {
    if (sectionName !== "Title" && sectionName !== "Cover Letter") {
      finalSections[sectionName] = sectionData;
    }
  });
  
  return finalSections;
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
