const express = require("express");
const crypto = require("crypto");
const Company = require("../models/Company");
const SharedCompanyInfo = require("../models/SharedCompany");
const TeamMember = require("../models/TeamMember");
const ProjectReference = require("../models/ProjectReference");
const PastProject = require("../models/PastProject");

const router = express.Router();

// Get all companies
router.get("/companies", async (req, res) => {
  try {
    const companies = await Company.find().lean();
    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

// Get company profile (backward compatibility - returns first company)
router.get("/company", async (req, res) => {
  try {
    let profile = await Company.findOne().lean();

    if (!profile) {
      return res.status(404).json({ error: "Company profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching company profile:", error);
    res.status(500).json({ error: "Failed to fetch company profile" });
  }
});

// Get specific company by ID
router.get("/companies/:companyId", async (req, res) => {
  try {
    const company = await Company.findOne({
      companyId: req.params.companyId,
    }).lean();

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ error: "Failed to fetch company" });
  }
});

// Create a new company
router.post("/companies", async (req, res) => {
  try {
    const {
      name,
      tagline,
      description,
      founded,
      location,
      website,
      email,
      phone,
      coreCapabilities = [],
      certifications = [],
      industryFocus = [],
      missionStatement,
      visionStatement,
      values = [],
      statistics = {},
      socialMedia = {},
      coverLetter,
      firmQualificationsAndExperience,
    } = req.body || {};

    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "name and description are required" });
    }

    // IMPORTANT: New companies should NEVER be linked unless explicitly specified
    // This prevents accidental linking of companies
    const newCompany = new Company({
      name,
      tagline,
      description,
      founded: founded ? new Date(founded) : new Date("2010-01-01"),
      location,
      website,
      email,
      phone,
      coreCapabilities,
      certifications,
      industryFocus,
      missionStatement,
      visionStatement,
      values,
      statistics,
      socialMedia,
      coverLetter,
      firmQualificationsAndExperience,
      lastUpdated: new Date(),
      sharedInfo: null, // Explicitly set to null - new companies are independent by default
    });

    await newCompany.save();
    console.log(
      `[Create Company] Created independent company: ${newCompany.name} (${newCompany.companyId})`
    );
    res.status(201).json(newCompany.toObject());
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ error: "Failed to create company" });
  }
});

// Update a specific company
router.put("/companies/:companyId", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.founded && typeof updates.founded === "string") {
      const date = new Date(updates.founded);
      if (!isNaN(date.getTime())) {
        updates.founded = date;
      }
    }
    updates.lastUpdated = new Date();

    // Find the company (not using lean() so we can use middleware)
    const company = await Company.findOne({ companyId: req.params.companyId });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Apply updates
    Object.assign(company, updates);

    // Apply dynamic naming if name-related fields were updated
    if (
      updates.description ||
      updates.coverLetter ||
      updates.firmQualificationsAndExperience
    ) {
      company.applyDynamicNaming();
    }

    // Save (this will trigger pre-save middleware for linked updates)
    await company.save();

    // If this company is linked, fetch all linked companies to return updated data
    let affectedCompanies = [company.toObject()];
    if (company.sharedInfo) {
      const sharedInfo = await SharedCompanyInfo.findById(company.sharedInfo);
      if (
        sharedInfo &&
        sharedInfo.linkedCompanies &&
        sharedInfo.linkedCompanies.length > 1
      ) {
        // ONLY fetch companies that are explicitly in the linkedCompanies array
        // This ensures we only sync the specific linked companies (Eighth Gen + Polaris)
        const linkedCompanies = await Company.find({
          _id: { $in: sharedInfo.linkedCompanies },
        });

        // Verify we're only dealing with the intended linked companies
        // Filter to ensure we only return companies that have the SAME sharedInfo ID
        const verifiedLinkedCompanies = linkedCompanies.filter(
          (c) =>
            c.sharedInfo &&
            c.sharedInfo.toString() === company.sharedInfo.toString()
        );

        affectedCompanies = verifiedLinkedCompanies.map((c) => c.toObject());

        console.log(
          `[Linked Update] Updated ${affectedCompanies.length} companies:`,
          affectedCompanies.map((c) => c.name).join(", ")
        );
      }
    }

    res.json({
      company: company.toObject(),
      affectedCompanies: affectedCompanies,
    });
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
});

