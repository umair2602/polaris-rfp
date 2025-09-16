const express = require("express");
const Proposal = require("../models/Proposal");
const RFP = require("../models/RFP");
const PDFDocument = require("pdfkit");
const path = require("path");
const router = express.Router();

// Generate new proposal
router.post("/generate", async (req, res) => {
  try {
    const { rfpId, templateId, title, customContent = {} } = req.body;

    // Validate required fields
    if (!rfpId || !templateId || !title) {
      return res.status(400).json({
        error: "Missing required fields: rfpId, templateId, title",
      });
    }

    // Get RFP data
    const rfp = await RFP.findById(rfpId);
    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    // Generate proposal sections (simplified for now)
    const sections = generateProposalSections(rfp, templateId, customContent);

    // Create proposal
    const proposal = new Proposal({
      rfpId,
      templateId,
      title,
      sections,
      customContent,
      lastModifiedBy: "system",
    });

    await proposal.save();
    await proposal.populate("rfpId", "title clientName projectType");

    console.log("Proposal generated successfully:", proposal._id);
    res.status(201).json(proposal);
  } catch (error) {
    console.error("Error generating proposal:", error);
    res.status(500).json({
      error: "Failed to generate proposal",
      message: error.message,
    });
  }
});

// Get all proposals
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const proposals = await Proposal.find()
      .populate("rfpId", "title clientName projectType")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-sections"); // Exclude large sections data

    const total = await Proposal.countDocuments();

    res.json({
      data: proposals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
});

// Get single proposal
router.get("/:id", async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate(
      "rfpId",
      "title clientName projectType keyRequirements deliverables"
    );

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    res.json(proposal);
  } catch (error) {
    console.error("Error fetching proposal:", error);
    res.status(500).json({ error: "Failed to fetch proposal" });
  }
});

// Update proposal
router.put("/:id", async (req, res) => {
  try {
    const allowedUpdates = [
      "title",
      "status",
      "sections",
      "customContent",
      "budgetBreakdown",
      "timelineDetails",
      "teamAssignments",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.lastModifiedBy = "system";

    const proposal = await Proposal.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("rfpId", "title clientName projectType");

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    res.json(proposal);
  } catch (error) {
    console.error("Error updating proposal:", error);
    res.status(500).json({ error: "Failed to update proposal" });
  }
});

// Delete proposal
router.delete("/:id", async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndDelete(req.params.id);

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    res.json({ message: "Proposal deleted successfully" });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    res.status(500).json({ error: "Failed to delete proposal" });
  }
});

// Export proposal as JSON (PDF generation would be added later)
router.get("/:id/export", async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate(
      "rfpId",
      "title clientName projectType"
    );

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    const exportData = {
      proposal: {
        title: proposal.title,
        status: proposal.status,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
      },
      rfp: {
        title: proposal.rfpId.title,
        clientName: proposal.rfpId.clientName,
        projectType: proposal.rfpId.projectType,
      },
      sections: proposal.sections,
      metadata: {
        exportedAt: new Date(),
        exportedBy: "system",
        version: proposal.version,
      },
    };

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${proposal.title.replace(/\s+/g, "_")}.json"`
    );
    res.setHeader("Content-Type", "application/json");
    res.json(exportData);
  } catch (error) {
    console.error("Error exporting proposal:", error);
    res.status(500).json({ error: "Failed to export proposal" });
  }
});

