/**
 * Transaction Type Definitions
 * Core types for financial transactions and related data structures
 */

/**
 * Payment method types detected from transaction details
 */
export type PaymentMethod =
  | "UPI"
  | "NEFT"
  | "IMPS"
  | "ATM"
  | "POS"
  | "CHEQUE"
  | "OTHER";

/**
 * Date range for filtering and analysis
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Core transaction model representing a single financial transaction
 */
export interface Transaction {
  // Core fields from bank statement
  id: string; // Unique identifier (generated)
  date: Date; // Transaction date
  details: string; // Raw transaction details from bank
  refNo: string; // Bank reference number
  debit: number | null; // Debit amount (null if credit)
  credit: number | null; // Credit amount (null if debit)
  balance: number; // Balance after transaction

  // Derived fields
  amount: number; // Absolute amount (debit or credit)
  type: "debit" | "credit"; // Transaction type
  paymentMethod: PaymentMethod; // Detected payment method

  // Categorization
  tagIds: string[]; // Assigned tag IDs
  manualTagOverride: boolean; // Whether tags were manually set

  // User additions
  notes: string | null; // User-added notes
  customTags: string[]; // User-added custom tags
  isReviewed: boolean; // Marked as reviewed by user

  // Metadata
  sourceFile: string; // Original file name
  importedAt: Date; // When transaction was imported
}

/**
 * Bank profile configuration for parsing statements
 */
export interface BankProfile {
  bankName: string;
  columnMappings: ColumnMapping;
  dateFormat: string;
  skipRows: number;
}

/**
 * Column mapping for extracting data from bank statements
 */
export interface ColumnMapping {
  date: string | number;
  details: string | number;
  refNo: string | number;
  debit: string | number;
  credit: string | number;
  balance: string | number;
}

/**
 * Configuration for statement parser
 */
export interface StatementParserConfig {
  supportedFormats: string[];
  dateFormats: string[];
  bankProfiles: BankProfile[];
}

/**
 * Parse error information
 */
export interface ParseError {
  row: number;
  column?: string;
  message: string;
  severity: "warning" | "error";
}

/**
 * Metadata about a parsed statement
 */
export interface StatementMetadata {
  fileName: string;
  bankName: string;
  accountNumber?: string;
  statementPeriod: DateRange;
  transactionCount: number;
  parsedAt: Date;
}

/**
 * Result of parsing a bank statement
 */
export interface ParseResult {
  success: boolean;
  transactions: Transaction[];
  dateRange: DateRange;
  errors: ParseError[];
  metadata: StatementMetadata;
}

/**
 * Result of merging multiple statements
 */
export interface MergeResult {
  transactions: Transaction[];
  duplicatesRemoved: number;
  newTransactions: number;
  overlappingPeriods: DateRange[];
}

/**
 * Record of an uploaded file
 */
export interface UploadedFileRecord {
  fileName: string;
  uploadedAt: Date;
  transactionCount: number;
  dateRange: DateRange;
  checksum: string;
}
