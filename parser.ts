import { RawCsvRow } from '../../types/network';

/**
 * RFC 4180 compliant CSV parser.
 * Supports:
 * - Commas within double quotes
 * - Escaped double quotes ("")
 * - Carriage returns (\r\n and \n)
 * - Blank lines (skips safely)
 * - Trailing whitespace handling
 */
export function parseCsvContent(csvText: string): { headers: string[]; rows: RawCsvRow[]; rawRows: string[][] } {
  if (!csvText || !csvText.trim()) {
    return { headers: [], rows: [], rawRows: [] };
  }

  const parsedLines: string[][] = [];
  let currentField = '';
  let currentRecord: string[] = [];
  let inQuotes = false;
  let i = 0;
  const len = csvText.length;

  while (i < len) {
    const char = csvText[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && csvText[i + 1] === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRecord.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (i + 1 < len && csvText[i + 1] === '\n') {
          i++; // skip \n of \r\n
        }
        currentRecord.push(currentField.trim());
        currentField = '';
        if (currentRecord.some(field => field.length > 0)) {
          parsedLines.push(currentRecord);
        }
        currentRecord = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRecord.push(currentField.trim());
        currentField = '';
        if (currentRecord.some(field => field.length > 0)) {
          parsedLines.push(currentRecord);
        }
        currentRecord = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Handle final field if text didn't end with newline
  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    if (currentRecord.some(field => field.length > 0)) {
      parsedLines.push(currentRecord);
    }
  }

  if (parsedLines.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  const headers = parsedLines[0].map(h => h.trim());
  const dataRows = parsedLines.slice(1);
  const rows: RawCsvRow[] = [];

  for (let r = 0; r < dataRows.length; r++) {
    const record = dataRows[r];
    const rowObj: RawCsvRow = {};
    for (let c = 0; c < headers.length; c++) {
      const headerName = headers[c];
      rowObj[headerName] = record[c] !== undefined ? record[c] : '';
    }
    rows.push(rowObj);
  }

  return {
    headers,
    rows,
    rawRows: dataRows
  };
}
