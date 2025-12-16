const PDFDocument = require('pdfkit')
const path = require('path')
const { renderTable, renderMarkdownContent } = require('../utils/pdfRenderers')

class PdfGenerator {
  constructor() {
    this.logoConfig = null
    this.initializeLogoConfig()
  }

  /**
   * Initialize logo configuration
   */
  initializeLogoConfig() {
    try {
      const eighthGenLogoPath = path.join(
        __dirname,
        '../public/logos/Picture 1.png',
      )
      const polarisLogoPath = path.join(
        __dirname,
        '../public/logos/polaris.png',
      )

      this.logoConfig = {
        eighthGenLogoPath,
        polarisLogoPath,
        logoHeight: 60,
        logoSpacing: 40,
        logoY: 10,
      }
    } catch (logoError) {
      console.warn('Could not load logo paths:', logoError.message)
    }
  }

  /**
   * Add header logos to any page
   * @param {PDFDocument} doc - The PDFKit document instance
   */
  addHeaderLogos(doc, company) {
    if (!this.logoConfig) return

    try {
      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right
      const logoWidth = 80
      const logoHeight = 60
      const logoY = 20
      const logoSpacing = 20

      // Company logo (top-right corner). Prefer Polaris if available.
      const name = String(company?.name || '').toLowerCase()
      const preferredLogo =
        name.includes('polaris') && this.logoConfig.polarisLogoPath
          ? this.logoConfig.polarisLogoPath
          : this.logoConfig.eighthGenLogoPath

      doc.image(
        preferredLogo,
        doc.page.width - logoWidth - logoSpacing,
        logoY,
        {
          width: logoWidth,
          height: logoHeight,
          fit: [logoWidth, logoHeight],
          align: 'right',
        },
      )

      // Set the Y position after logos
      doc.y = logoY + logoHeight + 30
    } catch (logoError) {
      console.warn('Could not render logos:', logoError.message)
    }
  }

  /**
   * Render the title page
   * @param {PDFDocument} doc - The PDFKit document instance
   * @param {Object} proposal - The proposal data
   * @param {Object} company - The company data
   */
  renderTitlePage(doc, proposal, company) {
    // Title
    if (proposal.title) {
      doc
        .fontSize(24)
        .fillColor('#1a202c')
        .text(proposal.title, {
          align: 'center',
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
        })
      doc.moveDown(4)
    }

    // Extract contact information from Title section
    const titleSection = proposal.sections?.Title
    let contactInfo = {}

    if (titleSection && typeof titleSection.content === 'object') {
      contactInfo = titleSection.content
    }

    // Company name - use extracted data or fallback to company
    const submittedBy = contactInfo.submittedBy || company?.name
    if (submittedBy) {
      doc
        .fontSize(14)
        .fillColor('#1a202c')
        .text(`Submitted by: ${submittedBy}`, {
          align: 'center',
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
        })

      doc.moveDown(3)
    }

    // Contact details - using extracted contact information
    const contactName = contactInfo.name || 'Jose P, President'
    const contactEmail = contactInfo.email || company?.email
    const contactPhone = contactInfo.number || company?.phone

    if (contactName) {
      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#1a202c')
        .text(contactName, {
          align: 'center',
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
        })
      doc.moveDown(2)
    }

    if (contactEmail) {
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#2d3748')
        .text(contactEmail, {
          align: 'center',
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
        })
      doc.moveDown(1.5)
    }

    if (contactPhone) {
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#2d3748')
        .text(contactPhone, {
          align: 'center',
          width:
            doc.page.width - doc.page.margins.left - doc.page.margins.right,
        })
      doc.moveDown(1.5)
    }
  }

  /**
   * Helper function to check if we need a page break before adding content
   * @param {PDFDocument} doc - The PDFKit document instance
   * @param {number} estimatedHeight - The estimated height of content
   * @param {boolean} isHeading - Whether this is a heading
   */
  checkPageBreak(doc, estimatedHeight, isHeading = false) {
    const pageHeight =
      doc.page.height - doc.page.margins.top - doc.page.margins.bottom
    const remainingSpace = pageHeight - (doc.y - doc.page.margins.top)

    if (isHeading) {
      // For headings, ensure at least 200 units of space for heading + some content
      if (remainingSpace < 200) {
        doc.addPage()
        return true
      }
    } else {
      // For regular content, add page break if content won't fit
      if (remainingSpace < estimatedHeight) {
        doc.addPage()
        return true
      }
    }
    return false
  }

