/**
 * Sanitizes CSV data to prevent CSV formula injection (CSV Injection / CWE-1236)
 * when opening exported files in Microsoft Excel, Google Sheets, or LibreOffice.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  let str = String(value);

  // If the cell starts with formula characters (=, +, -, @, tab, CR), prepend a single quote
  const formulaChars = ['=', '+', '-', '@', '\t', '\r'];
  if (str.length > 0 && formulaChars.includes(str.charAt(0))) {
    str = `'${str}`;
  }

  // If string contains comma, quote, or newline, escape internal quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function arrayToCsvRow(cells: unknown[]): string {
  return cells.map(sanitizeCsvCell).join(',');
}
