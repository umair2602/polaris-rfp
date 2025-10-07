const mongoose = require('mongoose');

const projectReferenceSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true,
    trim: true
  },
  timePeriod: {
    type: String,
    trim: true
  },
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  contactTitle: {
    type: String,
    trim: true
  },
  additionalTitle: {
    type: String,
    trim: true
  },
  scopeOfWork: {
    type: String,
    required: true
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
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String
  },
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
projectReferenceSchema.index({ isActive: 1 });
projectReferenceSchema.index({ isPublic: 1 });
projectReferenceSchema.index({ organizationName: 1 });

module.exports = mongoose.model('ProjectReference', projectReferenceSchema);