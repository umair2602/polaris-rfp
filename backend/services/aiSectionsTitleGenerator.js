const OpenAI = require('openai');
const promptGuidelines = require('./promptGuidelinesSectionsTitles');

class SectionTitlesGenerator {
  static get openai() {
    if (!this._openai) {
      this._openai = process.env.OPENAI_API_KEY
        ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        : null;
    }
    return this._openai;
  }

  static get baseSections() {
    return [
      'Title',
      'Cover Letter',
      'Technical Approach and Methodology',
      'Key Personnel and Experience',
      'Budget Estimate',
      'Project Timeline',
      'References',
    ];
  }

  /**
   * Generate proposal section titles based on predefined base sections and RFP analysis
   */
  static async generateSectionTitles(rfp) {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = promptGuidelines.getSystemPrompt();
    const userPrompt = promptGuidelines.getUserPrompt(rfp);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = (completion.choices?.[0]?.message?.content || '').trim();
    const parsed = JSON.parse(raw);

    let titles = [];
    if (Array.isArray(parsed)) {
      titles = parsed;
    } else if (parsed.titles && Array.isArray(parsed.titles)) {
      titles = parsed.titles;
    } else if (parsed.sections && Array.isArray(parsed.sections)) {
      titles = parsed.sections;
    } else if (parsed.section_titles && Array.isArray(parsed.section_titles)) {
      titles = parsed.section_titles;
    } else {
      const values = Object.values(parsed);
      if (values.length > 0 && Array.isArray(values[0])) {
        titles = values[0];
      }
    }

    const cleaned = this.sanitizeSectionTitlesArray(titles);

    // Separate sections into categories
    const compulsory = ['Title', 'Cover Letter'];
    const finalSections = [];
    const seenSections = new Set();
    let referencesSection = null;
    
    // Add compulsory sections first
    for (const section of compulsory) {
      finalSections.push(section);
      seenSections.add(section.toLowerCase());
    }
    
    // Add all other sections, but hold References for the end
    for (const section of cleaned) {
      const lowerSection = section.toLowerCase();
      if (!seenSections.has(lowerSection)) {
        // Check if this is the References section
        if (lowerSection === 'references' || lowerSection.includes('reference')) {
          referencesSection = section;
          seenSections.add(lowerSection);
        } else {
          finalSections.push(section);
          seenSections.add(lowerSection);
        }
      }
    }
    
    // Add References at the end if it was included
    if (referencesSection) {
      finalSections.push(referencesSection);
    }
    
    return finalSections.slice(0, 15);
  }

  /** Sanitize and deduplicate section titles */
  static sanitizeSectionTitlesArray(arr) {
    if (!Array.isArray(arr)) {
      console.warn('Expected array but got:', typeof arr);
      return [];
    }
    const seen = new Set();
    const titles = [];
    for (const item of arr) {
      if (typeof item !== 'string') continue;
      let title = item
        .replace(/^\d+\s*[).:-]\s*/g, '')
        .replace(/^\*+\s*/g, '')
        .replace(/^[-•]\s*/g, '')
        .trim();
      if (!title) continue;
      if (title.length > 120) continue;
      if (title.length < 3) continue;
      const lowerTitle = title.toLowerCase();
      const matchingBase = this.baseSections.find(
        (base) => base.toLowerCase() === lowerTitle || lowerTitle.includes(base.toLowerCase().split(' ')[0])
      );
      if (matchingBase) {
        title = matchingBase;
      }
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      titles.push(title);
    }
    return titles;
  }

  /** Main convenience method */
  static async generateContextualSectionTitles(rfp) {
    const titles = await this.generateSectionTitles(rfp);
    if (!titles || titles.length === 0) {
      throw new Error('OpenAI returned no section titles');
    }
    console.log(`Generated ${titles.length} contextual section titles`);
    return titles;
  }
}

module.exports = SectionTitlesGenerator;