router.get("/:id/export-pdf", async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate(
      "rfpId",
      "title clientName projectType keyRequirements deliverables"
    );

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${proposal.title.replace(/\s+/g, "_")}.pdf"`
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // ---------------- LOGO CONFIGURATION ----------------
    let logoConfig = null;
    try {
      // Define logo paths - you'll need to add these files to the backend/public/logos/ directory
      const eighthGenLogoPath = path.join(
        __dirname,
        "../public/logos/Picture 1.png"
      );
      const villageLogoPath = path.join(
        __dirname,
        "../public/logos/Picture 2.jpg"
      );

      logoConfig = {
        eighthGenLogoPath,
        villageLogoPath,
        logoHeight: 60,
        logoSpacing: 40,
        logoY: 10,
      };
    } catch (logoError) {
      console.warn("Could not load logo paths:", logoError.message);
    }

    // Function to add header logos to any page
    const addHeaderLogos = () => {
      if (!logoConfig) return;

      try {
        const pageWidth =
          doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const logoWidth = (pageWidth - logoConfig.logoSpacing) / 2;
        const logoY = doc.page.margins.top + logoConfig.logoY;

        // Eighth Generation Consulting logo (left side)
        doc.image(logoConfig.eighthGenLogoPath, doc.page.margins.left, logoY, {
          width: logoWidth,
          height: logoConfig.logoHeight,
          fit: [logoWidth, logoConfig.logoHeight],
          align: "left",
        });

        // Village of Richfield logo (right side)
        doc.image(
          logoConfig.villageLogoPath,
          doc.page.margins.left + logoWidth + logoConfig.logoSpacing,
          logoY,
          {
            width: logoWidth,
            height: logoConfig.logoHeight,
            fit: [logoWidth, logoConfig.logoHeight],
            align: "right",
          }
        );

        // Set the Y position after logos
        doc.y = logoY + logoConfig.logoHeight + 20;
      } catch (logoError) {
        console.warn("Could not render logos:", logoError.message);
      }
    };

    // Add page event handler to add headers to all pages
    doc.on("pageAdded", () => {
      addHeaderLogos();
    });

    // Add header to first page
    addHeaderLogos();

    // ---------------- COVER PAGE ----------------
    doc
      .fontSize(24)
      .fillColor("#1a202c")
      .text(proposal.title, { align: "center" });

    doc.moveDown(2);

    doc
      .fontSize(12)
      .fillColor("#4a5568")
      .text(`Submitted to: ${proposal.rfpId?.clientName || "Unknown Client"}`, {
        align: "center",
      });

    doc.moveDown(0.5);
    doc.text(`Project Type: ${proposal.rfpId?.projectType || "N/A"}`, {
      align: "center",
    });

    doc.moveDown(0.5);
    doc.text(`Status: ${proposal.status || "Draft"}`, { align: "center" });

    doc.moveDown(2);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: "center" });

    doc.addPage();

    // ---------------- SECTIONS ----------------
    Object.entries(proposal.sections || {}).forEach(
      ([sectionName, sectionData]) => {
        // Section title
        doc.fontSize(16).fillColor("#1E4E9E").text(sectionName);

        doc.moveDown(0.5);

        // Section content
        if (sectionData.content && sectionData.content.includes("|")) {
          renderTable(doc, sectionData.content);
        } else {
          doc
            .fontSize(11)
            .fillColor("#000000")
            .text(sectionData.content || "No content available", {
              align: "justify",
              lineGap: 6,
            });
        }

        doc.moveDown(1.5);
      }
    );

    // ---------------- FOOTER ----------------
    doc
      .fontSize(10)
      .fillColor("gray")
      .text(
        "Generated by Proposal Management System • Confidential",
        50,
        doc.page.height - 50,
        {
          align: "center",
        }
      );

    // End the PDF generation
    doc.end();
  } catch (error) {
    console.error("Error exporting proposal as PDF:", error);
    res.status(500).json({ error: "Failed to export proposal PDF" });
  }
});

