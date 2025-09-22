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
    title.addText(proposal.title || "Proposal Title", {
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

    const contact = docx.createP({ align: "center" });
    contact.addText(`Contact: ${company?.contact || "Jose P, President"}`, {
      font_size: 14,
      font_face: "Calibri",
    });
    contact.addLineBreak();
    contact.addText(" ", { font_size: 6, font_face: "Calibri" }); // <-- fake blank line for spacing

    contact.addText(`Email: ${company?.email || "N/A"}`, { font_size: 14, font_face: "Calibri" });
    contact.addLineBreak();
    contact.addText(" ", { font_size: 6, font_face: "Calibri" }); // spacing again

    contact.addText(`Phone: ${company?.phone || "N/A"}`, { font_size: 14, font_face: "Calibri" });

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

    Object.entries(sections).forEach(([sectionName, sectionData]) => {
      if (sectionName === "Title") return;

      // Header logos are already added in the main generation flow

      const heading = docx.createP({ align: "center" });
      heading.addText(sectionName, { bold: true, font_size: 11, font_face: "Calibri" });

      const content = sectionData?.content || "";
      if (typeof content === "string" && content.includes("|")) {
        this.addTable(docx, content);
      } else {
        this.addTextContent(docx, content);
      }

      docx.putPageBreak();
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
            .filter((c) => c !== "");
          if (cells.length) table.push(cells);
        }
      }

      if (table.length > 0) {
        // Create table with advanced formatting
        const tableData = this.createFormattedTable(table);
        const tableStyle = this.createTableStyle();
        
        docx.createTable(tableData, tableStyle);
      }
    } catch (error) {
      console.error("Error creating table:", error);
      // Fallback: just add the content as text
      docx.createP().addText(content, { font_face: "Calibri" });
    }
  }

  // ---------------- TABLE FORMATTING ----------------
  createFormattedTable(table) {
    return table.map((row, rowIndex) => {
      return row.map((cell, cellIndex) => {
        // Header row formatting
        if (rowIndex === 0) {
          return {
            val: cell,
            opts: {
              b: true,
              sz: '24',
              font_face: "Calibri",
              align: "center",
              vAlign: "center",
              shd: {
                fill: "D9D9D9",
                themeFill: "text1",
                "themeFillTint": "80"
              }
            }
          };
        }
        
        // Data row formatting
        return {
          val: cell,
          opts: {
            b: false,
            sz: '22',
            font_face: "Calibri",
            align: "left",
            vAlign: "top"
          }
        };
      });
    });
  }

  createTableStyle() {
    return {
      tableColWidth: 2000,
      tableSize: 24,
      tableColor: "000000",
      tableAlign: "left",
      tableFontFamily: "Calibri",
      spacingBefore: 100,
      spacingAfter: 100,
      spacingLine: 240,
      spacingLineRule: 'atLeast',
      indent: 0,
      fixedLayout: false,
      borders: true,
      borderSize: 4
    };
  }
}

module.exports = DocxGenerator;
