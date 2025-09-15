const express = require('express');
const router = express.Router();

// Simple in-memory templates for demo
const templates = [
  {
    id: 'software_development',
    name: 'Software Development Proposal',
    projectType: 'software_development',
    sectionCount: 8,
    description: 'Comprehensive template for software development projects'
  },
  {
    id: 'strategic_communications',
    name: 'Strategic Communications Proposal',
    projectType: 'strategic_communications',
    sectionCount: 6,
    description: 'Template for strategic communications and marketing projects'
  },
  {
    id: 'financial_modeling',
    name: 'Financial Modeling Proposal',
    projectType: 'financial_modeling',
    sectionCount: 7,
    description: 'Template for financial analysis and modeling projects'
  }
];

// Get all templates
router.get('/', async (req, res) => {
  try {
    res.json({ data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/:id', async (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

module.exports = router;