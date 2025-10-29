// Centralized section guidelines used by both AI generators
// Keep this as the single source of truth for formatting and structure

class PromptGuidelines {
  getSectionGuidelines() {
    return `
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
   - CRITICAL: Format as a proper markdown table with exactly 3 columns: "Phase", "Timeline", and "Key Activities & Milestones"
   - Use this exact table format:
     | Phase | Timeline | Key Activities & Milestones |
     |-------|----------|----------------------------|
     | Phase 1: [Detailed Phase Name matching methodology] | [Specific duration with start/end dates if RFP provides deadline] | [Detailed 3-4 sentence paragraph describing the phase activities, key milestones, deliverables, and outcomes. Include specific tasks, meetings, reviews, and checkpoints. Explain what will be accomplished and how it contributes to the overall project success. Reference specific RFP requirements that will be addressed in this phase.] |
     | Phase 2: [Detailed Phase Name matching methodology] | [Specific duration with start/end dates if RFP provides deadline] | [Detailed 3-4 sentence paragraph describing the phase activities, key milestones, deliverables, and outcomes. Include specific tasks, meetings, reviews, and checkpoints. Explain what will be accomplished and how it contributes to the overall project success. Reference specific RFP requirements that will be addressed in this phase.] |
   - Each phase should have realistic timeline estimates and comprehensive descriptions
   - Write detailed content (3-4 sentences) in the "Key Activities & Milestones" column explaining what will be accomplished in each phase
   - Include specific milestones, deliverables, and review points for each phase
   - Ensure all rows have exactly 3 cells with proper markdown table syntax

**For sections related to Budget, Cost, or Financial** (containing words like "budget", "cost", "financial", "pricing", "fees"):
    Provide a resource-based cost breakdown by phase that matches the methodology phases
    - Create a detailed breakdown that aligns 1:1 with the phases defined in the Methodology/Process section
    - If a budget range is provided in the RFP, keep totals within that range and briefly justify major cost drivers
    - If specific budget rules are mentioned (e.g., NTE, reimbursables), follow them strictly and note any assumptions below the table
    - Break down costs by Phase and Role with hourly rate, estimated hours, and calculated cost
    - CRITICAL: Format as a proper markdown table with exactly 5 columns: "Phase", "Role", "Hourly Rate", "Hours", "Cost ($)"
    - Determine the list of phases as follows:
       - If the Methodology/Process section exists, EXTRACT its phase names/headings and use those EXACT names in the Budget table
       - If Methodology is not available, INFER the appropriate number of logical phases from the RFP scope and complexity (typically 4-8 phases for complex projects, minimum 4 phases for simpler projects)
       - Complex projects (large scope, multiple deliverables, long duration) should have more than 6 phases
       - Medium projects should have more than 4 phases  
       - Simple projects should have at least 4 phases
       - Use those phase names consistently across all sections (Methodology, Timeline, Budget)
    - Use this exact table header and row structure (do not hardcode example values; compute based on the RFP context):
       | Phase | Role | Hourly Rate | Hours | Cost ($) |
       |------|------|-------------|-------|----------|
       | Phase 1: [Detailed Phase Name] | [Role A] | $[Rate] | [Hours] | $[Rate*Hours] |
       |  | [Role B] | $[Rate] | [Hours] | $[Rate*Hours] |
       |  | [Role C or additional roles as needed] | $[Rate] | [Hours] | $[Rate*Hours] |
       | Subtotal Phase 1 |  |  |  | $[Sum of Phase 1] |
       | Phase 2: [Detailed Phase Name] | [Role A] | $[Rate] | [Hours] | $[Rate*Hours] |
       |  | [Role B] | $[Rate] | [Hours] | $[Rate*Hours] |
       |  | [Role C or additional roles as needed] | $[Rate] | [Hours] | $[Rate*Hours] |
       | Subtotal Phase 2 |  |  |  | $[Sum of Phase 2] |
       | [Continue with Phase 3, Phase 4, Phase 5, Phase 6, etc. as needed based on the project complexity and methodology phases] |
       | TOTAL |  |  |  | $[Grand Total] |
    - Rules and formatting requirements:
       - Use currency format with a dollar sign and thousands separators (e.g., $12,340.00); round to two decimals
       - Keep the Phase cell filled only on the first row for that phase; leave it blank for subsequent role rows in the same phase
       - Ensure subtotals equal the sum of role costs for that phase; ensure TOTAL equals the sum of all subtotals
       - NEVER limit to just 2-3 phases; always generate at least 4 phases minimum, preferably 5-8 phases for comprehensive project coverage
       - Do not include ellipsis "..." rows in the final output; generate concrete rows for EVERY single phase identified in the methodology
       - Create a complete budget table that accounts for ALL phases of the project lifecycle
       - Do not reuse or copy any example numbers; generate values based on the RFP scope, rates typical for the domain, and stated constraints
       - STRICT MARKDOWN SYNTAX (to prevent column shifts):
          - Every data row must have exactly 5 cells and start and end with a pipe
          - For role-only rows inside a phase, the first cell MUST be empty: "|  | [Role] | $[Rate] | [Hours] | $[Rate*Hours] |"
          - For Subtotal rows, only the first and last cells contain text: "| Subtotal Phase X |  |  |  | $[Subtotal] |"
          - For the TOTAL row: "| TOTAL |  |  |  | $[Grand Total] |"
          - Never omit the leading "|  |" when the Phase cell is intentionally blank; never merge cells
    - After the table, add a short assumptions/notes block listing key assumptions (e.g., rate basis, travel, data collection scope, number of meetings)

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
   Generate comprehensive, detailed content that is directly relevant to the section title and RFP requirements
   - **DEPTH BASED ON IMPORTANCE**: Scale the depth and detail of your response based on the section's importance to the RFP requirements and the amount of relevant information available in the RFP document
   - **STRUCTURE YOUR RESPONSE**:
     * Start with an opening paragraph that connects the section topic to the specific RFP requirements and project goals
     * Include multiple detailed body paragraphs or major subsections, each addressing a different aspect of the topic (adjust based on complexity and RFP details)
     * Conclude with a summary paragraph that ties everything back to delivering value for this specific project
   - **USE SPECIFIC DETAILS**:
     * Reference specific requirements, deliverables, and constraints from the RFP document
     * Use industry-standard terminology and technical language appropriate to the project domain
     * Include concrete examples, methodologies, tools, or approaches relevant to this section topic
     * Incorporate quantifiable metrics, standards, or benchmarks where applicable (e.g., "achieving 99.9% uptime", "reducing processing time by 40%", "ISO 9001 compliance")
   - **DEMONSTRATE DEEP UNDERSTANDING**:
     * Show how this section's topic directly supports the RFP's stated objectives and success criteria
     * Explain WHY this aspect matters for the client's specific situation and project context
     * Address potential challenges or risks related to this topic and how they'll be mitigated
     * Connect this section to other aspects of the proposal (methodology, timeline, team expertise)
   - **FOR SECTIONS NOT EXPLICITLY IN RFP**:
     * **CRITICAL**: Even if the RFP doesn't explicitly mention this section topic (e.g., "Sustainability", "Innovation", "Quality Assurance", "Risk Management", "Data Security"), you MUST generate thoughtful, comprehensive content
     * Infer and explain how this topic relates to the project's goals, deliverables, industry best practices, and client needs
     * Propose specific strategies, frameworks, or approaches for how this aspect will be addressed in the project execution
     * Demonstrate thought leadership by addressing this topic proactively, showing foresight and comprehensive planning
   - **CONTENT DEPTH EXAMPLES BY SECTION TYPE**:
     * Quality Assurance: Describe QA methodologies, testing protocols, review processes, quality metrics, compliance checks, acceptance criteria, and continuous improvement processes
     * Risk Management: Identify potential risks (technical, schedule, budget, resource, external), mitigation strategies, contingency plans, monitoring approach, and escalation procedures
     * Innovation/Technology: Detail innovative approaches, cutting-edge tools/technologies, modern methodologies, competitive advantages, and how innovation drives project success
     * Sustainability: Address environmental impact, sustainable practices, long-term viability, resource efficiency, social responsibility, and alignment with sustainability goals
     * Data Security/Privacy: Explain security frameworks, data protection measures, compliance requirements, access controls, encryption, backup/recovery, and incident response
     * Communication Plan: Detail stakeholder communication strategies, reporting frequency/formats, escalation paths, collaboration tools, meeting cadence, and documentation approaches
     * Change Management: Describe change management methodology, stakeholder engagement, training plans, adoption strategies, resistance management, and success measurement
   - **FORMATTING FOR READABILITY**:
     * Use clear paragraph breaks for prose-heavy sections
     * Use bullet points or numbered lists for multi-faceted topics with distinct components
     * Include subheadings (using **bold** text) to organize complex sections into logical subsections
     * Use tables (properly formatted markdown) when presenting structured information, comparisons, or frameworks
   - **NEVER USE PLACEHOLDERS**: Never write "not available", "not specified", "to be determined", or similar placeholders - always provide substantive, actionable, relevant content
   - **MAINTAIN PROPOSAL VOICE**: Write confidently and professionally, using "we will", "our approach", "our team" to demonstrate capability and commitment`;
  }

