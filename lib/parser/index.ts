/**
 * Parser Module
 *
 * Exports all parser-related functionality for Excel file processing
 */

import * as XLSX from "xlsx";
import type {
  Transaction,
  ParseError,
  DateRange,
  ParseResult,
} from "../types/transaction";
import { decryptExcel, readFileAsArrayBuffer } from "./decrypt";
import { parseSBIStatement } from "./sbi";
import { mergeStatements, deduplicateTransactions } from "./merge";

export {
  decryptExcel,
  isValidExcelFile,
  isEncrypted,
  validateExcelFile,
  readFileAsArrayBuffer,
  DecryptionError,
} from "./decrypt";

export type { DecryptionErrorCode, DecryptionValidation } from "./decrypt";

export {
  parseSBIStatement,
  extractSBITransactions,
  detectPaymentMethod,
  parseSBIDate,
  parseAmount,
  detectColumnMappings,
  SBI_PROFILE,
} from "./sbi";

export {
  deduplicateTransactions,
  mergeStatements,
  detectOverlappingRanges,
  areDuplicates,
  findDuplicates,
  sortTransactionsByDate,
  getDateRange,
} from "./merge";

/**
 * Main function to parse a bank statement file
 *
 * Handles the complete flow:
 * 1. Read file as ArrayBuffer
 * 2. Decrypt if password-protected
 * 3. Parse Excel workbook
 * 4. Extract transactions
 * 5. Deduplicate transactions
 *
 * @param file - File object to parse
 * @param password - Optional password for encrypted files
 * @returns Promise<ParseResult> - Parse result with transactions and metadata
 */
export async function parseStatement(
  file: File,
  password?: string,
): Promise<ParseResult> {
  const errors: ParseError[] = [];

  try {
    // Read file as ArrayBuffer
    const buffer = await readFileAsArrayBuffer(file);

    // Decrypt if password provided
    let workbookBuffer = buffer;
    if (password) {
      try {
        workbookBuffer = await decryptExcel(buffer, password);
      } catch (error) {
        errors.push({
          row: 0,
          message: error instanceof Error ? error.message : "Decryption failed",
          severity: "error",
        });
        return {
          success: false,
          transactions: [],
          dateRange: { start: new Date(), end: new Date() },
          errors,
          metadata: {
            fileName: file.name,
            bankName: "Unknown",
            statementPeriod: { start: new Date(), end: new Date() },
            transactionCount: 0,
            parsedAt: new Date(),
          },
        };
      }
    }

    // Parse Excel workbook
    let workbook: XLSX.WorkBook;
    try {
      // If password was provided, pass it to xlsx.read for decryption
      const readOptions: XLSX.ParsingOptions = { type: "array" };
      if (password) {
        readOptions.password = password;
      }

      workbook = XLSX.read(workbookBuffer, readOptions);
    } catch (error) {
      // Check if it's a password error
      const errorMessage = error instanceof Error ? error.message : "";
      if (
        errorMessage.toLowerCase().includes("password") ||
        errorMessage.toLowerCase().includes("decrypt") ||
        errorMessage.toLowerCase().includes("encrypt")
      ) {
        errors.push({
          row: 0,
          message:
            "Password-protected files are not supported. Please remove the password in Excel (File > Info > Protect Workbook > Encrypt with Password > Delete password) and upload again.",
          severity: "error",
        });
      } else {
        errors.push({
          row: 0,
          message:
            "Failed to read Excel file. File may be corrupted or invalid.",
          severity: "error",
        });
      }
      return {
        success: false,
        transactions: [],
        dateRange: { start: new Date(), end: new Date() },
        errors,
        metadata: {
          fileName: file.name,
          bankName: "Unknown",
          statementPeriod: { start: new Date(), end: new Date() },
          transactionCount: 0,
          parsedAt: new Date(),
        },
      };
    }

    // Parse SBI statement
    const { transactions: rawTransactions, errors: parseErrors } =
      parseSBIStatement(workbook, file.name);

    errors.push(...parseErrors);

    // Deduplicate transactions
    const transactions = deduplicateTransactions(rawTransactions);

    // Calculate date range
    let dateRange: DateRange;
    if (transactions.length > 0) {
      const dates = transactions.map((t) => t.date.getTime());
      dateRange = {
        start: new Date(Math.min(...dates)),
        end: new Date(Math.max(...dates)),
      };
    } else {
      dateRange = { start: new Date(), end: new Date() };
    }

    // Create metadata
    const metadata = {
      fileName: file.name,
      bankName: "State Bank of India",
      statementPeriod: dateRange,
      transactionCount: transactions.length,
      parsedAt: new Date(),
    };

    return {
      success: errors.filter((e) => e.severity === "error").length === 0,
      transactions,
      dateRange,
      errors,
      metadata,
    };
  } catch (error) {
    errors.push({
      row: 0,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      severity: "error",
    });

    return {
      success: false,
      transactions: [],
      dateRange: { start: new Date(), end: new Date() },
      errors,
      metadata: {
        fileName: file.name,
        bankName: "Unknown",
        statementPeriod: { start: new Date(), end: new Date() },
        transactionCount: 0,
        parsedAt: new Date(),
      },
    };
  }
}