function renderTable(doc, content) {
  const rows = content
    .split("\n")
    .filter((line) => line.includes("|") && !line.match(/^-+$/));

  if (rows.length < 2) {
    doc.text(content);
    return;
  }

  const headers = rows[0]
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  const dataRows = rows.slice(1).map((row) =>
    row
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean)
  );

  const tableTop = doc.y;
  const cellPadding = 6;
  const rowHeight = 20;
  const colWidth =
    (doc.page.width - doc.page.margins.left - doc.page.margins.right) /
    headers.length;

  // Header row
  headers.forEach((header, i) => {
    doc
      .rect(doc.page.margins.left + i * colWidth, tableTop, colWidth, rowHeight)
      .fillAndStroke("#f7fafc", "#e2e8f0");

    doc
      .fontSize(11)
      .fillColor("#2d3748")
      .text(
        header,
        doc.page.margins.left + i * colWidth + cellPadding,
        tableTop + 6,
        {
          width: colWidth - 2 * cellPadding,
          align: "left",
        }
      );
  });

  // Data rows
  dataRows.forEach((row, rowIndex) => {
    const y = tableTop + (rowIndex + 1) * rowHeight;

    row.forEach((cell, i) => {
      doc
        .rect(doc.page.margins.left + i * colWidth, y, colWidth, rowHeight)
        .stroke();

      doc
        .fontSize(11)
        .fillColor("#1a202c")
        .text(cell, doc.page.margins.left + i * colWidth + cellPadding, y + 6, {
          width: colWidth - 2 * cellPadding,
          align: "left",
        });
    });
  });

  doc.moveDown(2);
}

// Helper function to generate proposal sections
function generateProposalSections(rfp, templateId, customContent) {
  const contentLibrary = require("../services/contentLibrary");

  const sections = {};

  // Generate Executive Summary
  sections["Executive Summary"] = {
    content: generateExecutiveSummary(rfp, contentLibrary),
    type: "generated",
    lastModified: new Date(),
  };

  // Generate Technical Approach (for software development)
  if (rfp.projectType === "software_development") {
    sections["Technical Approach & Methodology"] = {
      content: generateTechnicalApproach(rfp),
      type: "generated",
      lastModified: new Date(),
    };
  }

  // Generate Team Section
  sections["Key Personnel and Experience"] = {
    content: generateTeamSection(rfp.projectType, contentLibrary),
    type: "generated",
    lastModified: new Date(),
  };

  // Generate Budget Section
  sections["Budget Estimate"] = {
    content: generateBudgetSection(rfp),
    type: "generated",
    lastModified: new Date(),
  };

  // Generate Timeline
  sections["Project Timeline"] = {
    content: generateTimelineSection(rfp),
    type: "generated",
    lastModified: new Date(),
  };

  // Generate References
  sections["References"] = {
    content: generateReferencesSection(rfp.projectType, contentLibrary),
    type: "generated",
    lastModified: new Date(),
  };

  // Apply custom content overrides
  Object.keys(customContent).forEach((sectionName) => {
    if (sections[sectionName]) {
      sections[sectionName].content = customContent[sectionName];
      sections[sectionName].type = "custom";
      sections[sectionName].lastModified = new Date();
    }
  });

  return sections;
}

function generateExecutiveSummary(rfp, contentLibrary) {
  const companyIntro = contentLibrary.generateCompanyIntroduction(
    rfp.projectType
  );

  return `${companyIntro}

We understand that ${rfp.clientName} seeks a qualified partner for ${
    rfp.title
  }. Our proven expertise in ${rfp.projectType.replace(
    "_",
    " "
  )} positions us uniquely to deliver exceptional results for your organization.

Key project requirements include:
${
  rfp.keyRequirements
    ?.slice(0, 5)
    .map((req) => `• ${req}`)
    .join("\n") || "• Requirements to be refined during discovery phase"
}

Our approach combines technical excellence with cultural sensitivity, ensuring solutions that are both innovative and appropriate for your organization's needs. We are committed to delivering exceptional value and look forward to partnering with ${
    rfp.clientName
  } on this important initiative.`;
}

function generateTechnicalApproach(rfp) {
  return `Our technical approach follows industry best practices while being tailored to your specific requirements:

**Project Initiation & Planning**
We begin with comprehensive stakeholder discovery and requirements analysis, conducting structured workshops to understand your vision, constraints, and success criteria.

**Technical Architecture**
Our architecture prioritizes scalability, security, and maintainability, employing modern patterns including microservices architecture, API-first design, and cloud-native infrastructure.

**Development Methodology**
We follow an iterative Agile development approach with regular client feedback cycles, including sprint-based development with 2-week iterations and continuous integration.

**Quality Assurance**
Comprehensive QA includes automated testing, user acceptance testing with stakeholder participation, and security vulnerability scanning.

**Deployment & Support**
Our deployment strategy minimizes risk with staged environments and includes ongoing maintenance, monitoring, and optimization services.`;
}

