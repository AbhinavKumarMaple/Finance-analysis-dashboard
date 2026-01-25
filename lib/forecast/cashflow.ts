/**
 * Cash Flow Projection Module
 * Projects future cash flow based on historical patterns and recurring payments
 * Requirements: 16.2
 */

import type { Transaction } from "../../types/transaction";
import type {
  RecurringPayment,
  CashFlowProjection,
} from "../../types/analytics";

/**
 * Projects cash flow for specified number of days ahead
 * Requirement: 16.2
 */
export function projectCashFlow(
  transactions: Transaction[],
  days: number,
): CashFlowProjection[] {
  if (transactions.length === 0 || days <= 0) {
    return [];
  }

  // Calculate historical daily averages
  const { avgDailyIncome, avgDailyExpense } =
    calculateDailyAverages(transactions);

  // Get recurring payments from transactions
  const recurring = detectRecurringPayments(transactions);

  // Generate projections for 30, 60, 90 day periods
  const projections: CashFlowProjection[] = [];
  const currentDate = new Date();

  // Common projection periods
  const periods = [30, 60, 90].filter((p) => p <= days);

  for (const periodDays of periods) {
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + periodDays);

    // Calculate expected inflow and outflow
    const expectedInflow = avgDailyIncome * periodDays;
    const expectedOutflow = avgDailyExpense * periodDays;

    // Get recurring payments due in this period
    const recurringInPeriod = recurring.filter((r) => {
      return r.nextExpectedDate >= currentDate && r.nextExpectedDate <= endDate;
    });

    // Add recurring payment amounts to expected outflow
    const recurringTotal = recurringInPeriod.reduce(
      (sum, r) => sum + r.amount,
      0,
    );

    projections.push({
      period: `${periodDays} days`,
      expectedInflow,
      expectedOutflow: expectedOutflow + recurringTotal,
      netFlow: expectedInflow - expectedOutflow - recurringTotal,
      recurringPayments: recurringInPeriod,
    });
  }

  return projections;
}

/**
 * Helper: Calculates average daily income and expenses
 */
function calculateDailyAverages(transactions: Transaction[]): {
  avgDailyIncome: number;
  avgDailyExpense: number;
} {
  if (transactions.length === 0) {
    return { avgDailyIncome: 0, avgDailyExpense: 0 };
  }

  // Get date range
  const dates = transactions.map((t) => t.date.getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const daysCovered = Math.max(
    1,
    Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)),
  );

  // Calculate totals
  const totalIncome = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
  const totalExpense = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);

  return {
    avgDailyIncome: totalIncome / daysCovered,
    avgDailyExpense: totalExpense / daysCovered,
  };
}

/**
 * Helper: Detects recurring payments from transaction history
 * Simplified version for cash flow projections
 */
function detectRecurringPayments(
  transactions: Transaction[],
): RecurringPayment[] {
  // Filter debit transactions only
  const debits = transactions.filter((t) => t.type === "debit");

  if (debits.length < 2) {
    return [];
  }

  // Group transactions by merchant
  const merchantGroups = groupByMerchant(debits);

  const recurringPayments: RecurringPayment[] = [];

  // Analyze each merchant group for recurring patterns
  for (const [merchant, merchantTransactions] of merchantGroups.entries()) {
    if (merchantTransactions.length < 2) {
      continue;
    }

    const recurring = analyzeRecurringPattern(merchant, merchantTransactions);
    if (recurring) {
      recurringPayments.push(recurring);
    }
  }

  return recurringPayments;
}

/**
 * Helper: Groups transactions by merchant identifier
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
 * Helper: Extracts merchant identifier from transaction details
 */
function extractMerchantIdentifier(details: string): string {
  // Simple extraction: use first meaningful word
  const words = details.split(/[\s/]+/).filter((w) => w.length > 3);
  return words[0] || details.substring(0, 20);
}

/**
 * Helper: Analyzes a group of transactions for recurring patterns
 */
function analyzeRecurringPattern(
  merchant: string,
  transactions: Transaction[],
): RecurringPayment | null {
  // Sort by date
  const sorted = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Check for similar amounts (within 5% tolerance)
  const amounts = sorted.map((t) => t.debit || 0);
  const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

  // Filter transactions with similar amounts
  const similarAmounts = sorted.filter((t) => {
    const amount = t.debit || 0;
    const diff = Math.abs(amount - avgAmount);
    return diff / avgAmount <= 0.05; // 5% tolerance
  });

  if (similarAmounts.length < 2) {
    return null;
  }

  // Calculate intervals between transactions
  const intervals: number[] = [];
  for (let i = 1; i < similarAmounts.length; i++) {
    const daysDiff = Math.round(
      (similarAmounts[i].date.getTime() -
        similarAmounts[i - 1].date.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    intervals.push(daysDiff);
  }

  // Detect frequency from intervals
  const frequency = detectFrequency(intervals);
  if (!frequency) {
    return null;
  }

  // Calculate confidence based on consistency
  const confidence = calculateConfidence(intervals, frequency);

  // Calculate next expected date
  const lastTransaction = similarAmounts[similarAmounts.length - 1];
  const nextExpectedDate = calculateNextDate(lastTransaction.date, frequency);

  return {
    merchant,
    amount: avgAmount,
    frequency: frequency.type,
    nextExpectedDate,
    category: "other",
    confidence,
  };
}

/**
 * Helper: Detects frequency from interval patterns
 */
function detectFrequency(intervals: number[]): {
  type: "weekly" | "monthly" | "quarterly" | "yearly";
  days: number;
} | null {
  if (intervals.length === 0) return null;

  const avgInterval =
    intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

  // Weekly: ~7 days (±3 days tolerance)
  if (avgInterval >= 4 && avgInterval <= 10) {
    return { type: "weekly", days: 7 };
  }

  // Monthly: ~30 days (±7 days tolerance)
  if (avgInterval >= 23 && avgInterval <= 37) {
    return { type: "monthly", days: 30 };
  }

  // Quarterly: ~90 days (±15 days tolerance)
  if (avgInterval >= 75 && avgInterval <= 105) {
    return { type: "quarterly", days: 90 };
  }

  // Yearly: ~365 days (±30 days tolerance)
  if (avgInterval >= 335 && avgInterval <= 395) {
    return { type: "yearly", days: 365 };
  }

  return null;
}

/**
 * Helper: Calculates confidence score based on interval consistency
 */
function calculateConfidence(
  intervals: number[],
  frequency: { type: string; days: number },
): number {
  if (intervals.length === 0) return 0;

  // Calculate variance from expected frequency
  const variances = intervals.map((interval) =>
    Math.abs(interval - frequency.days),
  );
  const avgVariance =
    variances.reduce((sum, v) => sum + v, 0) / variances.length;

  // Convert variance to confidence (0-100)
  const maxVariance = frequency.days * 0.3; // 30% tolerance
  const confidence = Math.max(
    0,
    Math.min(100, 100 - (avgVariance / maxVariance) * 100),
  );

  return Math.round(confidence);
}

/**
 * Helper: Calculates next expected payment date
 */
function calculateNextDate(
  lastDate: Date,
  frequency: { type: string; days: number },
): Date {
  const nextDate = new Date(lastDate);

  switch (frequency.type) {
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
}
