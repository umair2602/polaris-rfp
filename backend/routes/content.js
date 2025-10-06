const express = require("express");
const Company = require("../models/Company");
const TeamMember = require("../models/TeamMember");
const ProjectReference = require("../models/ProjectReference");
const PastProject = require("../models/PastProject");

const router = express.Router();

// Get company profile
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

// Update or create company profile
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
    const {
      memberId,
      name,
      title,
      roleDescription,
      experienceYears,
      education = [],
      certifications = [],
      specializations = [],
      responsibilities = [],
      bio,
      keyProjects = [],
      skills = [],
      email,
      linkedIn,
      profileImage,
      projectTypes = [],
    } = req.body || {};

    if (!name || !title) {
      return res.status(400).json({ error: "name and title are required" });
    }

    const newMember = new TeamMember({
      memberId:
        memberId || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      title,
      roleDescription: roleDescription || title,
      experienceYears: Number(experienceYears || 0),
      education,
      certifications,
      specializations,
      responsibilities,
      bio,
      keyProjects,
      skills,
      email,
      linkedIn,
      profileImage,
      isActive: true,
      projectTypes,
    });

    await newMember.save();
    res.status(201).json(newMember.toObject());
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
    const updates = { ...req.body };
    if (updates.experienceYears !== undefined) {
      updates.experienceYears = Number(updates.experienceYears);
    }
    if (updates.roleDescription === undefined && updates.title) {
      updates.roleDescription = updates.title;
    }

    const updated = await TeamMember.findOneAndUpdate(
      { memberId: req.params.memberId },
      { $set: updates },
      { new: true }
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
      clientName,
      contactPerson,
      contactEmail,
      contactPhone,
      projectTypes,
      projectType,
      projectName,
      projectScope,
      projectValue,
      duration,
      relationshipYears,
      testimonial,
      isPublic = true,
      attachments = [],
    } = req.body || {};

    if (!clientName || !contactPerson || !contactEmail || !testimonial) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const reference = new ProjectReference({
      clientName,
      contactPerson,
      contactEmail,
      contactPhone,
      projectType:
        projectType ||
        (Array.isArray(projectTypes) ? projectTypes[0] : undefined) ||
        "general",
      projectName: projectName || `${clientName} Reference`,
      projectScope: projectScope || testimonial?.slice(0, 200) || "",
      projectValue,
      duration:
        duration ||
        (relationshipYears ? `${relationshipYears} years` : undefined),
      testimonial,
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
    const updates = { ...req.body };
    if (
      updates.projectTypes &&
      !updates.projectType &&
      Array.isArray(updates.projectTypes)
    ) {
      updates.projectType = updates.projectTypes[0];
    }
    const updated = await ProjectReference.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
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
