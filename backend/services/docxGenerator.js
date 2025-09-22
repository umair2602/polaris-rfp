const officegen = require("officegen");
const fs = require("fs");
const path = require("path");

class DocxGenerator {
  constructor() {}

  async generateDocx(proposal, company) {
    return new Promise((resolve, reject) => {
      const docx = officegen("docx");
      const { PassThrough } = require('stream');
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
  const eighthGenLogoPath = path.join(__dirname, "../public/logos/Picture 1.png");
  const villageLogoPath = path.join(__dirname, "../public/logos/Picture 2.jpg");

  // Global header for all pages
  const header = docx.getHeader();
  const para = header.createP();

  if (fs.existsSync(villageLogoPath)) {
    para.addImage(villageLogoPath, { cx: 110, cy: 80 });
  }

  // Add manual spaces (or tabs) between left & right logos
  para.addText(" ".repeat(100)); // adjust the repeat number until logos push apart

  if (fs.existsSync(eighthGenLogoPath)) {
    para.addImage(eighthGenLogoPath, { cx: 100, cy: 90 });
  }
}

  // ---------------- TITLE PAGE ----------------
  addTitlePage(docx, proposal, company) {
    // Header logos are already added in the main generation flow

    const title = docx.createP({ align: "center" });
    title.addText(proposal.title || "Proposal Title", { bold: true, font_size: 32 });

    const submittedBy = docx.createP({ align: "center" });
    submittedBy.addText(`Submitted by: ${company?.name || "Eighth Generation Consulting"}`, {
      bold: true,
      font_size: 16,
    });

    const contact = docx.createP({ align: "center" });
    contact.addText(
      `Contact: ${company?.contact || "Jose P, President"}\nEmail: ${company?.email || "N/A"}\nPhone: ${company?.phone || "N/A"}`,
      { font_size: 14 }
    );

    docx.putPageBreak();
  }

  // ---------------- COVER LETTER ----------------
  addCoverLetterPage(docx, proposal, company) {
    // Header logos are already added in the main generation flow

    const title = docx.createP({ align: "center" });
    title.addText("Zoning Code Update and Comprehensive Land Use Plan", {
      bold: true,
      font_size: 20,
    });

    const submittedTo = docx.createP();
    submittedTo.addText("Submitted to:", { bold: true });
    submittedTo.addLineBreak();
    submittedTo.addText(proposal.rfpId?.clientName || "Town of Amherst", { bold: true });

    const submittedBy = docx.createP();
    submittedBy.addText("Submitted by:", { bold: true });
    submittedBy.addLineBreak();
    submittedBy.addText(company?.name || "Eighth Generation Consulting", { bold: true });

    const date = docx.createP();
    date.addText("09/16/2025");

    const salutation = docx.createP();
    salutation.addText("Dear Town Board and Planning Commission,");

    const bodyParagraphs = [
      "On behalf of Eighth Generation Consulting, we are pleased to submit our proposal...",
      "Our team brings extensive experience in rural township planning...",
      "We are committed to delivering a clear, implementable plan...",
      "We appreciate your consideration and look forward to working together.",
    ];

    bodyParagraphs.forEach((para) => {
      const p = docx.createP();
      p.addText(para, { font_size: 12 });
    });

    const closing = docx.createP();
    closing.addText("Sincerely,");

    const contact = docx.createP();
    contact.addText("Name, President");
    contact.addLineBreak();
    contact.addText(company?.email || "email@gmail.com");
    contact.addLineBreak();
    contact.addText(company?.phone || "111-222-33");

    docx.putPageBreak();
  }

  // ---------------- SECTIONS ----------------
  addSections(docx, sections = {}) {
    if (!sections || typeof sections !== "object") return;

    Object.entries(sections).forEach(([sectionName, sectionData]) => {
      if (sectionName === "Title") return;

      // Header logos are already added in the main generation flow

      const heading = docx.createP({ align: "center" });
      heading.addText(sectionName, { bold: true, font_size: 18 });

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
      p.addText(para.trim(), { font_size: 12 });
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
        // Create a simple table with proper formatting
        const tableData = table.map(row => 
          row.map(cell => ({
            val: cell,
            opts: {
              cellColWidth: 2000, // Fixed width for all columns
              b: false,
              sz: '24'
            }
          }))
        );
        
        docx.createTable(tableData, {
          tableColWidth: 2000,
          tableSize: 24,
          tableColor: "000000",
          tableAlign: "left"
        });
      }
    } catch (error) {
      console.error("Error creating table:", error);
      // Fallback: just add the content as text
      docx.createP().addText(content);
    }
  }
}

module.exports = DocxGenerator;
