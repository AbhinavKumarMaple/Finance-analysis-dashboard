/**
 * SBI Statement Parser Module
 *
 * Parses State Bank of India (SBI) Excel bank statements.
 * Extracts transaction data and detects payment methods from transaction details.
 *
 * SBI Statement Format:
 * - Columns: Date, Details, Ref No./Cheque No., Debit, Credit, Balance
 * - Date format: DD MMM YYYY (e.g., "01 Jan 2024")
 * - Amounts: Numbers with optional commas (e.g., "1,234.56")
 * - Payment methods detected from Details field
 *
 * Requirements: 1.3
 */

import * as XLSX from "xlsx";
import type {
  Transaction,
  BankProfile,
  ColumnMapping,
  PaymentMethod,
  ParseError,
} from "../../types/transaction";

/**
 * SBI bank profile configuration
 */
export const SBI_PROFILE: BankProfile = {
  bankName: "State Bank of India",
  columnMappings: {
    date: "Date",
    details: "Details",
    refNo: "Ref No./Cheque No.",
    debit: "Debit",
    credit: "Credit",
    balance: "Balance",
  },
  dateFormat: "DD MMM YYYY",
  skipRows: 0, // Number of header rows to skip
};

/**
 * Alternative column names that SBI might use
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  date: ["Date", "Txn Date", "Transaction Date", "Value Date"],
  details: ["Details", "Description", "Narration", "Particulars"],
  refNo: [
    "Ref No/Cheque No",
    "Ref No./Cheque No.",
    "Ref No",
    "Reference No",
    "Cheque No",
    "Transaction ID",
  ],
  debit: ["Debit", "Withdrawal", "Dr"],
  credit: ["Credit", "Deposit", "Cr"],
  balance: ["Balance", "Closing Balance", "Available Balance"],
};

/**
 * Payment method detection patterns
 */
const PAYMENT_METHOD_PATTERNS: Record<PaymentMethod, RegExp[]> = {
  UPI: [/UPI/i, /\bUPI\b/i, /UNIFIED PAYMENT/i],
  NEFT: [/NEFT/i, /\bNEFT\b/i, /NATIONAL ELECTRONIC/i],
  IMPS: [/IMPS/i, /\bIMPS\b/i, /IMMEDIATE PAYMENT/i],
  ATM: [/ATM/i, /\bATM\b/i, /CASH WITHDRAWAL/i, /\bCWD\b/i],
  POS: [/POS/i, /\bPOS\b/i, /POINT OF SALE/i, /CARD PURCHASE/i],
  CHEQUE: [
    /CHEQUE/i,
    /\bCHQ\b/i,
    /\bCHEQUE\b/i,
    /CHECK/i,
    /CLEARING/i,
    /\bCLG\b/i,
  ],
  OTHER: [],
};

/**
 * Detects payment method from transaction details
 *
 * @param details - Transaction details string
 * @returns PaymentMethod - Detected payment method
 */
export function detectPaymentMethod(details: string): PaymentMethod {
  if (!details) {
    return "OTHER";
  }

  const detailsUpper = details.toUpperCase();

  // Check each payment method pattern
  for (const [method, patterns] of Object.entries(PAYMENT_METHOD_PATTERNS)) {
    if (method === "OTHER") continue;

    for (const pattern of patterns) {
      if (pattern.test(detailsUpper)) {
        return method as PaymentMethod;
      }
    }
  }

  return "OTHER";
}

/**
 * Parses a date string in SBI format
 *
 * Supports formats:
 * - DD MMM YYYY (e.g., "01 Jan 2024")
 * - DD-MMM-YYYY (e.g., "01-Jan-2024")
 * - DD/MM/YYYY (e.g., "01/01/2024")
 * - YYYY-MM-DD (e.g., "2024-01-01")
 *
 * @param dateStr - Date string from statement
 * @returns Date | null - Parsed date or null if invalid
 */
export function parseSBIDate(dateStr: string | number): Date | null {
  if (!dateStr) {
    return null;
  }

  // Handle Excel serial date numbers
  if (typeof dateStr === "number") {
    // Excel dates are days since 1900-01-01 (with a leap year bug)
    const excelEpoch = new Date(1900, 0, 1);
    const days = dateStr - 2; // Adjust for Excel's leap year bug
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  const dateString = String(dateStr).trim();

  // Try parsing ISO date format (YYYY-MM-DD) - must have dashes and year first
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
  }

  // Try parsing DD MMM YYYY format (e.g., "01 Jan 2024")
  const monthNames: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  // Match DD MMM YYYY or DD-MMM-YYYY
  const match = dateString.match(/(\d{1,2})[\s\-]([a-z]{3})[\s\-](\d{4})/i);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase();
    const year = parseInt(match[3], 10);

    if (monthNames.hasOwnProperty(monthStr)) {
      const month = monthNames[monthStr];
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }
  }

  // Try parsing DD/MM/YYYY format
  const dmyMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // Month is 0-indexed
    const year = parseInt(dmyMatch[3], 10);
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Parses an amount string to number
 *
 * Handles:
 * - Commas in numbers (e.g., "1,234.56")
 * - Empty strings (returns null)
 * - Invalid numbers (returns null)
 *
 * @param amountStr - Amount string from statement
 * @returns number | null - Parsed amount or null if invalid/empty
 */
