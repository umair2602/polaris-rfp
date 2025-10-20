const mongoose = require("mongoose");

const sharedCompanyInfoSchema = new mongoose.Schema(
  {
    // Shared fields that sync between linked companies
    description: { type: String },
    founded: { type: Date },
    location: { type: String },
    website: { type: String },
    phone: { type: String },
    tagline: { type: String },
    missionStatement: { type: String },
    visionStatement: { type: String },
    values: [String],
    coreCapabilities: [String],
    certifications: [String],
    industryFocus: [String],
    firmQualificationsAndExperience: { type: String },
    coverLetter: { type: String },
    statistics: {
      yearsInBusiness: Number,
      projectsCompleted: Number,
      clientsSatisfied: Number,
      teamMembers: Number,
    },
    socialMedia: {
      linkedin: String,
      twitter: String,
      facebook: String,
    },

    // Track which companies are linked to this shared info
    linkedCompanies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
    ],

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Method to update shared fields and propagate to all linked companies
sharedCompanyInfoSchema.methods.updateAndPropagate = async function (
  updates,
  excludeCompanyId = null
) {
  // Update the shared info
  Object.assign(this, updates);
  this.lastUpdated = new Date();
  await this.save();

  // CRITICAL: Only propagate to companies that are BOTH:
  // 1. In the linkedCompanies array
  // 2. Have THIS sharedInfo._id as their sharedInfo reference
  // This prevents accidental propagation to unrelated companies
  const Company = mongoose.model("Company");
  
  // First, validate that linkedCompanies array is not empty and has valid IDs
  if (!this.linkedCompanies || this.linkedCompanies.length === 0) {
    console.log('[SharedCompany] No linked companies found, skipping propagation');
    return this;
  }

  // Log for debugging
  console.log(`[SharedCompany] Propagating to ${this.linkedCompanies.length} linked companies`);
  console.log(`[SharedCompany] LinkedCompanies IDs:`, this.linkedCompanies.map(id => id.toString()));
  console.log(`[SharedCompany] Excluding company ID:`, excludeCompanyId?.toString());

  // Find ONLY companies that:
  // 1. Are in the linkedCompanies array
  // 2. Have this sharedInfo as their reference (double verification)
  // 3. Are not the company that triggered the update
  const query = {
    _id: { $in: this.linkedCompanies },
    sharedInfo: this._id, // CRITICAL: Must reference THIS SharedCompanyInfo
  };
  
  if (excludeCompanyId) {
    query._id = { $in: this.linkedCompanies, $ne: excludeCompanyId };
  }

  const linkedCompanies = await Company.find(query);

  console.log(`[SharedCompany] Found ${linkedCompanies.length} companies to update:`, 
    linkedCompanies.map(c => `${c.name} (${c.companyId})`));

  // Update each linked company with the shared data
  // Use updateOne to bypass pre-save middleware and prevent infinite loop
  for (const company of linkedCompanies) {
    console.log(`[SharedCompany] Updating company: ${company.name} (${company.companyId})`);
    await Company.updateOne(
      { 
        _id: company._id,
        sharedInfo: this._id // Extra safety check
      },
      { 
        $set: { 
          ...updates, 
          lastUpdated: new Date() 
        } 
      }
    );
  }

  return this;
};

module.exports = mongoose.model("SharedCompanyInfo", sharedCompanyInfoSchema);
