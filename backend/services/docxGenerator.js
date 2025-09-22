const officegen = require("officegen");
const fs = require("fs");
const path = require("path");

class DocxGenerator {
  constructor() {}

  async generateDocx(proposal, company) {
    return new Promise((resolve, reject) => {
      const docx = officegen("docx");
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
    para.addText(" ".repeat(90)); // adjust the repeat number until logos push apart

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
    cleanTitle = cleanTitle.replace(/^Proposal for\s+Proposal for\s+/i, "Proposal for ");
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
    email.addText(`Email: ${company?.email || "N/A"}`, { font_size: 14, font_face: "Calibri" });

    const emptyLine11 = docx.createP();
    emptyLine11.addText(" ");

    const phone = docx.createP({ align: "center" });
    phone.addText(`Phone: ${company?.phone || "N/A"}`, { font_size: 14, font_face: "Calibri" });

    docx.putPageBreak();
  }

  // ---------------- COVER LETTER ----------------
  addCoverLetterPage(docx, proposal, company) {
    // Header logos are already added in the main generation flow

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
    submittedBy.addText(company?.name || "Eighth Generation Consulting", {
      bold: true,
      font_face: "Calibri",
    });

    const date = docx.createP();
    date.addText("09/16/2025", { font_face: "Calibri" });

    const salutation = docx.createP();
    salutation.addText("Dear Town Board and Planning Commission,", { font_face: "Calibri" });

    const bodyParagraphs = [
      "On behalf of Eighth Generation Consulting, we are pleased to submit our proposal to partner with Town of Amherst on the development of a Comprehensive Land Use Plan and a complete Zoning Code Update. We recognize that this is a once-in-a-generation opportunity to modernize the Township's planning framework, protect its rural and agricultural character, and create a legally defensible, community-driven vision for the next 10–20 years.",
      "Our team brings extensive experience in rural township planning, zoning modernization, and community engagement, having successfully completed similar projects for small communities across the US. We understand the unique needs of Richfield Township: balancing growth pressures with preservation of farmland and residential quality of life.",
      "We are committed to delivering a clear, implementable plan, a user-friendly zoning code, and strong engagement with your residents, Trustees, and Planning Commission.",
      "We appreciate your consideration and look forward to working together. Sincerely,"
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
    contact.addText(company?.email || "email@gmail.com", { font_face: "Calibri" });
    contact.addLineBreak();
    contact.addText(company?.phone || "111-222-33", { font_face: "Calibri" });

    docx.putPageBreak();
  }

  // ---------------- SECTIONS ----------------
  addSections(docx, sections = {}) {
    if (!sections || typeof sections !== "object") return;

    const sectionEntries = Object.entries(sections).filter(([sectionName]) => sectionName !== "Title");
    
    sectionEntries.forEach(([sectionName, sectionData], index) => {
      // Header logos are already added in the main generation flow

      const heading = docx.createP({ align: "center" });
      heading.addText(sectionName, { bold: true, font_size: 13, font_face: "Calibri", color: "073763" });

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
      const lines = para.split('\n');
      
      if (lines.length === 1) {
        // Single line paragraph
        const p = docx.createP();
        // Only convert to bullet if line starts with dash and has content after it
        if (para.trim().startsWith('-') && para.trim().length > 1) {
          const bulletText = para.trim().substring(1).trim();
          if (bulletText) { // Only add bullet if there's content after the dash
            p.addText('• ', { font_size: 12, font_face: "Calibri" });
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
          if (line.trim().startsWith('-') && line.trim().length > 1) {
            const bulletText = line.trim().substring(1).trim();
            if (bulletText) { // Only add bullet if there's content after the dash
              p.addText('• ', { font_size: 12, font_face: "Calibri" });
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
            .map((c) => c.replace(/<br\s*\/?>/gi, '\n')) // Convert <br> tags to line breaks
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
    const rowCount = table.length;
    
    // Check for specific keywords in content to determine table type
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('budget') || contentLower.includes('cost') || contentLower.includes('price')) {
      return 'budget';
    } else if (contentLower.includes('timeline') || contentLower.includes('schedule') || contentLower.includes('phase')) {
      return 'timeline';
    } else if (contentLower.includes('team') || contentLower.includes('member') || contentLower.includes('staff')) {
      return 'team';
    } else if (columnCount >= 4) {
      return 'wide';
    } else if (columnCount === 2) {
      return 'narrow';
    } else {
      return 'default';
    }
  }

  // ---------------- TABLE FORMATTING ----------------
  createFormattedTable(table, tableType = 'default') {
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
              sz: '24',
              font_face: "Calibri",
              align: this.getHeaderAlignment(tableType, cellIndex),
              vAlign: "center",
              shd: {
                fill: this.getHeaderColor(tableType),
                themeFill: "text1",
                "themeFillTint": "80"
              }
            }
          };
        }
        
        // Data row formatting
        return {
          val: processedCell,
          opts: {
            b: false,
            sz: '22',
            font_face: "Calibri",
            align: this.getDataAlignment(tableType, cellIndex),
            vAlign: "top"
          }
        };
      });
    });
  }

  processTableCellContent(cell) {
    // Convert line breaks to array format for multi-line cells
    if (typeof cell === 'string' && cell.includes('\n')) {
      return cell.split('\n').filter(line => line.trim() !== '');
    }
    return cell;
  }

  getHeaderAlignment(tableType, cellIndex) {
    switch (tableType) {
      case 'budget':
        return "center";
      case 'timeline':
        return "center";
      case 'team':
        return "left";
      default:
        return "center";
    }
  }

  getDataAlignment(tableType, cellIndex) {
    switch (tableType) {
      case 'budget':
        return "center";
      case 'timeline':
        return "center";
      case 'team':
        return "left";
      default:
        return "left";
    }
  }

  getHeaderColor(tableType) {
    switch (tableType) {
      case 'budget':
        return "E6F3FF"; // Light blue
      case 'timeline':
        return "E6FFE6"; // Light green
      case 'team':
        return "FFF0E6"; // Light orange
      default:
        return "D9D9D9"; // Light gray
    }
  }

  createTableStyle(tableType = 'default') {
    const baseStyle = {
      tableSize: 24,
      tableColor: "000000",
      tableAlign: "left",
      tableFontFamily: "Calibri",
      spacingBefore: 100,
      spacingAfter: 100,
      spacingLine: 240,
      spacingLineRule: 'atLeast',
      indent: 0,
      fixedLayout: true,
      borders: true,
      borderSize: 4
    };

    switch (tableType) {
      case 'budget':
        return {
          ...baseStyle,
          tableColWidth: 3000,
          columns: [{ width: 2000 }, { width: 1000 }, { width: 300 }]
        };
      case 'timeline':
        return {
          ...baseStyle,
          tableColWidth: 4500,
          columns: [{ width: 800 }, { width: 1600 }, { width: 2100 }]
        };
      case 'team':
        return {
          ...baseStyle,
          tableColWidth: 4000,
          columns: [{ width: 2000 }, { width: 2000 }]
        };
      case 'wide':
        return {
          ...baseStyle,
          tableColWidth: 8000,
          fixedLayout: false
        };
      case 'narrow':
        return {
          ...baseStyle,
          tableColWidth: 3000,
          columns: [{ width: 1500 }, { width: 1500 }]
        };
      default:
        return {
          ...baseStyle,
          tableColWidth: 4000
        };
    }
  }
}

module.exports = DocxGenerator;