// Delete a company
router.delete("/companies/:companyId", async (req, res) => {
  try {
    const deleted = await Company.findOneAndDelete({
      companyId: req.params.companyId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ error: "Failed to delete company" });
  }
});

// Update or create company profile (backward compatibility)
router.put("/company", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.founded && typeof updates.founded === "string") {
      const date = new Date(updates.founded);
      if (!isNaN(date.getTime())) {
        updates.founded = date;
      }
    }
    updates.lastUpdated = new Date();

    let profile = await Company.findOne();
    if (!profile) {
      profile = new Company(updates);
      await profile.save();
      return res.status(201).json(profile.toObject());
    }

    Object.assign(profile, updates);
    await profile.save();
    return res.json(profile.toObject());
  } catch (error) {
    console.error("Error updating company profile:", error);
    res.status(500).json({ error: "Failed to update company profile" });
  }
});

// Get all team members
router.get("/team", async (req, res) => {
  try {
    let teamMembers = await TeamMember.find({ isActive: true }).lean();

    res.json(teamMembers);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// Create a team member
router.post("/team", async (req, res) => {
  try {
    const { memberId, nameWithCredentials, position, email, biography } =
      req.body || {};

    if (!nameWithCredentials || !position || !biography) {
      return res
        .status(400)
        .json({
          error: "nameWithCredentials, position, and biography are required",
        });
    }

    // Generate a more unique memberId
    let uniqueMemberId = memberId;
    let attempts = 0;
    const maxAttempts = 5;

    // If no memberId provided, generate one
    while (!uniqueMemberId && attempts < maxAttempts) {
      const timestamp = Date.now();
      const randomHex = crypto.randomBytes(8).toString("hex"); // Increased from 6 to 8 bytes
      const candidateId = `member_${timestamp}_${randomHex}`;

      // Check if this memberId already exists
      const existingMember = await TeamMember.findOne({
        memberId: candidateId,
      });
      if (!existingMember) {
        uniqueMemberId = candidateId;
        break;
      }
      attempts++;

      // Add small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));
    }

    if (!uniqueMemberId) {
      // Fallback: use ObjectId as string
      const mongoose = require("mongoose");
      uniqueMemberId = `member_${new mongoose.Types.ObjectId().toString()}`;
    }

    const newMember = new TeamMember({
      memberId: uniqueMemberId,
      nameWithCredentials,
      position,
      email,
      biography,
      isActive: true,
    });

    try {
      await newMember.save();
      res.status(201).json(newMember.toObject());
    } catch (saveError) {
      // If still getting duplicate key error, it might be due to existing bad data
      if (saveError.code === 11000) {
        console.log(`Duplicate key error for memberId: ${uniqueMemberId}`);

        // Try one more time with ObjectId-based approach
        const mongoose = require("mongoose");
        const fallbackId = `member_${Date.now()}_${new mongoose.Types.ObjectId().toString()}`;

        const fallbackMember = new TeamMember({
          memberId: fallbackId,
          nameWithCredentials,
          position,
          email,
          biography,
          isActive: true,
        });

        await fallbackMember.save();
        res.status(201).json(fallbackMember.toObject());
      } else {
        throw saveError;
      }
    }
  } catch (error) {
    console.error("Error creating team member:", error);
    res.status(500).json({ error: "Failed to create team member" });
  }
});

// Get specific team member
router.get("/team/:memberId", async (req, res) => {
  try {
    const member = await TeamMember.findOne({
      memberId: req.params.memberId,
      isActive: true,
    }).lean();
    if (!member) {
      return res.status(404).json({ error: "Team member not found" });
    }
    res.json(member);
  } catch (error) {
    console.error("Error fetching team member:", error);
    res.status(500).json({ error: "Failed to fetch team member" });
  }
});

// Update a team member
router.put("/team/:memberId", async (req, res) => {
  try {
    const { nameWithCredentials, position, email, biography } = req.body;

    if (!nameWithCredentials || !position || !biography) {
      return res
        .status(400)
        .json({
          error: "nameWithCredentials, position, and biography are required",
        });
    }

    const updates = {
      nameWithCredentials,
      position,
      email,
      biography,
    };

    const updated = await TeamMember.findOneAndUpdate(
      { memberId: req.params.memberId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Team member not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating team member:", error);
    res.status(500).json({ error: "Failed to update team member" });
  }
});

// Soft-delete a team member
router.delete("/team/:memberId", async (req, res) => {
  try {
    const updated = await TeamMember.findOneAndUpdate(
      { memberId: req.params.memberId },
      { $set: { isActive: false } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Team member not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting team member:", error);
    res.status(500).json({ error: "Failed to delete team member" });
  }
});

// Get past projects
router.get("/projects", async (req, res) => {
  try {
    const { project_type, industry, count = 20 } = req.query;

    let query = { isActive: true, isPublic: true };
    if (project_type) {
      query.projectType = project_type;
    }
    if (industry) {
      query.industry = industry;
    }

    let projects = await PastProject.find(query)
      .limit(parseInt(count))
      .sort({ createdAt: -1 })
      .lean();

    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Create a past project
router.post("/projects", async (req, res) => {
  try {
    const {
      title,
      clientName,
      description,
      industry,
      projectType,
      duration,
      budget,
      startDate,
      completionDate,
      keyOutcomes = [],
      technologies = [],
      challenges = [],
      solutions = [],
      teamMembers = [],
      files = [],
      confidentialityLevel,
      isPublic = true,
    } = req.body || {};

    if (
      !title ||
      !clientName ||
      !description ||
      !industry ||
      !projectType ||
      !duration
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const project = new PastProject({
      title,
      clientName,
      description,
      industry,
      projectType,
      duration,
      budget,
      startDate,
      completionDate,
      keyOutcomes,
      technologies,
      challenges,
      solutions,
      teamMembers,
      files,
      confidentialityLevel,
      isPublic,
      isActive: true,
    });

    await project.save();
    return res.status(201).json(project.toObject());
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update a past project
router.put("/projects/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    const updated = await PastProject.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Project not found" });
    }
    return res.json(updated);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Soft-delete a past project
router.delete("/projects/:id", async (req, res) => {
  try {
    const updated = await PastProject.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Project not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Get project references
router.get("/references", async (req, res) => {
  try {
    const { project_type, count = 10 } = req.query;

    let query = { isActive: true, isPublic: true };
    if (project_type) {
      query.projectType = project_type;
    }

    let references = await ProjectReference.find(query)
      .limit(parseInt(count))
      .lean();

    res.json(references);
  } catch (error) {
    console.error("Error fetching references:", error);
    res.status(500).json({ error: "Failed to fetch references" });
  }
});

// Create a project reference
router.post("/references", async (req, res) => {
  try {
    const {
      organizationName,
      timePeriod,
      contactName,
      contactTitle,
      additionalTitle,
      scopeOfWork,
      contactEmail,
      contactPhone,
      isPublic = true,
      attachments = [],
    } = req.body || {};

    if (!organizationName || !contactName || !contactEmail || !scopeOfWork) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const reference = new ProjectReference({
      organizationName,
      timePeriod,
      contactName,
      contactTitle,
      additionalTitle,
      scopeOfWork,
      contactEmail,
      contactPhone,
      isPublic: Boolean(isPublic),
      attachments,
      isActive: true,
    });

    await reference.save();
    return res.status(201).json(reference.toObject());
  } catch (error) {
    console.error("Error creating reference:", error);
    res.status(500).json({ error: "Failed to create reference" });
  }
});

// Update a project reference
router.put("/references/:id", async (req, res) => {
  try {
    const {
      organizationName,
      timePeriod,
      contactName,
      contactTitle,
      additionalTitle,
      scopeOfWork,
      contactEmail,
      contactPhone,
      isPublic,
      attachments,
    } = req.body;

    // Validate required fields
    if (!organizationName || !contactName || !contactEmail || !scopeOfWork) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updates = {
      organizationName,
      timePeriod,
      contactName,
      contactTitle,
      additionalTitle,
      scopeOfWork,
      contactEmail,
      contactPhone,
      isPublic: Boolean(isPublic),
      attachments,
    };

    const updated = await ProjectReference.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Reference not found" });
    }
    return res.json(updated);
  } catch (error) {
    console.error("Error updating reference:", error);
    res.status(500).json({ error: "Failed to update reference" });
  }
});

// Soft-delete a project reference
router.delete("/references/:id", async (req, res) => {
  try {
    const updated = await ProjectReference.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Reference not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting reference:", error);
    res.status(500).json({ error: "Failed to delete reference" });
  }
});

module.exports = router;
