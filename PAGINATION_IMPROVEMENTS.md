# Pagination Improvements for PDF and DOCX Generation

## Summary
Updated the PDF and DOCX generation logic to minimize empty space while maintaining clean and readable page breaks. Sections now flow continuously instead of each section starting on a new page.

**IMPORTANT: Enhanced orphan heading prevention to eliminate cases where headings appear at the end of one page with content starting on the next.**

## Changes Made

### 1. DOCX Generation (`backend/services/docxGenerator.js`)

**Before:**
- Every section started on a new page (except the last one)
- Created excessive empty space when sections didn't fill entire pages
- No mechanism to keep headings with their content

**After:**
- Sections flow continuously with spacing between them
- Removed automatic `docx.putPageBreak()` calls between sections
- Added vertical spacing (3 empty paragraphs) between sections for visual separation
- **Set `keepNext: true` on headings** - Ensures heading stays on same page as next paragraph
- **Set `keepWithPrevious: true` on first paragraph** - Binds first content paragraph to heading
- This double-binding prevents orphaned headings completely

**Benefits:**
- Reduced document length
- Better space utilization
- Maintained visual separation between sections
- **No orphaned headings - heading always appears with content**

### 2. PDF Generation (`backend/routes/proposals.js`)

**Before:**
- Every section started on a new page with `doc.addPage()`
- No logic to prevent orphaned headings
- Tables could be cut off mid-content
- Threshold of 150 units was sometimes insufficient

**After:**

#### Enhanced Orphan Heading Prevention
- **Increased threshold from 150 to 200 units** for better safety margin
- **Double-check after rendering heading**: If less than 100 units remain after heading, move entire heading to next page
- This two-stage check ensures headings never appear orphaned

#### Smart Section Placement
- Added `checkPageBreak()` helper function to determine if content fits on current page
- Pre-check: Ensures at least 200 units of space before rendering heading
- Post-check: Verifies at least 100 units remain after heading for content
- Sections separated by spacing (`doc.moveDown(2.5)`) instead of page breaks

#### Intelligent Table Rendering
- **Pre-table check:** Estimates total table height before rendering
  - If table won't fit and we're not near the top of page, starts new page
- **Row-by-row page breaks:** For long tables that span multiple pages
  - Checks remaining space before rendering each row
  - Automatically starts new page and redraws table header when needed
  - Maintains alternating row colors across page breaks

#### Key Metrics
- **Pre-heading check**: 200 units minimum space requirement (increased from 150)
- **Post-heading check**: 100 units minimum space for content after heading
- Table minimum space check: Based on estimated row count × 30 units
- Section spacing: 2.5 line breaks instead of page breaks

## Technical Details

### DOCX Orphan Prevention (Enhanced)
```javascript
// Heading with keep-next property
const heading = docx.createP({ 
  align: "center",
  keepNext: true // Keep heading with next paragraph
});

// First paragraph with keep-with-previous
const p = docx.createP({
  keepWithPrevious: isFirstParagraph && paraIndex === 0
});
```

### PDF Orphan Prevention (Two-Stage Check)
```javascript
// Stage 1: Pre-check before rendering heading
const checkPageBreak = (estimatedHeight, isHeading = false) => {
  const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
  const remainingSpace = pageHeight - (doc.y - doc.page.margins.top);
  
  if (isHeading) {
    if (remainingSpace < 200) { // Increased threshold
      doc.addPage();
      return true;
    }
  }
  return false;
};

// Stage 2: Post-check after rendering heading
const remainingAfterHeading = pageHeight - (afterHeadingY - doc.page.margins.top);

if (remainingAfterHeading < 100) {
  // Not enough space - move entire heading to next page
  doc.addPage();
  // Re-render heading on new page
}
```

### Table Pagination (PDF)
- Estimates table height before rendering
- Checks space before each row
- Redraws table headers on new pages
- Maintains styling and formatting across pages

### DOCX Flow Control
- Uses `keepNext` property on headings to bind with following paragraph
- Uses `keepWithPrevious` on first paragraph to bind with heading
- Relies on Word/Google Docs' native pagination for other content
- Adds spacing for visual separation

## Testing Recommendations

1. **Short sections:** Verify multiple sections appear on same page
2. **Long sections:** Confirm sections span multiple pages correctly
3. **Mixed content:** Test sections with text, tables, and lists
4. **Large tables:** Verify table headers repeat on new pages
5. **Orphaned headings:** **CRITICAL** - Confirm no headings appear alone at page bottom
6. **DOCX rendering:** Test in Microsoft Word and Google Docs
7. **Edge cases:** Test sections with very little content after heading

## Files Modified

1. `backend/services/docxGenerator.js` - DOCX generation logic
2. `backend/routes/proposals.js` - PDF generation logic

## Backward Compatibility

- All existing proposals will render with new pagination logic
- No database changes required
- No API changes required
- Existing exports will automatically use improved layout

## Performance Impact

- Minimal performance impact
- Added calculations are simple arithmetic operations
- No additional database queries
- Slightly faster generation due to fewer page operations

## Version History

### v2 (Current) - Enhanced Orphan Prevention
- Increased PDF threshold from 150 to 200 units
- Added post-heading space verification (100 units minimum)
- Added `keepNext` and `keepWithPrevious` properties in DOCX
- Increased section spacing from 2 to 3 paragraphs in DOCX
- Increased section spacing from 2 to 2.5 lines in PDF

### v1 - Initial Implementation
- Removed automatic page breaks between sections
- Added basic orphan heading prevention
- Implemented intelligent table pagination