  /**
   * Render a single section
   * @param {PDFDocument} doc - The PDFKit document instance
   * @param {string} sectionName - The name of the section
   * @param {Object} sectionData - The section data
   */
  renderSection(doc, sectionName, sectionData) {
    // Special handling for table sections to prevent orphaned headings
    const isTableSection =
      sectionData.content &&
      typeof sectionData.content === 'string' &&
      sectionData.content.includes('|')

    if (isTableSection) {
      // For table sections, be very aggressive to prevent orphaned headings
      const pageHeight =
        doc.page.height - doc.page.margins.top - doc.page.margins.bottom
      const remainingSpace = pageHeight - (doc.y - doc.page.margins.top)

      // Count table rows to estimate minimum space needed
      const tableRows = sectionData.content
        .split('\n')
        .filter(
          (line) =>
            line.trim().includes('|') &&
            !line.trim().match(/^[\s\-\|]+$/) &&
            line.trim().length > 0,
        )
      const minTableHeight = Math.max(120, Math.min(tableRows.length * 25, 300))

      // If not enough space for heading + minimum table content, start new page
      if (remainingSpace < minTableHeight) {
        doc.addPage()
      }
    } else {
      // For non-table sections, use normal orphan prevention
      this.checkPageBreak(doc, 0, true)
    }

    // Section title
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#1E4E9E')
      .text(sectionName, {
        align: 'center',
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      })

    doc.moveDown(0.5)

    // After rendering heading, check if we have enough space for at least some content
    if (!isTableSection) {
      const afterHeadingY = doc.y
      const pageHeight =
        doc.page.height - doc.page.margins.top - doc.page.margins.bottom
      const remainingAfterHeading =
        pageHeight - (afterHeadingY - doc.page.margins.top)

      if (remainingAfterHeading < 100) {
        // Not enough space after heading - move entire heading to next page
        doc.addPage()
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor('#1E4E9E')
          .text(sectionName, {
            align: 'center',
            width:
              doc.page.width - doc.page.margins.left - doc.page.margins.right,
          })
        doc.moveDown(0.5)
      }
    }

    // Section content
    this.renderSectionContent(doc, sectionName, sectionData)

    // Add extra space at the end of each section
    doc.moveDown(1.5)
  }

  /**
   * Render section content based on type
   * @param {PDFDocument} doc - The PDFKit document instance
   * @param {string} sectionName - The name of the section
   * @param {Object} sectionData - The section data
   */
  renderSectionContent(doc, sectionName, sectionData) {
    if (sectionName === 'Title' && typeof sectionData.content === 'object') {
      // Handle Title section with object content
      const titleData = sectionData.content
      let titleContent = ''

      if (titleData.submittedBy) {
        titleContent += `Submitted by: ${titleData.submittedBy}\n`
      }
      if (titleData.name) {
        titleContent += `Name: ${titleData.name}\n`
      }
      if (titleData.email) {
        titleContent += `Email: ${titleData.email}\n`
      }
      if (titleData.number) {
        titleContent += `Number: ${titleData.number}\n`
      }

      doc
        .fontSize(11)
        .fillColor('#000000')
        .text(titleContent || 'No contact information available', {
          align: 'center',
          lineGap: 6,
        })
    } else if (
      sectionName === 'Title' &&
      typeof sectionData.content === 'string'
    ) {
      // Handle Title section with string content
      let titleContent = sectionData.content
      const lines = titleContent.split('\n')

      lines.forEach((line) => {
        if (!line.trim()) {
          doc.moveDown(0.5)
          return
        }

        // Check if line has bold markdown formatting **text**
        if (line.includes('**')) {
          const parts = line.split(/(\*\*.*?\*\*)/g)

          parts.forEach((part) => {
            if (!part) return

            if (part.startsWith('**') && part.endsWith('**')) {
              const boldText = part.slice(2, -2)
              doc
                .font('Helvetica-Bold')
                .fontSize(11)
                .fillColor('#000000')
                .text(boldText, {
                  continued: true,
                  align: 'center',
                })
            } else {
              doc
                .font('Helvetica')
                .fontSize(11)
                .fillColor('#000000')
                .text(part, {
                  continued: false,
                  align: 'center',
                  lineGap: 4,
                })
            }
          })
        } else {
          doc.font('Helvetica').fontSize(11).fillColor('#000000').text(line, {
            align: 'center',
            lineGap: 4,
          })
        }
      })
    } else if (
      sectionData.content &&
      typeof sectionData.content === 'string' &&
      sectionData.content.includes('|')
    ) {
      // Render table
      renderTable(doc, sectionData.content)
    } else {
      // Render content preserving bold and markdown headings
      const content =
        typeof sectionData.content === 'string'
          ? sectionData.content
          : String(sectionData.content || 'No content available')

      renderMarkdownContent(doc, content, {
        baseFontSize: 11,
        align: 'justify',
        lineGap: 6,
      })
    }
  }

  /**
   * Generate PDF document and return as stream
   * @param {Object} proposal - The proposal data
   * @param {Object} company - The company data
   * @param {Stream} outputStream - The output stream to pipe to
   * @returns {PDFDocument} The PDFKit document instance
   */
  generatePdf(proposal, company, outputStream) {
    const doc = new PDFDocument({ margin: 50 })
    doc.pipe(outputStream)

    // Add page event handler to add headers to all pages
    doc.on('pageAdded', () => {
      this.addHeaderLogos(doc, company)
    })

    // Add header to first page
    this.addHeaderLogos(doc, company)

    // Render title page
    this.renderTitlePage(doc, proposal, company)

    // Add page break before sections
    doc.addPage()

    // Render sections
    const sections = proposal.sections || {}
    let sectionCount = 0

    Object.entries(sections).forEach(([sectionName, sectionData]) => {
      // Skip Title section as it's already handled on the title page
      if (sectionName === 'Title') {
        return
      }

      // Add spacing between sections (except the first one)
      if (sectionCount > 0) {
        doc.moveDown(2.5)
      }
      sectionCount++

      this.renderSection(doc, sectionName, sectionData)
    })

    // End the PDF generation
    doc.end()

    return doc
  }
}

module.exports = PdfGenerator
