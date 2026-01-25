/**
 * Tag Matching Engine
 *
 * Performs case-insensitive partial matching of keywords to transaction details.
 * Supports multiple keywords per tag and multiple tag matches per transaction.
 *
 * Requirements: 17.3, 17.4, 17.5, 17.10
 */

import type { Tag, TagMatch, CategorizationResult } from "../../types/tag";
import type { Transaction } from "../../types/transaction";
import { containsKeyword } from "./extract";

/**
 * Matches keywords to tags and returns matching information
 *
 * Performs case-insensitive partial matching. If any keyword from a tag
 * is found in the keywords array, that tag is considered a match.
 *
 * @param keywords - Array of keywords extracted from transaction
 * @param tags - Array of tags to match against
 * @returns TagMatch[] - Array of tag matches with keyword and position info
 */
export function matchKeywordsToTags(
  keywords: string[],
  tags: Tag[],
): TagMatch[] {
  const matches: TagMatch[] = [];

  for (const tag of tags) {
    for (const tagKeyword of tag.keywords) {
      // Check if any extracted keyword contains the tag keyword (case-insensitive)
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        if (
          keyword.toLowerCase().includes(tagKeyword.toLowerCase()) ||
          tagKeyword.toLowerCase().includes(keyword.toLowerCase())
        ) {
          matches.push({
            tagId: tag.id,
            keyword: tagKeyword,
            matchPosition: i,
          });
          break; // Only record one match per tag
        }
      }
    }
  }

  return matches;
}

/**
 * Categorizes a single transaction by matching its details against tags
 *
 * Performs case-insensitive partial matching of tag keywords against
 * transaction details. Returns all matching tags.
 *
 * @param transaction - Transaction to categorize
 * @param tags - Array of tags to match against
 * @returns CategorizationResult - Categorization result with matched tags
 */
export function categorizeTransaction(
  transaction: Transaction,
  tags: Tag[],
): CategorizationResult {
  const matches: TagMatch[] = [];
  const details = transaction.details.toLowerCase();

  // Check each tag's keywords
  for (const tag of tags) {
    let tagMatched = false;

    for (const keyword of tag.keywords) {
      const keywordLower = keyword.toLowerCase();

      // Check if transaction details contain the keyword
      if (details.includes(keywordLower)) {
        const matchPosition = details.indexOf(keywordLower);

        matches.push({
          tagId: tag.id,
          keyword,
          matchPosition,
        });

        tagMatched = true;
        break; // Only record one match per tag
      }
    }
  }

  return {
    transactionId: transaction.id,
    matchedTags: matches,
    isManualOverride: false,
  };
}

/**
 * Categorizes all transactions by matching against tags
 *
 * @param transactions - Array of transactions to categorize
 * @param tags - Array of tags to match against
 * @returns Map<string, CategorizationResult> - Map of transaction ID to categorization result
 */
export function categorizeAllTransactions(
  transactions: Transaction[],
  tags: Tag[],
): Map<string, CategorizationResult> {
  const results = new Map<string, CategorizationResult>();

  for (const transaction of transactions) {
    const result = categorizeTransaction(transaction, tags);
    results.set(transaction.id, result);
  }

  return results;
}

/**
 * Applies categorization results to transactions
 *
 * Updates transaction tagIds based on categorization results.
 * Does not override manual tag assignments.
 *
 * @param transactions - Array of transactions to update
 * @param categorizationResults - Map of categorization results
 * @returns Transaction[] - Updated transactions (new array)
 */
export function applyCategorizationResults(
  transactions: Transaction[],
  categorizationResults: Map<string, CategorizationResult>,
): Transaction[] {
  return transactions.map((transaction) => {
    const result = categorizationResults.get(transaction.id);

    // Skip if no result or manual override is set
    if (!result || transaction.manualTagOverride) {
      return transaction;
    }

    // Extract unique tag IDs from matches
    const tagIds = Array.from(
      new Set(result.matchedTags.map((match) => match.tagId)),
    );

    return {
      ...transaction,
      tagIds,
    };
  });
}

