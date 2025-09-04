const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  roleDescription: {
    type: String,
    required: true
  },
  experienceYears: {
    type: Number,
    required: true
  },
  education: [String],
  certifications: [String],
  specializations: [String],
  responsibilities: [String],
  bio: {
    type: String
  },
  keyProjects: [{
    name: String,
    role: String,
    description: String,
    year: Number
  }],
  skills: [{
    category: String,
    items: [String]
  }],
  email: {
    type: String
  },
  linkedIn: {
    type: String
  },
  profileImage: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  projectTypes: [{
    type: String,
    enum: ['software_development', 'strategic_communications', 'financial_modeling', 'general']
  }]
}, {
  timestamps: true
});

// Indexes
teamMemberSchema.index({ memberId: 1 });
teamMemberSchema.index({ projectTypes: 1 });
teamMemberSchema.index({ isActive: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);