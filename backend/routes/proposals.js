const express = require("express");
const Proposal = require("../models/Proposal");
const RFP = require("../models/RFP");
const Company = require("../models/Company");
const PDFDocument = require("pdfkit");
const path = require("path");
const { generateAIProposalSections } = require("../services/aiProposalGenerator");
const router = express.Router();

// Generate new proposal with AI
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

    // Generate proposal sections using AI
    const sections = await generateAIProposalSections(rfp, templateId, customContent);

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

    res.status(201).json(proposal);
  } catch (error) {
    console.error("Error generating proposal:", error);
    res.status(500).json({
      error: "Failed to generate proposal",
      message: error.message,
    });
  }
});

// Generate proposal sections using AI
router.post("/:id/generate-sections", async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate(
      "rfpId",
      "title clientName projectType keyRequirements deliverables budgetRange submissionDeadline location contactInformation rawText"
    );

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    if (!openai) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    // Generate AI sections
    const sections = await generateAIProposalSections(proposal.rfpId, proposal.templateId, {});

    // Update proposal with new sections
    proposal.sections = sections;
    proposal.lastModifiedBy = "ai-generation";
    await proposal.save();

    res.json({ 
      message: "Sections generated successfully", 
      sections: sections,
      proposal: proposal 
    });
  } catch (error) {
    console.error("Error generating AI sections:", error);
    res.status(500).json({
      error: "Failed to generate AI sections",
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
      "title clientName projectType keyRequirements deliverables budgetRange submissionDeadline location contactInformation"
    );

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    // Get company information
    const company = await Company.findOne().sort({ createdAt: -1 });


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
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const logoWidth = 80; // Fixed width for corner logos
        const logoHeight = 60; // Fixed height for corner logos
        const logoY = 20; // Position from top of page
        const logoSpacing = 20; // Space from page edges

        // Village of Richfield logo (top-left corner) - stick to left edge
        doc.image(logoConfig.villageLogoPath, logoSpacing, logoY, {
          width: logoWidth,
          height: logoHeight,
          fit: [logoWidth, logoHeight],
          align: "left",
        });

        // Eighth Generation Consulting logo (top-right corner) - stick to right edge
        doc.image(
          logoConfig.eighthGenLogoPath,
          doc.page.width - logoWidth - logoSpacing,
          logoY,
          {
            width: logoWidth,
            height: logoHeight,
            fit: [logoWidth, logoHeight],
            align: "right",
          }
        );

        // Set the Y position after logos
        doc.y = logoY + logoHeight + 30;
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

    // ---------------- TITLE PAGE ----------------
    // Title
    if (proposal.title) {
      doc
        .fontSize(24)
        .fillColor("#1a202c")
        .text(proposal.title, { align: "center" });
      doc.moveDown(4);
    }

    // Submitted by section - only show if company name exists
    if (company?.name) {
      doc
        .fontSize(14)
        .fillColor("#1a202c")
        .text(`Submitted by: ${company.name}`, { align: "center" });

      doc.moveDown(1.5);
    }

    // Contact details - using actual company data
    if (company) {
      // Contact person - using a default since it's not in the company data
      doc
        .fontSize(12)
        .fillColor("#4a5568")
        .text("Jose P, President", { align: "center" });
      doc.moveDown(0.5);

      if (company.email) {
        doc
          .fontSize(12)
          .fillColor("#4a5568")
          .text(company.email, { align: "center" });
        doc.moveDown(0.5);
      }

      if (company.phone) {
        doc
          .fontSize(12)
          .fillColor("#4a5568")
          .text(company.phone, { align: "center" });
        doc.moveDown(0.5);
      }
    }

    // Additional proposal information
    doc.moveDown(1);

    // Submitted to information
    if (proposal.rfpId?.clientName) {
      doc
        .fontSize(12)
        .fillColor("#4a5568")
        .text(`Submitted to: ${proposal.rfpId.clientName}`, {
          align: "center",
        });
      doc.moveDown(0.5);
    }

    // Project type
    if (proposal.rfpId?.projectType) {
      doc
        .fontSize(12)
        .fillColor("#4a5568")
        .text(
          `Project Type: ${proposal.rfpId.projectType
            .replace(/_/g, " ")
            .toUpperCase()}`,
          { align: "center" }
        );
      doc.moveDown(0.5);
    }

    // Submission deadline
    if (proposal.rfpId?.submissionDeadline) {
      doc
        .fontSize(12)
        .fillColor("#4a5568")
        .text(`Submission Deadline: ${proposal.rfpId.submissionDeadline}`, {
          align: "center",
        });
      doc.moveDown(0.5);
    }

    // Location
    if (proposal.rfpId?.location) {
      doc
        .fontSize(12)
        .fillColor("#4a5568")
        .text(`Location: ${proposal.rfpId.location}`, {
          align: "center",
        });
      doc.moveDown(0.5);
    }

    // Add a new page for the hardcoded cover letter
    doc.addPage();

    // ---------------- HARDCODED COVER LETTER PAGE ----------------
    // This page is hardcoded exactly as shown in the image with only 4 dynamic fields
    doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("Zoning Code Update and Comprehensive Land Use Plan", { align: "center" });
    doc.moveDown(2);
    // Submitted to - dynamic
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Submitted to:", { align: "left" });
    doc.moveDown(1);
    
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(proposal.rfpId?.clientName || "Town of Amherst", { align: "left" });
    doc.moveDown(2);

    // Submitted by - dynamic
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Submitted by:", { align: "left" });
    doc.moveDown(1);
    
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(company?.name || "Eighth Generation Consulting", { align: "left" });
    doc.moveDown(2);

    // Date - hardcoded
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text("09/16/2025", { align: "left" });
    doc.moveDown(2);

    // Title - hardcoded


    // Salutation - hardcoded
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text("Dear Town Board and Planning Commission,", { align: "left" });
    doc.moveDown(1.5);

    // Body paragraphs - all hardcoded exactly as in the image
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text("On behalf of Eighth Generation Consulting, we are pleased to submit our proposal to partner with Town of Amherst on the development of a Comprehensive Land Use Plan and a complete Zoning Code Update. We recognize that this is a once-in-a-generation opportunity to modernize the Township's planning framework, protect its rural and agricultural character, and create a legally defensible, community-driven vision for the next 10–20 years.", { 
        align: "left",
        lineGap: 6
      });
    doc.moveDown(1);

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text("Our team brings extensive experience in rural township planning, zoning modernization, and community engagement, having successfully completed similar projects for small communities across the US. We understand the unique needs of Richfield Township: balancing growth pressures with preservation of farmland and residential quality of life.", { 
        align: "left",
        lineGap: 6
      });
    doc.moveDown(1);

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text("We are committed to delivering a clear, implementable plan, a user-friendly zoning code, and strong engagement with your residents, Trustees, and Planning Commission.", { 
        align: "left",
        lineGap: 6
      });
    doc.moveDown(1);

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text("We appreciate your consideration and look forward to working together.", { 
        align: "left",
        lineGap: 6
      });
    doc.moveDown(1);

    // Closing - hardcoded
    doc.moveDown(1);
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text("Sincerely,", { align: "left" });
    doc.moveDown(2);

    // Contact information - only Name, Email, Number are dynamic
    const contactName = "Name, President"; // This could be made dynamic if needed
    const contactEmail = company?.email || "email@gmail.com";
    const contactPhone = company?.phone || "111-222-33";

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text(contactName, { align: "left" });
    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text(contactEmail, { align: "left" });
    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text(contactPhone, { align: "left" });

    doc.addPage();

    // ---------------- SECTIONS ----------------
    // Use existing sections from the proposal database
    const sections = proposal.sections || {};

    Object.entries(sections).forEach(([sectionName, sectionData], index) => {
      // Add a new page for each section (except the first one which already has a page)
      if (index > 0) {
        doc.addPage();
      }

      // Section title
      doc.fontSize(16).fillColor("#1E4E9E").text(sectionName);

      doc.moveDown(0.5);

      // Section content
      if (sectionData.content && sectionData.content.includes("|")) {
        renderTable(doc, sectionData.content);
      } else {
        // Clean markdown formatting from content
        let cleanContent = sectionData.content || "No content available";
        
        // Remove markdown bold formatting (**text**)
        cleanContent = cleanContent.replace(/\*\*(.*?)\*\*/g, '$1');
        
        // Remove markdown italic formatting (*text*)
        cleanContent = cleanContent.replace(/\*(.*?)\*/g, '$1');
        
        // Remove markdown headers (# ## ###)
        cleanContent = cleanContent.replace(/^#{1,6}\s*/gm, '');
        
        doc
          .fontSize(11)
          .fillColor("#000000")
          .text(cleanContent, {
            align: "justify",
            lineGap: 6,
          });
      }

      // Add extra space at the end of each section
      doc.moveDown(1.5);
    });

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
    .map((c) => c.trim())
    .filter(Boolean);
  const dataRows = rows.slice(1).map((row) =>
    row
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean)
  );

  const tableTop = doc.y;
  const cellPadding = 6;
  const colWidth =
    (doc.page.width - doc.page.margins.left - doc.page.margins.right) /
    headers.length;

  // Header row
  headers.forEach((header, i) => {
    doc
      .rect(doc.page.margins.left + i * colWidth, tableTop, colWidth, 25)
      .fillAndStroke("#f7fafc", "#e2e8f0");

    doc
      .fontSize(11)
      .fillColor("#2d3748")
      .text(
        header,
        doc.page.margins.left + i * colWidth + cellPadding,
        tableTop + 8,
        {
          width: colWidth - 2 * cellPadding,
          align: "left",
        }
      );
  });

  let y = tableTop + 25;

  // Data rows
  dataRows.forEach((row) => {
    let maxHeight = 25;
    row.forEach((cell, i) => {
      const textHeight = doc.heightOfString(cell, {
        width: colWidth - 2 * cellPadding,
      });
      maxHeight = Math.max(maxHeight, textHeight + 12);
    });

    row.forEach((cell, i) => {
      doc
        .rect(doc.page.margins.left + i * colWidth, y, colWidth, maxHeight)
        .stroke();

      doc
        .fontSize(11)
        .fillColor("#1a202c")
        .text(cell, doc.page.margins.left + i * colWidth + cellPadding, y + 6, {
          width: colWidth - 2 * cellPadding,
          align: "left",
        });
    });

    y += maxHeight;
  });

  doc.y = y + 20;
}



module.exports = router;
