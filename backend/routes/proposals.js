const express = require("express");
const Proposal = require("../models/Proposal");
const RFP = require("../models/RFP");
const Company = require("../models/Company");
const PDFDocument = require("pdfkit");
const path = require("path");
const OpenAI = require("openai");
const router = express.Router();

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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

    console.log("AI Proposal generated successfully:", proposal._id);
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

    console.log("AI sections generated successfully for proposal:", proposal._id);
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
    console.log("exportData", exportData);
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

    // Console log the data for debugging
    console.log("Proposal data:", JSON.stringify(proposal, null, 2));
    console.log("Company data:", JSON.stringify(company, null, 2));

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

    // ---------------- TITLE PAGE ----------------
    // Title
    if (proposal.title) {
      doc
        .fontSize(24)
        .fillColor("#1a202c")
        .text(proposal.title, { align: "center" });
      doc.moveDown(4);
    }

    // Add a new page for the hardcoded cover letter
    doc.addPage();

    // ---------------- HARDCODED COVER LETTER PAGE ----------------
    // This page is hardcoded exactly as shown in the image with only 4 dynamic fields
    
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
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Zoning Code Update and Comprehensive Land Use Plan", { align: "center" });
    doc.moveDown(2);

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
    // Generate sections using AI
    const sections = await generateAIProposalSections(
      proposal.rfpId,
      proposal.templateId,
      proposal.customContent || {}
    );

    Object.entries(sections).forEach(([sectionName, sectionData]) => {
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


// AI-powered proposal section generation
async function generateAIProposalSections(rfp, templateId, customContent) {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const systemPrompt = `
You are an expert proposal writer. Generate a comprehensive proposal based on the RFP data provided. 
Structure the proposal with the following sections and format them as markdown:

1. **Project Understanding and Approach** - Detailed understanding of requirements and our methodology
2. **Key Personnel** - Team members and their qualifications
3. **Methodology (By Phase)** - Detailed project phases and deliverables
4. **Project Schedule** - Timeline with milestones
5. **Budget** - Cost breakdown by phases
6. **References** - Relevant past projects and client experience

Guidelines:
- Use professional, persuasive language
- Include specific details from the RFP
- Format tables using markdown table syntax
- Use bullet points for lists
- Include realistic timelines and budgets
- Make content relevant to the project type
- Ensure each section is comprehensive but concise
- Use **bold** for emphasis and *italics* for important details

For the References section, use this exact format:
- Start with: "We are pleased to provide the following experience from organizations with comparable scopes of work."
- For each reference, include:
  - Organization Name (Year-Year)
  - Contact: [Name], [Title] of [Organization]
  - Email: [email]
  - Phone: [phone]
  - Scope of Work: [Detailed description of work performed and achievements]
- Do NOT include testimonials or quotes

CRITICAL: Return the sections as a JSON object with EXACTLY these section names as keys and content as values:
{
  "Firm Qualifications and Experience": "content here",
  "Relevant Comprehensive Planning & Rural Community Experience": "content here",
  "Project Understanding and Approach": "content here",
  "Key Personnel": "content here",
  "Methodology (By Phase)": "content here",
  "Project Schedule": "content here",
  "Budget": "content here",
  "References": "content here"
}

Each section should be a separate key-value pair in the JSON object.`;

  const userPrompt = `
RFP Information:
- Title: ${rfp.title}
- Client: ${rfp.clientName}
- Project Type: ${rfp.projectType}
- Budget Range: ${rfp.budgetRange || 'Not specified'}
- Submission Deadline: ${rfp.submissionDeadline || 'Not specified'}
- Location: ${rfp.location || 'Not specified'}
- Key Requirements: ${rfp.keyRequirements?.join(', ') || 'Not specified'}
- Deliverables: ${rfp.deliverables?.join(', ') || 'Not specified'}
- Contact Information: ${rfp.contactInformation || 'Not specified'}

${rfp.rawText ? `\nRFP Full Text:\n${rfp.rawText.substring(0, 4000)}...` : ''}

Generate a comprehensive proposal with all sections formatted as markdown.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0].message.content.trim();
    
    console.log("AI Response length:", raw.length);
    console.log("AI Response preview:", raw.substring(0, 200) + "...");
    
    // Try to parse as JSON first
    try {
      // Clean the response to extract JSON
      let jsonText = raw;
      
      // Look for JSON object in the response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
        console.log("Found JSON in response, length:", jsonText.length);
      }
      
      const parsed = JSON.parse(jsonText);
      console.log("Parsed JSON keys:", Object.keys(parsed));
      
      // Validate that we have the expected sections
      const expectedSections = [
        "Firm Qualifications and Experience",
        "Relevant Comprehensive Planning & Rural Community Experience",
        "Project Understanding and Approach", 
        "Key Personnel",
        "Methodology (By Phase)",
        "Project Schedule",
        "Budget",
        "References"
      ];
      
      // Check if we have the expected structure
      const hasExpectedSections = expectedSections.some(section => parsed.hasOwnProperty(section));
      
      if (hasExpectedSections) {
        console.log("Using JSON parsing - found expected sections");
        return formatAISections(parsed);
      } else {
        console.log("JSON structure doesn't match expected sections, trying markdown extraction");
        // If structure is different, try to extract from markdown
        return extractSectionsFromMarkdown(raw);
      }
    } catch (jsonError) {
      console.log("JSON parsing failed, trying markdown extraction:", jsonError.message);
      // If not JSON, try to extract sections from markdown
      return extractSectionsFromMarkdown(raw);
    }
  } catch (error) {
    console.error("AI proposal generation failed:", error);
    throw new Error(`AI proposal generation failed: ${error.message}`);
  }
}

// Format AI-generated sections for the database
function formatAISections(sections) {
  const formattedSections = {};
  
  // Add hardcoded sections first
  formattedSections["Firm Qualifications and Experience"] = {
    content: getFirmQualificationsContent(),
    type: "hardcoded",
    lastModified: new Date().toISOString(),
  };
  
  formattedSections["Relevant Comprehensive Planning & Rural Community Experience"] = {
    content: getRelevantExperienceContent(),
    type: "hardcoded", 
    lastModified: new Date().toISOString(),
  };
  
  // Add AI-generated sections
  Object.entries(sections).forEach(([sectionName, content]) => {
    // Skip the hardcoded sections if they were generated by AI
    if (sectionName !== "Firm Qualifications and Experience" && 
        sectionName !== "Relevant Comprehensive Planning & Rural Community Experience") {
      formattedSections[sectionName] = {
        content: content,
        type: "ai-generated",
        lastModified: new Date().toISOString(),
      };
    }
  });
  
  return formattedSections;
}

// Hardcoded content for Firm Qualifications and Experience
function getFirmQualificationsContent() {
  return `**Firm Qualifications and Experience**

Eighth Generation Consulting is a consultancy established in 2022, with a staff of 5 professionals specializing in land use planning, zoning, and public engagement. Our leadership team has over 75 years of combined experience supporting municipalities, tribal governments, and both non-profit and for-profit organizations to integrate economic and environmental development with community engagement and regulatory compliance requirements. We've earned numerous awards and recognitions for these efforts:

• **2022:** Honored by the United Nations at the Biodiversity COP15 for pioneering zoning, land use, and stakeholder collaboration through the City of Carbondale's Sustainability Plan.

• **2024:** Grand Prize winners through an NREL sponsored prize on community integration of infrastructure and workforce development in land use issues.

• **2024:** MIT Solver - Indigenous Communities Fellowship Class of 2024 for work on developing systems of collaboration between local, state, tribal, and federal entities around energy and responsible land use issues.

• **2025:** American Made Challenge Current Semifinalist, U.S. Department of Energy.

• **2025:** Verizon Disaster Resilience Prize Current Semifinalist for oneNode, a solar microgrid technology to restore connectivity, monitor hazards, and coordinate response in disaster zones.

• **2025:** Shortlisted as an MIT Solver semifinalist for a second time focusing on responsible land use, zoning, and privacy concerns for data center development.

• **2025:** Awarded Preferred Provider by the Alliance for Tribal Clean Energy.

Our core services include: Comprehensive Planning, Zoning Ordinance Updates, Rural & Agricultural Preservation, Public Facilitation, and Legal/Statutory Compliance Reviews.`;
}

// Hardcoded content for Relevant Comprehensive Planning & Rural Community Experience
function getRelevantExperienceContent() {
  return `**Relevant Comprehensive Planning & Rural Community Experience**

Eighth Generation Consulting's staff have contributed to and led multiple comprehensive planning and sustainability initiatives in complex municipal areas, including:

• **Carbondale's Sustainability Action Plan**
  - Emphasized cross-sector collaboration, brownfield development policy, and climate resiliency measures, adopted via a 5-0 City Council vote. Incorporated robust stakeholder engagement strategies that effectively included rural and agricultural stakeholders. Reviewed all current Zoning Land Use and restrictions, requirements, and assumptions.

• **Osage Nation planning and development support**
  - Led multiple community-based planning efforts emphasizing coordination between local groups like the Chamber of Commerce, tribal stakeholders in the Osage Nation, as well as county and state representatives. Integrated local concerns around land use, infrastructure planning, and economic development. Wrote 12 grant applications serving as subject matter experts on energy and land usage.

• **Tribal and Municipal Environmental Permitting & Siting Projects**
  - Partnered with the Upper Mattaponi Tribe of Virginia, the Rappahannock Tribe in collaboration with U.S. Fish and Wildlife, Virginia's Piedmont Environmental Council, and the City of Tacoma's Environmental Services Department to deliver GIS-driven siting, feasibility analysis, and permitting strategies for projects exceeding $400,000 in combined value. Developed community-informed engagement frameworks, coordinated with Authorities Having Jurisdiction (AHJs), and designed compliance pathways aligned with federal, state, and local regulations.`;
}

// Extract sections from markdown text if JSON parsing fails
function extractSectionsFromMarkdown(markdownText) {
  console.log("Extracting sections from markdown, text length:", markdownText.length);
  const sections = {};
  
  // Try multiple patterns for section headers
  const patterns = [
    /^##\s+(.+)$/gm,  // ## Section Name
    /^#\s+(.+)$/gm,   // # Section Name
    /^\*\*(.+?)\*\*\s*$/gm,  // **Section Name**
    /^(.+?):\s*$/gm   // Section Name:
  ];
  
  let foundSections = false;
  
  for (const pattern of patterns) {
    const matches = [];
    let match;
    
    // Reset regex
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(markdownText)) !== null) {
      matches.push({
        name: match[1].trim(),
        index: match.index,
        fullMatch: match[0]
      });
    }
    
    if (matches.length > 0) {
      foundSections = true;
      console.log(`Found ${matches.length} sections using pattern:`, pattern);
      
      // Process each section
      for (let i = 0; i < matches.length; i++) {
        const currentMatch = matches[i];
        const nextMatch = matches[i + 1];
        
        const sectionName = currentMatch.name;
        const sectionStart = currentMatch.index + currentMatch.fullMatch.length;
        const sectionEnd = nextMatch ? nextMatch.index : markdownText.length;
        
        const content = markdownText
          .substring(sectionStart, sectionEnd)
          .trim();
        
        if (content && content.length > 10) { // Only add if content is substantial
          console.log(`Adding section: ${sectionName} (${content.length} chars)`);
          sections[sectionName] = {
            content: content,
            type: "ai-generated",
            lastModified: new Date().toISOString(),
          };
        }
      }
      break; // Use the first pattern that finds sections
    }
  }
  
  // If no sections found with patterns, try to split by common section names
  if (!foundSections) {
    const commonSections = [
      "Project Understanding and Approach",
      "Key Personnel", 
      "Methodology",
      "Project Schedule",
      "Budget",
      "References"
    ];
    
    let currentContent = markdownText;
    
    for (const sectionName of commonSections) {
      const regex = new RegExp(`(${sectionName}[\\s\\S]*?)(?=${commonSections.join('|')}|$)`, 'gi');
      const match = regex.exec(currentContent);
      
      if (match && match[1]) {
        const content = match[1].replace(new RegExp(`^${sectionName}\\s*:?\\s*`, 'i'), '').trim();
        if (content && content.length > 10) {
          sections[sectionName] = {
            content: content,
            type: "ai-generated", 
            lastModified: new Date().toISOString(),
          };
        }
      }
    }
  }
  
  // If still no sections found, create a single section with all content
  if (Object.keys(sections).length === 0) {
    console.log("No sections found, creating single 'Proposal Content' section");
    sections["Proposal Content"] = {
      content: markdownText,
      type: "ai-generated",
      lastModified: new Date().toISOString(),
    };
  }
  
  // Add hardcoded sections to the beginning
  const hardcodedSections = {
    "Firm Qualifications and Experience": {
      content: getFirmQualificationsContent(),
      type: "hardcoded",
      lastModified: new Date().toISOString(),
    },
    "Relevant Comprehensive Planning & Rural Community Experience": {
      content: getRelevantExperienceContent(),
      type: "hardcoded", 
      lastModified: new Date().toISOString(),
    }
  };
  
  // Merge hardcoded sections with extracted sections
  const finalSections = { ...hardcodedSections, ...sections };
  
  console.log("Final sections created:", Object.keys(finalSections));
  return finalSections;
}

module.exports = router;