export function parseAmount(amountStr: string | number): number | null {
  if (amountStr === null || amountStr === undefined || amountStr === "") {
    return null;
  }

  // If already a number, return it
  if (typeof amountStr === "number") {
    return isNaN(amountStr) ? null : amountStr;
  }

  // Remove commas and parse
  const cleanStr = String(amountStr).replace(/,/g, "").trim();

  if (cleanStr === "" || cleanStr === "-") {
    return null;
  }

  const amount = parseFloat(cleanStr);
  return isNaN(amount) ? null : amount;
}

/**
 * Finds the actual column name from aliases
 *
 * @param headers - Array of column headers from the sheet
 * @param field - Field name to find
 * @returns string | null - Actual column name or null if not found
 */
function findColumnName(headers: string[], field: string): string | null {
  const aliases = COLUMN_ALIASES[field] || [];

  for (const alias of aliases) {
    const found = headers.find((h) => {
      if (!h) return false;
      const normalized = h.toLowerCase().trim().replace(/\s+/g, " ");
      const aliasNormalized = alias.toLowerCase().trim().replace(/\s+/g, " ");
      return normalized === aliasNormalized;
    });
    if (found) {
      return found;
    }
  }

  // Fallback: try partial matching for common variations
  if (field === "refNo") {
    const found = headers.find(
      (h) =>
        h &&
        (h.toLowerCase().includes("ref") || h.toLowerCase().includes("cheque")),
    );
    if (found) return found;
  }

  return null;
}

/**
 * Detects column mappings from sheet headers
 *
 * @param headers - Array of column headers from the sheet
 * @returns ColumnMapping | null - Detected column mappings or null if required columns not found
 */
export function detectColumnMappings(headers: string[]): ColumnMapping | null {
  const mappings: Partial<ColumnMapping> = {};

  console.log("Detecting columns from headers:", headers);

  // Try to find each required column
  for (const field of Object.keys(COLUMN_ALIASES)) {
    const columnName = findColumnName(headers, field);
    if (columnName) {
      mappings[field as keyof ColumnMapping] = columnName;
      console.log(`Mapped ${field} -> ${columnName}`);
    } else {
      console.log(`Could not find column for ${field}`);
    }
  }

  // Check if all required columns are found
  const requiredFields: (keyof ColumnMapping)[] = [
    "date",
    "details",
    "refNo",
    "debit",
    "credit",
    "balance",
  ];

  const missingFields: string[] = [];
  for (const field of requiredFields) {
    if (!mappings[field]) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    console.log("Missing required fields:", missingFields);
    return null;
  }

  return mappings as ColumnMapping;
}

/**
 * Finds the header row in the sheet data
 * SBI statements have account info at the top, then transaction headers
 *
 * @param rawData - Raw sheet data as array of arrays
 * @returns Index of header row, or -1 if not found
 */
function findHeaderRow(rawData: unknown[][]): number {
  console.log("Searching for header row in", rawData.length, "rows");

  for (let i = 0; i < Math.min(rawData.length, 40); i++) {
    const row = rawData[i];
    if (!row || row.length < 4) continue;

    // Convert row to strings for comparison
    const rowStr = row.map(
      (cell) =>
        String(cell || "")
          .toLowerCase()
          .trim()
          .replace(/\s+/g, " "), // Normalize whitespace
    );

    console.log(`Row ${i}:`, rowStr.slice(0, 6)); // Log first 6 columns

    // Look for transaction header indicators (more flexible matching)
    const hasDate = rowStr.some((cell) => cell.includes("date"));
    const hasDetails = rowStr.some(
      (cell) =>
        cell.includes("details") ||
        cell.includes("particulars") ||
        cell.includes("description"),
    );
    const hasRefNo = rowStr.some(
      (cell) =>
        cell.includes("ref") ||
        cell.includes("cheque") ||
        cell.includes("reference"),
    );
    const hasDebit = rowStr.some(
      (cell) => cell.includes("debit") || cell === "dr",
    );
    const hasCredit = rowStr.some(
      (cell) => cell.includes("credit") || cell === "cr",
    );
    const hasBalance = rowStr.some((cell) => cell.includes("balance"));

    // If we find a row with these key columns, it's likely the header
    if (hasDate && hasDetails && hasDebit && hasCredit && hasBalance) {
      console.log(`Found header row at index ${i}`);
      return i;
    }
  }

  console.log("Header row not found");
  return -1;
}

/**
 * Extracts transactions from an SBI statement sheet
 *
 * @param sheet - XLSX worksheet object
 * @param fileName - Name of the source file
 * @returns Object containing transactions and errors
 */
