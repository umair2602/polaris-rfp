const express = require("express");
const Proposal = require("../models/Proposal");
const RFP = require("../models/RFP");
const Company = require("../models/Company");
const PDFDocument = require("pdfkit");
const path = require("path");
const { generateAIProposalSections } = require("../services/aiProposalGenerator");
const { generateAIProposalFromTemplate } = require("../services/aiTemplateProposalGenerator");
const DocxGenerator = require("../services/docxGenerator");
const { Packer } = require("docx");
const router = express.Router();
const Template = require("../models/Template");

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

    let sections;

    // If templateId is a special AI flow, keep existing behavior using RFP-driven sections
    if (templateId === 'ai-template') {
      sections = await generateAIProposalSections(rfp, templateId, customContent);
    } else {
      // Load template and generate content strictly from template sections
      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      sections = await generateAIProposalFromTemplate(rfp.toObject ? rfp.toObject() : rfp, template.toObject ? template.toObject() : template, customContent);
    }

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

// (Removed earlier duplicate export-pdf route that stripped bold formatting)

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

        // Company logo (top-right corner) - stick to right edge
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
        .text(proposal.title, { 
          align: "center",
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
      doc.moveDown(4);
    }

    // Extract contact information from Title section
    const titleSection = proposal.sections?.Title;
    let contactInfo = {};
    
    if (titleSection && typeof titleSection.content === 'object') {
      contactInfo = titleSection.content;
    }

    // Company name - use extracted data or fallback to company
    const submittedBy = contactInfo.submittedBy || company?.name;
    if (submittedBy) {
      doc
        .fontSize(14)
        .fillColor("#1a202c")
        .text(`Submitted by: ${submittedBy}`, { 
          align: "center",
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });

      doc.moveDown(3);
    }

    // Contact details - using extracted contact information
    const contactName = contactInfo.name || "Jose P, President";
    const contactEmail = contactInfo.email || company?.email;
    const contactPhone = contactInfo.number || company?.phone;

    if (contactName) {
      doc
        .fontSize(14)
        .font("Helvetica")
        .fillColor("#1a202c")
        .text(contactName, { 
          align: "center",
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
      doc.moveDown(2);
    }

    if (contactEmail) {
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#2d3748")
        .text(contactEmail, { 
          align: "center",
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
      doc.moveDown(1.5);
    }

    if (contactPhone) {
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#2d3748")
        .text(contactPhone, { 
          align: "center",
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
      doc.moveDown(1.5);
    }



    // Add page break before cover letter and other sections
    doc.addPage();

    // ---------------- SECTIONS ----------------
    // Use existing sections from the proposal database
    const sections = proposal.sections || {};

    // Helper function to check if we need a page break before adding content
    const checkPageBreak = (estimatedHeight, isHeading = false) => {
      const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
      const remainingSpace = pageHeight - (doc.y - doc.page.margins.top);
      
      if (isHeading) {
        // For headings, ensure at least 200 units of space for heading + some content
        // This prevents orphaned headings (increased from 150 to 200 for better safety)
        if (remainingSpace < 200) {
          doc.addPage();
          return true;
        }
      } else {
        // For regular content, add page break if content won't fit
        if (remainingSpace < estimatedHeight) {
          doc.addPage();
          return true;
        }
      }
      return false;
    };

    let sectionCount = 0;
    Object.entries(sections).forEach(([sectionName, sectionData], index) => {
      // Skip Title section as it's already handled on the title page
      if (sectionName === "Title") {
        return;
      }
      
      // Add spacing between sections (except the first one)
      if (sectionCount > 0) {
        doc.moveDown(2.5); // Add space between sections instead of page break
      }
      sectionCount++;

      // Check if we need a page break before the section heading
      // This ensures heading + some content stays together
      checkPageBreak(0, true);

      // Section title
      const titleY = doc.y; // Save Y position for potential rollback
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor("#1E4E9E")
        .text(sectionName, {
          align: "center",
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });

      doc.moveDown(0.5);
      
      // After rendering heading, check if we have enough space for at least some content
      // If not, move heading to next page
      const afterHeadingY = doc.y;
      const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
      const remainingAfterHeading = pageHeight - (afterHeadingY - doc.page.margins.top);
      
      if (remainingAfterHeading < 100) {
        // Not enough space after heading - move entire heading to next page
        doc.addPage();
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor("#1E4E9E")
          .text(sectionName, {
            align: "center",
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
          });
        doc.moveDown(0.5);
      }

      // Section content
      if (sectionName === "Title" && typeof sectionData.content === 'object') {
        // Handle Title section with object content
        const titleData = sectionData.content;
        let titleContent = "";
        
        if (titleData.submittedBy) {
          titleContent += `Submitted by: ${titleData.submittedBy}\n`;
        }
        if (titleData.name) {
          titleContent += `Name: ${titleData.name}\n`;
        }
        if (titleData.email) {
          titleContent += `Email: ${titleData.email}\n`;
        }
        if (titleData.number) {
          titleContent += `Number: ${titleData.number}\n`;
        }
        
        doc
          .fontSize(11)
          .fillColor("#000000")
          .text(titleContent || "No contact information available", {
            align: "center",
            lineGap: 6,
          });
      } else if (sectionName === "Title" && typeof sectionData.content === 'string') {
        // Handle Title section with string content (from formatTitleSection or Cover Letter formatting)
        let titleContent = sectionData.content;
        
        // Split by lines to handle each field separately
        const lines = titleContent.split('\n');
        
        lines.forEach((line) => {
          if (!line.trim()) {
            doc.moveDown(0.5);
            return;
          }
          
          // Check if line has bold markdown formatting **text**
          if (line.includes('**')) {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            let isFirstPart = true;
            
            parts.forEach((part) => {
              if (!part) return;
              
              if (part.startsWith('**') && part.endsWith('**')) {
                // Bold text (like "Submitted to:")
                const boldText = part.slice(2, -2);
                doc
                  .font('Helvetica-Bold')
                  .fontSize(11)
                  .fillColor("#000000")
                  .text(boldText, {
                    continued: true,
                    align: "center",
                  });
              } else {
                // Regular text (like the actual value)
                doc
                  .font('Helvetica')
                  .fontSize(11)
                  .fillColor("#000000")
                  .text(part, {
                    continued: false,
                    align: "center",
                    lineGap: 4,
                  });
              }
            });
          } else {
            // Plain text line
            doc
              .font('Helvetica')
              .fontSize(11)
              .fillColor("#000000")
              .text(line, {
                align: "center",
                lineGap: 4,
              });
          }
        });
      } else if (sectionName === "Project Schedule") {
        // Render Project Schedule preserving bold and headings
        const content = typeof sectionData.content === 'string'
          ? sectionData.content
          : String(sectionData.content || "No content available");

        renderMarkdownContent(doc, content, {
          baseFontSize: 11,
          align: "justify",
          lineGap: 6,
        });
      } else if (sectionData.content && typeof sectionData.content === 'string' && sectionData.content.includes("|")) {
        renderTable(doc, sectionData.content);
      } else {
        // Render content preserving bold and markdown headings
        const content = typeof sectionData.content === 'string'
          ? sectionData.content
          : String(sectionData.content || "No content available");

        renderMarkdownContent(doc, content, {
          baseFontSize: 11,
          align: "justify",
          lineGap: 6,
        });
      }

      // Add extra space at the end of each section
      doc.moveDown(1.5);
    });

    // End the PDF generation
    doc.end();
  } catch (error) {
    console.error("Error exporting proposal as PDF:", error);
    res.status(500).json({ error: "Failed to export proposal PDF" });
  }
});

// Export proposal as DOCX
router.get("/:id/export-docx", async (req, res) => {
  console.log("🚀 Starting DOCX export request...");
  console.log("📋 Request params:", req.params);

  try {
    console.log("🔍 Looking up proposal with ID:", req.params.id);
    const proposal = await Proposal.findById(req.params.id).populate(
      "rfpId",
      "title clientName projectType keyRequirements deliverables budgetRange submissionDeadline location contactInformation"
    );

    if (!proposal) {
      console.error("❌ Proposal not found for ID:", req.params.id);
      return res.status(404).json({ error: "Proposal not found" });
    }

    console.log("✅ Proposal found:", {
      id: proposal._id,
      title: proposal.title,
      hasRfpId: !!proposal.rfpId,
      rfpId: proposal.rfpId?._id,
      sectionsCount: Object.keys(proposal.sections || {}).length
    });

    console.log("🏢 Looking up company information...");
    const company = await Company.findOne().sort({ createdAt: -1 }) || {};
    console.log("✅ Company data retrieved:", {
      hasCompany: !!company,
      companyId: company?._id,
      companyName: company?.name,
      companyKeys: company ? Object.keys(company) : []
    });

    console.log("📄 Creating DocxGenerator instance...");
    const docxGenerator = new DocxGenerator(); // <-- now uses officegen inside
    console.log("✅ DocxGenerator created");

    console.log("📝 Starting DOCX generation with officegen...");
    const buffer = await docxGenerator.generateDocx(proposal, company);
    console.log("✅ DOCX document generated successfully, size:", buffer.length, "bytes");

    // Ensure filename is safe
    const filename =
      (proposal.title || "proposal")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "") + ".docx";
    console.log("📁 Generated filename:", filename);

    // Set headers before sending
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    console.log("📤 Sending DOCX buffer to response...");
    res.send(buffer);
    console.log("🎉 DOCX export completed successfully");
  } catch (error) {
    console.error("❌ Error exporting proposal as DOCX:", error);
    res.status(500).json({
      error: "Failed to export proposal DOCX",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

function renderTable(doc, content) {
  // Keep lines that look like table rows and exclude pure separator rows
  const rows = content
    .split("\n")
    .filter((line) => {
      const trimmedLine = line.trim();
      return trimmedLine.includes("|") && !trimmedLine.match(/^[\s\-\|]+$/) && trimmedLine.length > 0;
    });

  if (rows.length < 2) {
    // Fallback to text if not enough rows for a table
    doc.text(content);
    return;
  }

  // Parse a row, preserving empty middle cells but trimming edges caused by leading/trailing pipes
  function parseRowKeepEmpties(row) {
    const parts = row.split("|").map((c) => c.trim());
    // Drop first/last if they are empty artifacts from leading/trailing pipe
    if (parts.length > 0 && parts[0] === "") parts.shift();
    if (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
    return parts; // keep empty strings inside
  }

  const rawTable = rows.map(parseRowKeepEmpties);
  if (rawTable.length === 0) {
    doc.text(content);
    return;
  }

  // Use first row as headers
  const headers = rawTable[0];
  const headerCount = headers.length;

  // Normalize data rows to exactly headerCount columns
  const dataRows = rawTable.slice(1).map((row) => {
    const r = [...row];
    if (r.length > headerCount) {
      // Merge extras into last column to avoid overflow
      const head = r.slice(0, headerCount - 1);
      const tail = r.slice(headerCount - 1).filter((x) => x !== "");
      return [...head, tail.join(" ")];
    }
    while (r.length < headerCount) r.push("");
    return r;
  });

  const cellPadding = 8;
  const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Detect 5-col Budget table by header names
  const lowerHeaders = headers.map((h) => String(h).toLowerCase());
  const isBudget5 =
    headerCount === 5 &&
    lowerHeaders.some((h) => h.includes("phase")) &&
    lowerHeaders.some((h) => h.includes("role")) &&
    (lowerHeaders.some((h) => h.includes("hourly")) || lowerHeaders.some((h) => h.includes("rate"))) &&
    lowerHeaders.some((h) => h.includes("hour")) &&
    lowerHeaders.some((h) => h.includes("cost"));

  // Column widths: custom for budget, equal otherwise
  const ratios = isBudget5 ? [0.26, 0.24, 0.16, 0.12, 0.22] : Array(headerCount).fill(1 / headerCount);
  const colWidths = ratios.map((r) => r * availableWidth);

  // Column alignments
  const colAlign = isBudget5 ? ["left", "left", "center", "center", "right"] : Array(headerCount).fill("left");

  // Estimate table height
  const estimatedHeaderHeight = 30;
  const estimatedMinTableHeight = estimatedHeaderHeight + (dataRows.length * 30); // Rough estimate
  
  // Check if we need a page break before starting the table
  const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
  const remainingSpace = pageHeight - (doc.y - doc.page.margins.top);
  
  // If table won't fit on current page and we're not near the top, start on new page
  if (remainingSpace < estimatedMinTableHeight && (doc.y - doc.page.margins.top) > 100) {
    doc.addPage();
  }

  const tableTop = doc.y;

  // Header row with better styling
  let xCursor = doc.page.margins.left;
  headers.forEach((header, i) => {
    const colWidth = colWidths[i];
    const cellX = xCursor;
    
    // Header background
    doc
      .rect(cellX, tableTop, colWidth, 30)
      .fillAndStroke("#f8f9fa", "#dee2e6");

    // Header text
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#212529")
      .text(
        header.replace(/<br\s*\/?>/gi, '\n'), // Handle <br> tags
        cellX + cellPadding,
        tableTop + 8,
        {
          width: colWidth - 2 * cellPadding,
          align: "left",
        }
      );
    xCursor += colWidth;
  });

  let y = tableTop + 30;

  // Data rows with improved styling and page break handling
  dataRows.forEach((row, rowIndex) => {
    let maxHeight = 30;
    
    // Calculate maximum height needed for this row
    row.forEach((cell, i) => {
      const colWidth = colWidths[i];
      const cleanCell = (cell === '' ? '\u00A0' : cell).replace(/<br\s*\/?>/gi, '\n');
      const textHeight = doc.heightOfString(cleanCell, {
        width: colWidth - 2 * cellPadding,
      });
      maxHeight = Math.max(maxHeight, textHeight + 16);
    });

    // Check if row will fit on current page
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
    const remainingSpace = pageHeight - (y - doc.page.margins.top);
    
    if (remainingSpace < maxHeight + 20) {
      // Not enough space, start new page and redraw header
      doc.addPage();
      y = doc.y;
      
      // Redraw header on new page
      let hx = doc.page.margins.left;
      headers.forEach((header, i) => {
        const colWidth = colWidths[i];
        const cellX = hx;
        
        // Header background
        doc
          .rect(cellX, y, colWidth, 30)
          .fillAndStroke("#f8f9fa", "#dee2e6");

        // Header text
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#212529")
          .text(
            header.replace(/<br\s*\/?>/gi, '\n'),
            cellX + cellPadding,
            y + 8,
            {
              width: colWidth - 2 * cellPadding,
              align: "left",
            }
          );
        hx += colWidth;
      });
      
      y += 30;
    }

    // Draw row with alternating background colors
    const backgroundColor = rowIndex % 2 === 0 ? "#ffffff" : "#f8f9fa";
    
    let rx = doc.page.margins.left;
    // Detect subtotal/total rows for styling
    const rowLabel = String(row[0] || '').toLowerCase();
    const isSummaryRow = rowLabel.includes('subtotal') || rowLabel.includes('total');

    row.forEach((cell, i) => {
      const colWidth = colWidths[i];
      const cellX = rx;
      const cleanCell = (cell === '' ? '\u00A0' : cell).replace(/<br\s*\/?>/gi, '\n');
      
      // Cell background
      doc
        .rect(cellX, y, colWidth, maxHeight)
        .fillAndStroke(backgroundColor, "#dee2e6");

      // Cell text
      doc
        .fontSize(10)
        .font(isSummaryRow ? "Helvetica-Bold" : "Helvetica")
        .fillColor("#212529")
        .text(
          cleanCell || "\u00A0", // Preserve empty cells as NBSP
          cellX + cellPadding,
          y + 8,
          {
            width: colWidth - 2 * cellPadding,
            align: colAlign[i] || "left",
          }
        );
      rx += colWidth;
    });

    y += maxHeight;
  });

  // Add some space after the table
  doc.y = y + 20;
  // Reset X to left margin so following content doesn't start at last cell X
  doc.x = doc.page.margins.left;
}

// Render markdown-like content with support for bold (**text**), headings (#, ##, ###), and bullets (-)
function renderMarkdownContent(doc, rawContent, options = {}) {
  const { baseFontSize = 11, align = "left", lineGap = 6 } = options;

  if (!rawContent) {
    doc.font('Helvetica').fontSize(baseFontSize).fillColor('#000000').text('No content available');
    return;
  }

  // Always start at left margin to avoid inheriting X from previous drawings (e.g., tables)
  doc.x = doc.page.margins.left;

  // Normalize bullets (various bullet characters to '-')
  let content = String(rawContent).replace(/[●•○◦]/g, '-');

  // Split by paragraphs
  const paragraphs = content.split(/\n\n+/);

  paragraphs.forEach((paragraph, pIdx) => {
    if (!paragraph.trim()) return;

    const lines = paragraph.split(/\n/);

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        doc.moveDown(0.3);
        return;
      }

      // Heading detection: ###, ##, # at line start
      const h3 = trimmed.match(/^###\s+(.*)$/);
      const h2 = trimmed.match(/^##\s+(.*)$/);
      const h1 = trimmed.match(/^#\s+(.*)$/);

      if (h3 || h2 || h1) {
        const level = h1 ? 1 : h2 ? 2 : 3;
        const text = (h1 || h2 || h3)[1];
        const size = level === 1 ? baseFontSize + 4 : level === 2 ? baseFontSize + 3 : baseFontSize + 2;

        doc
          .font('Helvetica-Bold')
          .fontSize(size)
          .fillColor('#1a202c')
          .text(text, { align: 'left', lineGap: lineGap });
        doc.moveDown(0.2);
        return;
      }

      // Bullets: leading one or more '-' followed by space
      const bulletMatch = trimmed.match(/^(-+)\s+(.*)$/);
      if (bulletMatch) {
        const indentLevel = Math.max(0, bulletMatch[1].length - 1);
        const bulletText = bulletMatch[2];
        const indent = 20 + indentLevel * 15;

        // Render bullet symbol
        doc
          .font('Helvetica')
          .fontSize(baseFontSize)
          .fillColor('#000000')
          .text('• ', { continued: true, indent, align: 'left', lineGap });

        // Render bullet text with inline bold support
        renderInlineBold(doc, bulletText, { baseFontSize, align: 'left', lineGap, continuedEnd: false });
        return;
      }

      // Normal line with inline bold
      renderInlineBold(doc, trimmed, { baseFontSize, align, lineGap, continuedEnd: false });
    });

    if (pIdx < paragraphs.length - 1) {
      doc.moveDown(0.8);
    }
  });
}

// Helper to render inline bold segments separated by ** **
function renderInlineBold(doc, text, opts) {
  const { baseFontSize, align, lineGap, continuedEnd } = opts;
  const parts = String(text).split(/(\*\*.*?\*\*)/g);
  parts.forEach((part, idx) => {
    if (!part) return;
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      doc
        .font('Helvetica-Bold')
        .fontSize(baseFontSize)
        .fillColor('#000000')
        .text(boldText, { continued: idx < parts.length - 1, align, lineGap });
    } else {
      // strip italic markers
      const regular = part.replace(/\*(.*?)\*/g, '$1');
      const isLast = idx === parts.length - 1;
      doc
        .font('Helvetica')
        .fontSize(baseFontSize)
        .fillColor('#000000')
        .text(regular, { continued: !isLast, align, lineGap });
    }
  });
  // If last segment ended with continued, close the line
  doc.text('', { continued: false });
}

// Update content library selection for a section
router.put("/:id/content-library/:sectionName", async (req, res) => {
  try {
    const { id, sectionName } = req.params;
    const { selectedIds, type } = req.body; // type: 'team', 'references', or 'company'

    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    let content = '';
    
    if (type === 'company') {
      const Company = require('../models/Company');
      const { formatTitleSection, formatCoverLetterSection, formatExperienceSection } = require('../services/sharedSectionFormatters');
      
      if (selectedIds.length > 0) {
        const selectedCompany = await Company.findOne({ 
          companyId: selectedIds[0] // Only use first selected company
        }).lean();
        
        if (selectedCompany) {
          // Get RFP data from the proposal
          const RFP = require('../models/RFP');
          const rfp = await RFP.findById(proposal.rfpId);
          
          // Determine section type based on section name
          const sectionTitle = sectionName.toLowerCase();
          if (sectionTitle === 'title') {
            content = formatTitleSection(selectedCompany, rfp || {});
          } else if (sectionTitle.includes('cover letter') || 
              sectionTitle.includes('introduction letter') || 
              sectionTitle.includes('transmittal letter')) {
            content = formatCoverLetterSection(selectedCompany, rfp || {});
          } else {
            // This is an experience/qualifications section
            content = await formatExperienceSection(selectedCompany, rfp || {});
          }
        } else {
          content = 'Selected company not found.';
        }
      } else {
        content = 'No company selected.';
      }
    } else if (type === 'team') {
      const TeamMember = require('../models/TeamMember');
      const selectedMembers = await TeamMember.find({ 
        memberId: { $in: selectedIds }, 
        isActive: true 
      }).lean();
      
      if (selectedMembers.length > 0) {
        content = 'Our experienced team brings together diverse expertise and proven track record to deliver exceptional results.\n\n';
        selectedMembers.forEach(member => {
          content += `**${member.nameWithCredentials}** - ${member.position}\n\n`;
          content += `${member.biography}\n\n`;
        });
      } else {
        content = 'No team members selected.';
      }
    } else if (type === 'references') {
      const ProjectReference = require('../models/ProjectReference');
      const selectedReferences = await ProjectReference.find({ 
        _id: { $in: selectedIds }, 
        isActive: true,
        isPublic: true
      }).lean();
      
      if (selectedReferences.length > 0) {
        content = 'Below are some of our recent project references that demonstrate our capabilities and client satisfaction:\n\n';
        selectedReferences.forEach(reference => {
          content += `**${reference.organizationName}**`;
          if (reference.timePeriod) {
            content += ` (${reference.timePeriod})`;
          }
          content += '\n\n';
          
          content += `**Contact:** ${reference.contactName}`;
          if (reference.contactTitle) {
            content += `, ${reference.contactTitle}`;
          }
          if (reference.additionalTitle) {
            content += ` - ${reference.additionalTitle}`;
          }
          content += ` of ${reference.organizationName}\n\n`;
          
          if (reference.contactEmail) {
            content += `**Email:** ${reference.contactEmail}\n\n`;
          }
          
          if (reference.contactPhone) {
            content += `**Phone:** ${reference.contactPhone}\n\n`;
          }
          
          content += `**Scope of Work:** ${reference.scopeOfWork}\n\n`;
          content += '---\n\n';
        });
      } else {
        content = 'No references selected.';
      }
    }

    // Update the section
    const updatedSections = {
      ...proposal.sections,
      [sectionName]: {
        ...proposal.sections[sectionName],
        content: content.trim(),
        type: 'content-library',
        lastModified: new Date().toISOString(),
        selectedIds: selectedIds // Store the selected IDs for future reference
      }
    };

    const updatedProposal = await Proposal.findByIdAndUpdate(
      id,
      { sections: updatedSections },
      { new: true }
    );

    res.json(updatedProposal);
  } catch (error) {
    console.error("Error updating content library selection:", error);
    res.status(500).json({ error: "Failed to update content library selection" });
  }
});

module.exports = router;
