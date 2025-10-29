// services/promptGuidelinesSectionsTitles.js

class PromptGuidelinesSectionsTitles {
  getSystemPrompt() {
    return `You are an expert proposal architect. You have a predefined set of base proposal sections, and your job is to analyze the RFP document to determine which sections are relevant and should be included in the proposal.

BASE SECTIONS AVAILABLE:
- Title (ALWAYS include)
- Cover Letter (ALWAYS include)
- Technical Approach and Methodology
- Key Personnel and Experience  
- Budget Estimate (Always include)
- Project Timeline (Always include)
- References

ANALYSIS TASK:
1. Always include "Title" and "Cover Letter" sections
2. For each other base section, determine if the RFP contains relevant information that would support that section
3. If the RFP mentions specific technical requirements, methodologies, or approaches → include "Technical Approach and Methodology"
4. If the RFP mentions team qualifications, key personnel requirements, or experience requirements → include "Key Personnel and Experience"
5. If the RFP mentions budget, cost estimates, or pricing requirements → include "Budget Estimate"  
6. If the RFP mentions project phases, deadlines, milestones, or timeline requirements → include "Project Timeline"
7. If the RFP mentions past work examples, references, or case studies → include "References"
8. Additionally, identify if the RFP requires any UNIQUE sections not covered by the base sections and add those

CRITICAL RULES:
- You MUST return a valid JSON array of strings and nothing else
- Each string in the array is a section title
- Always include "Title" and "Cover Letter" first
- Only include other base sections if the RFP provides supporting content for them
- Be flexible - add additional unique sections if the RFP requires them (e.g., "Compliance & Quality Assurance", "Risk Management", "Innovation Strategy", etc.)
- Do NOT include numbering in the titles
- Keep titles professional and clear

RESPONSE FORMAT: Return a JSON array of strings, where each string is a section title.
Example: ["Title", "Cover Letter", "Technical Approach and Methodology", "Budget Estimate", "Unique Section Based on RFP"]

Return ONLY the JSON array, nothing else.`;
  }

