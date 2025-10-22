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
  questionsDeadline: {
    type: String,
    trim: true
  },
  bidMeetingDate: {
    type: String,
    trim: true
  },

  bidRegistrationDate: {
    type: String,
    trim: true
  },
  isDisqualified: {
    type: Boolean,
    default: false
  },
  budgetRange: {
    type: String,
    trim: true
  },
  projectType: {
    type: String,
    required: true,
    trim: true
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

// Simple method to check if any deadline has passed
rfpSchema.methods.checkDisqualification = function() {
  const now = new Date();
  const deadlines = [this.submissionDeadline, this.questionsDeadline, this.bidMeetingDate, this.bidRegistrationDate];
  
  for (const deadline of deadlines) {
    if (deadline && new Date(deadline) < now) {
      this.isDisqualified = true;
      return true;
    }
  }
  
  this.isDisqualified = false;
  return false;
};

// Pre-save hook to automatically check disqualification
rfpSchema.pre('save', function(next) {
  this.checkDisqualification();
  next();
});

// Indexes
rfpSchema.index({ projectType: 1 });
rfpSchema.index({ clientName: 1 });
rfpSchema.index({ createdAt: -1 });
rfpSchema.index({ isDisqualified: 1 });

module.exports = mongoose.model('RFP', rfpSchema);