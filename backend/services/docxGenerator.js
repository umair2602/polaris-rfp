const officegen = require('officegen')
const fs = require('fs')
const path = require('path')

class DocxGenerator {
  constructor() {}

  async generateDocx(proposal, company) {
    return new Promise((resolve, reject) => {
      const docx = officegen({
        type: 'docx',
        orientation: 'portrait',
        pageMargins: {
          top: 1440, // 1 inch (1440 twips = 1 inch)
          right: 1440, // 1 inch
          bottom: 1440, // 1 inch
          left: 1440, // 1 inch
        },
        pageSize: 'A4',
      })

      const { PassThrough } = require('stream')
      const stream = new PassThrough()
      const buffer = []

      stream.on('data', (chunk) => buffer.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(buffer)))
      stream.on('error', (err) => reject(err))

      docx.on('error', (err) => reject(err))

      this.addHeaderLogos(docx, company)
      // ==== TITLE PAGE ====
      this.addTitlePage(docx, proposal, company)

      // ==== COVER LETTER PAGE ====
      this.addCoverLetterPage(docx, proposal, company)

      // ==== PROPOSAL SECTIONS ====
      this.addSections(docx, proposal.sections)

      // ==== GENERATE ====
      docx.generate(stream)
    })
  }

  // ---------------- HEADER LOGOS ----------------
  addHeaderLogos(docx, company) {
    const eighthGenLogoPath = path.join(
      __dirname,
      '../public/logos/Picture 1.png',
    )
    const polarisLogoPath = path.join(__dirname, '../public/logos/polaris.png')

    // Global header for all pages
    const header = docx.getHeader()
    const para = header.createP()

    // Company logo only (top-right-ish). Do NOT render client logos.
    // officegen does not support true right-aligned header images, so we approximate with spacing.
    const name = String(company?.name || '').toLowerCase()
    const preferredLogo =
      name.includes('polaris') && fs.existsSync(polarisLogoPath)
        ? polarisLogoPath
        : eighthGenLogoPath
    para.addText(' '.repeat(110))
    if (fs.existsSync(preferredLogo)) {
      para.addImage(preferredLogo, { cx: 100, cy: 90 })
    }
  }

  // ---------------- TITLE PAGE ----------------
  addTitlePage(docx, proposal, company) {
    // Header logos are already added in the main generation flow
    const emptyLine4 = docx.createP()
    emptyLine4.addText(' ')
    const emptyLine5 = docx.createP()
    emptyLine5.addText(' ')
    const emptyLine6 = docx.createP()
    emptyLine6.addText(' ')

    const title = docx.createP({ align: 'center' })
    // Clean title to remove duplicate "Proposal for" text
    let cleanTitle = proposal.title || 'Proposal Title'
    cleanTitle = cleanTitle.replace(
      /^Proposal for\s+Proposal for\s+/i,
      'Proposal for ',
    )
    title.addText(cleanTitle, {
      // bold: true,
      font_size: 23,
      font_face: 'Calibri',
    })

    const emptyLine = docx.createP()
    emptyLine.addText(' ')
    const emptyLine2 = docx.createP()
    emptyLine2.addText(' ')
    const emptyLine3 = docx.createP()
    emptyLine3.addText(' ')

    const titleSection = proposal.sections?.Title
    const contactInfo =
      titleSection &&
      typeof titleSection.content === 'object' &&
      titleSection.content
        ? titleSection.content
        : {}

    const submittedByValue =
      contactInfo.submittedBy || company?.name || 'Not specified'
    const contactNameValue =
      contactInfo.name ||
      (company?.name
        ? `${company.name.split(' ')[0]} Representative`
        : 'Not specified')
    const contactEmailValue =
      contactInfo.email || company?.email || 'Not specified'
    const contactPhoneValue =
      contactInfo.number || company?.phone || 'Not specified'

    const submittedBy = docx.createP({ align: 'center' })
    submittedBy.addText(`Submitted by: ${submittedByValue}`, {
      font_size: 13,
      font_face: 'Calibri',
    })
    const emptyLine9 = docx.createP()
    emptyLine9.addText(' ')

    const contact = docx.createP({ align: 'center' })
    contact.addText(`Contact: ${contactNameValue}`, {
      font_size: 14,
      font_face: 'Calibri',
    })

    const emptyLine10 = docx.createP()
    emptyLine10.addText(' ')

    const email = docx.createP({ align: 'center' })
    email.addText(`Email: ${contactEmailValue}`, {
      font_size: 14,
      font_face: 'Calibri',
    })

    const emptyLine11 = docx.createP()
    emptyLine11.addText(' ')

    const phone = docx.createP({ align: 'center' })
    phone.addText(`Phone: ${contactPhoneValue}`, {
      font_size: 14,
      font_face: 'Calibri',
    })

    docx.putPageBreak()
  }

  // ---------------- COVER LETTER ----------------
  addCoverLetterPage(docx, proposal, company) {
    // Header logos are already added in the main generation flow

    // Check if we have AI-generated cover letter content
    const coverLetterSection = proposal.sections?.['Cover Letter']

    if (coverLetterSection && coverLetterSection.content) {
      // Use AI-generated cover letter content
      this.addAICoverLetterContent(
        docx,
        coverLetterSection.content,
        proposal,
        company,
      )
    } else {
      // Fallback to hardcoded cover letter
      this.addHardcodedCoverLetter(docx, proposal, company)
    }
  }

  // ---------------- AI GENERATED COVER LETTER ----------------
  addAICoverLetterContent(docx, content, proposal, company) {
    // Add the cover letter title heading
    const title = docx.createP({ align: 'center' })
    title.addText('Cover Letter', {
      bold: true,
      font_size: 16,
      font_face: 'Calibri',
      color: '073763',
    })

    // Split by double newlines to get paragraphs, then filter out truly empty ones
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim())

    paragraphs.forEach((paragraph) => {
      const para = docx.createP()
      const trimmedParagraph = paragraph.trim()

      // Handle bold formatting within the paragraph
      if (trimmedParagraph.includes('**')) {
        const parts = trimmedParagraph.split('**')
        for (let i = 0; i < parts.length; i++) {
          if (i % 2 === 0) {
            // Regular text
            if (parts[i])
              para.addText(parts[i], { font_size: 12, font_face: 'Calibri' })
          } else {
            // Bold text
            if (parts[i])
              para.addText(parts[i], {
                bold: true,
                font_size: 12,
                font_face: 'Calibri',
              })
          }
        }
      } else {
        // No bold formatting, just add the paragraph as-is
        para.addText(trimmedParagraph, { font_size: 12, font_face: 'Calibri' })
      }
    })
  }

  // ---------------- HARDCODED COVER LETTER (FALLBACK) ----------------
  addHardcodedCoverLetter(docx, proposal, company) {
    const title = docx.createP({ align: 'center' })
    title.addText(proposal.title || 'Cover Letter', {
      bold: true,
      font_size: 11,
      font_face: 'Calibri',
    })

    const submittedTo = docx.createP()
    submittedTo.addText('Submitted to:', { bold: true, font_face: 'Calibri' })
    submittedTo.addLineBreak()
    submittedTo.addText(proposal.rfpId?.clientName || 'Town of Amherst', {
      bold: true,
      font_face: 'Calibri',
    })

    const submittedBy = docx.createP()
    submittedBy.addText('Submitted by:', { bold: true, font_face: 'Calibri' })
    submittedBy.addLineBreak()
    submittedBy.addText(company?.name || 'Not specified', {
      bold: true,
      font_face: 'Calibri',
    })

    const date = docx.createP()
    date.addText(new Date().toLocaleDateString('en-US'), {
      font_face: 'Calibri',
    })

    const salutation = docx.createP()
    salutation.addText('Dear Town Board and Planning Commission,', {
      font_face: 'Calibri',
    })

    const bodyParagraphs = [
      `On behalf of ${
        company?.name || 'our team'
      }, we are pleased to submit our proposal for your consideration. We understand the importance of delivering a compliant, high-quality response that directly addresses your scope, objectives, and evaluation criteria.`,
      'Our approach emphasizes clear deliverables, strong project management, and responsive stakeholder engagement. We will align our methodology, schedule, and budget to the RFP requirements and any stated deadlines and constraints.',
      'We appreciate your consideration and look forward to the opportunity to partner with you.',
    ]

    bodyParagraphs.forEach((para) => {
      const p = docx.createP()
      p.addText(para, { font_size: 12, font_face: 'Calibri' })
    })

    const closing = docx.createP()
    closing.addText('Sincerely,', { font_face: 'Calibri' })

    const contact = docx.createP()
    contact.addText(
      `${
        (proposal.sections?.Title?.content &&
          proposal.sections.Title.content.name) ||
        'Project Lead'
      }`,
      { font_face: 'Calibri' },
    )
    contact.addLineBreak()
    contact.addText(
      (proposal.sections?.Title?.content &&
        proposal.sections.Title.content.email) ||
        company?.email ||
        'Not specified',
      {
        font_face: 'Calibri',
      },
    )
    contact.addLineBreak()
    contact.addText(
      (proposal.sections?.Title?.content &&
        proposal.sections.Title.content.number) ||
        company?.phone ||
        'Not specified',
      { font_face: 'Calibri' },
    )
  }

  // ---------------- SECTIONS ----------------
  addSections(docx, sections = {}) {
    if (!sections || typeof sections !== 'object') return

    const sectionEntries = Object.entries(sections).filter(
      ([sectionName]) =>
        sectionName !== 'Title' && sectionName !== 'Cover Letter',
    )

    // Add page break before the first section (after cover letter)
    if (sectionEntries.length > 0) {
      docx.putPageBreak()
    }

    sectionEntries.forEach(([sectionName, sectionData], index) => {
      // Add spacing before each section (except the first one)
      if (index > 0) {
        // Add vertical spacing between sections
        const spacer1 = docx.createP()
        spacer1.addText(' ')
        const spacer2 = docx.createP()
        spacer2.addText(' ')
        const spacer3 = docx.createP()
        spacer3.addText(' ')
      }

      // Section heading with keep-with-next to prevent orphaning
      const heading = docx.createP({
        align: 'center',
        keepNext: true, // Keep heading with next paragraph to prevent orphaning
      })
      heading.addText(sectionName, {
        bold: true,
        font_size: 13,
        font_face: 'Calibri',
        color: '073763',
      })

      const content = sectionData?.content || ''
      if (typeof content === 'string' && content.includes('|')) {
        this.addTable(docx, content)
      } else {
        // Use special formatting for Key Personnel section
        if (sectionName === 'Key Personnel') {
          this.addKeyPersonnelContent(docx, content, true) // Pass true for first paragraph
        } else {
          this.addTextContent(docx, content, true) // Pass true for first paragraph
        }
      }

      // No automatic page breaks - let content flow naturally
    })
  }

  // ---------------- TEXT CONTENT ----------------
  addTextContent(docx, content, isFirstParagraph = false) {
    let cleanContent = content || 'No content available'
    if (typeof cleanContent !== 'string') {
      cleanContent = String(cleanContent)
    }

    // Remove markdown headers but keep bold formatting
    cleanContent = cleanContent
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\n\n+/g, '\n\n')

    const paragraphs = cleanContent.split('\n\n').filter((p) => p.trim())

    paragraphs.forEach((para, paraIndex) => {
      // First paragraph after heading should stay with heading
      const p = docx.createP({
        keepWithPrevious: isFirstParagraph && paraIndex === 0,
      })

      // Split paragraph by bold markers
      const parts = para.split(/(\*\*.*?\*\*)/g)

      parts.forEach((part) => {
        if (!part) return

        // Check if this part is bold
        if (part.startsWith('**') && part.endsWith('**')) {
          // Bold text
          const boldText = part.slice(2, -2)
          p.addText(boldText, {
            bold: true,
            font_size: 12,
            font_face: 'Calibri',
          })
        } else {
          // Regular text - remove any remaining italic markers
          const regularText = part.replace(/\*(.*?)\*/g, '$1')
          if (regularText.trim()) {
            p.addText(regularText, { font_size: 12, font_face: 'Calibri' })
          }
        }
      })
    })
  }

  // ---------------- KEY PERSONNEL CONTENT ----------------
  addKeyPersonnelContent(docx, content, isFirstParagraph = false) {
    let cleanContent = content || 'No content available'
    if (typeof cleanContent !== 'string') {
      cleanContent = String(cleanContent)
    }

    // Remove markdown headers but keep bold formatting
    cleanContent = cleanContent
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\n\n+/g, '\n\n')

    const paragraphs = cleanContent.split('\n\n').filter((p) => p.trim())

    paragraphs.forEach((para, paraIndex) => {
      // Check if paragraph contains lines that start with dashes
      const lines = para.split('\n')

      if (lines.length === 1) {
        // Single line paragraph - first paragraph should stay with heading
        const p = docx.createP({
          keepWithPrevious: isFirstParagraph && paraIndex === 0,
        })
        // Only convert to bullet if line starts with dash and has content after it
        if (para.trim().startsWith('-') && para.trim().length > 1) {
          const bulletText = para.trim().substring(1).trim()
          if (bulletText) {
            // Only add bullet if there's content after the dash
            p.addText('• ', { font_size: 12, font_face: 'Calibri' })

            // Handle bold formatting in bullet text
            const parts = bulletText.split(/(\*\*.*?\*\*)/g)
            parts.forEach((part) => {
              if (!part) return
              if (part.startsWith('**') && part.endsWith('**')) {
                p.addText(part.slice(2, -2), {
                  bold: true,
                  font_size: 12,
                  font_face: 'Calibri',
                })
              } else {
                const regularText = part.replace(/\*(.*?)\*/g, '$1')
                if (regularText.trim()) {
                  p.addText(regularText, {
                    font_size: 12,
                    font_face: 'Calibri',
                  })
                }
              }
            })
          } else {
            p.addText(para.trim(), { font_size: 12, font_face: 'Calibri' })
          }
        } else {
          // Handle bold formatting in regular text
          const parts = para.trim().split(/(\*\*.*?\*\*)/g)
          parts.forEach((part) => {
            if (!part) return
            if (part.startsWith('**') && part.endsWith('**')) {
              p.addText(part.slice(2, -2), {
                bold: true,
                font_size: 12,
                font_face: 'Calibri',
              })
            } else {
              const regularText = part.replace(/\*(.*?)\*/g, '$1')
              if (regularText.trim()) {
                p.addText(regularText, { font_size: 12, font_face: 'Calibri' })
              }
            }
          })
        }
      } else {
        // Multi-line paragraph - check each line
        lines.forEach((line, lineIndex) => {
          // First line of first paragraph should stay with heading
          const p = docx.createP({
            keepWithPrevious:
              isFirstParagraph && paraIndex === 0 && lineIndex === 0,
          })
          // Only convert to bullet if line starts with dash and has content after it
          if (line.trim().startsWith('-') && line.trim().length > 1) {
            const bulletText = line.trim().substring(1).trim()
            if (bulletText) {
              // Only add bullet if there's content after the dash
              p.addText('• ', { font_size: 12, font_face: 'Calibri' })

              // Handle bold formatting in bullet text
              const parts = bulletText.split(/(\*\*.*?\*\*)/g)
              parts.forEach((part) => {
                if (!part) return
                if (part.startsWith('**') && part.endsWith('**')) {
                  p.addText(part.slice(2, -2), {
                    bold: true,
                    font_size: 12,
                    font_face: 'Calibri',
                  })
                } else {
                  const regularText = part.replace(/\*(.*?)\*/g, '$1')
                  if (regularText.trim()) {
                    p.addText(regularText, {
                      font_size: 12,
                      font_face: 'Calibri',
                    })
                  }
                }
              })
            } else {
              p.addText(line.trim(), { font_size: 12, font_face: 'Calibri' })
            }
          } else {
            // Handle bold formatting in regular text
            const parts = line.trim().split(/(\*\*.*?\*\*)/g)
            parts.forEach((part) => {
              if (!part) return
              if (part.startsWith('**') && part.endsWith('**')) {
                p.addText(part.slice(2, -2), {
                  bold: true,
                  font_size: 12,
                  font_face: 'Calibri',
                })
              } else {
                const regularText = part.replace(/\*(.*?)\*/g, '$1')
                if (regularText.trim()) {
                  p.addText(regularText, {
                    font_size: 12,
                    font_face: 'Calibri',
                  })
                }
              }
            })
          }
        })
      }
    })
  }

  // ---------------- TABLE ----------------
  addTable(docx, content) {
    try {
      const lines = content.split('\n')
      const table = []
      let expectedCols = 0

      for (const line of lines) {
        if (!line.trim() || /^[\s\|\-]+$/.test(line)) continue

        if (line.includes('|')) {
          // Preserve intentionally empty cells between pipes to keep alignment
          let parts = line.split('|')
          if (parts.length && parts[0].trim() === '') parts.shift()
          if (parts.length && parts[parts.length - 1].trim() === '') parts.pop()
          const cells = parts
            .map((c) => c.trim())
            .map((c) => c.replace(/\*\*/g, '').replace(/\*/g, '')) // Remove ** and * markdown formatting
            .map((c) => c.replace(/<br\s*\/?>(?=.)/gi, '\n')) // Convert <br> tags to line breaks
            .map((c) => (c === '' ? '\u00A0' : c)) // Use NBSP for empty cells

          if (cells.length) {
            // Establish expected column count from header row
            if (expectedCols === 0) expectedCols = cells.length
            // Pad/trim to match header width
            const normalized =
              cells.length < expectedCols
                ? [
                    ...cells,
                    ...Array(expectedCols - cells.length).fill('\u00A0'),
                  ]
                : cells.slice(0, expectedCols)
            table.push(normalized)
          }
        }
      }

      if (table.length > 0) {
        // Determine table type and width based on content
        const tableType = this.determineTableType(table, content)
        const tableData = this.createFormattedTable(table, tableType)
        const tableStyle = this.createTableStyle(
          tableType,
          table[0]?.length || 0,
        )

        docx.createTable(tableData, tableStyle)
      }
    } catch (error) {
      console.error('Error creating table:', error)
      // Fallback: just add the content as text
      docx.createP().addText(content, { font_face: 'Calibri' })
    }
  }

  // ---------------- TABLE TYPE DETECTION ----------------
  determineTableType(table, content) {
    const columnCount = table[0] ? table[0].length : 0
    const firstRow = table[0] ? table[0].join(' ').toLowerCase() : ''
    const contentLower = content.toLowerCase()

    // Budget table detection - look for cost/price columns
    if (
      (firstRow.includes('phase') &&
        (firstRow.includes('cost') || firstRow.includes('price'))) ||
      firstRow.includes('budget') ||
      firstRow.includes('$') ||
      contentLower.includes('budget') ||
      contentLower.includes('cost breakdown')
    ) {
      return 'budget'
    }
    // Timeline table detection - look for schedule/timeline/milestone columns
    else if (
      firstRow.includes('timeline') ||
      firstRow.includes('schedule') ||
      firstRow.includes('milestone') ||
      firstRow.includes('deadline') ||
      firstRow.includes('duration') ||
      contentLower.includes('project schedule') ||
      contentLower.includes('timeline') ||
      contentLower.includes('schedule') ||
      (columnCount === 3 &&
        firstRow.includes('phase') &&
        (firstRow.includes('timeline') ||
          firstRow.includes('key activities') ||
          firstRow.includes('milestones') ||
          firstRow.includes('activities')))
    ) {
      return 'timeline'
    }
    // Methodology table detection - Phase | Deliverables format
    else if (
      (firstRow.includes('phase') && firstRow.includes('deliverable')) ||
      (columnCount === 2 &&
        (firstRow.includes('phase') || firstRow.includes('deliverable'))) ||
      contentLower.includes('methodology')
    ) {
      return 'methodology'
    }
    // Team table detection - look for personnel/team columns
    else if (
      firstRow.includes('team') ||
      firstRow.includes('personnel') ||
      firstRow.includes('member') ||
      firstRow.includes('staff') ||
      (firstRow.includes('name') && firstRow.includes('experience'))
    ) {
      return 'team'
    }
    // Wide table for 3+ columns
    else if (columnCount >= 3) {
      return 'wide'
    }
    // Narrow table for 2 columns
    else if (columnCount === 2) {
      return 'narrow'
    } else {
      return 'default'
    }
  }

  // ---------------- TABLE FORMATTING ----------------
  createFormattedTable(table, tableType = 'default') {
    return table.map((row, rowIndex) => {
      return row.map((cell, cellIndex) => {
        // Process cell content to handle line breaks
        const processedCell = this.processTableCellContent(cell)

        // Header row formatting
        if (rowIndex === 0) {
          return {
            val: processedCell,
            opts: {
              b: true,
              sz: '24',
              font_face: 'Calibri',
              align: this.getHeaderAlignment(tableType, cellIndex),
              vAlign: 'center',
              shd: {
                fill: this.getHeaderColor(tableType),
                themeFill: 'text1',
                themeFillTint: '80',
              },
            },
          }
        }

        // Data row formatting
        return {
          val: processedCell,
          opts: {
            b: false,
            sz: '22',
            font_face: 'Calibri',
            align: this.getDataAlignment(tableType, cellIndex),
            vAlign: 'top',
          },
        }
      })
    })
  }

  processTableCellContent(cell) {
    if (typeof cell === 'string') {
      // Convert line breaks to array format for multi-line cells
      if (cell.includes('\n')) {
        return cell.split('\n').filter((line) => line.trim() !== '')
      }

      // Handle <br> tags
      if (cell.includes('<br')) {
        return cell
          .replace(/<br\s*\/?>/gi, '\n')
          .split('\n')
          .filter((line) => line.trim() !== '')
      }

      // For very long text, add some basic word wrapping
      if (cell.length > 100) {
        // Split on periods, semicolons, or other natural breaks
        const sentences = cell.split(/(?<=[.!?;])\s+/)
        if (sentences.length > 1) {
          return sentences
        }
      }
    }
    return cell
  }

  getHeaderAlignment(tableType, cellIndex) {
    switch (tableType) {
      case 'budget':
        return 'center'
      case 'timeline':
        return 'center'
      case 'team':
        return 'left'
      default:
        return 'center'
    }
  }

  getDataAlignment(tableType, cellIndex) {
    switch (tableType) {
      case 'budget':
        // For 5-col budget: Phase(left), Role(left), Rate(center), Hours(center), Cost(right)
        if (cellIndex === 0 || cellIndex === 1) return 'left'
        if (cellIndex === 2 || cellIndex === 3) return 'center'
        if (cellIndex === 4) return 'right'
        return 'center'
      case 'timeline':
        // For 3-col timeline: Phase(left), Timeline(center), Activities(left)
        if (cellIndex === 0) return 'left' // Phase
        if (cellIndex === 1) return 'center' // Timeline
        if (cellIndex === 2) return 'left' // Key Activities
        return 'left'
      case 'team':
        return 'left'
      default:
        return 'left'
    }
  }

  getHeaderColor(tableType) {
    switch (tableType) {
      case 'budget':
        return 'E6F3FF' // Light blue
      case 'timeline':
        return 'FFF4E6' // Light amber/yellow - for schedule/timeline
      case 'team':
        return 'FFF0E6' // Light orange
      default:
        return 'D9D9D9' // Light gray
    }
  }

  createTableStyle(tableType = 'default', columnCount = 0) {
    const baseStyle = {
      tableSize: 24,
      tableColor: '000000',
      tableAlign: 'center', // Center tables on the page
      tableFontFamily: 'Calibri',
      spacingBefore: 100,
      spacingAfter: 100,
      spacingLine: 240,
      spacingLineRule: 'atLeast',
      indent: 0,
      fixedLayout: false, // Changed to false for better Google Docs compatibility
      borders: true,
      borderSize: 4,
      tableColWidth: 9000, // Moderate increase for better centering
    }

    switch (tableType) {
      case 'budget':
        // Dynamic widths: support 5-col resource budget or fallback to 3-col
        if (columnCount >= 5) {
          return {
            ...baseStyle,
            tableColWidth: 11000,
            columns: [
              { width: 3500 }, // Phase
              { width: 3000 }, // Role
              { width: 1500 }, // Hourly Rate
              { width: 1200 }, // Hours
              { width: 1800 }, // Cost ($)
            ],
          }
        }
        return {
          ...baseStyle,
          tableColWidth: 9000,
          columns: [
            { width: 3000 }, // Phase
            { width: 4500 }, // Description
            { width: 1500 }, // Cost
          ],
        }
      case 'timeline':
        // Support 3-column timeline table: Phase | Timeline | Key Activities & Milestones
        if (columnCount === 3) {
          return {
            ...baseStyle,
            tableColWidth: 10000,
            columns: [
              { width: 2800 }, // Phase column
              { width: 2200 }, // Timeline column
              { width: 5000 }, // Key Activities & Milestones column - wider for detailed descriptions
            ],
          }
        }
        // Fallback for other timeline formats
        return {
          ...baseStyle,
          tableColWidth: 9000,
          columns: [
            { width: 2500 }, // Phase column
            { width: 3000 }, // Timeline column
            { width: 3500 }, // Description column
          ],
        }
      case 'team':
        return {
          ...baseStyle,
          tableColWidth: 9000, // Moderate increase for better centering
          columns: [
            { width: 4000 }, // Name/Title column
            { width: 5000 }, // Experience/Qualifications column
          ],
        }
      case 'wide':
        return {
          ...baseStyle,
          tableColWidth: 10000, // Moderate increase for wide tables
          fixedLayout: false,
          columns: [
            { width: 5000 }, // Equal width columns
            { width: 5000 },
          ],
        }
      case 'narrow':
        return {
          ...baseStyle,
          tableColWidth: 8000, // Moderate increase for narrow tables
          columns: [
            { width: 4000 }, // Equal width columns
            { width: 4000 },
          ],
        }
      case 'methodology':
        return {
          ...baseStyle,
          tableColWidth: 9000, // Moderate increase for better centering
          columns: [
            { width: 3000 }, // Phase column
            { width: 6000 }, // Deliverables column - wider for content
          ],
        }
      default:
        return {
          ...baseStyle,
          tableColWidth: 9000, // Moderate increase for default tables
          columns: [
            { width: 4500 }, // Equal width columns
            { width: 4500 },
          ],
        }
    }
  }
}

module.exports = DocxGenerator