function generateTeamSection(projectType, contentLibrary) {
  const relevantRoles = {
    software_development: ["saxon_metzger", "wesley_ladd", "technical_lead"],
    strategic_communications: ["saxon_metzger", "communications_lead"],
    financial_modeling: ["saxon_metzger"],
    general: ["saxon_metzger"],
  };

  const roles = relevantRoles[projectType] || relevantRoles.general;
  const teamMembers = contentLibrary.getTeamMembersByRoles(roles);

  return teamMembers
    .map(
      (member) => `
**${member.name}**, ${member.title}
${member.roleDescription}

*Experience:* ${member.experienceYears}+ years
*Education:* ${member.education.join(", ")}
*Certifications:* ${member.certifications.join(", ")}
*Key Responsibilities:* ${member.responsibilities.slice(0, 4).join(", ")}
`
    )
    .join("\n");
}

function generateBudgetSection(rfp) {
  const phases = [
    { name: "Discovery & Planning", cost: 15000, percentage: 15 },
    { name: "Design & Architecture", cost: 25000, percentage: 25 },
    { name: "Development & Implementation", cost: 40000, percentage: 40 },
    { name: "Testing & Quality Assurance", cost: 10000, percentage: 10 },
    { name: "Deployment & Training", cost: 10000, percentage: 10 },
  ];

  const total = phases.reduce((sum, phase) => sum + phase.cost, 0);

  let budgetContent = `**Project Investment Breakdown**\n\n`;
  budgetContent += `| Phase | Investment | % of Total |\n`;
  budgetContent += `|-------|------------|------------|\n`;

  phases.forEach((phase) => {
    budgetContent += `| ${phase.name} | $${phase.cost.toLocaleString()} | ${
      phase.percentage
    }% |\n`;
  });

  budgetContent += `| **TOTAL PROJECT INVESTMENT** | **$${total.toLocaleString()}** | **100%** |\n\n`;
  budgetContent += `This investment covers all aspects of the project including planning, development, testing, deployment, and initial support.`;

  return budgetContent;
}

function generateTimelineSection(rfp) {
  const phases = [
    { name: "Discovery & Planning", weeks: 3 },
    { name: "Design & Architecture", weeks: 4 },
    { name: "Development Phase 1", weeks: 4 },
    { name: "Development Phase 2", weeks: 4 },
    { name: "Testing & QA", weeks: 3 },
    { name: "Deployment & Training", weeks: 2 },
  ];

  let timelineContent = `**Project Timeline**\n\n`;
  timelineContent += `| Phase | Duration | Key Deliverables |\n`;
  timelineContent += `|-------|----------|------------------|\n`;

  let currentWeek = 0;
  phases.forEach((phase) => {
    const startWeek = currentWeek + 1;
    const endWeek = currentWeek + phase.weeks;
    timelineContent += `| Weeks ${startWeek}-${endWeek} | ${phase.name} | Key milestones and deliverables |\n`;
    currentWeek = endWeek;
  });

  const totalWeeks = phases.reduce((sum, phase) => sum + phase.weeks, 0);
  timelineContent += `\n**Total Project Duration:** ${totalWeeks} weeks\n`;
  timelineContent += `**Estimated Completion:** ${Math.ceil(
    totalWeeks / 4
  )} months from project start`;

  return timelineContent;
}

function generateReferencesSection(projectType, contentLibrary) {
  const references = contentLibrary.getProjectReferences(projectType, 3);

  return references
    .map(
      (ref) => `
**${ref.clientName}**
*Project:* ${ref.projectScope}
*Contact:* ${ref.contactPerson} (${ref.contactEmail})
*Value:* ${ref.projectValue} | *Duration:* ${ref.duration}

*Key Outcomes:*
${ref.outcomes.map((outcome) => `• ${outcome}`).join("\n")}

*"${ref.testimonial}"*
`
    )
    .join("\n");
}

module.exports = router;
