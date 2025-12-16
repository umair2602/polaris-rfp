const mongoose = require('mongoose')

const proposalSchema = new mongoose.Schema(
  {
    rfpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RFP',
      required: true,
    },
    companyId: {
      type: String,
      trim: true,
      default: null,
    },
    templateId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'submitted', 'won', 'lost'],
      default: 'draft',
    },
    sections: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    customContent: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    budgetBreakdown: {
      type: mongoose.Schema.Types.Mixed,
    },
    timelineDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    teamAssignments: [
      {
        memberId: String,
        role: String,
        responsibilities: [String],
      },
    ],
    review: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
      decision: {
        type: String,
        trim: true,
        enum: ['', 'shortlist', 'reject'],
        default: '',
      },
      notes: {
        type: String,
        default: '',
      },
      rubric: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
    version: {
      type: Number,
      default: 1,
    },
    lastModifiedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
proposalSchema.index({ rfpId: 1 })
proposalSchema.index({ status: 1 })
proposalSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Proposal', proposalSchema)
