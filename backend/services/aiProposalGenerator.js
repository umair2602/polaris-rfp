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
You are an expert proposal writer. Generate a comprehensive proposal based on the RFP data provided. 
Structure the proposal with the following sections and format them as markdown:

1. **Project Understanding and Approach** - Comprehensive analysis of the project context, challenges, opportunities, and our strategic methodology
2. **Key Personnel** - Team members with their names, titles, and detailed qualifications including specific achievements and experience
3. **Methodology (By Phase)** - Detailed project phases and deliverables
4. **Project Schedule** - Timeline with milestones
5. **Budget** - Cost breakdown by phases
6. **References** - Relevant past projects and client experience

Guidelines:
- Use professional, persuasive language
- Include specific details from the RFP
- Format tables using markdown table syntax
- Use bullet points for lists
- Include realistic timelines and budgets
- Make content relevant to the project type
- Ensure each section is comprehensive but concise
- Use **bold** for emphasis and *italics* for important details

For the Project Understanding and Approach section specifically:
- Write 4-6 comprehensive paragraphs (300-500 words total)
- Start with the current situation/context of the client/community using specific details from the RFP
- Identify specific challenges, pressures, and opportunities mentioned in the RFP
- Reference specific details from the RFP (population, land use patterns, community characteristics)
- Explain why action is needed now and what happens without proper planning
- Describe the community's valuable assets that must be protected
- Address compliance requirements (state/federal laws, codes)
- Conclude with our collaborative, data-driven approach
- Use specific language from the RFP to show deep understanding
- Make it sound like you've thoroughly analyzed their specific situation
- NEVER use generic phrases like "The RFP outlines" or "The RFP mentions" - instead, directly state the facts as if you know them firsthand
- Use direct references to specific details, numbers, and facts from the RFP content

For the Key Personnel section specifically:
- Include 3-5 key team members with REAL NAMES (not placeholders like [Name])
- Each person should have: Full Name, Credentials (MBA, PhD, etc.), Title
- Follow this exact format for each person:
  [Full Name], [Credentials] - [Title]
  ● [Specific achievement or experience bullet point]
  ● [Another specific achievement or experience bullet point]
  ● [Additional relevant experience bullet point]
- Use 3-5 bullet points per person describing their specific achievements, projects, and qualifications
- Make the experience relevant to the project type (planning, zoning, community engagement, etc.)
- Include specific details like years of experience, notable projects, certifications, or awards

For the References section, use this exact format:
- Start with: "We are pleased to provide the following experience from organizations with comparable scopes of work."
- For each reference, include:
  - Organization Name (Year-Year)
  - Contact: [Name], [Title] of [Organization]
  - Email: [email]
  - Phone: [phone]
  - Scope of Work: [Detailed description of work performed and achievements]
- Do NOT include testimonials or quotes

CRITICAL: Return the sections as a JSON object with EXACTLY these section names as keys and content as values:
{
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

${rfp.rawText ? `\nRFP Full Text:\n${rfp.rawText.substring(0, 4000)}...` : ''}

IMPORTANT: 

For the Project Understanding and Approach section:
- Extract specific details from the RFP text (population numbers, land use patterns, community characteristics, challenges mentioned)
- Reference the client's specific situation, assets, and needs
- Show deep understanding of their current state and future challenges
- Address compliance requirements (Ohio Revised Code, federal requirements, etc.)
- Write 4-6 comprehensive paragraphs that demonstrate thorough analysis
- Use specific language and details from the RFP to show you've read and understood their unique situation
- DO NOT use generic phrases like "The RFP outlines" or "The RFP mentions" - instead, directly reference specific details from the RFP content
- Start with specific facts about the community/client from the RFP text
- Use direct quotes or specific details from the RFP when relevant

For the Key Personnel section, use realistic names and create detailed professional profiles. Consider using names like:
- Saxon Metzger, MBA - Project Manager
- etc
The above names are just examples. Use realistic names mentioned in the RFP and create detailed professional profiles.

Each person should have 3-5 detailed bullet points describing their specific achievements, relevant projects, certifications, and experience that directly relates to this RFP's requirements.

Generate a comprehensive proposal with all sections formatted as markdown.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 4000,
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
        return formatAISections(parsed);
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
  
  // Add hardcoded sections first
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
  
  // Add AI-generated sections
  Object.entries(sections).forEach(([sectionName, content]) => {
    // Skip the hardcoded sections if they were generated by AI
    if (sectionName !== "Firm Qualifications and Experience" && 
        sectionName !== "Relevant Comprehensive Planning & Rural Community Experience") {
      
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
  
  // Merge hardcoded sections with extracted sections
  const finalSections = { ...hardcodedSections, ...sections };
  
  return finalSections;
}

module.exports = {
  generateAIProposalSections,
  formatAISections,
  getFirmQualificationsContent,
  getRelevantExperienceContent,
  extractSectionsFromMarkdown,
  cleanContent,
  cleanKeyPersonnelContent
};
