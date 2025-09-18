const mongoose = require('mongoose')

const pastProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    projectType: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    budget: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    keyOutcomes: [String],
    technologies: [String],
    challenges: [String],
    solutions: [String],
    teamMembers: [String],
    files: [
      {
        name: String,
        path: String,
        type: String,
        description: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    confidentialityLevel: {
      type: String,
      enum: ['public', 'restricted', 'confidential'],
      default: 'public',
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
pastProjectSchema.index({ projectType: 1 })
pastProjectSchema.index({ industry: 1 })
pastProjectSchema.index({ isActive: 1 })
pastProjectSchema.index({ isPublic: 1 })
pastProjectSchema.index({ clientName: 1 })

module.exports = mongoose.model('PastProject', pastProjectSchema)
