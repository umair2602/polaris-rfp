const express = require('express');
const multer = require('multer');
const mockDb = require('../utils/mockData');
const rfpAnalyzer = require('../services/rfpAnalyzer');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Upload and analyze RFP
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📄 Analyzing RFP:', req.file.originalname);
    
    // Analyze the RFP
    const analysis = await rfpAnalyzer.analyzeRFP(req.file.buffer, req.file.originalname);
    
    // Create RFP record
    const rfpData = {
      ...analysis,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      clientName: analysis.clientName || extractClientFromFilename(req.file.originalname) || 'Unknown Client'
    };

    const rfp = await mockDb.createRFP(rfpData);
    
    console.log('✅ RFP saved successfully:', rfp._id);
    res.status(201).json(rfp);
    
  } catch (error) {
    console.error('❌ RFP upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process RFP',
      message: error.message 
    });
  }
});

// Get all RFPs
router.get('/', async (req, res) => {
  try {
    const rfps = await mockDb.findRFPs();
    
    // Remove large text content for list view
    const simplifiedRFPs = rfps.map(rfp => {
      const { rawText, parsedSections, ...simplified } = rfp;
      return simplified;
    });

    res.json(simplifiedRFPs);
  } catch (error) {
    console.error('Error fetching RFPs:', error);
    res.status(500).json({ error: 'Failed to fetch RFPs' });
  }
});

// Get single RFP
router.get('/:id', async (req, res) => {
  try {
    const rfp = await mockDb.findRFPById(req.params.id);
    
    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    res.json(rfp);
  } catch (error) {
    console.error('Error fetching RFP:', error);
    res.status(500).json({ error: 'Failed to fetch RFP' });
  }
});

// Update RFP
router.put('/:id', async (req, res) => {
  try {
    const allowedUpdates = [
      'title', 'clientName', 'submissionDeadline', 'budgetRange',
      'keyRequirements', 'deliverables', 'specialRequirements', 'timeline'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const rfp = await mockDb.updateRFP(req.params.id, updates);

    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    res.json(rfp);
  } catch (error) {
    console.error('Error updating RFP:', error);
    res.status(500).json({ error: 'Failed to update RFP' });
  }
});

// Delete RFP
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await mockDb.deleteRFP(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    res.json({ message: 'RFP deleted successfully' });
  } catch (error) {
    console.error('Error deleting RFP:', error);
    res.status(500).json({ error: 'Failed to delete RFP' });
  }
});

// Helper function to extract client name from filename
function extractClientFromFilename(filename) {
  // Try to extract client name from common filename patterns
  const cleanName = filename
    .replace('.pdf', '')
    .replace(/rfp|RFP|proposal|PROPOSAL/gi, '')
    .replace(/[-_]/g, ' ')
    .trim();
  
  if (cleanName.length > 0) {
    return cleanName;
  }
  
  return null;
}

module.exports = router;