export function extractSBITransactions(
  sheet: XLSX.WorkSheet,
  fileName: string,
): { transactions: Transaction[]; errors: ParseError[] } {
  const transactions: Transaction[] = [];
  const errors: ParseError[] = [];

  // First, get raw data to find the header row
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  if (rawData.length === 0) {
    errors.push({
      row: 0,
      message: "No data found in the sheet",
      severity: "error",
    });
    return { transactions, errors };
  }

  // Find the header row
  const headerRowIndex = findHeaderRow(rawData);

  if (headerRowIndex === -1) {
    errors.push({
      row: 0,
      message:
        "Could not find transaction header row. Expected columns: Date, Details, Debit, Credit, Balance",
      severity: "error",
    });
    return { transactions, errors };
  }

  console.log(`Using header row at index ${headerRowIndex}`);

  // Get the actual header row
  const headerRow = rawData[headerRowIndex] as unknown[];
  const headers = headerRow.map((cell) => String(cell || "").trim());

  console.log("Actual headers:", headers);

  // Convert sheet to JSON starting AFTER the header row
  const dataRows = rawData.slice(headerRowIndex + 1);

  // Convert to objects using the headers
  const data: Record<string, unknown>[] = dataRows.map((row) => {
    const obj: Record<string, unknown> = {};
    (row as unknown[]).forEach((cell, index) => {
      if (headers[index]) {
        obj[headers[index]] = cell;
      }
    });
    return obj;
  });

  if (data.length === 0) {
    errors.push({
      row: 0,
      message: "No transaction data found after header row",
      severity: "error",
    });
    return { transactions, errors };
  }

  // Detect column mappings
  const columnMappings = detectColumnMappings(headers);

  if (!columnMappings) {
    errors.push({
      row: headerRowIndex + 1,
      message:
        "Could not detect required columns. Expected: Date, Details, Ref No, Debit, Credit, Balance",
      severity: "error",
    });
    return { transactions, errors };
  }

  const importedAt = new Date();

  // Process each row
  data.forEach((row, index) => {
    const rowNumber = headerRowIndex + index + 2; // Account for header rows and Excel 1-indexing

    try {
      // Stop if we hit the summary section
      const firstValue = Object.values(row)[0];
      if (
        firstValue &&
        String(firstValue).toLowerCase().includes("statement summary")
      ) {
        return; // Stop processing
      }

      // Stop if we hit footer text
      if (
        firstValue &&
        (String(firstValue).toLowerCase().includes("brought forward") ||
          String(firstValue).toLowerCase().includes("please do not share"))
      ) {
        return; // Stop processing
      }
      // Extract values using detected column mappings
      const dateValue = row[columnMappings.date as string];
      const details = String(row[columnMappings.details as string] || "");
      const refNo = String(row[columnMappings.refNo as string] || "");
      const debitValue = row[columnMappings.debit as string];
      const creditValue = row[columnMappings.credit as string];
      const balanceValue = row[columnMappings.balance as string];

      // Parse date
      const date = parseSBIDate(dateValue as string | number);
      if (!date) {
        errors.push({
          row: rowNumber,
          column: columnMappings.date as string,
          message: `Invalid date: ${dateValue}`,
          severity: "warning",
        });
        return; // Skip this row
      }

      // Parse amounts
      const debit = parseAmount(debitValue as string | number);
      const credit = parseAmount(creditValue as string | number);
      const balance = parseAmount(balanceValue as string | number);

      // Validate balance
      if (balance === null) {
        errors.push({
          row: rowNumber,
          column: columnMappings.balance as string,
          message: `Invalid balance: ${balanceValue}`,
          severity: "warning",
        });
        return; // Skip this row
      }

      // Skip rows with no debit or credit
      if (debit === null && credit === null) {
        return; // Skip empty transaction rows
      }

      // Determine transaction type and amount
      const type: "debit" | "credit" = debit !== null ? "debit" : "credit";
      const amount = debit !== null ? debit : credit!;

      // Detect payment method
      const paymentMethod = detectPaymentMethod(details);

      // Generate unique ID (combination of date, refNo, and amount)
      const id = `${date.getTime()}-${refNo}-${amount}`;

      // Create transaction object
      const transaction: Transaction = {
        id,
        date,
        details,
        refNo,
        debit,
        credit,
        balance,
        amount,
        type,
        paymentMethod,
        tagIds: [],
        manualTagOverride: false,
        notes: null,
        customTags: [],
        isReviewed: false,
        sourceFile: fileName,
        importedAt,
      };

      transactions.push(transaction);
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: `Error parsing row: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
      });
    }
  });

  return { transactions, errors };
}

/**
 * Parses an SBI statement from a workbook
 *
 * @param workbook - XLSX workbook object
 * @param fileName - Name of the source file
 * @returns Object containing transactions and errors
 */
export function parseSBIStatement(
  workbook: XLSX.WorkBook,
  fileName: string,
): { transactions: Transaction[]; errors: ParseError[] } {
  const errors: ParseError[] = [];

  // Get the first sheet (SBI statements typically have one sheet)
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    errors.push({
      row: 0,
      message: "No sheets found in the workbook",
      severity: "error",
    });
    return { transactions: [], errors };
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    errors.push({
      row: 0,
      message: `Sheet "${sheetName}" not found`,
      severity: "error",
    });
    return { transactions: [], errors };
  }

  return extractSBITransactions(sheet, fileName);
}