  getGeneralGuidelines() {
    return `
GENERAL GUIDELINES:
- Generate COMPREHENSIVE, DETAILED content for each section - avoid brief or superficial responses
- Use professional, persuasive language that demonstrates expertise
- Include extensive specific details from the RFP document throughout all sections
- Reference specific RFP requirements, constraints, objectives, and deliverables in each section
- **CRITICAL: For Methodology/Process/Phases sections, you MUST use proper markdown table format with 2 columns (Phase | Deliverables). Use <br> tags for line breaks within cells**
- **CRITICAL: For Budget/Cost sections, you MUST use proper markdown table format with 5 columns (Phase | Role | Hourly Rate | Hours | Cost)**
- Use bullet points for lists but ensure each point is substantial and detailed
- Make content highly relevant to the project type, scope, and complexity described in the RFP
- Ensure each section is comprehensive and thorough - prioritize depth over brevity
- Use **bold** for emphasis and *italics* for important details
- Adapt language and examples to match the RFP's project type and industry context
- Draw extensively from the RFP raw text to create content that shows deep document analysis
- Each section should feel substantial and valuable to proposal evaluators
- **CRITICAL**: For sections not explicitly mentioned in the RFP, demonstrate how your expertise in that area will benefit the project - DO NOT say "not available" or similar phrases

FORMATTING RULES:
- The AI should intelligently detect section types based on keywords in the section titles and apply appropriate formatting automatically
- No need for hardcoded section names - use pattern matching on section titles
- Apply table formats for Methodology, Timeline, Budget sections based on keyword detection
- Use proper markdown syntax throughout`;
  }
}

module.exports = new PromptGuidelines();
