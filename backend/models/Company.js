const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Eighth Generation Consulting'
  },
  tagline: {
    type: String,
    trim: true,
    default: 'Excellence in Indigenous Business Solutions'
  },
  description: {
    type: String,
    required: true
  },
  founded: {
    type: Date,
    default: new Date('2010-01-01')
  },
  location: {
    type: String,
    default: 'Victoria, BC, Canada'
  },
  website: {
    type: String,
    default: 'https://eighthgen.com'
  },
  email: {
    type: String,
    default: 'info@eighthgen.com'
  },
  phone: {
    type: String,
    default: '+1 (250) 555-0123'
  },
  coreCapabilities: [String],
  certifications: [String],
  industryFocus: [String],
  missionStatement: {
    type: String
  },
  visionStatement: {
    type: String
  },
  values: [String],
  statistics: {
    yearsInBusiness: Number,
    projectsCompleted: Number,
    clientsSatisfied: Number,
    teamMembers: Number
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);