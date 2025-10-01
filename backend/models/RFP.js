const mongoose = require('mongoose');

const rfpSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  submissionDeadline: {
    type: String,
    trim: true
  },
  budgetRange: {
    type: String,
    trim: true
  },
  projectType: {
    type: String,
    required: true,
    enum: ['software_development', 'strategic_communications', 'financial_modeling', 'general']
  },
  keyRequirements: [{
    type: String,
    trim: true
  }],
  evaluationCriteria: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  deliverables: [{
    type: String,
    trim: true
  }],
  timeline: {
    type: mongoose.Schema.Types.Mixed,
    default: ""
  },
  projectScope: {
    type: String,
    trim: true
  },
  contactInformation: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  additionalInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  specialRequirements: [{
    type: String,
    trim: true
  }],
  rawText: {
    type: String
  },
  parsedSections: {
    type: mongoose.Schema.Types.Mixed
  },
  sectionTitles: [{
    type: String,
    trim: true
  }],
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes
rfpSchema.index({ projectType: 1 });
rfpSchema.index({ clientName: 1 });
rfpSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RFP', rfpSchema);