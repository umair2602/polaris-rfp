const express = require('express');
const Template = require('../models/Template');

const router = express.Router();

// Template definitions
const templates = {
  software_development: {
    id: 'software_development',
    name: 'Software Development Proposal',
    projectType: 'software_development',
    sections: [
      {
        title: 'Title',
        contentType: 'title',
        required: true
      },
      {
        title: 'Cover Letter',
        contentType: 'cover_letter',
        required: true
      },
      {
        title: 'Firm Qualifications and Experience',
        contentType: 'Firm Qualifications and Experience',
        required: true
      },
      {
        title: 'Technical Approach & Methodology',
        contentType: 'Technical Approach & Methodology',
        required: true,
        subsections: [
          'Project Initiation & Planning',
          'Technical Architecture',
          'Development Phases',
          'Testing & Quality Assurance',
          'Deployment & Launch',
          'Maintenance & Support'
        ]
      },
      {
        title: 'Key Personnel and Experience',
        contentType: 'Key Personnel and Experience',
        required: true,
        includeRoles: ['project_lead', 'technical_lead', 'senior_architect', 'qa_lead']
      },
      {
        title: 'Budget Estimate',
        contentType: 'Budget Estimate',
        required: true,
        format: 'detailed_table'
      },
      {
        title: 'Project Timeline',
        contentType: 'Project Timeline',
        required: true
      },
      {
        title: 'References',
        contentType: 'References',
        required: true,
        minimumCount: 3,
        filterByType: 'software_development'
      }
    ]
  },
  strategic_communications: {
    id: 'strategic_communications',
    name: 'Strategic Communications Proposal',
    projectType: 'strategic_communications',
    sections: [
      {
        title: 'Title',
        contentType: 'Title',
        required: true
      },
      {
        title: 'Cover Letter',
        contentType: 'Cover Letter',
        required: true
      },
      {
        title: 'Experience & Qualifications',
        contentType: 'Experience & Qualifications',
        required: true
      },
      {
        title: 'Project Understanding & Workplan',
        contentType: 'Project Understanding & Workplan',
        required: true
      },
      {
        title: 'Benefits to Client',
        contentType: 'Benefits to Client',
        required: true
      },
      {
        title: 'Key Team Members',
        contentType: 'Key Team Members',
        required: true,
        includeRoles: ['project_manager', 'communications_lead', 'content_strategist']
      },
      {
        title: 'Budget',
        contentType: 'Budget',
        required: true
      },
      {
        title: 'Compliance & Quality Assurance',
        contentType: 'Compliance & Quality Assurance',
        required: true
      },
      {
        title: 'References',
        contentType: 'client_references',
        required: true,
        minimumCount: 3,
        filterByType: 'strategic_communications'
      }
    ]
  },
  financial_modeling: {
    id: 'financial_modeling',
    name: 'Financial Modeling & Analysis Proposal',
    projectType: 'financial_modeling',
    sections: [
      {
        title: 'Title',
        contentType: 'title',
        required: true
      },
      {
        title: 'Cover Letter',
        contentType: 'cover_letter',
        required: true
      },
      {
        title: 'Firm Qualifications and Experience',
        contentType: 'Firm Qualifications and Experience',
        required: true
      },
      {
        title: 'Methodology & Approach',
        contentType: 'Methodology & Approach',
        required: true
      },
      {
        title: 'Team Expertise',
        contentType: 'Key Team Members',
        required: true,
        includeRoles: ['financial_analyst', 'senior_modeler', 'project_manager']
      },
      {
        title: 'Deliverables & Timeline',
        contentType: 'Deliverables & Timeline',
        required: true
      },
      {
        title: 'Investment & Budget',
        contentType: 'Budget',
        required: true
      },
      {
        title: 'References',
        contentType: 'client_references',
        required: true,
        filterByType: 'financial_modeling'
      }
    ]
  }
};

