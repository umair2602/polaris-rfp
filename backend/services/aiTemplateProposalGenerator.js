const OpenAI = require('openai');

const {
  formatAISections,
  validateAISections,
  extractSectionsFromMarkdown,
  cleanContent,
  cleanKeyPersonnelContent,
  extractTitleContactInfo,
} = require('./aiProposalGenerator');

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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
    throw new Error('OpenAI API key not configured');
  }

  if (!template || !Array.isArray(template.sections) || template.sections.length === 0) {
    throw new Error('Template missing required sections');
  }

  // Build ordered section titles directly from the template, ALWAYS prepend Title and Cover Letter
  const templateOrderedSections = [...template.sections]
    .filter(s => {
      const label = (s && (s.name || s.title)) ? String(s.name || s.title).trim() : '';
      return label.length > 0;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const compulsory = ['Title', 'Cover Letter'];
  const seen = new Set();
  const orderedTitles = [];
  [...compulsory, ...templateOrderedSections.map(s => String(s.name || s.title).trim())].forEach(t => {
    const k = String(t || '').trim();
    const key = k.toLowerCase();
    if (!k || seen.has(key)) return;
    seen.add(key);
    orderedTitles.push(k);
  });
  const dynamicList = orderedTitles.map((t, i) => `${i + 1}. **${t}**`).join('\n');

  // Build per-section guidance from the template (default content, contentType, required)
  const perSectionGuidance = templateOrderedSections
    .map(s => {
      const hints = [];
      if (s.isRequired === true || s.required === true) hints.push('Required: Yes');
      const contentType = s.contentType || s.type;
      if (contentType) hints.push(`Type: ${contentType}`);
      const baseContent = s.content || s.defaultContent;
      if (baseContent && String(baseContent).trim().length > 0) {
        const base = String(baseContent).trim();
        const truncated = base.length > 1200 ? `${base.slice(0, 1200)}...` : base;
        hints.push(`Base content (use as seed, adapt to RFP):\n${truncated}`);
      }
      return `Section: ${s.name || s.title}\n${hints.join('\n')}`.trim();
    })
    .join('\n\n');

  const systemPrompt = `You are an expert proposal writer. Generate a comprehensive proposal strictly using the template-provided section titles and the RFP context. Structure the proposal with the following sections and format them as markdown:\n\n${dynamicList}\n\nCRITICAL: Use EXACTLY these section titles as JSON keys, in this order:\n${JSON.stringify(orderedTitles)}\n\n1. **Title** - ENHANCED CONTACT INFORMATION EXTRACTION:\n   Carefully scan the entire text for ANY contact information and extract the following:\n\n   - **Submitted by**: [Organization submitting the proposal; if not found, use "Not specified"]\n   - **Name**: Look for contact person, project manager, point of contact, or any individual name mentioned for correspondence\n   - **Email**: Search for any email addresses in the text (look for @ symbols)\n   - **Number**: Find any phone numbers, contact numbers, or telephone references\n\n   SEARCH PATTERNS TO LOOK FOR:\n   - "Contact:", "Contact Person:", "Point of Contact:", "Project Manager:"\n   - "Email:", "E-mail:", "Send to:", "Submit to:"\n   - "Phone:", "Tel:", "Telephone:", "Call:", "Contact Number:"\n   - Names followed by titles like "Director", "Manager", "Coordinator"\n   - Email formats: anything@domain.com, anything@domain.gov, anything@domain.org\n   - Phone formats: (xxx) xxx-xxxx, xxx-xxx-xxxx, xxx.xxx.xxxx\n   - Addresses that might contain contact info\n   - Look in submission instructions, cover letters, and contact sections\n   - Check letterheads, signatures, and footer information\n\n   EXTRACTION RULES:\n   - If multiple contacts exist, prioritize the PRIMARY contact or project-specific contact\n   - If no specific contact info is found, use "Not specified" for that field\n   - For "Submitted by", if not found in the RFP, use "Not specified"\n   - Look throughout the entire text, including headers, footers, and appendices\n   - Extract the most relevant contact for proposal submission/communication\n   - Clean extracted data (remove extra spaces, formatting)\n\n2. **Cover Letter** - Personalized cover letter with contextual details and company-specific information\n   Use this EXACT format structure:\n     **Submitted to:** [Client Name from RFP]\n     **Submitted by:** [Company Name from context]\n     **Date:** [Current date in MM/DD/YYYY format]\n\n     Dear [Appropriate salutation based on RFP context],\n\n     [Personalized opening paragraph mentioning specific connections or relevant experience]\n\n     [2-3 body paragraphs explaining understanding of the project and approach]\n\n     [Closing paragraph expressing commitment and looking forward to working together]\n\n     Sincerely,\n\n     [Generated Name], [Generated Title]\n     [Generated Email]\n     [Generated Phone]\n   Generate realistic contact information based on company context and include specific details from the RFP when available.\n\nFormatting rules:\n- Each JSON value must be markdown-formatted content for that section\n- Do not include any extra keys or wrapper text outside the JSON\n- Use professional, persuasive language\n- Use bullet points and markdown tables where appropriate\n- Keep content grounded in the RFP context; avoid hallucinations\n\nTemplate guidance for each non-compulsory section (use as hints, adapt to the RFP):\n${perSectionGuidance}`;

  const userPrompt = `RFP Information:\n- Title: ${rfp.title}\n- Client: ${rfp.clientName}\n- Project Type: ${rfp.projectType}\n- Budget Range: ${rfp.budgetRange || 'Not specified'}\n- Submission Deadline: ${rfp.submissionDeadline || 'Not specified'}\n- Location: ${rfp.location || 'Not specified'}\n- Key Requirements: ${rfp.keyRequirements?.join(', ') || 'Not specified'}\n- Deliverables: ${rfp.deliverables?.join(', ') || 'Not specified'}\n- Contact Information: ${rfp.contactInformation || 'Not specified'}\n\n${rfp.rawText ? `RFP Full Text:\n${rfp.rawText}` : ''}\n\nAdditional Context:\n${customContent ? JSON.stringify(customContent) : 'None'}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 12000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion.choices[0].message.content.trim();

    // Helper: build fallback Title string from RFP if needed
    const buildFallbackTitle = () => {
      const company = 'Not specified';
      const contactBlock = String(rfp.contactInformation || '').trim();
      const emailMatch = contactBlock.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      const phoneMatch = contactBlock.match(/(?:\+?\d[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/);
      // Try to infer a name as a capitalized word pair before email
      let name = '';
      if (emailMatch) {
        const before = contactBlock.slice(0, emailMatch.index);
        const nameMatch = before.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*[,-:]?\s*$/);
        if (nameMatch) name = nameMatch[1].trim();
      }
      return `Submitted by: ${company}\nName: ${name || 'Not specified'}\nEmail: ${emailMatch ? emailMatch[0] : 'Not specified'}\nNumber: ${phoneMatch ? phoneMatch[0] : 'Not specified'}`;
    };

    // Prefer JSON parse. If it fails, fallback to markdown extraction
    try {
      let jsonText = raw;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonText = jsonMatch[0];

      const parsed = JSON.parse(jsonText);

      // Validate at least one expected key exists
      const hasExpected = orderedTitles.some(t => Object.prototype.hasOwnProperty.call(parsed, t));
      if (hasExpected) {
        // Ensure Title is present and populated; if missing/empty, synthesize from RFP
        if (!parsed.Title || String(parsed.Title).trim().length === 0) {
          parsed.Title = buildFallbackTitle();
        }
        const validated = validateAISections(parsed);
        const formatted = formatAISections(validated);
        // Post-guard: ensure object has at least one field
        if (
          formatted.Title &&
          formatted.Title.content &&
          typeof formatted.Title.content === 'object'
        ) {
          const t = formatted.Title.content;
          const hasAny = !!(t.submittedBy || t.name || t.email || t.number);
          if (!hasAny) {
            formatted.Title.content = extractTitleContactInfo(buildFallbackTitle());
          }
        }
        return formatted;
      }
      const extracted = extractSectionsFromMarkdown(raw);
      // If Title missing or empty, inject fallback Title section
      if (!extracted.Title || !extracted.Title.content || (typeof extracted.Title.content === 'object' && !extracted.Title.content.email && !extracted.Title.content.number && !extracted.Title.content.name)) {
        extracted.Title = {
          content: extractTitleContactInfo(buildFallbackTitle()),
          type: 'ai-generated',
          lastModified: new Date().toISOString(),
        };
      }
      // Post-guard for extracted shape as well
      if (
        extracted.Title &&
        extracted.Title.content &&
        typeof extracted.Title.content === 'object'
      ) {
        const t = extracted.Title.content;
        const hasAny = !!(t.submittedBy || t.name || t.email || t.number);
        if (!hasAny) {
          extracted.Title.content = extractTitleContactInfo(buildFallbackTitle());
        }
      }
      return extracted;
    } catch (_e) {
      const extracted = extractSectionsFromMarkdown(raw);
      if (!extracted.Title || !extracted.Title.content || (typeof extracted.Title.content === 'object' && !extracted.Title.content.email && !extracted.Title.content.number && !extracted.Title.content.name)) {
        extracted.Title = {
          content: extractTitleContactInfo(buildFallbackTitle()),
          type: 'ai-generated',
          lastModified: new Date().toISOString(),
        };
      }
      if (
        extracted.Title &&
        extracted.Title.content &&
        typeof extracted.Title.content === 'object'
      ) {
        const t = extracted.Title.content;
        const hasAny = !!(t.submittedBy || t.name || t.email || t.number);
        if (!hasAny) {
          extracted.Title.content = extractTitleContactInfo(buildFallbackTitle());
        }
      }
      return extracted;
    }
  } catch (error) {
    console.error('AI template proposal generation failed:', error);
    throw new Error(`AI template proposal generation failed: ${error.message}`);
  }
}

module.exports = {
  generateAIProposalFromTemplate,
};