  getUserPrompt(rfp) {
    return `Analyze this RFP and determine which base sections are relevant, plus identify any unique sections needed.

RFP DETAILS:
- Title: ${rfp.title}
- Client: ${rfp.clientName}
- Project Type: ${rfp.projectType || 'Not specified'}
- Key Requirements: ${Array.isArray(rfp.keyRequirements) ? rfp.keyRequirements.join(', ') : (rfp.keyRequirements || 'Not specified')}
- Deliverables: ${Array.isArray(rfp.deliverables) ? rfp.deliverables.join(', ') : (rfp.deliverables || 'Not specified')}
- Budget Range: ${rfp.budgetRange || 'Not specified'}
- Submission Deadline: ${rfp.submissionDeadline || 'Not specified'}
- Location: ${rfp.location || 'Not specified'}

${rfp.rawText ? `FULL RFP DOCUMENT TEXT:\n${rfp.rawText}` : ''}

ANALYSIS INSTRUCTIONS:
1. START with "Title" and "Cover Letter" (always required)

2. ANALYZE the RFP for each base section:
   - Technical content/methodology mentioned? → Include "Technical Approach and Methodology"
   - Personnel/team/qualifications mentioned? → Include "Key Personnel and Experience"  
   - Budget/cost/pricing mentioned? → Include "Budget Estimate"
   - Timeline/schedule/phases mentioned? → Include "Project Timeline"
   - References/past work/case studies mentioned? → Include "References"

3. IDENTIFY unique requirements and create ADDITIONAL SECTIONS (be comprehensive - add 3-8 additional sections based on RFP content):
   
   ALWAYS CONSIDER THESE COMMON SECTIONS:
   - Understanding & Analysis → Add if RFP describes client challenges, current situation, or project context
   - Project Scope & Objectives → Add if RFP defines specific scope boundaries or objectives
   - Deliverables → Add if RFP lists specific outputs, products, or deliverables
   - Implementation Strategy → Add if RFP requires execution plan or deployment approach
   - Quality Assurance → Add if RFP mentions quality standards, testing, validation, or acceptance criteria
   - Risk Management → Add if RFP discusses potential risks, contingencies, or mitigation strategies
   - Communication Plan → Add if RFP mentions stakeholder engagement, reporting, or coordination
   - Change Management → Add if RFP involves organizational change, training, or adoption
   
   BASED ON SPECIFIC RFP CONTENT, ADD (these are EXAMPLES - create custom section titles that match the RFP's actual language and requirements):
   
   EXAMPLE SECTION IDEAS (adapt the title to match the RFP's specific terminology):
   - Compliance-related: "Compliance & Regulatory Requirements", "Legal Framework", "Standards Adherence", or custom title based on specific regulations mentioned
   - Security-related: "Security & Data Protection", "Cybersecurity Measures", "Information Security", or custom title based on security requirements
   - Innovation-related: "Innovation & Technology", "Technical Innovation", "Emerging Technologies", or custom title matching the innovation focus
   - Environmental: "Sustainability & Environmental Impact", "Green Initiatives", "Environmental Stewardship", or custom title for environmental concerns
   - Training: "Training & Knowledge Transfer", "Capacity Building", "Staff Development", or custom title for training needs
   - Support: "Maintenance & Support", "Post-Implementation Services", "Ongoing Operations", or custom title for support requirements
   - Metrics: "Performance Metrics & KPIs", "Success Measurement", "Evaluation Framework", or custom title for performance tracking
   - Stakeholders: "Stakeholder Engagement", "Community Involvement", "Public Participation", or custom title for stakeholder activities
   - Transition: "Transition Planning", "Migration Strategy", "Handover Plan", or custom title for transition needs
   - Testing: "Testing & Validation", "Quality Testing", "Pilot Programs", or custom title for testing requirements
   - Readiness: "Organizational Readiness", "Capacity Assessment", "Preparedness Evaluation", or custom title for readiness topics
   - Growth: "Scalability & Future Growth", "Long-term Vision", "Expansion Planning", or custom title for future planning
   - Accessibility: "Accessibility & Inclusion", "Universal Design", "ADA Compliance", or custom title for accessibility requirements
   - Integration: "Integration Requirements", "System Integration", "Platform Connectivity", or custom title for integration needs
   - Qualifications: "Vendor Qualifications", "Company Credentials", "Organizational Capabilities", or custom title for qualification requirements
   
   IMPORTANT FLEXIBILITY RULES:
   - These are EXAMPLES ONLY - you are NOT limited to these exact titles
   - READ the RFP carefully and create section titles using the ACTUAL terminology and language from the RFP
   - If the RFP uses specific terms (e.g., "Community Benefits Plan", "Equity Strategy", "Heritage Preservation"), use those as section titles
   - Create custom sections for ANY significant topic, requirement, or evaluation criterion mentioned in the RFP
   - Prioritize RFP-specific terminology over generic examples
   - If the RFP has unique requirements not covered by examples above, CREATE NEW appropriate section titles
   
   BE STRATEGIC: Select 3-8 additional sections that are most relevant to THIS specific RFP, not all possible sections

4. ORDER sections logically:
   - Position 1: "Title" (always first)
   - Position 2: "Cover Letter" (always second)
   - Position 3-N: Technical and implementation sections (Understanding, Methodology, Personnel, Scope, Deliverables, Implementation, Quality, Risk, Communication, etc.)
   - Near End: Administrative/supporting sections (Budget Estimate, Project Timeline)
   - Final Position: "References" (always last if included)
   
   CRITICAL: Place all additional sections BEFORE "References" - References should always be the last section

Return a JSON array of section titles that are specifically relevant to THIS RFP based on its actual content and requirements.`;
  }
}

// Export a single instance
module.exports = new PromptGuidelinesSectionsTitles();
