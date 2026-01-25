/**
 * Balance Metrics Calculations
 *
 * Calculates balance-related metrics including current, highest, lowest, and average balance.
 * Handles date range filtering for period-specific analysis.
 *
 * Requirements: 2.1, 2.2
 */

import type { Transaction, DateRange } from "../../types/transaction";
import type { BalanceMetrics } from "../../types/analytics";

/**
 * Calculates balance metrics for a set of transactions
 *
 * Computes:
 * - Current balance (most recent transaction)
 * - Highest balance in period
 * - Lowest balance in period
 * - Average balance across all transactions
 *
 * @param transactions - Array of transactions
 * @param dateRange - Optional date range to filter transactions
 * @returns BalanceMetrics - Calculated balance metrics
 */
export function calculateBalanceMetrics(
  transactions: Transaction[],
  dateRange?: DateRange,
): BalanceMetrics {
  // Filter by date range if provided
  let filteredTransactions = transactions;
  if (dateRange) {
    filteredTransactions = transactions.filter(
      (t) => t.date >= dateRange.start && t.date <= dateRange.end,
    );
  }

  // Handle empty transactions
  if (filteredTransactions.length === 0) {
    const now = new Date();
    return {
      current: 0,
      highest: 0,
      lowest: 0,
      average: 0,
      periodStart: dateRange?.start || now,
      periodEnd: dateRange?.end || now,
    };
  }

  // Sort by date to ensure correct ordering
  const sorted = [...filteredTransactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Get current balance (most recent transaction)
  const current = sorted[sorted.length - 1].balance;

  // Calculate highest and lowest
  const balances = sorted.map((t) => t.balance);
  const highest = Math.max(...balances);
  const lowest = Math.min(...balances);

  // Calculate average
  const sum = balances.reduce((acc, bal) => acc + bal, 0);
  const average = sum / balances.length;

  // Determine period
  const periodStart = sorted[0].date;
  const periodEnd = sorted[sorted.length - 1].date;

  return {
    current,
    highest,
    lowest,
    average,
    periodStart,
    periodEnd,
  };
}

/**
 * Gets the current balance from the most recent transaction
 *
 * @param transactions - Array of transactions
 * @returns number - Current balance or 0 if no transactions
 */
export function getCurrentBalance(transactions: Transaction[]): number {
  if (transactions.length === 0) {
    return 0;
  }

  // Find most recent transaction
  const mostRecent = transactions.reduce((latest, current) =>
    current.date > latest.date ? current : latest,
  );

  return mostRecent.balance;
}

/**
 * Gets balance at a specific date
 *
 * Returns the balance from the transaction closest to (but not after) the specified date.
 *
 * @param transactions - Array of transactions
 * @param date - Target date
 * @returns number | null - Balance at date or null if no transactions before date
 */
export function getBalanceAtDate(
  transactions: Transaction[],
  date: Date,
): number | null {
  // Filter transactions up to the specified date
  const beforeDate = transactions.filter((t) => t.date <= date);

  if (beforeDate.length === 0) {
    return null;
  }

  // Find the most recent transaction before or on the date
  const closest = beforeDate.reduce((latest, current) =>
    current.date > latest.date ? current : latest,
  );

  return closest.balance;
}

/**
 * Calculates balance change over a period
 *
 * @param transactions - Array of transactions
 * @param dateRange - Date range for calculation
 * @returns object - Start balance, end balance, and change amount
 */
export function calculateBalanceChange(
  transactions: Transaction[],
  dateRange: DateRange,
): {
  startBalance: number | null;
  endBalance: number | null;
  change: number | null;
  percentChange: number | null;
} {
  const startBalance = getBalanceAtDate(transactions, dateRange.start);
  const endBalance = getBalanceAtDate(transactions, dateRange.end);

  if (startBalance === null || endBalance === null) {
    return {
      startBalance,
      endBalance,
      change: null,
      percentChange: null,
    };
  }

  const change = endBalance - startBalance;
  const percentChange =
    startBalance !== 0 ? (change / Math.abs(startBalance)) * 100 : 0;

  return {
    startBalance,
    endBalance,
    change,
    percentChange,
  };
}

/**
 * Gets balance history as time series data
 *
 * @param transactions - Array of transactions
 * @param dateRange - Optional date range to filter
 * @returns Array of {date, balance} objects
 */
export function getBalanceHistory(
  transactions: Transaction[],
  dateRange?: DateRange,
): Array<{ date: Date; balance: number }> {
  let filtered = transactions;

  if (dateRange) {
    filtered = transactions.filter(
      (t) => t.date >= dateRange.start && t.date <= dateRange.end,
    );
  }

  // Sort by date
  const sorted = [...filtered].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  return sorted.map((t) => ({
    date: t.date,
    balance: t.balance,
  }));
}

/**
 * Checks if balance is below a threshold
 *
 * @param transactions - Array of transactions
 * @param threshold - Balance threshold
 * @returns boolean - True if current balance is below threshold
 */
export function isBalanceBelowThreshold(
  transactions: Transaction[],
  threshold: number,
): boolean {
  const current = getCurrentBalance(transactions);
  return current < threshold;
}

/**
 * Calculates the number of days with balance below threshold
 *
 * @param transactions - Array of transactions
 * @param threshold - Balance threshold
 * @param dateRange - Optional date range
 * @returns number - Count of days below threshold
 */
export function countDaysBelowThreshold(
  transactions: Transaction[],
  threshold: number,
  dateRange?: DateRange,
): number {
  let filtered = transactions;

  if (dateRange) {
    filtered = transactions.filter(
      (t) => t.date >= dateRange.start && t.date <= dateRange.end,
    );
  }

  // Group by date and get one balance per day
  const dailyBalances = new Map<string, number>();

  for (const transaction of filtered) {
    const dateKey = transaction.date.toISOString().split("T")[0];
    // Keep the last balance of each day
    const existing = dailyBalances.get(dateKey);
    if (
      !existing ||
      transaction.date.getTime() > new Date(dateKey + "T00:00:00").getTime()
    ) {
      dailyBalances.set(dateKey, transaction.balance);
    }
  }

  // Count days below threshold
  let count = 0;
  for (const balance of dailyBalances.values()) {
    if (balance < threshold) {
      count++;
    }
  }

  return count;
}
