// Helpers to handle Title section which stores an object
export const formatTitleObjectToText = (obj: any): string => {
  if (!obj || typeof obj !== 'object') return '';
  const { submittedBy, name, email, number } = obj as {
    submittedBy?: string; name?: string; email?: string; number?: string;
  };
  const parts: string[] = [];
  if (submittedBy) parts.push(`Submitted by: ${submittedBy}`);
  if (name) parts.push(`Name: ${name}`);
  if (email) parts.push(`Email: ${email}`);
  if (number) parts.push(`Number: ${number}`);
  return parts.join("\n");
};

export const parseTitleTextToObject = (text: string): any => {
  const lines = (text || '').split(/\r?\n/);
  const result: any = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    if (!val) continue;
    if (key.startsWith('submitted')) result.submittedBy = val;
    else if (key === 'name') result.name = val;
    else if (key === 'email') result.email = val;
    else if (key === 'number' || key === 'phone') result.number = val;
  }
  return result;
};

// Helper function to render content with proper table formatting
export const renderSectionContent = (content: any, sectionName: string): string => {
  if (!content) return "No content available";

  // Handle Title section with object content
  if (sectionName === "Title") {
    if (typeof content === "object" && content !== null) {
      const titleData = content as { submittedBy?: string; name?: string; email?: string; number?: string };
      
      // Check if the object has any valid content
      const hasValidContent = titleData.submittedBy || titleData.name || titleData.email || titleData.number;
      
      if (!hasValidContent) {
        return `<div class="title-section"><p class="text-gray-500 italic">No contact information available</p></div>`;
      }
      
      return `
          <div class="title-section">
            ${titleData.submittedBy ? `<p><strong>Submitted by:</strong> ${titleData.submittedBy}</p>` : ''}
            ${titleData.name ? `<p><strong>Name:</strong> ${titleData.name}</p>` : ''}
            ${titleData.email ? `<p><strong>Email:</strong> ${titleData.email}</p>` : ''}
            ${titleData.number ? `<p><strong>Number:</strong> ${titleData.number}</p>` : ''}
          </div>
        `;
    }
    if (typeof content === 'string') {
      // If backend sent Title as a string, render line by line
      const lines = content.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) {
        return `<div class="title-section"><p class="text-gray-500 italic">No contact information available</p></div>`;
      }
      return `
          <div class="title-section">
            ${lines.map(line => `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>')}</p>`).join('')}
          </div>
        `;
    }
    
    // If content is neither object nor string, show fallback
    return `<div class="title-section"><p class="text-gray-500 italic">Title section content format not recognized</p></div>`;
  }

  // Ensure content is a string for other sections
  const contentStr = typeof content === 'string' ? content : String(content);
  if (!contentStr) return "No content available";

  // Check if this section contains table data (Budget Estimate or Project Timeline)
  const isTableSection =
    sectionName.toLowerCase().includes("budget") ||
    sectionName.toLowerCase().includes("timeline") ||
    contentStr.includes("|"); // Contains pipe characters (markdown table)

  if (isTableSection && contentStr.includes("|")) {
    return renderMarkdownTable(contentStr);
  }

  // Regular content formatting
  return contentStr
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^• (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>");
};

// Helper function to render markdown tables as proper HTML tables
export const renderMarkdownTable = (content: string): string => {
  const lines = content.split("\n");
  let tableHtml = "";
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes("|") && !line.match(/^[\s\-\|]+$/)) {
      // This is a table row (not a separator line)
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
    } else if (inTable && line.match(/^[\s\-\|]+$/)) {
      // This is a table separator line, skip it
      continue;
    } else if (inTable && line === "") {
      // End of table
      tableHtml += formatTableRows(tableRows);
      inTable = false;
      tableRows = [];
    } else if (!inTable) {
      // Regular content
      const formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");
      tableHtml += formattedLine ? `<p>${formattedLine}</p>` : "<br>";
    }
  }

  // Handle table at end of content
  if (inTable && tableRows.length > 0) {
    tableHtml += formatTableRows(tableRows);
  }

  return tableHtml;
};

// Helper function to format table rows into proper HTML table
export const formatTableRows = (rows: string[]): string => {
  if (rows.length === 0) return "";

  const headerRow = rows[0];
  const dataRows = rows.slice(1);

  // Parse a markdown table row while preserving intentionally empty cells
  const parseRow = (row: string) => {
    // Split into raw parts, then drop only the leading and trailing pipe placeholders
    const parts = row.split("|");
    if (parts.length > 0 && parts[0].trim() === "") parts.shift();
    if (parts.length > 0 && parts[parts.length - 1].trim() === "") parts.pop();
    // Do NOT filter empty cells; keep them to preserve alignment
    return parts.map((cell) => cell.trim());
  };

  const headerCells = parseRow(headerRow);
  const expectedCols = headerCells.length;

  let tableHtml =
    '<div class="overflow-hidden"><table class="w-full divide-y divide-gray-200 my-4">';

  // Header
  tableHtml += '<thead class="bg-gray-50">';
  tableHtml += "<tr>";
  headerCells.forEach((cell) => {
    const formattedCell = cell.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );
    tableHtml += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">${formattedCell}</th>`;
  });
  tableHtml += "</tr>";
  tableHtml += "</thead>";

  // Body
  tableHtml += '<tbody class="bg-white divide-y divide-gray-200">';
  dataRows.forEach((row, index) => {
    let cells = parseRow(row);
    // Pad or trim to expected column count to keep alignment stable
    if (cells.length < expectedCols) {
      cells = [...cells, ...Array(expectedCols - cells.length).fill("")];
    } else if (cells.length > expectedCols) {
      cells = cells.slice(0, expectedCols);
    }

    const isSubtotal = (cells[0] || "").toLowerCase().startsWith("subtotal");
    const isTotal = (cells[0] || "").toLowerCase().includes("total");

    tableHtml += `<tr class="${
      index % 2 === 0 ? "bg-white" : "bg-gray-50"
    }">`;
    cells.forEach((cell, ci) => {
      const content = cell === "" ? "&nbsp;" : cell;
      const formattedCell = content.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      );
      const extraClass = isSubtotal || isTotal ? "font-semibold" : "";
      tableHtml += `<td class="px-6 py-4 text-sm text-gray-900 break-words ${extraClass}">${formattedCell}</td>`;
    });
    tableHtml += "</tr>";
  });
  tableHtml += "</tbody>";
  tableHtml += "</table></div>";

  return tableHtml;
};

