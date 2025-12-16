const mongoose = require('mongoose')

const canvaCompanyTemplateSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      trim: true,
      required: true,
      index: true,
      unique: true,
    },
    brandTemplateId: { type: String, trim: true, required: true },
    // Field mapping: { [datasetKey]: { kind: 'source'|'literal'|'asset', source?: string, value?: string, assetId?: string } }
    fieldMapping: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

module.exports = mongoose.model(
  'CanvaCompanyTemplate',
  canvaCompanyTemplateSchema,
)
