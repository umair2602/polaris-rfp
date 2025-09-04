const mongoose = require('mongoose');

const templateSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    default: 'static'
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  },
  placeholders: [{
    key: String,
    description: String,
    defaultValue: String
  }]
}, { _id: true });

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  projectType: {
    type: String,
    required: true,
    enum: ['software_development', 'strategic_communications', 'financial_modeling', 'general']
  },
  sections: [templateSectionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  lastModifiedBy: {
    type: String,
    default: 'system'
  },
  version: {
    type: Number,
    default: 1
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes
templateSchema.index({ projectType: 1 });
templateSchema.index({ isActive: 1 });
templateSchema.index({ name: 1 });

module.exports = mongoose.model('Template', templateSchema);