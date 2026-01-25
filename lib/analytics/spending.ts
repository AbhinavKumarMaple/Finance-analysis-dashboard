/**
 * Spending Breakdown Calculations
 *
 * Calculates spending by tag, merchant, payment method, day of week, and time of month.
 * Provides detailed spending analysis and patterns.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 9.3
 */

import type { Transaction } from "../../types/transaction";
import type { Tag } from "../../types/tag";
import type { SpendingBreakdown, MerchantSpend } from "../../types/analytics";
import { extractMerchantName } from "../categorization/extract";

/**
 * Calculates comprehensive spending breakdown
 *
 * @param transactions - Array of transactions
 * @param tags - Array of tags for categorization
 * @returns SpendingBreakdown - Breakdown by various dimensions
 */
export function calculateSpendingBreakdown(
  transactions: Transaction[],
  tags: Tag[],
): SpendingBreakdown {
  // Filter to debit transactions only
  const debits = transactions.filter((t) => t.type === "debit");

  return {
    byTag: calculateSpendingByTag(debits, tags),
    byMerchant: calculateSpendingByMerchant(debits),
    byPaymentMethod: calculateSpendingByPaymentMethod(debits),
    byDayOfWeek: calculateSpendingByDayOfWeek(debits),
    byTimeOfMonth: calculateSpendingByTimeOfMonth(debits),
  };
}

/**
 * Calculates spending by tag/category
 *
 * @param transactions - Array of debit transactions
 * @param tags - Array of tags
 * @returns Map<string, number> - Map of tag ID to total spending
 */
export function calculateSpendingByTag(
  transactions: Transaction[],
  tags: Tag[],
): Map<string, number> {
  const spending = new Map<string, number>();

  // Initialize all tags with 0
  for (const tag of tags) {
    spending.set(tag.id, 0);
  }

  // Sum spending for each tag
  for (const transaction of transactions) {
    for (const tagId of transaction.tagIds) {
      const current = spending.get(tagId) || 0;
      spending.set(tagId, current + transaction.amount);
    }
  }

  return spending;
}

/**
 * Calculates spending by merchant
 *
 * @param transactions - Array of debit transactions
 * @returns MerchantSpend[] - Array of merchant spending data, sorted by total amount
 */
export function calculateSpendingByMerchant(
  transactions: Transaction[],
): MerchantSpend[] {
  const merchantMap = new Map<string, MerchantSpend>();

  for (const transaction of transactions) {
    const merchant =
      extractMerchantName(transaction.details) || "Unknown Merchant";

    const existing = merchantMap.get(merchant);

    if (existing) {
      existing.totalAmount += transaction.amount;
      existing.transactionCount++;
      existing.averageAmount = existing.totalAmount / existing.transactionCount;
      if (transaction.date > existing.lastTransaction) {
        existing.lastTransaction = transaction.date;
      }
    } else {
      merchantMap.set(merchant, {
        merchant,
        totalAmount: transaction.amount,
        transactionCount: 1,
        averageAmount: transaction.amount,
        lastTransaction: transaction.date,
      });
    }
  }

  // Convert to array and sort by total amount descending
  return Array.from(merchantMap.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount,
  );
}

/**
 * Calculates spending by payment method
 *
 * @param transactions - Array of debit transactions
 * @returns Map<string, number> - Map of payment method to total spending
 */
export function calculateSpendingByPaymentMethod(
  transactions: Transaction[],
): Map<string, number> {
  const spending = new Map<string, number>();

  for (const transaction of transactions) {
    const method = transaction.paymentMethod;
    const current = spending.get(method) || 0;
    spending.set(method, current + transaction.amount);
  }

  return spending;
}

/**
 * Calculates spending by day of week
 *
 * @param transactions - Array of debit transactions
 * @returns number[] - Array of 7 numbers (Sunday=0 to Saturday=6)
 */
export function calculateSpendingByDayOfWeek(
  transactions: Transaction[],
): number[] {
  const spending = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat

  for (const transaction of transactions) {
    const dayOfWeek = transaction.date.getDay();
    spending[dayOfWeek] += transaction.amount;
  }

  return spending;
}

/**
 * Calculates spending by time of month
 *
 * @param transactions - Array of debit transactions
 * @returns object - Spending for early, mid, and late month
 */
export function calculateSpendingByTimeOfMonth(transactions: Transaction[]): {
  early: number;
  mid: number;
  late: number;
} {
  const spending = { early: 0, mid: 0, late: 0 };

  for (const transaction of transactions) {
    const day = transaction.date.getDate();

    if (day <= 10) {
      spending.early += transaction.amount;
    } else if (day <= 20) {
      spending.mid += transaction.amount;
    } else {
      spending.late += transaction.amount;
    }
  }

  return spending;
}

/**
 * Gets top N merchants by spending
 *
 * @param transactions - Array of debit transactions
 * @param limit - Number of top merchants to return (default: 10)
 * @returns MerchantSpend[] - Top merchants sorted by total amount
 */
export function getTopMerchants(
  transactions: Transaction[],
  limit: number = 10,
): MerchantSpend[] {
  const merchants = calculateSpendingByMerchant(transactions);
  return merchants.slice(0, limit);
}

/**
 * Calculates spending percentages by category
 *
 * @param spendingByTag - Map of tag ID to spending amount
 * @returns Map<string, number> - Map of tag ID to percentage (0-100)
 */
