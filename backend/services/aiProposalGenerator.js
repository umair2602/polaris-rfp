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

  const systemPrompt = `
You are an expert proposal writer. Generate a comprehensive proposal based on the RFP document provided. 
Structure the proposal with the following sections and format them as markdown:

1. **Title** - ENHANCED CONTACT INFORMATION EXTRACTION:
   Carefully scan the entire text for ANY contact information and extract the following:
   
   - **Submitted by**: [Your company name - "Eighth Generation Consulting" - this should ALWAYS be included]
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
   - For "Submitted by", ALWAYS use "Eighth Generation Consulting" 
   - Look throughout the entire text, including headers, footers, and appendices
   - Extract the most relevant contact for proposal submission/communication
   - Clean extracted data (remove extra spaces, formatting)

2. **Project Understanding and Approach** - Comprehensive analysis based on information provided in the RFP
3. **Key Personnel** - Team members with qualifications relevant to the project requirements
4. **Methodology (By Phase)** - Detailed project phases and deliverables based on RFP requirements
5. **Project Schedule** - Timeline with milestones based on RFP specifications
6. **Budget** - Cost breakdown by phases based on RFP budget information
7. **References** - Relevant past projects and client experience

GUIDELINES:
- Use professional, persuasive language
- Include specific details from the RFP when available
- Format tables using markdown table syntax
- Use bullet points for lists
- Make content relevant to the project type as described in the RFP
- Ensure each section is comprehensive but concise
- Use **bold** for emphasis and *italics* for important details

For the Project Understanding and Approach section:
- Write 4-6 comprehensive paragraphs (300-500 words total)
- Start with the current situation/context of the client/community using specific details from the RFP
- Identify specific challenges, pressures, and opportunities mentioned in the RFP
- Reference specific details from the RFP (population, land use patterns, community characteristics)
- Explain why action is needed now and what happens without proper planning
- Describe the community's valuable assets that must be protected
- Address compliance requirements (state/federal laws, codes) mentioned in the RFP
- Conclude with our collaborative, data-driven approach
- Use specific language from the RFP to show deep understanding
- If specific details are not provided in the RFP, work with the general project description available

For the Key Personnel section:
- Include 3-5 key team members with realistic professional names
- Each person should have: Full Name, Credentials (MBA, PhD, etc.), Title
- Follow this exact format for each person:
  [Full Name], [Credentials] - [Title]
  ● [Specific achievement or experience bullet point]
  ● [Another specific achievement or experience bullet point]
  ● [Additional relevant experience bullet point]
- Use 3-5 bullet points per person describing their specific achievements, projects, and qualifications
- Make the experience relevant to the project type as described in the RFP
- Include specific details like years of experience, notable projects, certifications, or awards

For the Methodology (By Phase) section:
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

For the Project Schedule section:
- Create a realistic timeline based on the project requirements and deliverables
- If specific deadlines are mentioned in the RFP, incorporate those
- If not specified, create a logical timeline based on the project scope
- Include key milestones and deliverables
- CRITICAL: Format as a proper markdown table with exactly 3 columns: "Phase", "Timeline", "Key Milestones"
- Use this exact table format:
  | Phase | Timeline | Key Milestones |
  |-------|----------|----------------|
  | Phase 1: [Phase Name] | [Duration] | [Milestone 1], [Milestone 2] |
  | Phase 2: [Phase Name] | [Duration] | [Milestone 1], [Milestone 2] |
  | Phase 3: [Phase Name] | [Duration] | [Milestone 1], [Milestone 2] |
  | Phase 4: [Phase Name] | [Duration] | [Milestone 1], [Milestone 2] |
  | Phase 5: [Phase Name] | [Duration] | [Milestone 1], [Milestone 2] |
- Each phase should have realistic timeline and 2-3 key milestones
- Use <br> tags for line breaks within table cells if needed
- Ensure the table is properly formatted and readable

For the Budget section:
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
  - Organization Name (Year-Year)
  - Contact: [Name], [Title] of [Organization]
  - Email: [email]
  - Phone: [phone]
  - Scope of Work: [Detailed description of work performed and achievements]
- Make the references relevant to the project type and requirements

CRITICAL: Return the sections as a JSON object with EXACTLY these section names as keys and content as values:
{
  "Title": "Submitted by: Eighth Generation Consulting\nName: [Resource person name]\nEmail: [Resource person email]\nNumber: [Resource person contact number]",
  "Firm Qualifications and Experience": "content here",
  "Relevant Comprehensive Planning & Rural Community Experience": "content here",
  "Project Understanding and Approach": "content here",
  "Key Personnel": "content here",
  "Methodology (By Phase)": "content here",
  "Project Schedule": "content here",
  "Budget": "content here",
  "References": "content here"
}

Each section should be a separate key-value pair in the JSON object.`;

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
   - Use specific details from the RFP text when available (population numbers, land use patterns, community characteristics, challenges)
   - If specific details are not provided, work with the general project description and requirements
   - Reference the client's specific situation, assets, and needs as described in the RFP
   - Address compliance requirements mentioned in the RFP
   - Write 4-6 comprehensive paragraphs that demonstrate understanding of the project