// Helper function to determine if a section is from content library
export const isContentLibrarySection = (sectionData: any): boolean => {
  return sectionData?.type === 'content-library';
};

// Helper function to get content library type from section name
export const getContentLibraryType = (sectionName: string): 'team' | 'references' | 'company' | null => {
  const title = sectionName.toLowerCase();
  
  // Check for Title section
  if (title === 'title') {
    return 'company';
  }
  
  // Check for cover letter/company sections
  if (title.includes('cover letter') || 
      title.includes('introduction letter') || 
      title.includes('transmittal letter')) {
    return 'company';
  }

  // Check for experience and qualifications sections
  if (title.includes('experience') ||
      title.includes('qualification') ||
      title.includes('firm qualification') ||
      title.includes('company qualification') ||
      title.includes('firm experience') ||
      title.includes('company experience') ||
      title.includes('background') ||
      title.includes('capabilities') ||
      title.includes('expertise') ||
      title.includes('credentials') ||
      title.includes('track record') ||
      title.includes('company profile')) {
    return 'company';
  }
  
  // Check for personnel/team sections
  if (title.includes('personnel') || 
      title.includes('team') || 
      title.includes('staff') || 
      title.includes('key personnel') ||
      title.includes('project team') ||
      title.includes('team member') ||
      title.includes('human resource') ||
      title.includes('expertise')) {
    return 'team';
  }
  
  // Check for references/experience sections
  if (title.includes('reference') || 
      (title.includes('experience') && !title.includes('personnel') && !title.includes('team') && !title.includes('key')) ||
      title.includes('past project') ||
      title.includes('client reference') ||
      title.includes('project portfolio')) {
    return 'references';
  }
  
  return null;
};

// Helper function to get selected IDs from section data
export const getSelectedIds = (sectionData: any): string[] => {
  return sectionData?.selectedIds || [];
};


