const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      unique: true,
    },
    nameWithCredentials: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    companyId: {
      type: String,
      default: null,
      trim: true,
    },
    biography: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (memberId already has unique index from schema definition)
teamMemberSchema.index({ isActive: 1 });
teamMemberSchema.index({ nameWithCredentials: 1 });
teamMemberSchema.index({ companyId: 1 });

// Virtual populate for company details
teamMemberSchema.virtual("company", {
  ref: "Company",
  localField: "companyId",
  foreignField: "companyId",
  justOne: true,
});

// Ensure virtuals are included when converting to JSON
teamMemberSchema.set("toJSON", { virtuals: true });
teamMemberSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("TeamMember", teamMemberSchema);
