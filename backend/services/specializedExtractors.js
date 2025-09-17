// services/specializedExtractors.js
// Specialized AI extractors for specific RFP sections
// These methods handle sections that need dedicated AI analysis
// to avoid chunking issues and improve extraction accuracy

class SpecializedExtractors {
  constructor(openai) {
    this.openai = openai;
  }

  // ------------------------------
  // Budget-specific AI extractor
  // ------------------------------
  async analyzeBudgetWithAI(budgetText) {
    if (!this.openai) return null;

    const systemPrompt = `
You are an extractor. The user will provide a messy RFP "Budget" section. 
Reconstruct it as structured JSON, preserving all rows.

Output format:
{
  "total": "string",
  "phases": {
    "Phase 1": {
      "roles": {"Role": {"hourlyRate": "string", "hours": "string", "cost": "string"}},
      "subtotal": "string"
    },
    "Phase 2": {
      "roles": {...},
      "subtotal": "string"
    }
  },
  "rawLines": ["original lines you parsed"]
}

Rules:
- Parse numbers/dollar values exactly as written.
- Preserve each role and its cost, even if misaligned.
- Do not drop rows; if a field is missing, set it to "Not mentioned".
- Output only JSON, no commentary.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: budgetText },
        ],
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (err) {
      console.warn("Budget AI extraction failed:", err.message);
      return null;
    }
  }

  // ------------------------------
  // Personnel-specific AI extractor
  // ------------------------------
  async analyzePersonnelWithAI(personnelText) {
    if (!this.openai) return null;

    const systemPrompt = `
You are an extractor. The user will provide a section of RFP text that lists "Key Personnel". 
Reconstruct it as structured JSON.

Output format:
{
  "Key Personnel": {
    "Full Name, Degree(s) - Role": [
      "bullet point responsibility/experience",
      "..."
    ]
  }
}

Rules:
- Always associate bullets with the most recent person's name/role line.
- Preserve bullets as strings, do not merge them.
- If no bullets are present, include an empty array for that person.
- Do not invent or summarize.
- Output only JSON, no commentary.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: personnelText },
        ],
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (err) {
      console.warn("Personnel AI extraction failed:", err.message);
      return null;
    }
  }

  // ------------------------------
  // Methodology-specific AI extractor
  // ------------------------------
  async analyzeMethodologyWithAI(methodologyText) {
    if (!this.openai) return null;

    const systemPrompt = `
You are an extractor. The user will provide a section of RFP text that describes methodology phases.
Reconstruct it as structured JSON.

Output format:
{
  "Methodology (By Phase)": {
    "Phase 1: Title": [
      "deliverable / step as string",
      "..."
    ],
    "Phase 2: Title": [
      "deliverable / step as string",
      "..."
    ]
  }
}

Rules:
- Treat any line starting with "Phase X" as the beginning of a new phase.
- Attach following bullets or paragraphs to that phase until the next "Phase" starts.
- Preserve deliverables exactly as written, one per array item.
- If a phase has no bullets, include an empty array.
- Do not invent or summarize.
- Output only JSON, no commentary.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: methodologyText },
        ],
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (err) {
      console.warn("Methodology AI extraction failed:", err.message);
      return null;
    }
  }

  // ------------------------------
  // Schedule-specific AI extractor
  // ------------------------------
  async analyzeScheduleWithAI(scheduleText) {
    if (!this.openai) return null;

    const systemPrompt = `
You are an extractor. The user will provide a section of RFP text that describes a project schedule.
Reconstruct it as structured JSON.

Output format:
{
  "Project Schedule": {
    "Months 1-2: Title": "description text",
    "Months 3-4: Title": "description text",
    "Months 5-7: Title": "description text",
    "etc.": "..."
  }
}

Rules:
- Treat any line starting with "Month" or "Months" as the beginning of a new schedule phase.
- Join all following sentences/paragraphs until the next "Month(s)" line.
- Keep descriptions as plain text (do not summarize or shorten).
- If a phase has no description, use "Not mentioned in the document".
- Output only JSON, no commentary.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: scheduleText },
        ],
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (err) {
      console.warn("Schedule AI extraction failed:", err.message);
      return null;
    }
  }
}

module.exports = SpecializedExtractors;
