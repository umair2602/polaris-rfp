const mongoose = require('mongoose')

// Stores a mapping between an app object (company/team member/etc) and a Canva asset_id.
const canvaAssetLinkSchema = new mongoose.Schema(
  {
    ownerType: {
      type: String,
      enum: ['company', 'teamMember'],
      required: true,
      index: true,
    },
    ownerId: { type: String, trim: true, required: true, index: true },
    kind: {
      type: String,
      enum: ['logo', 'headshot', 'generic'],
      default: 'generic',
      index: true,
    },
    assetId: { type: String, trim: true, required: true },
    name: { type: String, trim: true, default: '' },
    sourceUrl: { type: String, trim: true, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

canvaAssetLinkSchema.index(
  { ownerType: 1, ownerId: 1, kind: 1 },
  { unique: true },
)

module.exports = mongoose.model('CanvaAssetLink', canvaAssetLinkSchema)
