const OpenAI = require("openai");
const TeamMember = require("../models/TeamMember");
const ProjectReference = require("../models/ProjectReference");
const Company = require("../models/Company");

const {
  formatAISections,
  validateAISections,
  extractSectionsFromMarkdown,
  cleanContent,
  cleanKeyPersonnelContent,
  extractTitleContactInfo,
} = require("./aiProposalGenerator");

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Fetch company information from the content library
 */
async function fetchCompanyInfo() {
  try {
    const company = await Company.findOne().sort({ createdAt: -1 }).lean();
    return company;
  } catch (error) {
    console.error("Error fetching company info:", error);
    return null;
  }
}

/**
 * Fetch team members from the content library
 */
async function fetchTeamMembers() {
  try {
    const teamMembers = await TeamMember.find({ isActive: true }).lean();
    return teamMembers;
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

/**
 * Fetch project references from the content library
 */
async function fetchProjectReferences() {
  try {
    const references = await ProjectReference.find({
      isActive: true,
      isPublic: true,
    }).lean();
    return references;
  } catch (error) {
    console.error("Error fetching project references:", error);
    return [];
  }
}

/**
 * Format team members data into proposal section content
 */
function formatTeamMembersSection(teamMembers, selectedIds = null) {
  if (!teamMembers || teamMembers.length === 0) {
    return "No team members available in the content library.";
  }

  // If specific IDs are provided, filter by those
  const membersToUse = selectedIds
    ? teamMembers.filter((member) => selectedIds.includes(member.memberId))
    : teamMembers;

  if (membersToUse.length === 0) {
    return "No suitable team members found for this project.";
  }

  let content =
    "Our experienced team brings together diverse expertise and proven track record to deliver exceptional results.\n\n";

  membersToUse.forEach((member) => {
    content += `**${member.nameWithCredentials}** - ${member.position}\n\n`;
    content += `${member.biography}\n\n`;
  });

  return content.trim();
}

/**
 * Format project references data into proposal section content
 */
function formatReferencesSection(references, selectedIds = null) {
  if (!references || references.length === 0) {
    return "No project references available in the content library.";
  }

  // If specific IDs are provided, filter by those
  const referencesToUse = selectedIds
    ? references.filter((reference) =>
        selectedIds.includes(reference._id.toString())
      )
    : references;

  if (referencesToUse.length === 0) {
    return "No suitable project references found for this project.";
  }

  let content =
    "Below are some of our recent project references that demonstrate our capabilities and client satisfaction:\n\n";

  referencesToUse.forEach((reference) => {
    content += `**${reference.organizationName}**`;
    if (reference.timePeriod) {
      content += ` (${reference.timePeriod})`;
    }
    content += "\n\n";

    content += `**Contact:** ${reference.contactName}`;
    if (reference.contactTitle) {
      content += `, ${reference.contactTitle}`;
    }
    if (reference.additionalTitle) {
      content += ` - ${reference.additionalTitle}`;
    }
    content += ` of ${reference.organizationName}\n\n`;

    if (reference.contactEmail) {
      content += `**Email:** ${reference.contactEmail}\n\n`;
    }

    if (reference.contactPhone) {
      content += `**Phone:** ${reference.contactPhone}\n\n`;
    }

    content += `**Scope of Work:** ${reference.scopeOfWork}\n\n`;
    content += "---\n\n";
  });

  return content.trim();
}

/**
 * Use AI to select most relevant team members based on RFP content
 */
async function selectRelevantTeamMembers(rfp, teamMembers) {
  console.log("--- AI Team Member Selection Debug ---");
  console.log("OpenAI configured:", !!openai);
  console.log("Team members count:", teamMembers?.length || 0);

  if (!openai || !teamMembers || teamMembers.length === 0) {
    console.log(
      "Skipping AI selection - OpenAI not configured or no team members"
    );
    return [];
  }

  try {
    // Create a summary of available team members for AI
    const membersSummary = teamMembers.map((member) => ({
      id: member.memberId,
      name: member.nameWithCredentials,
      position: member.position,
      expertise: member.biography.substring(0, 200), // Limit to avoid token limits
    }));

    console.log("Members summary for AI:", membersSummary);

    const prompt = `Based on the following RFP requirements, select the most relevant team members from our content library. Return ONLY the IDs of the selected members as a JSON array (e.g., ["id1", "id2"]).

RFP Information:
- Title: ${rfp.title}
- Project Type: ${rfp.projectType}
- Key Requirements: ${rfp.keyRequirements?.join(", ") || "Not specified"}
- Deliverables: ${rfp.deliverables?.join(", ") || "Not specified"}
- Project Scope: ${rfp.projectScope || "Not specified"}
- Raw Text Preview: ${
      rfp.rawText ? rfp.rawText.substring(0, 300) + "..." : "Not available"
    }

Available Team Members:
${membersSummary
  .map(
    (m) =>
      `ID: ${m.id} | ${m.name} - ${m.position} | Expertise: ${m.expertise}...`
  )
  .join("\n")}

Instructions:
- Select team members whose expertise most closely matches the RFP requirements
- Consider the project type and required skills
- Limit selection to 2-4 most relevant members
- If no members are particularly relevant, return an empty array
- Return only the JSON array of IDs, no other text`;

    console.log("Sending prompt to OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const response = completion.choices[0].message.content.trim();
    console.log("OpenAI response:", response);

    const selectedIds = JSON.parse(response);
    console.log("Parsed selected IDs:", selectedIds);

    return Array.isArray(selectedIds) ? selectedIds : [];
  } catch (error) {
    console.error("AI team member selection failed:", error);
    console.log("Falling back to keyword-based selection...");
    return fallbackTeamSelection(rfp, teamMembers);
  }
}

/**
 * Use AI to select most relevant project references based on RFP content
 */
async function selectRelevantReferences(rfp, references) {
  console.log("--- AI Reference Selection Debug ---");
  console.log("OpenAI configured:", !!openai);
  console.log("References count:", references?.length || 0);

  if (!openai || !references || references.length === 0) {
    console.log(
      "Skipping AI selection - OpenAI not configured or no references"
    );
    return [];
  }

  try {
    // Create a summary of available references for AI
    const referencesSummary = references.map((ref) => ({
      id: ref._id.toString(),
      organization: ref.organizationName,
      scope: ref.scopeOfWork.substring(0, 200), // Limit to avoid token limits
    }));

    console.log("References summary for AI:", referencesSummary);

    const prompt = `Based on the following RFP requirements, select the most relevant project references from our content library. Return ONLY the IDs of the selected references as a JSON array (e.g., ["id1", "id2"]).

RFP Information:
- Title: ${rfp.title}
- Project Type: ${rfp.projectType}
- Key Requirements: ${rfp.keyRequirements?.join(", ") || "Not specified"}
- Deliverables: ${rfp.deliverables?.join(", ") || "Not specified"}
- Project Scope: ${rfp.projectScope || "Not specified"}
- Raw Text Preview: ${
      rfp.rawText ? rfp.rawText.substring(0, 300) + "..." : "Not available"
    }

Available Project References:
${referencesSummary
  .map((r) => `ID: ${r.id} | ${r.organization} | Scope: ${r.scope}...`)
  .join("\n")}

Instructions:
- Select references that demonstrate similar work or capabilities required by this RFP
- Consider industry, project type, and scope alignment
- Limit selection to 2-3 most relevant references
- If no references are particularly relevant, return an empty array
- Return only the JSON array of IDs, no other text`;

    console.log("Sending prompt to OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const response = completion.choices[0].message.content.trim();
    console.log("OpenAI response:", response);

    const selectedIds = JSON.parse(response);
    console.log("Parsed selected IDs:", selectedIds);

    return Array.isArray(selectedIds) ? selectedIds : [];
  } catch (error) {
    console.error("AI reference selection failed:", error);
    console.log("Falling back to keyword-based selection...");
    return fallbackReferenceSelection(rfp, references);
  }
}

/**
 * Fallback team selection based on keyword matching
 */
function fallbackTeamSelection(rfp, teamMembers) {
  if (!teamMembers || teamMembers.length === 0) return [];

  console.log("Using fallback team selection...");

  // Extract keywords from RFP
  const rfpText = [
    rfp.title || "",
    rfp.projectType || "",
    rfp.projectScope || "",
    ...(rfp.keyRequirements || []),
    ...(rfp.deliverables || []),
    rfp.rawText || "",
  ]
    .join(" ")
    .toLowerCase();

  console.log("RFP text for matching:", rfpText.substring(0, 200) + "...");

  // Score each team member based on keyword matches
  const scoredMembers = teamMembers.map((member) => {
    const memberText = [
      member.nameWithCredentials || "",
      member.position || "",
      member.biography || "",
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;

    // Direct RFP keyword matches in member text
    const rfpWords = rfpText.split(/\s+/).filter((word) => word.length > 4);
    rfpWords.forEach((word) => {
      if (memberText.includes(word)) {
        score += 1;
      }
    });

    // Bonus for position-based matches
    if (rfpText.includes("zoning") && memberText.includes("zoning")) score += 5;
    if (rfpText.includes("planning") && memberText.includes("planning"))
      score += 5;
    if (rfpText.includes("municipal") && memberText.includes("municipal"))
      score += 5;
    if (rfpText.includes("urban") && memberText.includes("urban")) score += 5;
    if (rfpText.includes("legal") && memberText.includes("legal")) score += 5;
    if (rfpText.includes("attorney") && memberText.includes("attorney"))
      score += 5;

    // Penalty for clearly irrelevant roles
    if (memberText.includes("finance") && !rfpText.includes("finance"))
      score -= 10;
    if (memberText.includes("accounting") && !rfpText.includes("accounting"))
      score -= 10;
    if (memberText.includes("technology") && !rfpText.includes("technology"))
      score -= 10;
    if (memberText.includes("software") && !rfpText.includes("software"))
      score -= 10;

    console.log(
      `${member.memberId} (${member.nameWithCredentials}): score ${score}`
    );
    return { member, score };
  });

  // Select members with score > 0, limit to 2, sort by score
  const selectedMembers = scoredMembers
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.member.memberId);

  console.log("Fallback team selection results:", selectedMembers);

  // If no matches found with positive scores, return empty array instead of all
  return selectedMembers;
}

/**
 * Fallback reference selection based on keyword matching
 */
function fallbackReferenceSelection(rfp, references) {
  if (!references || references.length === 0) return [];

  // Extract keywords from RFP
  const rfpText = [
    rfp.title || "",
    rfp.projectType || "",
    rfp.projectScope || "",
    ...(rfp.keyRequirements || []),
    ...(rfp.deliverables || []),
    rfp.rawText || "",
  ]
    .join(" ")
    .toLowerCase();

  console.log("Using fallback reference selection...");
  console.log("RFP text for matching:", rfpText.substring(0, 200) + "...");

  // Score each reference based on keyword matches
  const scoredReferences = references.map((ref) => {
    const refText = [ref.organizationName || "", ref.scopeOfWork || ""]
      .join(" ")
      .toLowerCase();

    let score = 0;

    // Direct RFP keyword matches in reference text
    const rfpWords = rfpText.split(/\s+/).filter((word) => word.length > 4);
    rfpWords.forEach((word) => {
      if (refText.includes(word)) {
        score += 1;
      }
    });

    // Bonus for highly relevant matches
    if (rfpText.includes("zoning") && refText.includes("zoning")) score += 5;
    if (rfpText.includes("planning") && refText.includes("planning"))
      score += 5;
    if (rfpText.includes("municipal") && refText.includes("municipal"))
      score += 5;
    if (rfpText.includes("urban") && refText.includes("urban")) score += 5;
    if (rfpText.includes("city") && refText.includes("city")) score += 3;
    if (rfpText.includes("county") && refText.includes("county")) score += 3;

    // Penalty for clearly irrelevant projects
    if (refText.includes("software") && !rfpText.includes("software"))
      score -= 10;
    if (refText.includes("technology") && !rfpText.includes("technology"))
      score -= 10;
    if (refText.includes("web") && !rfpText.includes("web")) score -= 10;
    if (refText.includes("database") && !rfpText.includes("database"))
      score -= 10;

    console.log(`${ref._id} (${ref.organizationName}): score ${score}`);
    return { reference: ref, score };
  });

  // Select references with score > 0, limit to 2, sort by score
  const selectedRefs = scoredReferences
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.reference._id.toString());

  console.log("Fallback reference selection results:", selectedRefs);

  // If no matches found with positive scores, return empty array instead of all
  return selectedRefs;
}

/**
 * Format Title section using company information from content library
 */
function formatTitleSection(companyInfo, rfp) {
  if (!companyInfo) {
    return {
      submittedBy: "Not specified",
      name: "Not specified", 
      email: "Not specified",
      number: "Not specified"
    };
  }

  // Extract company information for Title section
  const submittedBy = companyInfo.name || "Not specified";
  
  // Use primary contact information or generate based on company data
  const contactName = companyInfo.primaryContact?.name || 
    (companyInfo.name ? `${companyInfo.name.split(' ')[0]} Representative` : "Not specified");
  
  const contactEmail = companyInfo.primaryContact?.email || 
    companyInfo.email || 
    "Not specified";
  
  const contactPhone = companyInfo.primaryContact?.phone || 
    companyInfo.phone || 
    "Not specified";

  return {
    submittedBy: submittedBy,
    name: contactName,
    email: contactEmail,
    number: contactPhone
  };
}

/**
 * Format cover letter using company information from content library
 */
function formatCoverLetterSection(companyInfo, rfp) {
  if (!companyInfo) {
    return "No company information available in the content library.";
  }

  // Get current date in MM/DD/YYYY format
  const currentDate = new Date().toLocaleDateString('en-US');
  
  // Determine client name and salutation
  const clientName = rfp.clientName || rfp.title || 'Valued Client';
  const salutation = rfp.clientName ? `Dear ${rfp.clientName} Team` : 'Dear Hiring Manager';
  
  // Use company's cover letter content ONLY - no additional generic content
  const coverLetterContent = companyInfo.coverLetter || 
    `We are pleased to submit our proposal for your consideration. Our team brings extensive experience and expertise to deliver exceptional results for your project.`;
  
  // Generate contact information from company data
  const contactName = companyInfo.name ? 
    `${companyInfo.name.split(' ')[0]} Representative` : 
    'Project Manager';
  const contactTitle = 'Project Director';
  const contactEmail = companyInfo.email || 'contact@company.com';
  const contactPhone = companyInfo.phone || '(555) 123-4567';

  // Format the cover letter with ONLY the company's content, no additional paragraphs
  const formattedCoverLetter = `**Submitted to:** ${clientName}
**Submitted by:** ${companyInfo.name || 'Our Company'}
**Date:** ${currentDate}

${salutation},

${coverLetterContent}

Sincerely,

${contactName}, ${contactTitle}
${contactEmail}
${contactPhone}`;

  return formattedCoverLetter;
}

/**
 * Format experience and qualifications using company information from content library
 */
async function formatExperienceSection(companyInfo, rfp) {
  if (!companyInfo) {
    return "No company information available in the content library.";
  }

  // Use AI to format the experience content if available and OpenAI is configured
  if (openai && companyInfo.firmQualificationsAndExperience) {
    try {
      const prompt = `Take the following company qualifications and experience content and format it professionally for an RFP proposal. Keep the formatting simple and clean.

Company Experience Content:
${companyInfo.firmQualificationsAndExperience}

RFP Project Context:
- Title: ${rfp.title || 'Not specified'}
- Client: ${rfp.clientName || 'Not specified'}
- Project Type: ${rfp.projectType || 'Not specified'}
- Key Requirements: ${rfp.keyRequirements?.join(', ') || 'Not specified'}

Format this content following these rules:
1. Use the company's content as the primary source - do not add excessive details
2. Keep formatting simple - use bullet points (●) for lists, no markdown headings (#)
3. Write in paragraph form with bullet points for achievements/awards only
4. Make it relevant to the RFP but don't over-elaborate
5. Use professional, concise language
6. Do not add multiple sections or subheadings
7. Keep the same tone and style as the original content

Return only the clean, simply formatted content without markdown headings or excessive structure.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 2000,
        messages: [
          { role: "user", content: prompt }
        ],
      });

      const formattedContent = completion.choices[0].message.content.trim();
      return formattedContent;
    } catch (error) {
      console.error("AI formatting failed for experience section:", error);
      // Fallback to basic formatting
    }
  }

  // Basic formatting without AI - keep it simple like the original content
  const baseContent = companyInfo.firmQualificationsAndExperience || 
    `${companyInfo.name || 'Our company'} brings extensive experience and proven qualifications to deliver exceptional results for your project.`;

  let formattedContent = baseContent;

  // Add company statistics if available - format simply
  if (companyInfo.statistics && (companyInfo.statistics.yearsInBusiness || companyInfo.statistics.projectsCompleted)) {
    formattedContent += `\n\n`;
    if (companyInfo.statistics.yearsInBusiness) {
      formattedContent += `Our company has been in business for ${companyInfo.statistics.yearsInBusiness}+ years`;
    }
    if (companyInfo.statistics.projectsCompleted) {
      formattedContent += `${companyInfo.statistics.yearsInBusiness ? ', completing' : 'We have completed'} ${companyInfo.statistics.projectsCompleted}+ projects`;
    }
    if (companyInfo.statistics.clientsSatisfied) {
      formattedContent += ` for ${companyInfo.statistics.clientsSatisfied}+ satisfied clients`;
    }
    formattedContent += `.`;
  }

  // Add core capabilities if available - simple list
  if (companyInfo.coreCapabilities && companyInfo.coreCapabilities.length > 0) {
    formattedContent += `\n\nOur core services include: ${companyInfo.coreCapabilities.join(', ')}.`;
  }

  return formattedContent.trim();
}

/**
 * Check if a section title indicates it should use content library data
 */
function shouldUseContentLibrary(sectionTitle) {
  const title = sectionTitle.toLowerCase();

  // Check for Title section
  if (title === "title") {
    return "title";
  }

  // Check for cover letter sections
  if (
    title.includes("cover letter") ||
    title.includes("introduction letter") ||
    title.includes("transmittal letter")
  ) {
    return "cover-letter";
  }

  // Check for experience and qualifications sections
  if (
    title.includes("experience") ||
    title.includes("qualification") ||
    title.includes("firm qualification") ||
    title.includes("company qualification") ||
    title.includes("firm experience") ||
    title.includes("company experience") ||
    title.includes("background") ||
    title.includes("capabilities") ||
    title.includes("expertise") ||
    title.includes("credentials") ||
    title.includes("track record") ||
    title.includes("company profile")
  ) {
    return "experience";
  }

  // Check for personnel/team sections FIRST (higher priority)
  if (
    title.includes("personnel") ||
    title.includes("team") ||
    title.includes("staff") ||
    title.includes("key personnel") ||
    title.includes("project team") ||
    title.includes("team member") ||
    title.includes("human resource") ||
    title.includes("expertise")
  ) {
    return "team";
  }

  // Check for references/experience sections (but exclude personnel-related experience)
  if (
    title.includes("reference") ||
    (title.includes("experience") &&
      !title.includes("personnel") &&
      !title.includes("team") &&
      !title.includes("key")) ||
    title.includes("past project") ||
    title.includes("client reference") ||
    title.includes("project portfolio")
  ) {
    return "references";
  }

  return null;
}

/**
 * Generate AI proposal sections based strictly on a Template's sections
 * - Always prepends Title and Cover Letter
 * - Uses the template's section names (order preserved after compulsory)
 * - Optionally seeds each section with the template's default content and metadata
 * - Returns sections formatted for DB via existing helpers
 *
 * @param {Object} rfp - RFP record (may include rawText and metadata)
 * @param {Object} template - Template record with sections array
 * @param {Object} [customContent] - Optional overrides or additional context
 */
async function generateAIProposalFromTemplate(rfp, template, customContent) {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  if (
    !template ||
    !Array.isArray(template.sections) ||
    template.sections.length === 0
  ) {
    throw new Error("Template missing required sections");
  }

  // Fetch content library data
  const companyInfo = await fetchCompanyInfo();
  const teamMembers = await fetchTeamMembers();
  const projectReferences = await fetchProjectReferences();

  // Use AI to select most relevant content based on RFP
  let selectedTeamIds = await selectRelevantTeamMembers(rfp, teamMembers);
  let selectedReferenceIds = await selectRelevantReferences(
    rfp,
    projectReferences
  );

  // Fallback: if AI doesn't select anything, use keyword-based fallback
  if (selectedTeamIds.length === 0 && teamMembers.length > 0) {
    console.log("AI team selection empty, using keyword fallback...");
    selectedTeamIds = fallbackTeamSelection(rfp, teamMembers);
  }

  if (selectedReferenceIds.length === 0 && projectReferences.length > 0) {
    console.log("AI reference selection empty, using keyword fallback...");
    selectedReferenceIds = fallbackReferenceSelection(rfp, projectReferences);
  }

  console.log("Final selected team IDs:", selectedTeamIds);
  console.log("Final selected reference IDs:", selectedReferenceIds);

  // Build ordered section titles directly from the template, ALWAYS prepend Title and Cover Letter
  const templateOrderedSections = [...template.sections]
    .filter((s) => {
      const label =
        s && (s.name || s.title) ? String(s.name || s.title).trim() : "";
      return label.length > 0;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const compulsory = ["Title", "Cover Letter"];
  const seen = new Set();
  const orderedTitles = [];
  [
    ...compulsory,
    ...templateOrderedSections.map((s) => String(s.name || s.title).trim()),
  ].forEach((t) => {
    const k = String(t || "").trim();
    const key = k.toLowerCase();
    if (!k || seen.has(key)) return;
    seen.add(key);
    orderedTitles.push(k);
  });

  // Identify sections that should use content library
  const contentLibrarySections = {};
  orderedTitles.forEach((title) => {
    const libraryType = shouldUseContentLibrary(title);
    if (libraryType) {
      contentLibrarySections[title] = libraryType;
    }
  });

  // Filter out content library sections from AI generation
  const aiOnlySections = orderedTitles.filter(
    (title) => !contentLibrarySections[title]
  );

  console.log("Content library sections:", contentLibrarySections);
  console.log("AI-only sections:", aiOnlySections);
  const dynamicList = aiOnlySections
    .map((t, i) => `${i + 1}. **${t}**`)
    .join("\n");

  // Check if Cover Letter should be generated by AI or handled by content library
  const shouldGenerateCoverLetter = aiOnlySections.includes("Cover Letter");

  // Build per-section guidance from the template (default content, contentType, required)
  const perSectionGuidance = templateOrderedSections
    .map((s) => {
      const hints = [];
      if (s.isRequired === true || s.required === true)
        hints.push("Required: Yes");
      const contentType = s.contentType || s.type;
      if (contentType) hints.push(`Type: ${contentType}`);
      const baseContent = s.content || s.defaultContent;
      if (baseContent && String(baseContent).trim().length > 0) {
        const base = String(baseContent).trim();
        const truncated =
          base.length > 1200 ? `${base.slice(0, 1200)}...` : base;
        hints.push(`Base content (use as seed, adapt to RFP):\n${truncated}`);
      }
      return `Section: ${s.name || s.title}\n${hints.join("\n")}`.trim();
    })
    .join("\n\n");

  // Build cover letter instructions only if AI should generate it
  const coverLetterInstructions = shouldGenerateCoverLetter ? 
    `\n\n2. **Cover Letter** - Use company information from content library to create a personalized cover letter\n   Use this EXACT format structure:\n     **Submitted to:** [Client Name from RFP]\n     **Submitted by:** [Company Name from context]\n     **Date:** [Current date in MM/DD/YYYY format]\n\n     Dear [Appropriate salutation based on RFP context],\n\n     [Personalized opening paragraph mentioning specific connections or relevant experience]\n\n     [2-3 body paragraphs explaining understanding of the project and approach]\n\n     [Closing paragraph expressing commitment and looking forward to working together]\n\n     Sincerely,\n\n     [Generated Name], [Generated Title]\n     [Generated Email]\n     [Generated Phone]\n   Generate realistic contact information based on company context and include specific details from the RFP when available.` : 
    '';

  const systemPrompt = `You are an expert proposal writer. Generate a comprehensive proposal strictly using the template-provided section titles and the RFP context. 

NOTE: Some sections will be handled separately using content library data. Generate content ONLY for the following sections:\n\n${dynamicList}\n\nCRITICAL: Use EXACTLY these section titles as JSON keys, in this order:\n${JSON.stringify(
    aiOnlySections
  )}${coverLetterInstructions}\n\nFormatting rules:\n- Each JSON value must be markdown-formatted content for that section\n- Do not include any extra keys or wrapper text outside the JSON\n- Use professional, persuasive language\n- Use bullet points and markdown tables where appropriate\n- Keep content grounded in the RFP context; avoid hallucinations\n\nTemplate guidance for each non-compulsory section (use as hints, adapt to the RFP):\n${perSectionGuidance}`;

  const userPrompt = `RFP Information:\n- Title: ${rfp.title}\n- Client: ${
    rfp.clientName
  }\n- Project Type: ${rfp.projectType}\n- Budget Range: ${
    rfp.budgetRange || "Not specified"
  }\n- Submission Deadline: ${
    rfp.submissionDeadline || "Not specified"
  }\n- Location: ${rfp.location || "Not specified"}\n- Key Requirements: ${
    rfp.keyRequirements?.join(", ") || "Not specified"
  }\n- Deliverables: ${
    rfp.deliverables?.join(", ") || "Not specified"
  }\n- Contact Information: ${rfp.contactInformation || "Not specified"}\n\n${
    rfp.rawText ? `RFP Full Text:\n${rfp.rawText}` : ""
  }\n\nAdditional Context:\n${
    customContent ? JSON.stringify(customContent) : "None"
  }`;

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

    // Helper: build fallback Title string from RFP if needed
    const buildFallbackTitle = () => {
      const company = "Not specified";
      const contactBlock = String(rfp.contactInformation || "").trim();
      const emailMatch = contactBlock.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
      );
      const phoneMatch = contactBlock.match(
        /(?:\+?\d[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/
      );
      // Try to infer a name as a capitalized word pair before email
      let name = "";
      if (emailMatch) {
        const before = contactBlock.slice(0, emailMatch.index);
        const nameMatch = before.match(
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*[,-:]?\s*$/
        );
        if (nameMatch) name = nameMatch[1].trim();
      }
      return `Submitted by: ${company}\nName: ${
        name || "Not specified"
      }\nEmail: ${emailMatch ? emailMatch[0] : "Not specified"}\nNumber: ${
        phoneMatch ? phoneMatch[0] : "Not specified"
      }`;
    };

    // Prefer JSON parse. If it fails, fallback to markdown extraction
    try {
      let jsonText = raw;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonText = jsonMatch[0];

      const parsed = JSON.parse(jsonText);

      // Validate at least one expected key exists
      const hasExpected = aiOnlySections.some((t) =>
        Object.prototype.hasOwnProperty.call(parsed, t)
      );
      
      if (hasExpected) {
        // Ensure Title is present and populated; if missing/empty, synthesize from RFP
        if (!parsed.Title || String(parsed.Title).trim().length === 0) {
          parsed.Title = buildFallbackTitle();
        }

        // Add content library sections in the original order
        for (const sectionTitle of orderedTitles) {
          const libraryType = contentLibrarySections[sectionTitle];
          if (libraryType) {
            if (libraryType === "team") {
              parsed[sectionTitle] = formatTeamMembersSection(
                teamMembers,
                selectedTeamIds
              );
            } else if (libraryType === "references") {
              parsed[sectionTitle] = formatReferencesSection(
                projectReferences,
                selectedReferenceIds
              );
            } else if (libraryType === "title") {
              parsed[sectionTitle] = formatTitleSection(
                companyInfo,
                rfp
              );
            } else if (libraryType === "cover-letter") {
              parsed[sectionTitle] = formatCoverLetterSection(
                companyInfo,
                rfp
              );
            } else if (libraryType === "experience") {
              parsed[sectionTitle] = await formatExperienceSection(
                companyInfo,
                rfp
              );
            }
          }
        }

        // Create final sections object in the correct template order
        const finalSections = {};
        
        orderedTitles.forEach((sectionTitle) => {
          if (parsed[sectionTitle]) {
            if (contentLibrarySections[sectionTitle]) {
              // Content library section
              const libraryType = contentLibrarySections[sectionTitle];
              let selectedIds = [];
              if (libraryType === "team") {
                selectedIds = selectedTeamIds;
              } else if (libraryType === "references") {
                selectedIds = selectedReferenceIds;
              }
              
              // Handle Title section specially - it returns an object, not a string
              const content = libraryType === "title" ? parsed[sectionTitle] : parsed[sectionTitle];
              
              finalSections[sectionTitle] = {
                content: content,
                type: "content-library",
                lastModified: new Date().toISOString(),
                ...(selectedIds.length > 0 && { selectedIds: selectedIds }),
              };
            } else {
              // AI generated section
              const cleanedContent = cleanContent(parsed[sectionTitle]);
              finalSections[sectionTitle] = {
                content: cleanedContent,
                type: "ai-generated",
                lastModified: new Date().toISOString(),
              };
            }
          }
        });

        return finalSections;
        // Post-guard: ensure object has at least one field
        if (
          formatted.Title &&
          formatted.Title.content &&
          typeof formatted.Title.content === "object"
        ) {
          const t = formatted.Title.content;
          const hasAny = !!(t.submittedBy || t.name || t.email || t.number);
          if (!hasAny) {
            formatted.Title.content = extractTitleContactInfo(
              buildFallbackTitle()
            );
          }
        }
        return formatted;
      }
      const extracted = extractSectionsFromMarkdown(raw);

      // Add content library sections to extracted sections in original order
      for (const sectionTitle of orderedTitles) {
        const libraryType = contentLibrarySections[sectionTitle];
        if (libraryType) {
          let content;
          let selectedIds = [];
          if (libraryType === "team") {
            content = formatTeamMembersSection(teamMembers, selectedTeamIds);
            selectedIds = selectedTeamIds;
          } else if (libraryType === "references") {
            content = formatReferencesSection(
              projectReferences,
              selectedReferenceIds
            );
            selectedIds = selectedReferenceIds;
          } else if (libraryType === "title") {
            content = formatTitleSection(companyInfo, rfp);
          } else if (libraryType === "cover-letter") {
            content = formatCoverLetterSection(companyInfo, rfp);
          } else if (libraryType === "experience") {
            content = await formatExperienceSection(companyInfo, rfp);
          }

          if (content) {
            extracted[sectionTitle] = {
              content: content,
              type: "content-library",
              lastModified: new Date().toISOString(),
              ...(selectedIds.length > 0 && { selectedIds: selectedIds }),
            };
          }
        }
      }

      // If Title missing or empty, inject fallback Title section
      if (
        !extracted.Title ||
        !extracted.Title.content ||
        (typeof extracted.Title.content === "object" &&
          !extracted.Title.content.email &&
          !extracted.Title.content.number &&
          !extracted.Title.content.name)
      ) {
        extracted.Title = {
          content: extractTitleContactInfo(buildFallbackTitle()),
          type: "ai-generated",
          lastModified: new Date().toISOString(),
        };
      }

      // Create final sections object in the correct template order
      const finalSections = {};
      orderedTitles.forEach((sectionTitle) => {
        if (extracted[sectionTitle]) {
          finalSections[sectionTitle] = extracted[sectionTitle];
        }
      });

      return finalSections;
    } catch (_e) {
      const extracted = extractSectionsFromMarkdown(raw);

      // Add content library sections to extracted sections in original order
      for (const sectionTitle of orderedTitles) {
        const libraryType = contentLibrarySections[sectionTitle];
        if (libraryType) {
          let content;
          let selectedIds = [];
          if (libraryType === "team") {
            content = formatTeamMembersSection(teamMembers, selectedTeamIds);
            selectedIds = selectedTeamIds;
          } else if (libraryType === "references") {
            content = formatReferencesSection(
              projectReferences,
              selectedReferenceIds
            );
            selectedIds = selectedReferenceIds;
          } else if (libraryType === "title") {
            content = formatTitleSection(companyInfo, rfp);
          } else if (libraryType === "cover-letter") {
            content = formatCoverLetterSection(companyInfo, rfp);
          } else if (libraryType === "experience") {
            content = await formatExperienceSection(companyInfo, rfp);
          }

          if (content) {
            extracted[sectionTitle] = {
              content: content,
              type: "content-library",
              lastModified: new Date().toISOString(),
              ...(selectedIds.length > 0 && { selectedIds: selectedIds }),
            };
          }
        }
      }

      if (
        !extracted.Title ||
        !extracted.Title.content ||
        (typeof extracted.Title.content === "object" &&
          !extracted.Title.content.email &&
          !extracted.Title.content.number &&
          !extracted.Title.content.name)
      ) {
        extracted.Title = {
          content: extractTitleContactInfo(buildFallbackTitle()),
          type: "ai-generated",
          lastModified: new Date().toISOString(),
        };
      }

      // Create final sections object in the correct template order
      const finalSections = {};
      orderedTitles.forEach((sectionTitle) => {
        if (extracted[sectionTitle]) {
          finalSections[sectionTitle] = extracted[sectionTitle];
        }
      });

      return finalSections;
    }
  } catch (error) {
    console.error("AI template proposal generation failed:", error);
    throw new Error(`AI template proposal generation failed: ${error.message}`);
  }
}

module.exports = {
  generateAIProposalFromTemplate,
  fetchCompanyInfo,
  fetchTeamMembers,
  fetchProjectReferences,
  formatTitleSection,
  formatCoverLetterSection,
  formatExperienceSection,
  formatTeamMembersSection,
  formatReferencesSection,
  shouldUseContentLibrary,
  selectRelevantTeamMembers,
  selectRelevantReferences,
  fallbackTeamSelection,
  fallbackReferenceSelection,
};
