/**
 * Transaction Deduplication and Merging Module
 *
 * Handles deduplication of transactions based on Ref_No and Date combination.
 * Merges multiple statements while preserving unique transactions.
 * Auto-detects and handles overlapping date ranges.
 *
 * Requirements: 1.4, 1.5
 */

import type {
  Transaction,
  MergeResult,
  DateRange,
} from "../../types/transaction";

/**
 * Creates a unique key for a transaction based on Ref_No and Date
 *
 * @param transaction - Transaction to create key for
 * @returns string - Unique key in format "YYYYMMDD-RefNo"
 */
function createTransactionKey(transaction: Transaction): string {
  const dateStr = transaction.date
    .toISOString()
    .split("T")[0]
    .replace(/-/g, "");
  return `${dateStr}-${transaction.refNo}`;
}

/**
 * Deduplicates transactions based on Ref_No and Date combination
 *
 * If multiple transactions have the same Ref_No and Date, only the first one is kept.
 * This function is idempotent - running it multiple times produces the same result.
 *
 * @param transactions - Array of transactions to deduplicate
 * @returns Transaction[] - Deduplicated array of transactions
 */
export function deduplicateTransactions(
  transactions: Transaction[],
): Transaction[] {
  const seen = new Map<string, Transaction>();

  for (const transaction of transactions) {
    const key = createTransactionKey(transaction);

    // Only add if we haven't seen this key before
    if (!seen.has(key)) {
      seen.set(key, transaction);
    }
  }

  return Array.from(seen.values());
}

/**
 * Detects overlapping date ranges between two sets of transactions
 *
 * @param existing - Existing transactions
 * @param incoming - New transactions to merge
 * @returns DateRange[] - Array of overlapping date ranges
 */
export function detectOverlappingRanges(
  existing: Transaction[],
  incoming: Transaction[],
): DateRange[] {
  if (existing.length === 0 || incoming.length === 0) {
    return [];
  }

  // Get date ranges for both sets
  const existingDates = existing
    .map((t) => t.date.getTime())
    .sort((a, b) => a - b);
  const incomingDates = incoming
    .map((t) => t.date.getTime())
    .sort((a, b) => a - b);

  const existingStart = new Date(existingDates[0]);
  const existingEnd = new Date(existingDates[existingDates.length - 1]);
  const incomingStart = new Date(incomingDates[0]);
  const incomingEnd = new Date(incomingDates[incomingDates.length - 1]);

  // Check for overlap
  const overlapStart = new Date(
    Math.max(existingStart.getTime(), incomingStart.getTime()),
  );
  const overlapEnd = new Date(
    Math.min(existingEnd.getTime(), incomingEnd.getTime()),
  );

  // If overlap exists, return it
  if (overlapStart <= overlapEnd) {
    return [{ start: overlapStart, end: overlapEnd }];
  }

  return [];
}

/**
 * Merges multiple statements preserving unique transactions
 *
 * Combines existing and incoming transactions, removes duplicates based on
 * Ref_No and Date combination, and detects overlapping date ranges.
 *
 * @param existing - Existing transactions
 * @param incoming - New transactions to merge
 * @returns MergeResult - Result containing merged transactions and statistics
 */
export function mergeStatements(
  existing: Transaction[],
  incoming: Transaction[],
): MergeResult {
  // Combine all transactions
  const combined = [...existing, ...incoming];
  const totalBefore = combined.length;

  // Deduplicate
  const deduplicated = deduplicateTransactions(combined);
  const totalAfter = deduplicated.length;

  // Calculate statistics
  const duplicatesRemoved = totalBefore - totalAfter;
  const newTransactions = totalAfter - existing.length;

  // Detect overlapping periods
  const overlappingPeriods = detectOverlappingRanges(existing, incoming);

  return {
    transactions: deduplicated,
    duplicatesRemoved,
    newTransactions,
    overlappingPeriods,
  };
}

/**
 * Checks if two transactions are duplicates based on Ref_No and Date
 *
 * @param t1 - First transaction
 * @param t2 - Second transaction
 * @returns boolean - True if transactions are duplicates
 */
export function areDuplicates(t1: Transaction, t2: Transaction): boolean {
  return createTransactionKey(t1) === createTransactionKey(t2);
}

/**
 * Finds duplicate transactions in an array
 *
 * @param transactions - Array of transactions to check
 * @returns Transaction[][] - Array of duplicate groups (each group contains 2+ duplicates)
 */
export function findDuplicates(transactions: Transaction[]): Transaction[][] {
  const groups = new Map<string, Transaction[]>();

  // Group transactions by key
  for (const transaction of transactions) {
    const key = createTransactionKey(transaction);
    const group = groups.get(key) || [];
    group.push(transaction);
    groups.set(key, group);
  }

  // Return only groups with 2+ transactions
  return Array.from(groups.values()).filter((group) => group.length > 1);
}

/**
 * Sorts transactions by date in descending order (most recent first)
 *
 * @param transactions - Array of transactions to sort
 * @returns Transaction[] - Sorted array (new array, does not mutate input)
 */
export function sortTransactionsByDate(
  transactions: Transaction[],
): Transaction[] {
  return [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Gets the date range covered by a set of transactions
 *
 * @param transactions - Array of transactions
 * @returns DateRange | null - Date range or null if no transactions
 */
export function getDateRange(transactions: Transaction[]): DateRange | null {
  if (transactions.length === 0) {
    return null;
  }

  const dates = transactions.map((t) => t.date.getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);

  return {
    start: new Date(minDate),
    end: new Date(maxDate),
  };
}
