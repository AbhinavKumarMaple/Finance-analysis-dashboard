/**
 * Anomaly Detection Module
 * Detects unusual transactions and spending patterns
 */

import type { Transaction } from "../../types/transaction";
import type { Anomaly } from "../../types/analytics";

/**
 * Detects anomalies in transaction data
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */
export function detectAnomalies(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Detect high amount transactions (>3x merchant average)
  const highAmountAnomalies = detectHighAmountTransactions(transactions);
  anomalies.push(...highAmountAnomalies);

  // Detect duplicate transactions
  const duplicateAnomalies = detectDuplicateTransactions(transactions);
  anomalies.push(...duplicateAnomalies);

  // Detect spending spikes (>2x daily average)
  const spendingSpikes = detectSpendingSpikes(transactions);
  anomalies.push(...spendingSpikes);

  return anomalies;
}

/**
 * Detects high amount transactions (>3x merchant average)
 * Requirement: 13.1
 */
function detectHighAmountTransactions(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const debits = transactions.filter((t) => t.type === "debit");

  if (debits.length === 0) {
    return anomalies;
  }

  // Group transactions by merchant
  const merchantGroups = groupByMerchant(debits);

  for (const [merchant, merchantTransactions] of merchantGroups.entries()) {
    if (merchantTransactions.length < 2) {
      continue; // Need at least 2 transactions to establish average
    }

    // Calculate average amount for this merchant
    const totalAmount = merchantTransactions.reduce(
      (sum, t) => sum + (t.debit || 0),
      0,
    );
    const avgAmount = totalAmount / merchantTransactions.length;

    // Flag transactions > 3x average
    const threshold = avgAmount * 3;

    for (const transaction of merchantTransactions) {
      const amount = transaction.debit || 0;
      if (amount > threshold) {
        anomalies.push({
          transaction,
          type: "high_amount",
          severity: determineSeverity(amount, avgAmount),
          description: `Transaction amount (${formatCurrency(amount)}) is ${Math.round(amount / avgAmount)}x higher than average for ${merchant} (${formatCurrency(avgAmount)})`,
        });
      }
    }
  }

  return anomalies;
}

/**
 * Detects duplicate transactions
 * Requirement: 13.2
 */
function detectDuplicateTransactions(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const debits = transactions.filter((t) => t.type === "debit");

  // Group by amount, merchant, and date
  const groups = new Map<string, Transaction[]>();

  for (const transaction of debits) {
    const merchant = extractMerchantIdentifier(transaction.details);
    const dateStr = formatDate(transaction.date);
    const amount = transaction.debit || 0;

    // Create a key combining amount, merchant, and date
    const key = `${amount.toFixed(2)}-${merchant}-${dateStr}`;

    const existing = groups.get(key) || [];
    existing.push(transaction);
    groups.set(key, existing);
  }

  // Flag groups with more than one transaction
  for (const [key, group] of groups.entries()) {
    if (group.length > 1) {
      for (const transaction of group) {
        anomalies.push({
          transaction,
          type: "duplicate",
          severity: "medium",
          description: `Potential duplicate transaction: ${group.length} transactions with same amount, merchant, and date`,
        });
      }
    }
  }

  return anomalies;
}

/**
 * Detects spending spikes (>2x daily average)
 * Requirement: 13.3
 */
function detectSpendingSpikes(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const debits = transactions.filter((t) => t.type === "debit");

  if (debits.length === 0) {
    return anomalies;
  }

  // Calculate daily spending
  const dailySpending = new Map<
    string,
    { total: number; transactions: Transaction[] }
  >();

  for (const transaction of debits) {
    const dateStr = formatDate(transaction.date);
    const existing = dailySpending.get(dateStr) || {
      total: 0,
      transactions: [],
    };
    existing.total += transaction.debit || 0;
    existing.transactions.push(transaction);
    dailySpending.set(dateStr, existing);
  }

  // Calculate average daily spending
  const totalSpending = Array.from(dailySpending.values()).reduce(
    (sum, day) => sum + day.total,
    0,
  );
  const avgDailySpending = totalSpending / dailySpending.size;

  // Flag days with spending > 2x average
  const threshold = avgDailySpending * 2;

  for (const [dateStr, day] of dailySpending.entries()) {
    if (day.total > threshold) {
      // Flag all transactions on this day
      for (const transaction of day.transactions) {
        anomalies.push({
          transaction,
          type: "spending_spike",
          severity: determineSeverity(day.total, avgDailySpending),
          description: `Daily spending (${formatCurrency(day.total)}) is ${Math.round(day.total / avgDailySpending)}x higher than average (${formatCurrency(avgDailySpending)})`,
        });
      }
    }
  }

  return anomalies;
}

/**
 * Detects duplicate transactions (alternative implementation)
 * Returns groups of duplicate transactions
 * Requirement: 13.2
 */
export function detectDuplicates(transactions: Transaction[]): Transaction[][] {
  const duplicateGroups: Transaction[][] = [];
  const debits = transactions.filter((t) => t.type === "debit");

  // Group by amount, merchant, and date
  const groups = new Map<string, Transaction[]>();

  for (const transaction of debits) {
    const merchant = extractMerchantIdentifier(transaction.details);
    const dateStr = formatDate(transaction.date);
    const amount = transaction.debit || 0;

    // Create a key combining amount, merchant, and date
    const key = `${amount.toFixed(2)}-${merchant}-${dateStr}`;

    const existing = groups.get(key) || [];
    existing.push(transaction);
    groups.set(key, existing);
  }

  // Return groups with more than one transaction
  for (const group of groups.values()) {
    if (group.length > 1) {
      duplicateGroups.push(group);
    }
  }

  return duplicateGroups;
}

/**
 * Groups transactions by merchant
 */
function groupByMerchant(
  transactions: Transaction[],
): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const merchant = extractMerchantIdentifier(transaction.details);
    const existing = groups.get(merchant) || [];
    existing.push(transaction);
    groups.set(merchant, existing);
  }

  return groups;
}

/**
 * Extracts merchant identifier from transaction details
 */
function extractMerchantIdentifier(details: string): string {
  // Try to extract from UPI format
  const upiMatch = details.match(/UPI\/[^/]+\/[^/]+\/([^/]+)/);
  if (upiMatch) {
    return upiMatch[1];
  }

  // Fallback: use first meaningful word
  const words = details.split(/[\s/]+/).filter((w) => w.length > 3);
  return words[0] || details.substring(0, 20);
}

/**
 * Determines severity based on amount ratio
 */
function determineSeverity(
  amount: number,
  average: number,
): "low" | "medium" | "high" {
  const ratio = amount / average;

  if (ratio > 5) {
    return "high";
  } else if (ratio > 3) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * Formats currency amount
 */
function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Formats date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