2. **Key Personnel**: 
   - Create realistic professional profiles relevant to the project requirements
   - Use realistic names and credentials appropriate for the project type
   - Focus on experience relevant to the specific project requirements mentioned in the RFP

3. **Methodology (By Phase)**: 
   - Create detailed phases based on the deliverables and requirements mentioned in the RFP
   - If specific methodology is mentioned, follow that structure
   - If not specified, create logical phases based on the project type and deliverables

4. **Project Schedule**: 
   - Create a realistic timeline based on the project requirements
   - If specific deadlines are mentioned in the RFP, incorporate those
   - If not specified, create a logical timeline based on the project scope

5. **Budget**: 
   - Create detailed cost breakdown based on the project phases and deliverables
   - If budget range is provided in the RFP, work within that range
   - If specific budget requirements are mentioned, follow those guidelines
   - Use markdown table format for clear presentation

6. **References**: 
   - Include relevant past projects that demonstrate experience with similar work
   - Make the references relevant to the project type and requirements

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
      const expectedSections = [
        "Title",
        "Firm Qualifications and Experience",
        "Relevant Comprehensive Planning & Rural Community Experience",
        "Project Understanding and Approach", 
        "Key Personnel",
        "Methodology (By Phase)",
        "Project Schedule",
        "Budget",
        "References"
      ];
      
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
  
  // Define sections that should only contain RFP-based information
  const rfpBasedSections = [
    "Title",
    "Project Understanding and Approach",
    "Key Personnel", 
    "Methodology (By Phase)",
    "Project Schedule",
    "Budget",
    "References"
  ];
  
  // Validate each section
  Object.entries(sections).forEach(([sectionName, content]) => {
    if (sectionName === "Title") {
      // Title section should always be preserved as-is for contact extraction
      validatedSections[sectionName] = content;
    } else if (rfpBasedSections.includes(sectionName)) {
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
    } else {
      // For non-RFP based sections, keep as is
      validatedSections[sectionName] = content;
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
    // Fix bullet points that might have been corrupted
    .replace(/[●•]/g, '-')
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
function formatAISections(sections) {
  const formattedSections = {};
  
  // Add Title section first if it exists
  if (sections.Title) {
    formattedSections["Title"] = {
      content: extractTitleContactInfo(sections.Title),
      type: "ai-generated",
      lastModified: new Date().toISOString(),
    };
  }
  
  // Add hardcoded sections
  formattedSections["Firm Qualifications and Experience"] = {
    content: getFirmQualificationsContent(),
    type: "hardcoded",
    lastModified: new Date().toISOString(),
  };
  
  formattedSections["Relevant Comprehensive Planning & Rural Community Experience"] = {
    content: getRelevantExperienceContent(),
    type: "hardcoded", 
    lastModified: new Date().toISOString(),
  };
  
  // Add remaining AI-generated sections (excluding Title which was already added)
  Object.entries(sections).forEach(([sectionName, content]) => {
    // Skip the hardcoded sections and Title if they were generated by AI
    if (sectionName !== "Firm Qualifications and Experience" && 
        sectionName !== "Relevant Comprehensive Planning & Rural Community Experience" &&
        sectionName !== "Title") {
      
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
 * Hardcoded content for Firm Qualifications and Experience
 */
function getFirmQualificationsContent() {
  return `Eighth Generation Consulting is a consultancy established in 2022, with a staff of 5 professionals specializing in land use planning, zoning, and public engagement. Our leadership team has over 75 years of combined experience supporting municipalities, tribal governments, and both non-profit and for-profit organizations to integrate economic and environmental development with community engagement and regulatory compliance requirements. We've earned numerous awards and recognitions for these efforts:

• **2022:** Honored by the United Nations at the Biodiversity COP15 for pioneering zoning, land use, and stakeholder collaboration through the City of Carbondale's Sustainability Plan.

• **2024:** Grand Prize winners through an NREL sponsored prize on community integration of infrastructure and workforce development in land use issues.

• **2024:** MIT Solver - Indigenous Communities Fellowship Class of 2024 for work on developing systems of collaboration between local, state, tribal, and federal entities around energy and responsible land use issues.

• **2025:** American Made Challenge Current Semifinalist, U.S. Department of Energy.

• **2025:** Verizon Disaster Resilience Prize Current Semifinalist for oneNode, a solar microgrid technology to restore connectivity, monitor hazards, and coordinate response in disaster zones.

• **2025:** Shortlisted as an MIT Solver semifinalist for a second time focusing on responsible land use, zoning, and privacy concerns for data center development.

• **2025:** Awarded Preferred Provider by the Alliance for Tribal Clean Energy.

Our core services include: Comprehensive Planning, Zoning Ordinance Updates, Rural & Agricultural Preservation, Public Facilitation, and Legal/Statutory Compliance Reviews.`;
}

/**
 * Hardcoded content for Relevant Comprehensive Planning & Rural Community Experience
 */
function getRelevantExperienceContent() {
  return `Eighth Generation Consulting's staff have contributed to and led multiple comprehensive planning and sustainability initiatives in complex municipal areas, including:

• **Carbondale's Sustainability Action Plan**
  - Emphasized cross-sector collaboration, brownfield development policy, and climate resiliency measures, adopted via a 5-0 City Council vote. Incorporated robust stakeholder engagement strategies that effectively included rural and agricultural stakeholders. Reviewed all current Zoning Land Use and restrictions, requirements, and assumptions.

• **Osage Nation planning and development support**
  - Led multiple community-based planning efforts emphasizing coordination between local groups like the Chamber of Commerce, tribal stakeholders in the Osage Nation, as well as county and state representatives. Integrated local concerns around land use, infrastructure planning, and economic development. Wrote 12 grant applications serving as subject matter experts on energy and land usage.

• **Tribal and Municipal Environmental Permitting & Siting Projects**
  - Partnered with the Upper Mattaponi Tribe of Virginia, the Rappahannock Tribe in collaboration with U.S. Fish and Wildlife, Virginia's Piedmont Environmental Council, and the City of Tacoma's Environmental Services Department to deliver GIS-driven siting, feasibility analysis, and permitting strategies for projects exceeding $400,000 in combined value. Developed community-informed engagement frameworks, coordinated with Authorities Having Jurisdiction (AHJs), and designed compliance pathways aligned with federal, state, and local regulations.`;
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
  
  // Add hardcoded sections to the beginning
  const hardcodedSections = {
    "Firm Qualifications and Experience": {
      content: getFirmQualificationsContent(),
      type: "hardcoded",
      lastModified: new Date().toISOString(),
    },
    "Relevant Comprehensive Planning & Rural Community Experience": {
      content: getRelevantExperienceContent(),
      type: "hardcoded", 
      lastModified: new Date().toISOString(),
    }
  };
  
  // Merge sections with proper ordering: Title first, then hardcoded, then AI sections
  const finalSections = {};
  
  // Add Title section first if it exists
  if (sections.Title) {
    finalSections["Title"] = sections.Title;
  }
  
  // Add hardcoded sections
  Object.assign(finalSections, hardcodedSections);
  
  // Add remaining AI sections (excluding Title)
  Object.entries(sections).forEach(([sectionName, sectionData]) => {
    if (sectionName !== "Title") {
      finalSections[sectionName] = sectionData;
    }
  });
  
  return finalSections;
}

module.exports = {
  generateAIProposalSections,
  formatAISections,
  getFirmQualificationsContent,
  getRelevantExperienceContent,
  extractSectionsFromMarkdown,
  extractTitleContactInfo,
  cleanContent,
  cleanKeyPersonnelContent,
  validateAISections,
  cleanGeneratedContent
};
