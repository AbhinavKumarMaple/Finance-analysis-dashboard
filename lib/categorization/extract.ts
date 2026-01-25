/**
 * Keyword Extraction Module
 *
 * Extracts merchant identifiers and keywords from transaction details.
 * Handles various transaction detail formats including UPI, NEFT, IMPS, etc.
 *
 * Requirements: 17.1
 */

/**
 * UPI transaction format patterns
 * Examples:
 * - UPI/DR/123456789/MERCHANT/payment@upi
 * - UPI-MERCHANT NAME-123456789
 * - UPI/MERCHANT/REF123
 */
const UPI_PATTERNS = [
  // Pattern: UPI/DR/ref/MERCHANT/upi_id
  /UPI\/(?:DR|CR)\/[^\/]+\/([^\/]+)\/[^\/]+/i,
  // Pattern: UPI-MERCHANT-ref
  /UPI-([^-]+)-\d+/i,
  // Pattern: UPI/MERCHANT/ref
  /UPI\/([^\/]+)\/[^\/]+/i,
  // Pattern: UPI MERCHANT ref
  /UPI\s+([A-Z][A-Z0-9\s]+?)\s+\d+/i,
];

/**
 * NEFT/IMPS transaction format patterns
 * Examples:
 * - NEFT-MERCHANT NAME-REF123
 * - IMPS/123456/MERCHANT/REF
 */
const TRANSFER_PATTERNS = [
  // Pattern: NEFT-MERCHANT-ref
  /(?:NEFT|IMPS)-([^-]+)-[^-]+/i,
  // Pattern: NEFT/IMPS/ref/MERCHANT
  /(?:NEFT|IMPS)\/[^\/]+\/([^\/]+)/i,
];

/**
 * Common words to filter out from merchant names
 */
const STOP_WORDS = new Set([
  "UPI",
  "NEFT",
  "IMPS",
  "ATM",
  "POS",
  "PAYMENT",
  "TRANSFER",
  "TO",
  "FROM",
  "REF",
  "REFERENCE",
  "NO",
  "NUMBER",
  "DR",
  "CR",
  "DEBIT",
  "CREDIT",
  "TRANSACTION",
  "TXN",
  "ID",
]);

/**
 * Extracts merchant identifier from UPI transaction details
 *
 * @param details - Transaction details string
 * @returns string | null - Extracted merchant name or null if not found
 */
function extractUPIMerchant(details: string): string | null {
  for (const pattern of UPI_PATTERNS) {
    const match = details.match(pattern);
    if (match && match[1]) {
      return cleanMerchantName(match[1]);
    }
  }
  return null;
}

/**
 * Extracts merchant identifier from NEFT/IMPS transaction details
 *
 * @param details - Transaction details string
 * @returns string | null - Extracted merchant name or null if not found
 */
function extractTransferMerchant(details: string): string | null {
  for (const pattern of TRANSFER_PATTERNS) {
    const match = details.match(pattern);
    if (match && match[1]) {
      return cleanMerchantName(match[1]);
    }
  }
  return null;
}

/**
 * Cleans and normalizes merchant name
 *
 * - Removes stop words
 * - Trims whitespace
 * - Converts to title case
 * - Removes special characters
 *
 * @param merchantName - Raw merchant name
 * @returns string - Cleaned merchant name
 */
function cleanMerchantName(merchantName: string): string {
  // Remove special characters except spaces and hyphens
  let cleaned = merchantName.replace(/[^a-zA-Z0-9\s\-]/g, " ");

  // Split into words
  const words = cleaned
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0);

  // Remove stop words
  const filtered = words.filter((word) => !STOP_WORDS.has(word.toUpperCase()));

  // Join and convert to title case
  return filtered
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

/**
 * Extracts keywords from transaction details for categorization
 *
 * Handles various transaction formats:
 * - UPI transactions: Extracts merchant from UPI format strings
 * - NEFT/IMPS: Extracts merchant from transfer format
 * - Other: Extracts significant words from details
 *
 * @param transactionDetails - Raw transaction details string
 * @returns string[] - Array of extracted keywords
 */
export function extractMerchantKeywords(transactionDetails: string): string[] {
  if (!transactionDetails || transactionDetails.trim().length === 0) {
    return [];
  }

  const keywords: string[] = [];
  const detailsUpper = transactionDetails.toUpperCase();

  // Try UPI extraction
  if (detailsUpper.includes("UPI")) {
    const merchant = extractUPIMerchant(transactionDetails);
    if (merchant) {
      keywords.push(merchant);
      // Also add individual words from merchant name
      const words = merchant.split(/\s+/).filter((w) => w.length > 2);
      keywords.push(...words);
    }
  }

  // Try NEFT/IMPS extraction
  if (detailsUpper.includes("NEFT") || detailsUpper.includes("IMPS")) {
    const merchant = extractTransferMerchant(transactionDetails);
    if (merchant) {
      keywords.push(merchant);
      // Also add individual words from merchant name
      const words = merchant.split(/\s+/).filter((w) => w.length > 2);
      keywords.push(...words);
    }
  }

  // Extract general keywords (words longer than 2 characters)
  const words = transactionDetails
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2)
    .filter((word) => !STOP_WORDS.has(word.toUpperCase()));

  // Add unique words
  for (const word of words) {
    const titleCase =
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    if (!keywords.includes(titleCase)) {
      keywords.push(titleCase);
    }
  }

  // Remove duplicates and return
  return Array.from(new Set(keywords));
}

/**
 * Extracts merchant name from transaction details
 *
 * Returns the primary merchant identifier, or null if not found.
 *
 * @param transactionDetails - Raw transaction details string
 * @returns string | null - Merchant name or null
 */
export function extractMerchantName(transactionDetails: string): string | null {
  if (!transactionDetails || transactionDetails.trim().length === 0) {
    return null;
  }

  const detailsUpper = transactionDetails.toUpperCase();

  // Try UPI extraction
  if (detailsUpper.includes("UPI")) {
    const merchant = extractUPIMerchant(transactionDetails);
    if (merchant) {
      return merchant;
    }
  }

  // Try NEFT/IMPS extraction
  if (detailsUpper.includes("NEFT") || detailsUpper.includes("IMPS")) {
    const merchant = extractTransferMerchant(transactionDetails);
    if (merchant) {
      return merchant;
    }
  }

  // Fallback: extract first significant word sequence
  const words = transactionDetails
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2)
    .filter((word) => !STOP_WORDS.has(word.toUpperCase()));

  if (words.length > 0) {
    // Take first 3 words as merchant name
    return words
      .slice(0, 3)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  return null;
}

/**
 * Checks if transaction details contain a specific keyword (case-insensitive)
 *
 * @param transactionDetails - Transaction details string
 * @param keyword - Keyword to search for
 * @returns boolean - True if keyword is found
 */
export function containsKeyword(
  transactionDetails: string,
  keyword: string,
): boolean {
  if (!transactionDetails || !keyword) {
    return false;
  }

  return transactionDetails.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Extracts all unique words from transaction details
 *
 * @param transactionDetails - Transaction details string
 * @returns string[] - Array of unique words
 */
export function extractAllWords(transactionDetails: string): string[] {
  if (!transactionDetails || transactionDetails.trim().length === 0) {
    return [];
  }

  const words = transactionDetails
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 0);

  return Array.from(new Set(words));
}
