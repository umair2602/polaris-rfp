const mongoose = require('mongoose');

const projectReferenceSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  projectScope: {
    type: String,
    required: true
  },
  projectType: {
    type: String,
    required: true,
    enum: ['software_development', 'strategic_communications', 'financial_modeling', 'general']
  },
  projectValue: {
    type: String
  },
  duration: {
    type: String
  },
  startDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  contactPerson: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String
  },
  outcomes: [String],
  testimonial: {
    type: String,
    required: true
  },
  keyTechnologies: [String],
  teamMembers: [String],
  challenges: [String],
  solutions: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  confidentialityLevel: {
    type: String,
    enum: ['public', 'restricted', 'confidential'],
    default: 'public'
  },
  attachments: [{
    name: String,
    path: String,
    type: String
  }]
}, {
  timestamps: true
});

// Indexes
projectReferenceSchema.index({ projectType: 1 });
projectReferenceSchema.index({ isActive: 1 });
projectReferenceSchema.index({ isPublic: 1 });
projectReferenceSchema.index({ clientName: 1 });

module.exports = mongoose.model('ProjectReference', projectReferenceSchema);