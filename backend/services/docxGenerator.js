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
    ImageRun,
  } = require('docx');
const path = require('path');
  
  class DocxGenerator {
    constructor() {}
  
  async generateDocx(proposal, company) {
    // Build all children before constructing the Document
    const children = [];

    // Add title page (matching PDF format)
    this.addTitlePage(children, proposal, company);

    // Add cover letter page (matching PDF format)
    this.addCoverLetterPage(children, proposal, company);

    // Add proposal sections (matching PDF format)
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

    addHeaderLogos(children) {
      try {
        const fs = require("fs");
    
        const eighthGenLogoPath = path.join(__dirname, "../public/logos/Picture 1.png");
        const villageLogoPath = path.join(__dirname, "../public/logos/Picture 2.jpg");
    
        const eighthGenLogo = fs.existsSync(eighthGenLogoPath)
          ? Buffer.from(fs.readFileSync(eighthGenLogoPath))
          : null;
        const villageLogo = fs.existsSync(villageLogoPath)
          ? Buffer.from(fs.readFileSync(villageLogoPath))
          : null;
    
        // Only build table if at least one logo exists
        if (eighthGenLogo || villageLogo) {
          children.push(
            new Table({
              rows: [
                new TableRow({
                  children: [
                    // Left cell (Village Logo)
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: villageLogo
                            ? [
                                new ImageRun({
                                  data: villageLogo,
                                  transformation: { height: 50, width: 90 }, // keep proportions
                                }),
                              ]
                            : [],
                          alignment: AlignmentType.LEFT,
                        }),
                      ],
                      verticalAlign: "center",
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE },
                    }),
                    // Right cell (Eighth Gen Logo)
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: eighthGenLogo
                            ? [
                                new ImageRun({
                                  data: eighthGenLogo,
                                  transformation: { height: 50, width: 90 },
                                }),
                              ]
                            : [],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      verticalAlign: "center",
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE },
                    }),
                  ],
                }),
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
    
          // Add spacing after logos
          children.push(
            new Paragraph({
              children: [new TextRun("")],
              spacing: { after: 400 },
            })
          );
        }
      } catch (err) {
        console.warn("Could not load logos for DOCX:", err.message);
      }
    }
    
    

    addTitlePage(children, proposal, company) {
      // Add header logos (matching PDF format)
      this.addHeaderLogos(children);

      // Add proposal title (matching PDF format)
      if (proposal.title) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: proposal.title,
                bold: true,
                size: 24,
                color: "1a202c",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 600 },
          })
        );
      }

      // Extract contact information from Title section (matching PDF format)
      const titleSection = proposal.sections?.Title;
      let contactInfo = {};
      
      if (titleSection && typeof titleSection.content === 'object') {
        contactInfo = titleSection.content;
      }

      // Company name - use extracted data or fallback to company
      const submittedBy = contactInfo.submittedBy || company?.name || "Eighth Generation Consulting";
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Submitted by: ${submittedBy}`,
              bold: true,
              size: 14,
              color: "1a202c",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 400 },
        })
      );

      // Contact details - using extracted contact information (matching PDF format)
      const contactName = contactInfo.name || "Jose P, President";
      const contactEmail = contactInfo.email || company?.email;
      const contactPhone = contactInfo.number || company?.phone;

      if (contactName) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: contactName,
                size: 14,
                color: "1a202c",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 300 },
          })
        );
      }

      if (contactEmail) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: contactEmail,
                size: 12,
                color: "2d3748",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
          })
        );
      }

      if (contactPhone) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: contactPhone,
                size: 12,
                color: "2d3748",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
          })
        );
      }
    }

    addCoverLetterPage(children, proposal, company) {
      // Add page break
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          pageBreakBefore: true,
        })
      );

      // Add header logos (matching PDF format)
      this.addHeaderLogos(children);

      // Cover letter title (matching PDF format)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Zoning Code Update and Comprehensive Land Use Plan",
              bold: true,
              size: 20,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 },
        })
      );

      // Submitted to section (matching PDF format)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Submitted to:",
              bold: true,
              size: 12,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proposal.rfpId?.clientName || "Town of Amherst",
              bold: true,
              size: 12,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 200 },
        })
      );

      // Submitted by section (matching PDF format)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Submitted by:",
              bold: true,
              size: 12,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: company?.name || "Eighth Generation Consulting",
              bold: true,
              size: 12,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 200 },
        })
      );

      // Date (matching PDF format)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "09/16/2025",
              size: 12,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 100 },
        })
      );

      // Salutation (matching PDF format)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Dear Town Board and Planning Commission,",
              size: 12,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 300 },
        })
      );

      // Body paragraphs (matching PDF format exactly)
      const bodyParagraphs = [
        "On behalf of Eighth Generation Consulting, we are pleased to submit our proposal to partner with Town of Amherst on the development of a Comprehensive Land Use Plan and a complete Zoning Code Update. We recognize that this is a once-in-a-generation opportunity to modernize the Township's planning framework, protect its rural and agricultural character, and create a legally defensible, community-driven vision for the next 10–20 years.",
        "Our team brings extensive experience in rural township planning, zoning modernization, and community engagement, having successfully completed similar projects for small communities across the US. We understand the unique needs of Richfield Township: balancing growth pressures with preservation of farmland and residential quality of life.",
        "We are committed to delivering a clear, implementable plan, a user-friendly zoning code, and strong engagement with your residents, Trustees, and Planning Commission.",
        "We appreciate your consideration and look forward to working together."
      ];

      bodyParagraphs.forEach(paragraph => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph,
                size: 12,
                color: "000000",
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 200 },
          })
        );
      });

      // Closing (matching PDF format)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Sincerely,",
              size: 12,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 200, after: 400 },
        })
      );

      // Contact information (matching PDF format)
      const coverContactName = "Name, President";
      const coverContactEmail = company?.email || "email@gmail.com";
      const coverContactPhone = company?.phone || "111-222-33";

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: coverContactName,
              size: 12,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: coverContactEmail,
              size: 12,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: coverContactPhone,
              size: 12,
              color: "000000",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 200 },
        })
      );
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

    addTitleSection(children, sectionData) {
      const content = sectionData?.content || '';
      
      // Add Title heading
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Title",
              bold: true,
              size: 18,
              color: "1E4E9E",
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 300 },
        })
      );

      // Handle structured content (object) or string content
      if (typeof content === 'object' && content.submittedBy) {
        // Structured content
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Submitted by: ${content.submittedBy || 'Not specified'}`,
                bold: true,
                size: 14,
                color: "2D3748",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Name: ${content.name || 'Not specified'}`,
                size: 12,
                color: "4A5568",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${content.email || 'Not specified'}`,
                size: 12,
                color: "4A5568",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Number: ${content.number || 'Not specified'}`,
                size: 12,
                color: "4A5568",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          })
        );
      } else if (typeof content === 'string') {
        // String content - parse and format
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.trim()) {
            const isFirstLine = index === 0;
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: line.trim(),
                    bold: isFirstLine,
                    size: isFirstLine ? 14 : 12,
                    color: isFirstLine ? "2D3748" : "4A5568",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: isFirstLine ? 200 : 150 },
              })
            );
          }
        });
      }

      // Add spacing after title section
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 400 },
        })
      );
    }
  
    addSections(children, sections = {}) {
      if (!sections || typeof sections !== 'object') return;
  
      let sectionCount = 0;
      Object.entries(sections).forEach(([sectionName, sectionData]) => {
        // Skip Title section as it's already handled on the title page
        if (sectionName === "Title") {
          return;
        }
        
        // Add a new page for each section (matching PDF format)
        if (sectionCount > 0) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: "" })],
              pageBreakBefore: true,
            })
          );
        }
        sectionCount++;

        // Section heading (matching PDF format)
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
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 100 },
          })
        );
  
        // Section content (matching PDF format)
        const content = sectionData?.content || '';
        if (content.includes('|')) {
          this.addTable(children, content);
        } else {
          this.addTextContent(children, content);
        }
      });
    }
  
    addTextContent(children, content) {
      let cleanContent = content || "No content available";
  
      // Ensure content is a string
      if (typeof cleanContent !== 'string') {
        cleanContent = String(cleanContent);
      }
      
      // Clean markdown formatting (matching PDF format)
      cleanContent = cleanContent
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/^#{1,6}\s*/gm, '') // Remove headers
        .replace(/\n\n+/g, '\n\n'); // Clean up multiple newlines
  
      const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());
  
      paragraphs.forEach(paragraph => {
        const lines = paragraph.split('\n');
  
        lines.forEach((line, idx) => {
          if (line.trim()) {
            children.push(
              new Paragraph({
                children: [new TextRun({ 
                  text: line.trim(), 
                  size: 12,
                  color: "000000"
                })],
                alignment: line.startsWith('•') || line.startsWith('-')
                  ? AlignmentType.LEFT
                  : AlignmentType.LEFT, // Match PDF format - all left aligned
                spacing: { after: idx === lines.length - 1 ? 200 : 100 },
              })
            );
          }
        });
      });
    }
  
    addTable(children, content) {
      const lines = content.split("\n");
      const rows = [];
      
      for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) continue;
        
        // Skip markdown table separator lines (lines with only |, -, and spaces)
        if (/^[\s\|\-]+$/.test(line)) continue;
        
        // Only process lines that contain | and are not separator lines
        if (line.includes('|') && !/^[\s\|\-]+$/.test(line)) {
          const cells = line.split('|')
            .map(cell => cell.trim())
            .filter(cell => cell !== ''); // Remove empty cells
          
          if (cells.length > 0) {
            rows.push(cells);
          }
        }
      }
  
      if (!rows.length) return;
  
      const tableRows = rows.map(row =>
        new TableRow({
          children: row.map(cell =>
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: cell, 
                  size: 12,
                  color: "000000"
                })] 
              })],
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
  