export function calculateSpendingPercentages(
  spendingByTag: Map<string, number>,
): Map<string, number> {
  const total = Array.from(spendingByTag.values()).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  if (total === 0) {
    return new Map();
  }

  const percentages = new Map<string, number>();

  for (const [tagId, amount] of spendingByTag.entries()) {
    percentages.set(tagId, (amount / total) * 100);
  }

  return percentages;
}

/**
 * Gets spending trend over time for a specific category
 *
 * @param transactions - Array of transactions
 * @param tagId - Tag ID to analyze
 * @returns Array of {month, amount} objects
 */
export function getCategorySpendingTrend(
  transactions: Transaction[],
  tagId: string,
): Array<{ month: string; amount: number }> {
  // Filter to transactions with this tag
  const filtered = transactions.filter(
    (t) => t.type === "debit" && t.tagIds.includes(tagId),
  );

  // Group by month
  const monthlySpending = new Map<string, number>();

  for (const transaction of filtered) {
    const month = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, "0")}`;
    const current = monthlySpending.get(month) || 0;
    monthlySpending.set(month, current + transaction.amount);
  }

  // Convert to array and sort by month
  return Array.from(monthlySpending.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculates average spending per transaction by category
 *
 * @param transactions - Array of transactions
 * @param tags - Array of tags
 * @returns Map<string, number> - Map of tag ID to average transaction amount
 */
export function calculateAverageSpendingByTag(
  transactions: Transaction[],
  tags: Tag[],
): Map<string, number> {
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();

  // Initialize
  for (const tag of tags) {
    totals.set(tag.id, 0);
    counts.set(tag.id, 0);
  }

  // Sum and count
  const debits = transactions.filter((t) => t.type === "debit");
  for (const transaction of debits) {
    for (const tagId of transaction.tagIds) {
      totals.set(tagId, (totals.get(tagId) || 0) + transaction.amount);
      counts.set(tagId, (counts.get(tagId) || 0) + 1);
    }
  }

  // Calculate averages
  const averages = new Map<string, number>();
  for (const tag of tags) {
    const total = totals.get(tag.id) || 0;
    const count = counts.get(tag.id) || 0;
    averages.set(tag.id, count > 0 ? total / count : 0);
  }

  return averages;
}

/**
 * Identifies highest spending day of week
 *
 * @param transactions - Array of debit transactions
 * @returns object - Day name and amount
 */
export function getHighestSpendingDay(transactions: Transaction[]): {
  day: string;
  amount: number;
} {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const spending = calculateSpendingByDayOfWeek(transactions);
  const maxAmount = Math.max(...spending);
  const maxIndex = spending.indexOf(maxAmount);

  return {
    day: dayNames[maxIndex],
    amount: maxAmount,
  };
}

/**
 * Calculates spending diversity score (0-100)
 *
 * Higher score means spending is more evenly distributed across categories.
 *
 * @param spendingByTag - Map of tag ID to spending amount
 * @returns number - Diversity score (0-100)
 */
export function calculateSpendingDiversity(
  spendingByTag: Map<string, number>,
): number {
  const amounts = Array.from(spendingByTag.values()).filter((a) => a > 0);

  if (amounts.length <= 1) {
    return 0;
  }

  const total = amounts.reduce((sum, a) => sum + a, 0);
  if (total === 0) {
    return 0;
  }

  // Calculate entropy-based diversity
  let entropy = 0;
  for (const amount of amounts) {
    const proportion = amount / total;
    entropy -= proportion * Math.log2(proportion);
  }

  // Normalize to 0-100 scale
  const maxEntropy = Math.log2(amounts.length);
  return maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
}

/**
 * Analyzes spending patterns including day of week, time of month, and seasonal trends
 *
 * @param transactions - Array of transactions
 * @returns SpendingPattern - Comprehensive spending pattern analysis
 */
export function analyzeSpendingPatterns(transactions: Transaction[]): {
  weekdayAverage: number;
  weekendAverage: number;
  dayOfWeekDistribution: number[];
  timeOfMonthPattern: {
    earlyMonth: number;
    midMonth: number;
    lateMonth: number;
  };
  seasonalTrends: Array<{
    month: number;
    averageSpend: number;
    yearOverYearChange?: number;
  }>;
} {
  const debits = transactions.filter((t) => t.type === "debit");

  // Calculate day of week distribution
  const dayOfWeekDistribution = calculateSpendingByDayOfWeek(debits);

  // Calculate weekday vs weekend averages
  const weekdaySpending = dayOfWeekDistribution
    .slice(1, 6)
    .reduce((sum, val) => sum + val, 0);
  const weekendSpending = dayOfWeekDistribution[0] + dayOfWeekDistribution[6];
  const weekdayAverage = weekdaySpending / 5;
  const weekendAverage = weekendSpending / 2;

  // Calculate time of month pattern
  const timeOfMonthPattern = calculateSpendingByTimeOfMonth(debits);

  // Calculate seasonal trends (monthly averages)
  const monthlySpending = new Map<number, { total: number; count: number }>();

  debits.forEach((t) => {
    const month = t.date.getMonth() + 1; // 1-12
    const existing = monthlySpending.get(month) || { total: 0, count: 0 };
    monthlySpending.set(month, {
      total: existing.total + (t.debit || 0),
      count: existing.count + 1,
    });
  });

  const seasonalTrends = Array.from(monthlySpending.entries())
    .map(([month, data]) => ({
      month,
      averageSpend: data.count > 0 ? data.total / data.count : 0,
    }))
    .sort((a, b) => a.month - b.month);

  return {
    weekdayAverage,
    weekendAverage,
    dayOfWeekDistribution,
    timeOfMonthPattern,
    seasonalTrends,
  };
}