// Get all available templates
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Try to get from database first
    let templateList = await Template.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name projectType sections isActive version')
      .lean();

    // If no templates in database, return empty list (no auto-seeding)

    const total = await Template.countDocuments({ isActive: true });

    const formattedList = templateList.map(template => ({
      id: template._id.toString(),
      name: template.name,
      projectType: template.projectType,
      sectionCount: template.sections ? template.sections.length : 0
    }));

    res.json({
      data: formattedList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get specific template
router.get('/:templateId', async (req, res) => {
  try {
    const template = await Template.findById(req.params.templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const formattedTemplate = {
      id: template._id.toString(),
      name: template.name,
      description: template.description,
      projectType: template.projectType,
      sections: template.sections,
      version: template.version,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    };

    res.json(formattedTemplate);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Preview template with RFP customization
router.post('/:templateId/preview', (req, res) => {
  try {
    const template = templates[req.params.templateId];
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const rfpData = req.body;
    let customizedTemplate = JSON.parse(JSON.stringify(template));

    // Add RFP-specific sections if needed
    if (rfpData.specialRequirements && rfpData.specialRequirements.length > 0) {
      const complianceSection = {
        title: 'Compliance & Special Requirements',
        contentType: 'compliance_details',
        required: true,
        specialRequirements: rfpData.specialRequirements
      };
      customizedTemplate.sections.splice(-1, 0, complianceSection);
    }

    // Adjust budget section format
    const budgetSections = customizedTemplate.sections.filter(s => 
      s.title.toLowerCase().includes('budget')
    );
    
    for (const section of budgetSections) {
      if (rfpData.budgetType === 'hourly') {
        section.format = 'hourly_breakdown';
      } else if (rfpData.budgetType === 'fixed') {
        section.format = 'fixed_price';
      }
    }

    // Customize team requirements
    if (rfpData.requiredRoles) {
      const teamSections = customizedTemplate.sections.filter(s => 
        s.contentType === 'team_profiles'
      );
      
      for (const section of teamSections) {
        section.includeRoles = rfpData.requiredRoles;
      }
    }

    res.json(customizedTemplate);
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

// Update template (MongoDB-backed)
router.put('/:templateId', async (req, res) => {
  try {
    const allowedUpdates = [
      'name',
      'description',
      'projectType',
      'sections',
      'isActive',
      'tags',
      'version'
    ];

    const updates = {};
    Object.keys(req.body || {}).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.lastModifiedBy = req.user?.id || 'system';

    const updated = await Template.findByIdAndUpdate(
      req.params.templateId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const formattedTemplate = {
      id: updated._id.toString(),
      name: updated.name,
      description: updated.description,
      projectType: updated.projectType,
      sections: updated.sections,
      version: updated.version,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };

    console.log(`✅ Template updated: ${updated._id}`);
    res.json(formattedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Create new template
router.post('/', async (req, res) => {
  try {
    const { name, templateType } = req.body;
    
    if (!name || !templateType) {
      return res.status(400).json({ error: 'Missing required fields: name, templateType' });
    }

    // Get the predefined template structure
    const predefinedTemplate = templates[templateType];
    if (!predefinedTemplate) {
      return res.status(400).json({ error: 'Invalid template type' });
    }

    // Convert predefined sections to database format
    const templateSections = predefinedTemplate.sections.map((section, index) => ({
      name: section.title,
      content: `Default content for ${section.title}`,
      contentType: section.contentType || 'static',
      isRequired: section.required !== false,
      order: index + 1,
      placeholders: []
    }));

    const newTemplate = new Template({
      name,
      description: `Template: ${name}`,
      projectType: predefinedTemplate.projectType,
      sections: templateSections,
      isActive: true,
      createdBy: 'user',
      lastModifiedBy: 'user',
      version: 1
    });

    await newTemplate.save();

    const formattedTemplate = {
      id: newTemplate._id.toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      projectType: newTemplate.projectType,
      sections: newTemplate.sections,
      version: newTemplate.version,
      isActive: newTemplate.isActive,
      createdAt: newTemplate.createdAt,
      updatedAt: newTemplate.updatedAt
    };

    console.log(`✅ Template created: ${newTemplate._id}`);
    res.status(201).json(formattedTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Delete template
router.delete('/:templateId', (req, res) => {
  try {
    const templateId = req.params.templateId;
    
    if (!templates[templateId]) {
      return res.status(404).json({ error: 'Template not found' });
    }

    delete templates[templateId];
    console.log(`✅ Template deleted: ${templateId}`);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Note: Auto-seeding removed by request; templates will not be created automatically

module.exports = router;