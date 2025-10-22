const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const PDFDocument = require('pdfkit');

// Single function that finds dates and, if in the past, shifts them to the same day next year.
function replaceDatesPreservingFormat(text) {
  const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
  const shiftIfPast = (date) => {
    const now = new Date();
    return date < now
      ? new Date(date.getFullYear() + 1, date.getMonth(), date.getDate())
      : date;
  };
  const monthIndex = (token) => {
    const map = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };
    const idx = map[(token || '').toLowerCase()];
    return typeof idx === 'number' ? idx : -1;
  };

  let out = text;

  // YYYY-MM-DD or YYYY/MM/DD
  out = out.replace(/(\b)(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(\b)/g, (match, b1, y, m, d, b2) => {
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    if (isNaN(date.getTime())) return match;
    const shifted = shiftIfPast(date);
    if (shifted.getTime() === date.getTime()) return match;
    const sep = match.includes('/') ? '/' : '-';
    return `${b1}${shifted.getFullYear()}${sep}${pad2(shifted.getMonth() + 1)}${sep}${pad2(shifted.getDate())}${b2}`;
  });

  // DD/MM/YYYY or DD-MM-YYYY
  out = out.replace(/(\b)(\d{1,2})[-\/]\d{1,2}[-\/]\d{4}(\b)/g, (match) => {
    // Re-match to capture groups cleanly
    const m = match.match(/(\b)(\d{1,2})[-\/]?(\d{1,2})[-\/]?(\d{4})(\b)/);
    if (!m) return match;
    const [, b1, dd, mm, yyyy, b2] = m;
    const date = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    if (isNaN(date.getTime())) return match;
    const shifted = shiftIfPast(date);
    if (shifted.getTime() === date.getTime()) return match;
    const sep = match.includes('/') ? '/' : '-';
    return `${b1}${pad2(shifted.getDate())}${sep}${pad2(shifted.getMonth() + 1)}${sep}${shifted.getFullYear()}${b2 || ''}`;
  });

  // Mon DD, YYYY / Month DD, YYYY
  out = out.replace(/(\b)(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\s+(\d{1,2})(?:,)?\s+(\d{4})(\b)/g,
    (match, b1, mon, day, y, b2) => {
      const mi = monthIndex(mon);
      if (mi < 0) return match;
      const date = new Date(parseInt(y), mi, parseInt(day));
      if (isNaN(date.getTime())) return match;
      const shifted = shiftIfPast(date);
      if (shifted.getTime() === date.getTime()) return match;
      const hasComma = match.includes(',');
      return `${b1}${mon} ${parseInt(day)}${hasComma ? ',' : ''} ${shifted.getFullYear()}${b2}`;
    }
  );

  // DD Mon YYYY / DD Month YYYY
  out = out.replace(/(\b)(\d{1,2})\s+(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\s+(\d{4})(\b)/g,
    (match, b1, day, mon, y, b2) => {
      const mi = monthIndex(mon);
      if (mi < 0) return match;
      const date = new Date(parseInt(y), mi, parseInt(day));
      if (isNaN(date.getTime())) return match;
      const shifted = shiftIfPast(date);
      if (shifted.getTime() === date.getTime()) return match;
      return `${b1}${parseInt(day)} ${mon} ${shifted.getFullYear()}${b2}`;
    }
  );

  return out;
}

async function convertPdfDates(inputPath, outputPath) {
  const buffer = fs.readFileSync(inputPath);
  const data = await pdfParse(buffer);

  // Merge all text content (simple approach)
  const originalText = data.text;
  const updatedText = replaceDatesPreservingFormat(originalText);

  // Write a basic PDF with updated text (layout not preserved)
  const doc = new PDFDocument({ margin: 50 });
  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Split by pages approximately using form feed markers if any, else just flow
    const lines = updatedText.split(/\r?\n/);
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
    const lineHeight = 14;
    let y = doc.y;
    for (const line of lines) {
      if (y + lineHeight > pageHeight) {
        doc.addPage();
        y = doc.y;
      }
      doc.text(line, { lineBreak: true });
      y += lineHeight;
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

if (require.main === module) {
  const input = process.argv[2];
  const output = process.argv[3] || path.join(process.cwd(), 'output.pdf');
  if (!input) {
    console.error('Usage: node utils/convertPdfDates.js <input.pdf> <output.pdf>');
    process.exit(1);
  }
  convertPdfDates(input, output)
    .then(() => console.log('Updated PDF written to', output))
    .catch(err => {
      console.error('Failed to convert PDF dates:', err);
      process.exit(1);
    });
}

module.exports = { convertPdfDates };