/**
 * Finds transactions that match a specific tag
 *
 * @param transactions - Array of transactions to search
 * @param tagId - Tag ID to search for
 * @returns Transaction[] - Transactions that have the specified tag
 */
export function findTransactionsByTag(
  transactions: Transaction[],
  tagId: string,
): Transaction[] {
  return transactions.filter((transaction) =>
    transaction.tagIds.includes(tagId),
  );
}

/**
 * Finds transactions that match any of the specified tags
 *
 * @param transactions - Array of transactions to search
 * @param tagIds - Array of tag IDs to search for
 * @returns Transaction[] - Transactions that have any of the specified tags
 */
export function findTransactionsByTags(
  transactions: Transaction[],
  tagIds: string[],
): Transaction[] {
  const tagIdSet = new Set(tagIds);

  return transactions.filter((transaction) =>
    transaction.tagIds.some((tagId) => tagIdSet.has(tagId)),
  );
}

/**
 * Finds untagged transactions (transactions with no tags assigned)
 *
 * @param transactions - Array of transactions to search
 * @returns Transaction[] - Transactions with no tags
 */
export function findUntaggedTransactions(
  transactions: Transaction[],
): Transaction[] {
  return transactions.filter(
    (transaction) =>
      !transaction.manualTagOverride && transaction.tagIds.length === 0,
  );
}

/**
 * Gets tag statistics for a set of transactions
 *
 * @param transactions - Array of transactions
 * @param tags - Array of tags
 * @returns Map<string, number> - Map of tag ID to transaction count
 */
export function getTagStatistics(
  transactions: Transaction[],
  tags: Tag[],
): Map<string, { tag: Tag; count: number; totalAmount: number }> {
  const stats = new Map<
    string,
    { tag: Tag; count: number; totalAmount: number }
  >();

  // Initialize stats for all tags
  for (const tag of tags) {
    stats.set(tag.id, { tag, count: 0, totalAmount: 0 });
  }

  // Count transactions and sum amounts for each tag
  for (const transaction of transactions) {
    for (const tagId of transaction.tagIds) {
      const stat = stats.get(tagId);
      if (stat) {
        stat.count++;
        stat.totalAmount += transaction.amount;
      }
    }
  }

  return stats;
}

/**
 * Suggests keywords for a tag based on existing transactions
 *
 * Analyzes transactions with the specified tag and suggests common keywords.
 *
 * @param transactions - Array of transactions
 * @param tagId - Tag ID to analyze
 * @param minFrequency - Minimum frequency for a keyword to be suggested (default: 2)
 * @returns string[] - Suggested keywords sorted by frequency
 */
export function suggestKeywordsForTag(
  transactions: Transaction[],
  tagId: string,
  minFrequency: number = 2,
): string[] {
  // Find transactions with this tag
  const taggedTransactions = findTransactionsByTag(transactions, tagId);

  if (taggedTransactions.length === 0) {
    return [];
  }

  // Count word frequencies
  const wordFrequency = new Map<string, number>();

  for (const transaction of taggedTransactions) {
    const words = transaction.details
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2);

    for (const word of words) {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    }
  }

  // Filter by minimum frequency and sort by frequency
  const suggestions = Array.from(wordFrequency.entries())
    .filter(([_, frequency]) => frequency >= minFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  return suggestions;
}

/**
 * Re-categorizes all transactions after tag changes
 *
 * Useful when tags are added, removed, or keywords are updated.
 * Preserves manual tag overrides.
 *
 * @param transactions - Array of transactions to re-categorize
 * @param tags - Updated array of tags
 * @returns Transaction[] - Re-categorized transactions (new array)
 */
export function recategorizeTransactions(
  transactions: Transaction[],
  tags: Tag[],
): Transaction[] {
  const results = categorizeAllTransactions(transactions, tags);
  return applyCategorizationResults(transactions, results);
}
