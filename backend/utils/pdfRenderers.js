/**
 * PDF Rendering Utilities
 * Helper functions for rendering tables, markdown content, and formatted text in PDFKit documents
 */

/**
 * Render a markdown table in a PDF document
 * @param {PDFDocument} doc - The PDFKit document instance
 * @param {string} content - The markdown table content
 */
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

  // Note: Page break logic is now handled at the section level to prevent orphaned headings
  // This ensures the section heading and table stay together

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

/**
 * Render markdown-like content with support for bold (**text**), headings (#, ##, ###), and bullets (-)
 * @param {PDFDocument} doc - The PDFKit document instance
 * @param {string} rawContent - The markdown content to render
 * @param {Object} options - Rendering options (baseFontSize, align, lineGap)
 */
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

/**
 * Helper to render inline bold segments separated by ** **
 * @param {PDFDocument} doc - The PDFKit document instance
 * @param {string} text - The text with markdown bold syntax
 * @param {Object} opts - Rendering options (baseFontSize, align, lineGap, continuedEnd)
 */
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

module.exports = {
  renderTable,
  renderMarkdownContent,
  renderInlineBold
};
