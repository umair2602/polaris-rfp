const mongoose = require('mongoose')

const canvaConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true,
    },
    accessTokenEnc: { type: String, default: null },
    refreshTokenEnc: { type: String, default: null },
    tokenType: { type: String, default: 'bearer' },
    scopes: { type: [String], default: [] },
    expiresAt: { type: Date, default: null },
    // Optional metadata
    canvaUserId: { type: String, default: null },
  },
  { timestamps: true },
)

module.exports = mongoose.model('CanvaConnection', canvaConnectionSchema)
