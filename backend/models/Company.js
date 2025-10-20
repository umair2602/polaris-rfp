const mongoose = require("mongoose");

// Forward declaration - will be properly resolved at runtime
// This prevents circular dependency issues
let SharedCompanyInfo;

const companySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `company_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Eighth Generation Consulting",
    },
    tagline: {
      type: String,
      trim: true,
      default: "Excellence in Indigenous Business Solutions",
    },
    description: {
      type: String,
      required: true,
    },
    founded: {
      type: Date,
      default: new Date("2010-01-01"),
    },
    location: {
      type: String,
      default: "Victoria, BC, Canada",
    },
    website: {
      type: String,
      default: "https://eighthgen.com",
    },
    email: {
      type: String,
      default: "info@eighthgen.com",
    },
    phone: {
      type: String,
      default: "+1 (250) 555-0123",
    },
    coreCapabilities: [String],
    certifications: [String],
    industryFocus: [String],
    missionStatement: {
      type: String,
    },
    visionStatement: {
      type: String,
    },
    values: [String],
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
    coverLetter: {
      type: String,
      trim: true,
    },
    firmQualificationsAndExperience: {
      type: String,
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    sharedInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SharedCompanyInfo",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Define shared fields that should sync between linked companies
const SHARED_FIELDS = [
  "description",
  "founded",
  "location",
  "website",
  "phone",
  "tagline",
  "coreCapabilities",
  "certifications",
  "industryFocus",
  "missionStatement",
  "visionStatement",
  "values",
  "statistics",
  "socialMedia",
  "coverLetter",
  "firmQualificationsAndExperience",
];

// Define independent fields that are unique per company
const INDEPENDENT_FIELDS = ["name", "email", "companyId"];

// Pre-save middleware to handle linked company updates
companySchema.pre("save", async function (next) {
  // Skip middleware if this is a propagated update (to prevent infinite loop)
  if (this.$locals && this.$locals.skipPropagation) {
    return next();
  }

  // Only process if this company is linked to shared info
  if (!this.sharedInfo) {
    return next();
  }

  // Check if any shared fields were modified
  const modifiedSharedFields = SHARED_FIELDS.filter((field) =>
    this.isModified(field)
  );

  if (modifiedSharedFields.length === 0) {
    return next();
  }

  try {
    // Lazy load SharedCompanyInfo to avoid circular dependency
    if (!SharedCompanyInfo) {
      SharedCompanyInfo = mongoose.model("SharedCompanyInfo");
    }

    const sharedInfo = await SharedCompanyInfo.findById(this.sharedInfo);

    if (!sharedInfo) {
      return next();
    }

    // Prepare updates for shared info
    const updates = {};
    modifiedSharedFields.forEach((field) => {
      updates[field] = this[field];
    });

    // Update shared info and propagate to other linked companies
    await sharedInfo.updateAndPropagate(updates, this._id);

    next();
  } catch (error) {
    next(error);
  }
});

// Method to dynamically replace company name in text fields
companySchema.methods.replaceCompanyName = function (text, targetCompanyName) {
  if (!text || typeof text !== "string") return text;

  const companyNames = ["Eighth Generation Consulting", "Polaris EcoSystems"];

  // Replace any occurrence of the other company name with this company's name
  let result = text;
  companyNames.forEach((name) => {
    if (name !== targetCompanyName) {
      const regex = new RegExp(name, "gi");
      result = result.replace(regex, targetCompanyName);
    }
  });

  return result;
};

// Method to apply dynamic name replacement to all text fields
companySchema.methods.applyDynamicNaming = function () {
  const textFields = [
    "description",
    "tagline",
    "missionStatement",
    "visionStatement",
    "coverLetter",
    "firmQualificationsAndExperience",
  ];

  textFields.forEach((field) => {
    if (this[field]) {
      this[field] = this.replaceCompanyName(this[field], this.name);
    }
  });

  // Handle array fields
  if (this.values && Array.isArray(this.values)) {
    this.values = this.values.map((value) =>
      this.replaceCompanyName(value, this.name)
    );
  }

  return this;
};

module.exports = mongoose.model("Company", companySchema);
