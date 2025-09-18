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
        title: 'Technical Approach & Methodology',
        contentType: 'structured',
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
        contentType: 'team_profiles',
        required: true,
        includeRoles: ['project_lead', 'technical_lead', 'senior_architect', 'qa_lead']
      },
      {
        title: 'Budget Estimate',
        contentType: 'financial_breakdown',
        required: true,
        format: 'detailed_table'
      },
      {
        title: 'Project Timeline',
        contentType: 'project_schedule',
        required: true
      },
      {
        title: 'References',
        contentType: 'client_references',
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
        title: 'Experience & Qualifications',
        contentType: 'credentials_showcase',
        required: true
      },
      {
        title: 'Project Understanding & Workplan',
        contentType: 'phased_approach',
        required: true
      },
      {
        title: 'Benefits to Client',
        contentType: 'value_proposition',
        required: true
      },
      {
        title: 'Key Team Members',
        contentType: 'team_profiles',
        required: true,
        includeRoles: ['project_manager', 'communications_lead', 'content_strategist']
      },
      {
        title: 'Budget',
        contentType: 'hourly_breakdown',
        required: true
      },
      {
        title: 'Compliance & Quality Assurance',
        contentType: 'standards_commitment',
        required: true
      },
      {
        title: 'References',
        contentType: 'client_testimonials',
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
        title: 'Methodology & Approach',
        contentType: 'analytical_methodology',
        required: true
      },
      {
        title: 'Team Expertise',
        contentType: 'team_profiles',
        required: true,
        includeRoles: ['financial_analyst', 'senior_modeler', 'project_manager']
      },
      {
        title: 'Deliverables & Timeline',
        contentType: 'deliverable_schedule',
        required: true
      },
      {
        title: 'Investment & Budget',
        contentType: 'financial_breakdown',
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

    // If no templates in database, seed with defaults
    if (templateList.length === 0) {
      await seedDefaultTemplates();
      templateList = await Template.find({ isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name projectType sections isActive version')
        .lean();
    }

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

// Update template
router.put('/:templateId', (req, res) => {
  try {
    const templateId = req.params.templateId;
    const updates = req.body;
    
    if (!templates[templateId]) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Update the template
    templates[templateId] = {
      ...templates[templateId],
      ...updates,
      id: templateId, // Preserve ID
      sectionCount: updates.sections ? updates.sections.length : templates[templateId].sections.length
    };

    console.log(`✅ Template updated: ${templateId}`);
    res.json(templates[templateId]);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Create new template
router.post('/', (req, res) => {
  try {
    const { id, name, projectType, sections = [] } = req.body;
    
    if (!id || !name || !projectType) {
      return res.status(400).json({ error: 'Missing required fields: id, name, projectType' });
    }

    if (templates[id]) {
      return res.status(409).json({ error: 'Template with this ID already exists' });
    }

    const newTemplate = {
      id,
      name,
      projectType,
      sections,
      sectionCount: sections.length
    };

    templates[id] = newTemplate;
    console.log(`✅ Template created: ${id}`);
    res.status(201).json(newTemplate);
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

// Seed default templates
async function seedDefaultTemplates() {
  try {
    const defaultTemplates = Object.values(templates).map(template => ({
      name: template.name,
      description: `Default ${template.name} template`,
      projectType: template.projectType,
      sections: template.sections.map((section, index) => ({
        name: section.title,
        content: `Default content for ${section.title}`,
        contentType: section.contentType || 'static',
        isRequired: section.required || true,
        order: index + 1,
        placeholders: []
      })),
      isActive: true,
      createdBy: 'system',
      lastModifiedBy: 'system',
      version: 1
    }));

    await Template.insertMany(defaultTemplates);
    console.log('✅ Default templates seeded successfully');
  } catch (error) {
    console.error('Error seeding default templates:', error);
  }
}

module.exports = router;