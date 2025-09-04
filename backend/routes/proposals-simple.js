const express = require('express');
const mockDb = require('../utils/mockData');

const router = express.Router();

// Generate new proposal
router.post('/generate', async (req, res) => {
  try {
    const { rfpId, templateId, title, customContent = {} } = req.body;

    // Validate required fields
    if (!rfpId || !templateId || !title) {
      return res.status(400).json({ 
        error: 'Missing required fields: rfpId, templateId, title' 
      });
    }

    // Get RFP data
    const rfp = await mockDb.findRFPById(rfpId);
    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    // Generate proposal sections
    const sections = generateProposalSections(rfp, templateId, customContent);

    // Create proposal
    const proposalData = {
      rfpId,
      templateId,
      title,
      status: 'draft',
      sections,
      customContent,
      lastModifiedBy: 'admin'  // Would use req.user.username with auth
    };

    const proposal = await mockDb.createProposal(proposalData);

    console.log('✅ Proposal generated successfully:', proposal._id);
    res.status(201).json({
      ...proposal,
      rfp: {
        _id: rfp._id,
        title: rfp.title,
        clientName: rfp.clientName,
        projectType: rfp.projectType
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating proposal:', error);
    res.status(500).json({ 
      error: 'Failed to generate proposal',
      message: error.message 
    });
  }
});

// Get all proposals
router.get('/', async (req, res) => {
  try {
    const proposals = await mockDb.findProposals();
    
    // Add RFP info and remove large sections for list view
    const enrichedProposals = proposals.map(proposal => {
      const rfp = mockDb.rfps.find(r => r._id === proposal.rfpId);
      const { sections, ...simplified } = proposal;
      
      return {
        ...simplified,
        rfp: rfp ? {
          title: rfp.title,
          clientName: rfp.clientName,
          projectType: rfp.projectType
        } : null
      };
    });

    res.json(enrichedProposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Get single proposal
router.get('/:id', async (req, res) => {
  try {
    const proposal = await mockDb.findProposalById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Add RFP info
    const rfp = await mockDb.findRFPById(proposal.rfpId);
    
    res.json({
      ...proposal,
      rfp: rfp ? {
        title: rfp.title,
        clientName: rfp.clientName,
        projectType: rfp.projectType,
        keyRequirements: rfp.keyRequirements,
        deliverables: rfp.deliverables
      } : null
    });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ error: 'Failed to fetch proposal' });
  }
});

// Update proposal
router.put('/:id', async (req, res) => {
  try {
    const allowedUpdates = [
      'title', 'status', 'sections', 'customContent', 
      'budgetBreakdown', 'timelineDetails', 'teamAssignments'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.lastModifiedBy = 'admin'; // Would use req.user.username with auth

    const proposal = await mockDb.updateProposal(req.params.id, updates);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json(proposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

// Delete proposal
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await mockDb.deleteProposal(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({ error: 'Failed to delete proposal' });
  }
});

// Helper function to generate proposal sections
function generateProposalSections(rfp, templateId, customContent) {
  const contentLibrary = require('../services/contentLibrary');
  
  const sections = {};

  // Executive Summary
  sections['Executive Summary'] = {
    content: generateExecutiveSummary(rfp, contentLibrary),
    type: 'generated',
    lastModified: new Date()
  };

  // Technical Approach (for software development)
  if (rfp.projectType === 'software_development') {
    sections['Technical Approach & Methodology'] = {
      content: generateTechnicalApproach(rfp),
      type: 'generated',
      lastModified: new Date()
    };
  }

  // Team Section
  sections['Key Personnel and Experience'] = {
    content: generateTeamSection(rfp.projectType, contentLibrary),
    type: 'generated',
    lastModified: new Date()
  };

  // Budget Section
  sections['Budget Estimate'] = {
    content: generateBudgetSection(rfp),
    type: 'generated',
    lastModified: new Date()
  };

  // Timeline
  sections['Project Timeline'] = {
    content: generateTimelineSection(rfp),
    type: 'generated',
    lastModified: new Date()
  };

  // References
  sections['References'] = {
    content: generateReferencesSection(rfp.projectType, contentLibrary),
    type: 'generated',
    lastModified: new Date()
  };

  // Apply custom content overrides
  Object.keys(customContent).forEach(sectionName => {
    if (sections[sectionName]) {
      sections[sectionName].content = customContent[sectionName];
      sections[sectionName].type = 'custom';
      sections[sectionName].lastModified = new Date();
    }
  });

  return sections;
}

function generateExecutiveSummary(rfp, contentLibrary) {
  const companyIntro = contentLibrary.generateCompanyIntroduction(rfp.projectType);
  
  return `${companyIntro}

We understand that ${rfp.clientName} seeks a qualified partner for ${rfp.title}. Our proven expertise in ${rfp.projectType.replace('_', ' ')} positions us uniquely to deliver exceptional results for your organization.

**Key Project Requirements:**
${rfp.keyRequirements?.slice(0, 5).map(req => `• ${req}`).join('\n') || '• Requirements to be refined during discovery phase'}

Our approach combines technical excellence with cultural sensitivity, ensuring solutions that are both innovative and appropriate for your organization's needs. We are committed to delivering exceptional value and look forward to partnering with ${rfp.clientName} on this important initiative.

**Project Investment:** ${rfp.budgetRange || 'To be determined based on scope refinement'}
**Timeline:** ${rfp.timeline || 'Aligned with your requirements and deadlines'}`;
}

function generateTechnicalApproach(rfp) {
  return `Our technical approach follows industry best practices while being tailored to your specific requirements:

## Project Initiation & Planning
We begin with comprehensive stakeholder discovery and requirements analysis, conducting structured workshops to understand your vision, constraints, and success criteria.

## Technical Architecture
Our architecture prioritizes scalability, security, and maintainability, employing:
• Microservices architecture for component independence
• API-first design for system integration flexibility  
• Cloud-native infrastructure for reliability and performance
• Security-by-design principles throughout all layers
• Responsive design for optimal user experience across devices

## Development Methodology
We follow an iterative Agile development approach with:
• Sprint-based development with 2-week iterations
• Daily standups and weekly progress reviews
• Continuous integration and automated testing
• Regular stakeholder demos and feedback incorporation
• Collaborative code reviews and knowledge sharing

## Quality Assurance
Our comprehensive QA approach ensures robust, reliable deliverables:
• Automated unit and integration testing
• User acceptance testing with stakeholder participation
• Security vulnerability scanning and penetration testing
• Performance and load testing under realistic conditions
• Accessibility compliance validation (WCAG 2.1 AA)

## Deployment & Launch
Our deployment strategy minimizes risk while ensuring smooth transition:
• Staged deployment with development, staging, and production environments
• Blue-green deployment for zero-downtime releases
• Comprehensive monitoring and logging implementation
• Rollback procedures and disaster recovery planning

## Maintenance & Support
Our ongoing support ensures long-term system reliability:
• 24/7 monitoring with proactive issue detection
• Regular security updates and patch management
• Performance optimization and capacity planning
• Documentation maintenance and knowledge transfer`;
}

function generateTeamSection(projectType, contentLibrary) {
  const relevantRoles = {
    'software_development': ['saxon_metzger', 'wesley_ladd', 'technical_lead'],
    'strategic_communications': ['saxon_metzger', 'communications_lead'],
    'financial_modeling': ['saxon_metzger'],
    'general': ['saxon_metzger']
  };

  const roles = relevantRoles[projectType] || relevantRoles.general;
  const teamMembers = contentLibrary.getTeamMembersByRoles(roles);

  return teamMembers.map(member => `
## ${member.name}, ${member.title}
${member.roleDescription}

**Experience:** ${member.experienceYears}+ years
**Education:** ${member.education.join(', ')}
**Certifications:** ${member.certifications.join(', ')}
**Key Responsibilities:** ${member.responsibilities.slice(0, 4).join(', ')}

**Notable Projects:**
${member.keyProjects.slice(0, 3).map(project => `• ${project}`).join('\n')}
`).join('\n');
}

function generateBudgetSection(rfp) {
  const phases = [
    { name: 'Discovery & Planning', cost: 15000, percentage: 15 },
    { name: 'Design & Architecture', cost: 25000, percentage: 25 },
    { name: 'Development & Implementation', cost: 40000, percentage: 40 },
    { name: 'Testing & Quality Assurance', cost: 10000, percentage: 10 },
    { name: 'Deployment & Training', cost: 10000, percentage: 10 }
  ];

  const total = phases.reduce((sum, phase) => sum + phase.cost, 0);

  let budgetContent = `## Project Investment Breakdown\n\n`;
  budgetContent += `| Phase | Investment | % of Total |\n`;
  budgetContent += `|-------|------------|------------|\n`;
  
  phases.forEach(phase => {
    budgetContent += `| ${phase.name} | $${phase.cost.toLocaleString()} | ${phase.percentage}% |\n`;
  });
  
  budgetContent += `| **TOTAL PROJECT INVESTMENT** | **$${total.toLocaleString()}** | **100%** |\n\n`;
  budgetContent += `This investment covers all aspects of the project including planning, development, testing, deployment, and initial support. Payment schedule can be structured to align with project milestones and your cash flow requirements.`;

  return budgetContent;
}

function generateTimelineSection(rfp) {
  const phases = [
    { name: 'Discovery & Planning', weeks: 3, deliverables: ['Project Charter', 'Requirements Document'] },
    { name: 'Design & Architecture', weeks: 4, deliverables: ['System Architecture', 'UI/UX Designs'] },
    { name: 'Development Phase 1', weeks: 4, deliverables: ['Core Functionality', 'User Authentication'] },
    { name: 'Development Phase 2', weeks: 4, deliverables: ['Advanced Features', 'Integration'] },
    { name: 'Testing & QA', weeks: 3, deliverables: ['Test Reports', 'Bug Fixes'] },
    { name: 'Deployment & Training', weeks: 2, deliverables: ['Live System', 'User Training'] }
  ];

  let timelineContent = `## Project Timeline\n\n`;
  timelineContent += `| Timeline | Phase | Key Deliverables |\n`;
  timelineContent += `|----------|-------|------------------|\n`;
  
  let currentWeek = 0;
  phases.forEach(phase => {
    const startWeek = currentWeek + 1;
    const endWeek = currentWeek + phase.weeks;
    timelineContent += `| Weeks ${startWeek}-${endWeek} | ${phase.name} | ${phase.deliverables.join(', ')} |\n`;
    currentWeek = endWeek;
  });

  const totalWeeks = phases.reduce((sum, phase) => sum + phase.weeks, 0);
  timelineContent += `\n**Total Project Duration:** ${totalWeeks} weeks (${Math.ceil(totalWeeks / 4)} months)\n`;
  
  if (rfp.submissionDeadline) {
    timelineContent += `**Target Completion:** Aligned with your ${new Date(rfp.submissionDeadline).toLocaleDateString()} requirements\n`;
  }

  return timelineContent;
}

function generateReferencesSection(projectType, contentLibrary) {
  const references = contentLibrary.getProjectReferences(projectType, 3);

  return references.map(ref => `
## ${ref.clientName}
**Project:** ${ref.projectScope}
**Contact:** ${ref.contactPerson}
**Email:** ${ref.contactEmail}
**Phone:** ${ref.contactPhone}
**Project Value:** ${ref.projectValue}
**Duration:** ${ref.duration}

**Key Outcomes:**
${ref.outcomes.map(outcome => `• ${outcome}`).join('\n')}

**Client Testimonial:**
*"${ref.testimonial}"*
`).join('\n---\n');
}

module.exports = router;