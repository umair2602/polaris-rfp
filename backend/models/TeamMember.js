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

module.exports = mongoose.model("TeamMember", teamMemberSchema);
