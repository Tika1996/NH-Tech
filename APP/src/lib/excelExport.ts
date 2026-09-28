import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  headers?: string[];
  rows?: (string | number | boolean | null | undefined)[][];
  columns?: ExcelColumn[];
  data?: Record<string, any>[];
}

/**
 * Generates and triggers download of a native Microsoft Excel (.xlsx) file.
 */
export function exportToExcel(options: ExcelExportOptions): void {
  try {
    const { filename, sheetName = 'Données' } = options;

    let headers: string[] = [];
    let rows: (string | number | boolean | null | undefined)[][] = [];

    if (options.columns && options.data) {
      headers = options.columns.map(c => c.header);
      rows = options.data.map(item => options.columns!.map(col => item[col.key]));
    } else if (options.headers && options.rows) {
      headers = options.headers;
      rows = options.rows;
    }

    const data = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Auto-fit column widths
    const colWidths = headers.map((header, colIndex) => {
      let maxLen = header.length;
      rows.forEach(row => {
        const val = row[colIndex];
        if (val !== null && val !== undefined) {
          const str = String(val);
          if (str.length > maxLen) maxLen = str.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
    });

    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const safeFilename = filename.toLowerCase().endsWith('.xlsx')
      ? filename
      : `${filename}.xlsx`;

    XLSX.writeFile(workbook, safeFilename);
  } catch (error) {
    console.error('Failed to generate XLSX file:', error);
    throw error;
  }
}
