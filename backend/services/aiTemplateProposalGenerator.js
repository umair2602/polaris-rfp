const OpenAI = require("openai");
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

const {
  formatAISections,
  validateAISections,
  extractSectionsFromMarkdown,
  cleanContent,
  cleanKeyPersonnelContent,
  extractTitleContactInfo,
} = require("./aiProposalGenerator");
const { getSectionGuidelines } = require('./promptGuidelines');

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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
 * Fallback team selection - simply returns first 2 team members
 */
function fallbackTeamSelection(rfp, teamMembers) {
  if (!teamMembers || teamMembers.length === 0) return [];

  console.log("Using fallback team selection - returning first 2 team members");

  // Simply return the first 2 team members
  const selectedMembers = teamMembers
    .slice(0, 2)
    .map((member) => member.memberId);

  console.log("Fallback team selection results:", selectedMembers);
  return selectedMembers;
}

/**
 * Fallback reference selection - simply returns first 2 references
 */
function fallbackReferenceSelection(rfp, references) {
  if (!references || references.length === 0) return [];

  console.log("Using fallback reference selection - returning first 2 references");

  // Simply return the first 2 references
  const selectedRefs = references
    .slice(0, 2)
    .map((ref) => ref._id.toString());

  console.log("Fallback reference selection results:", selectedRefs);
  return selectedRefs;
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
  // Track which library types have been used to prevent duplicates
  const contentLibrarySections = {};
  const usedLibraryTypes = new Set();
  
  for (const title of orderedTitles) {
    const libraryType = await shouldUseContentLibrary(title);
    if (libraryType) {
      // Only use each library type once to prevent duplicate content
      // Exception: allow multiple sections to be AI-generated (null type)
      if (libraryType === 'experience' && usedLibraryTypes.has('experience')) {
        // Skip this section - let AI generate it instead
        console.log(`Skipping duplicate experience section: ${title}`);
        continue;
      }
      
      contentLibrarySections[title] = libraryType;
      usedLibraryTypes.add(libraryType);
    }
  }

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
  )}${coverLetterInstructions}\n\nFormatting rules:\n- Each JSON value must be markdown-formatted content for that section\n- Do not include any extra keys or wrapper text outside the JSON\n- Use professional, persuasive language\n- Use bullet points and markdown tables where appropriate\n- Keep content grounded in the RFP context; avoid hallucinations\n\nSECTION GUIDELINES:\n${getSectionGuidelines()}\n\nTemplate guidance for each non-compulsory section (use as hints, adapt to the RFP):\n${perSectionGuidance}`;

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
  selectRelevantTeamMembers,
  selectRelevantReferences,
  fallbackTeamSelection,
  fallbackReferenceSelection,
};
