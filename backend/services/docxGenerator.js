const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
  } = require('docx');
  
  class DocxGenerator {
    constructor() {}
  
    async generateDocx(proposal, company) {
      // Build all children before constructing the Document
      const children = [];
  
      // Add header with logo
      await this.addHeader(children, company);
  
      // Add title
      this.addTitle(children, proposal);
  
      // Add RFP info
      if (proposal.rfpId && typeof proposal.rfpId === 'object') {
        this.addRFPInfo(children, proposal.rfpId);
      }
  
      // Add company info
      this.addCompanyInfo(children, company);
  
      // Add proposal sections
      this.addSections(children, proposal.sections);
  
      // Now create the document with valid sections
      const doc = new Document({
        creator: company?.name || "Eighth Generation Consulting",
        title: proposal.title,
        description: "Generated proposal document",
        sections: [
          {
            properties: {},
            children,
          },
        ],
      });
  
      return doc;
    }
  
    async addHeader(children, company) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "EIGHTH GENERATION CONSULTING",
              bold: true,
              size: 24,
              color: "1E4E9E",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Planning • Zoning • Community Development",
              size: 16,
              color: "1E4E9E",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }
  
    addTitle(children, proposal) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proposal.title,
              bold: true,
              size: 20,
              color: "1E4E9E",
            }),
          ],
          alignment: AlignmentType.CENTER,
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        })
      );
    }
  
    addRFPInfo(children, rfp) {
      if (!rfp) return;
  
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "RFP Information",
              bold: true,
              size: 16,
              color: "1E4E9E",
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
  
      const rfpInfo = [
        `Client: ${rfp.clientName || 'Not specified'}`,
        `Project Type: ${rfp.projectType || 'Not specified'}`,
        `Location: ${rfp.location || 'Not specified'}`,
        `Budget Range: ${rfp.budgetRange || 'Not specified'}`,
        `Submission Deadline: ${rfp.submissionDeadline || 'Not specified'}`,
      ];
  
      rfpInfo.forEach(info => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: info, size: 12 })],
            spacing: { after: 100 },
          })
        );
      });
  
      if (rfp.keyRequirements?.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Key Requirements:",
                bold: true,
                size: 12,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );
  
        rfp.keyRequirements.forEach(req => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${req}`,
                  size: 12,
                }),
              ],
              spacing: { after: 50 },
            })
          );
        });
      }
    }
  
    addCompanyInfo(children, company) {
      if (!company) return;
  
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "About Our Firm",
              bold: true,
              size: 16,
              color: "1E4E9E",
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
  
      const companyInfo = [
        `Company: ${company.name || 'Eighth Generation Consulting'}`,
        `Address: ${company.address || 'Not specified'}`,
        `Phone: ${company.phone || 'Not specified'}`,
        `Email: ${company.email || 'Not specified'}`,
        `Website: ${company.website || 'Not specified'}`,
      ];
  
      companyInfo.forEach(info => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: info, size: 12 })],
            spacing: { after: 100 },
          })
        );
      });
  
      if (company.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: company.description,
                size: 12,
              }),
            ],
            spacing: { before: 200, after: 200 },
          })
        );
      }
    }
  
    addSections(children, sections = {}) {
      if (!sections || typeof sections !== 'object') return;
  
      Object.entries(sections).forEach(([sectionName, sectionData]) => {
        // Section heading
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sectionName,
                bold: true,
                size: 16,
                color: "1E4E9E",
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          })
        );
  
        // Section content
        const content = sectionData?.content || '';
        if (content.includes('|')) {
          this.addTable(children, content);
        } else {
          this.addTextContent(children, content);
        }
  
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "" })],
            spacing: { after: 300 },
          })
        );
      });
    }
  
    addTextContent(children, content) {
      let cleanContent = content || "No content available";
  
      cleanContent = cleanContent
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^#{1,6}\s*/gm, '');
  
      const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());
  
      paragraphs.forEach(paragraph => {
        const lines = paragraph.split('\n');
  
        lines.forEach((line, idx) => {
          if (line.trim()) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: line.trim(), size: 12 })],
                alignment: line.startsWith('•') || line.startsWith('-')
                  ? AlignmentType.LEFT
                  : AlignmentType.JUSTIFIED,
                spacing: { after: idx === lines.length - 1 ? 200 : 100 },
              })
            );
          }
        });
      });
    }
  
    addTable(children, content) {
      const rows = content
        .split("\n")
        .filter(row => row.includes('|'))
        .map(row =>
          row.split('|')
            .map(cell => cell.trim())
            .filter(Boolean)
        );
  
      if (!rows.length) return;
  
      const tableRows = rows.map(row =>
        new TableRow({
          children: row.map(cell =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: 12 })] })],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
            })
          ),
        })
      );
  
      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }
  }
  
  module.exports = DocxGenerator;
  