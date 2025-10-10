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
// Reuse the extracted implementation
const {
  generateAIProposalFromTemplate: generateFromTemplateCore,
} = require('./templateGenerator');

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
  return generateFromTemplateCore(rfp, template, customContent);
}

module.exports = {
  generateAIProposalFromTemplate,
  selectRelevantTeamMembers,
  selectRelevantReferences,
  fallbackTeamSelection,
  fallbackReferenceSelection,
};
