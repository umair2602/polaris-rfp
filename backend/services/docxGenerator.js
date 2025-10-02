const officegen = require("officegen");
const fs = require("fs");
const path = require("path");

class DocxGenerator {
  constructor() {}

  async generateDocx(proposal, company) {
    return new Promise((resolve, reject) => {
        const docx = officegen({
          type: "docx",
          orientation: "portrait",
          pageMargins: {
            top: 1440,    // 1 inch (1440 twips = 1 inch)
            right: 1440,  // 1 inch
            bottom: 1440, // 1 inch
            left: 1440    // 1 inch
          },
          pageSize: "A4",
        });

      const { PassThrough } = require("stream");
      const stream = new PassThrough();
      const buffer = [];

      stream.on("data", (chunk) => buffer.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(buffer)));
      stream.on("error", (err) => reject(err));

      docx.on("error", (err) => reject(err));

      this.addHeaderLogos(docx);
      // ==== TITLE PAGE ====
      this.addTitlePage(docx, proposal, company);

      // ==== COVER LETTER PAGE ====
      this.addCoverLetterPage(docx, proposal, company);

      // ==== PROPOSAL SECTIONS ====
      this.addSections(docx, proposal.sections);

      // ==== GENERATE ====
      docx.generate(stream);
    });
  }

  // ---------------- HEADER LOGOS ----------------
  addHeaderLogos(docx) {
    const eighthGenLogoPath = path.join(
      __dirname,
      "../public/logos/Picture 1.png"
    );
    const villageLogoPath = path.join(
      __dirname,
      "../public/logos/Picture 2.jpg"
    );

    // Global header for all pages
    const header = docx.getHeader();
    const para = header.createP();

    if (fs.existsSync(villageLogoPath)) {
      para.addImage(villageLogoPath, { cx: 120, cy: 80 });
    }

    // Add manual spaces (or tabs) between left & right logos
    para.addText(" ".repeat(110)); // adjust the repeat number until logos push apart

    if (fs.existsSync(eighthGenLogoPath)) {
      para.addImage(eighthGenLogoPath, { cx: 100, cy: 90 });
    }
  }

  // ---------------- TITLE PAGE ----------------
  addTitlePage(docx, proposal, company) {
    // Header logos are already added in the main generation flow
    const emptyLine4 = docx.createP();
    emptyLine4.addText(" ");
    const emptyLine5 = docx.createP();
    emptyLine5.addText(" ");
    const emptyLine6 = docx.createP();
    emptyLine6.addText(" ");

    const title = docx.createP({ align: "center" });
    // Clean title to remove duplicate "Proposal for" text
    let cleanTitle = proposal.title || "Proposal Title";
    cleanTitle = cleanTitle.replace(
      /^Proposal for\s+Proposal for\s+/i,
      "Proposal for "
    );
    title.addText(cleanTitle, {
      // bold: true,
      font_size: 23,
      font_face: "Calibri",
    });

    const emptyLine = docx.createP();
    emptyLine.addText(" ");
    const emptyLine2 = docx.createP();
    emptyLine2.addText(" ");
    const emptyLine3 = docx.createP();
    emptyLine3.addText(" ");

    const submittedBy = docx.createP({ align: "center" });
    submittedBy.addText(`Submitted by: ${company?.name || "Unknown Company"}`, {
      font_size: 13,
      font_face: "Calibri",
    });
    const emptyLine9 = docx.createP();
    emptyLine9.addText(" ");

    const contact = docx.createP({ align: "center" });
    contact.addText(`Contact: ${company?.contact || "Jose P, President"}`, {
      font_size: 14,
      font_face: "Calibri",
    });

    const emptyLine10 = docx.createP();
    emptyLine10.addText(" ");

    const email = docx.createP({ align: "center" });
    email.addText(`Email: ${company?.email || "N/A"}`, {
      font_size: 14,
      font_face: "Calibri",
    });

    const emptyLine11 = docx.createP();
    emptyLine11.addText(" ");

    const phone = docx.createP({ align: "center" });
    phone.addText(`Phone: ${company?.phone || "N/A"}`, {
      font_size: 14,
      font_face: "Calibri",
    });

    docx.putPageBreak();
  }

  // ---------------- COVER LETTER ----------------
  addCoverLetterPage(docx, proposal, company) {
    // Header logos are already added in the main generation flow

    // Check if we have AI-generated cover letter content
    const coverLetterSection = proposal.sections?.["Cover Letter"];
    
    if (coverLetterSection && coverLetterSection.content) {
      // Use AI-generated cover letter content
      this.addAICoverLetterContent(docx, coverLetterSection.content, proposal, company);
    } else {
      // Fallback to hardcoded cover letter
      this.addHardcodedCoverLetter(docx, proposal, company);
    }
  }

  // ---------------- AI GENERATED COVER LETTER ----------------
  addAICoverLetterContent(docx, content, proposal, company) {
    // Add the cover letter title heading
    const title = docx.createP({ align: "center" });
    title.addText("Cover Letter", {
      bold: true,
      font_size: 16,
      font_face: "Calibri",
      color: "073763",
    });

    // Add some spacing after the title
    const emptyLine = docx.createP();
    emptyLine.addText(" ");

    // Simply render the cover letter content as-is, preserving formatting
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const para = docx.createP();
      const trimmedLine = line.trim();
      
      if (trimmedLine) {
        // Handle bold formatting
        if (trimmedLine.includes('**')) {
          const parts = trimmedLine.split('**');
          for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 0) {
              // Regular text
              if (parts[i]) para.addText(parts[i], { font_face: "Calibri" });
            } else {
              // Bold text
              if (parts[i]) para.addText(parts[i], { bold: true, font_face: "Calibri" });
            }
          }
        } else {
          para.addText(trimmedLine, { font_face: "Calibri" });
        }
      } else {
        // Empty line for spacing
        para.addText(" ", { font_face: "Calibri" });
      }
    });
  }

  // ---------------- HARDCODED COVER LETTER (FALLBACK) ----------------
  addHardcodedCoverLetter(docx, proposal, company) {
    const title = docx.createP({ align: "center" });
    title.addText("Zoning Code Update and Comprehensive Land Use Plan", {
      bold: true,
      font_size: 11,
      font_face: "Calibri",
    });

    const submittedTo = docx.createP();
    submittedTo.addText("Submitted to:", { bold: true, font_face: "Calibri" });
    submittedTo.addLineBreak();
    submittedTo.addText(proposal.rfpId?.clientName || "Town of Amherst", {
      bold: true,
      font_face: "Calibri",
    });

    const submittedBy = docx.createP();
    submittedBy.addText("Submitted by:", { bold: true, font_face: "Calibri" });
    submittedBy.addLineBreak();
    submittedBy.addText(company?.name || "Not specified", {
      bold: true,
      font_face: "Calibri",
    });

    const date = docx.createP();
    date.addText("09/16/2025", { font_face: "Calibri" });

    const salutation = docx.createP();
    salutation.addText("Dear Town Board and Planning Commission,", {
      font_face: "Calibri",
    });

    const bodyParagraphs = [
      "On behalf of Not specified, we are pleased to submit our proposal to partner with Town of Amherst on the development of a Comprehensive Land Use Plan and a complete Zoning Code Update. We recognize that this is a once-in-a-generation opportunity to modernize the Township's planning framework, protect its rural and agricultural character, and create a legally defensible, community-driven vision for the next 10–20 years.",
      "Our team brings extensive experience in rural township planning, zoning modernization, and community engagement, having successfully completed similar projects for small communities across the US. We understand the unique needs of Richfield Township: balancing growth pressures with preservation of farmland and residential quality of life.",
      "We are committed to delivering a clear, implementable plan, a user-friendly zoning code, and strong engagement with your residents, Trustees, and Planning Commission.",
      "We appreciate your consideration and look forward to working together. Sincerely,",
    ];

    bodyParagraphs.forEach((para) => {
      const p = docx.createP();
      p.addText(para, { font_size: 12, font_face: "Calibri" });
    });

    const closing = docx.createP();
    closing.addText("Sincerely,", { font_face: "Calibri" });

    const contact = docx.createP();
    contact.addText("Name, President", { font_face: "Calibri" });
    contact.addLineBreak();
    contact.addText(company?.email || "email@gmail.com", {
      font_face: "Calibri",
    });
    contact.addLineBreak();
    contact.addText(company?.phone || "111-222-33", { font_face: "Calibri" });
  }

  // ---------------- SECTIONS ----------------
  addSections(docx, sections = {}) {
    if (!sections || typeof sections !== "object") return;

    const sectionEntries = Object.entries(sections).filter(
      ([sectionName]) => sectionName !== "Title" && sectionName !== "Cover Letter"
    );

    // Add page break before the first section (after cover letter)
    if (sectionEntries.length > 0) {
      docx.putPageBreak();
    }

    sectionEntries.forEach(([sectionName, sectionData], index) => {
      // Header logos are already added in the main generation flow

      const heading = docx.createP({ align: "center" });
      heading.addText(sectionName, {
        bold: true,
        font_size: 13,
        font_face: "Calibri",
        color: "073763",
      });

      const content = sectionData?.content || "";
      if (typeof content === "string" && content.includes("|")) {
        this.addTable(docx, content);
      } else {
        // Use special formatting for Key Personnel section
        if (sectionName === "Key Personnel") {
          this.addKeyPersonnelContent(docx, content);
        } else {
          this.addTextContent(docx, content);
        }
      }

      // Only add page break if this is not the last section
      if (index < sectionEntries.length - 1) {
        docx.putPageBreak();
      }
    });
  }

  // ---------------- TEXT CONTENT ----------------
  addTextContent(docx, content) {
    let cleanContent = content || "No content available";
    if (typeof cleanContent !== "string") {
      cleanContent = String(cleanContent);
    }

    cleanContent = cleanContent
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/\n\n+/g, "\n\n");

    const paragraphs = cleanContent.split("\n\n").filter((p) => p.trim());

    paragraphs.forEach((para) => {
      const p = docx.createP();
      p.addText(para.trim(), { font_size: 12, font_face: "Calibri" });
    });
  }

  // ---------------- KEY PERSONNEL CONTENT ----------------
  addKeyPersonnelContent(docx, content) {
    let cleanContent = content || "No content available";
    if (typeof cleanContent !== "string") {
      cleanContent = String(cleanContent);
    }

    cleanContent = cleanContent
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/\n\n+/g, "\n\n");

    const paragraphs = cleanContent.split("\n\n").filter((p) => p.trim());

    paragraphs.forEach((para) => {
      // Check if paragraph contains lines that start with dashes
      const lines = para.split("\n");

      if (lines.length === 1) {
        // Single line paragraph
        const p = docx.createP();
        // Only convert to bullet if line starts with dash and has content after it
        if (para.trim().startsWith("-") && para.trim().length > 1) {
          const bulletText = para.trim().substring(1).trim();
          if (bulletText) {
            // Only add bullet if there's content after the dash
            p.addText("• ", { font_size: 12, font_face: "Calibri" });
            p.addText(bulletText, { font_size: 12, font_face: "Calibri" });
          } else {
            p.addText(para.trim(), { font_size: 12, font_face: "Calibri" });
          }
        } else {
          p.addText(para.trim(), { font_size: 12, font_face: "Calibri" });
        }
      } else {
        // Multi-line paragraph - check each line
        lines.forEach((line, index) => {
          const p = docx.createP();
          // Only convert to bullet if line starts with dash and has content after it
          if (line.trim().startsWith("-") && line.trim().length > 1) {
            const bulletText = line.trim().substring(1).trim();
            if (bulletText) {
              // Only add bullet if there's content after the dash
              p.addText("• ", { font_size: 12, font_face: "Calibri" });
              p.addText(bulletText, { font_size: 12, font_face: "Calibri" });
            } else {
              p.addText(line.trim(), { font_size: 12, font_face: "Calibri" });
            }
          } else {
            p.addText(line.trim(), { font_size: 12, font_face: "Calibri" });
          }
        });
      }
    });
  }

  // ---------------- TABLE ----------------
  addTable(docx, content) {
    try {
      const lines = content.split("\n");
      const table = [];

      for (const line of lines) {
        if (!line.trim() || /^[\s\|\-]+$/.test(line)) continue;

        if (line.includes("|")) {
          const cells = line
            .split("|")
            .map((c) => c.trim())
            .map((c) => c.replace(/\*\*/g, "").replace(/\*/g, "")) // Remove ** and * markdown formatting
            .map((c) => c.replace(/<br\s*\/?>/gi, "\n")) // Convert <br> tags to line breaks
            .filter((c) => c !== "");
          if (cells.length) table.push(cells);
        }
      }

      if (table.length > 0) {
        // Determine table type and width based on content
        const tableType = this.determineTableType(table, content);
        const tableData = this.createFormattedTable(table, tableType);
        const tableStyle = this.createTableStyle(tableType);

        docx.createTable(tableData, tableStyle);
      }
    } catch (error) {
      console.error("Error creating table:", error);
      // Fallback: just add the content as text
      docx.createP().addText(content, { font_face: "Calibri" });
    }
  }

  // ---------------- TABLE TYPE DETECTION ----------------
  determineTableType(table, content) {
    const columnCount = table[0] ? table[0].length : 0;
    const firstRow = table[0] ? table[0].join(" ").toLowerCase() : "";
    const contentLower = content.toLowerCase();

    // Budget table detection - look for cost/price columns
    if (
      (firstRow.includes("phase") &&
        (firstRow.includes("cost") || firstRow.includes("price"))) ||
      firstRow.includes("budget") ||
      firstRow.includes("$") ||
      contentLower.includes("budget") ||
      contentLower.includes("cost breakdown")
    ) {
      return "budget";
    }
    // Timeline table detection - look for schedule/timeline columns
    else if (
      firstRow.includes("timeline") ||
      firstRow.includes("schedule") ||
      firstRow.includes("milestone") ||
      firstRow.includes("deadline") ||
      contentLower.includes("project schedule")
    ) {
      return "timeline";
    }
    // Methodology table detection - Phase | Deliverables format
    else if (
      (firstRow.includes("phase") && firstRow.includes("deliverable")) ||
      (columnCount === 2 &&
        (firstRow.includes("phase") || firstRow.includes("deliverable"))) ||
      contentLower.includes("methodology")
    ) {
      return "methodology";
    }
    // Team table detection - look for personnel/team columns
    else if (
      firstRow.includes("team") ||
      firstRow.includes("personnel") ||
      firstRow.includes("member") ||
      firstRow.includes("staff") ||
      (firstRow.includes("name") && firstRow.includes("experience"))
    ) {
      return "team";
    }
    // Wide table for 3+ columns
    else if (columnCount >= 3) {
      return "wide";
    }
    // Narrow table for 2 columns
    else if (columnCount === 2) {
      return "narrow";
    } else {
      return "default";
    }
  }

  // ---------------- TABLE FORMATTING ----------------
  createFormattedTable(table, tableType = "default") {
    return table.map((row, rowIndex) => {
      return row.map((cell, cellIndex) => {
        // Process cell content to handle line breaks
        const processedCell = this.processTableCellContent(cell);

        // Header row formatting
        if (rowIndex === 0) {
          return {
            val: processedCell,
            opts: {
              b: true,
              sz: "24",
              font_face: "Calibri",
              align: this.getHeaderAlignment(tableType, cellIndex),
              vAlign: "center",
              shd: {
                fill: this.getHeaderColor(tableType),
                themeFill: "text1",
                themeFillTint: "80",
              },
            },
          };
        }

        // Data row formatting
        return {
          val: processedCell,
          opts: {
            b: false,
            sz: "22",
            font_face: "Calibri",
            align: this.getDataAlignment(tableType, cellIndex),
            vAlign: "top",
          },
        };
      });
    });
  }

  processTableCellContent(cell) {
    if (typeof cell === "string") {
      // Convert line breaks to array format for multi-line cells
      if (cell.includes("\n")) {
        return cell.split("\n").filter((line) => line.trim() !== "");
      }

      // Handle <br> tags
      if (cell.includes("<br")) {
        return cell
          .replace(/<br\s*\/?>/gi, "\n")
          .split("\n")
          .filter((line) => line.trim() !== "");
      }

      // For very long text, add some basic word wrapping
      if (cell.length > 100) {
        // Split on periods, semicolons, or other natural breaks
        const sentences = cell.split(/(?<=[.!?;])\s+/);
        if (sentences.length > 1) {
          return sentences;
        }
      }
    }
    return cell;
  }

  getHeaderAlignment(tableType, cellIndex) {
    switch (tableType) {
      case "budget":
        return "center";
      case "timeline":
        return "center";
      case "team":
        return "left";
      default:
        return "center";
    }
  }

  getDataAlignment(tableType, cellIndex) {
    switch (tableType) {
      case "budget":
        return "center";
      case "timeline":
        return "center";
      case "team":
        return "left";
      default:
        return "left";
    }
  }

  getHeaderColor(tableType) {
    switch (tableType) {
      case "budget":
        return "E6F3FF"; // Light blue
      case "timeline":
        return "E6FFE6"; // Light green
      case "team":
        return "FFF0E6"; // Light orange
      default:
        return "D9D9D9"; // Light gray
    }
  }

  createTableStyle(tableType = "default") {
    const baseStyle = {
      tableSize: 24,
      tableColor: "000000",
      tableAlign: "center", // Center tables on the page
      tableFontFamily: "Calibri",
      spacingBefore: 100,
      spacingAfter: 100,
      spacingLine: 240,
      spacingLineRule: "atLeast",
      indent: 0,
      fixedLayout: false, // Changed to false for better Google Docs compatibility
      borders: true,
      borderSize: 4,
      tableColWidth: 9000, // Moderate increase for better centering
    };

    switch (tableType) {
      case "budget":
        return {
          ...baseStyle,
          tableColWidth: 9000, // Moderate increase for better centering
          columns: [
            { width: 3000 }, // Phase column - wider for descriptions
            { width: 4500 }, // Description column - widest for content
            { width: 1500 }, // Cost column - wider for numbers
          ],
        };
      case "timeline":
        return {
          ...baseStyle,
          tableColWidth: 9000, // Moderate increase for better centering
          columns: [
            { width: 2500 }, // Phase column
            { width: 3000 }, // Timeline column
            { width: 3500 }, // Description column
          ],
        };
      case "team":
        return {
          ...baseStyle,
          tableColWidth: 9000, // Moderate increase for better centering
          columns: [
            { width: 4000 }, // Name/Title column
            { width: 5000 }, // Experience/Qualifications column
          ],
        };
      case "wide":
        return {
          ...baseStyle,
          tableColWidth: 10000, // Moderate increase for wide tables
          fixedLayout: false,
          columns: [
            { width: 5000 }, // Equal width columns
            { width: 5000 },
          ],
        };
      case "narrow":
        return {
          ...baseStyle,
          tableColWidth: 8000, // Moderate increase for narrow tables
          columns: [
            { width: 4000 }, // Equal width columns
            { width: 4000 },
          ],
        };
      case "methodology":
        return {
          ...baseStyle,
          tableColWidth: 9000, // Moderate increase for better centering
          columns: [
            { width: 3000 }, // Phase column
            { width: 6000 }, // Deliverables column - wider for content
          ],
        };
      default:
        return {
          ...baseStyle,
          tableColWidth: 9000, // Moderate increase for default tables
          columns: [
            { width: 4500 }, // Equal width columns
            { width: 4500 },
          ],
        };
    }
  }
}

module.exports = DocxGenerator;
