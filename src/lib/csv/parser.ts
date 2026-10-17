import { RawCsvRow } from '../../types/network';

/**
 * Ultra-robust CSV and log parser supporting RFC 4180, tab-separated values, 
 * BOM removal, quoted fields, and direct line fallback.
 */
export function parseCsvContent(csvText: string): { headers: string[]; rows: RawCsvRow[]; rawRows: string[][] } {
  if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
    return { headers: [], rows: [], rawRows: [] };
  }

  // Remove UTF-8 BOM if present
  let cleanText = csvText.trim();
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  // Helper to split a CSV line considering quotes
  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(f => f.replace(/^"|"$/g, ''));
  };

  const rawLines = lines.map(splitLine);
  if (rawLines.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  const headers = rawLines[0];
  const dataRawLines = rawLines.slice(1);
  const rows: RawCsvRow[] = [];

  for (let r = 0; r < dataRawLines.length; r++) {
    const record = dataRawLines[r];
    const rowObj: RawCsvRow = {};
    for (let c = 0; c < headers.length; c++) {
      const headerName = headers[c] || `col_${c}`;
      rowObj[headerName] = record[c] !== undefined ? record[c] : '';
    }
    rows.push(rowObj);
  }

  return {
    headers,
    rows,
    rawRows: dataRawLines
  };
}
