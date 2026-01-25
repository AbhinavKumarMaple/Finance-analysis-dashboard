/**
 * Cash Flow Calculations
 *
 * Calculates income, expenses, and net cash flow with various granularities.
 * Provides daily, weekly, and monthly breakdowns.
 *
 * Requirements: 2.3, 3.1, 3.2, 3.5
 */

import type { Transaction, DateRange } from "../../types/transaction";
import type { CashFlowMetrics } from "../../types/analytics";

/**
 * Calculates cash flow metrics for a set of transactions
 *
 * @param transactions - Array of transactions
 * @param granularity - Time granularity for calculations
 * @returns CashFlowMetrics[] - Array of cash flow metrics per period
 */
export function calculateCashFlow(
  transactions: Transaction[],
  granularity: "daily" | "weekly" | "monthly" = "monthly",
): CashFlowMetrics[] {
  if (transactions.length === 0) {
    return [];
  }

  // Group transactions by period
  const grouped = groupByPeriod(transactions, granularity);

  // Calculate metrics for each period
  return Array.from(grouped.entries()).map(([period, txns]) => {
    return calculatePeriodMetrics(txns, period);
  });
}

/**
 * Groups transactions by time period
 *
 * @param transactions - Array of transactions
 * @param granularity - Time granularity
 * @returns Map of period key to transactions
 */
function groupByPeriod(
  transactions: Transaction[],
  granularity: "daily" | "weekly" | "monthly",
): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const key = getPeriodKey(transaction.date, granularity);
    const group = groups.get(key) || [];
    group.push(transaction);
    groups.set(key, group);
  }

  return groups;
}

/**
 * Gets period key for a date based on granularity
 *
 * @param date - Date to get key for
 * @param granularity - Time granularity
 * @returns string - Period key
 */
function getPeriodKey(
  date: Date,
  granularity: "daily" | "weekly" | "monthly",
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  switch (granularity) {
    case "daily":
      return `${year}-${month}-${day}`;
    case "weekly":
      const weekNumber = getWeekNumber(date);
      return `${year}-W${String(weekNumber).padStart(2, "0")}`;
    case "monthly":
      return `${year}-${month}`;
  }
}

/**
 * Gets ISO week number for a date
 *
 * @param date - Date to get week number for
 * @returns number - Week number (1-53)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculates metrics for a period
 *
 * @param transactions - Transactions in the period
 * @param period - Period identifier
 * @returns CashFlowMetrics - Calculated metrics
 */
function calculatePeriodMetrics(
  transactions: Transaction[],
  period: string,
): CashFlowMetrics {
  // Calculate totals
  const totalInflow = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalInflow - totalOutflow;

  // Get unique days in period
  const uniqueDays = new Set(
    transactions.map((t) => t.date.toISOString().split("T")[0]),
  ).size;

  const days = uniqueDays || 1;

  // Calculate averages
  const averageDailyInflow = totalInflow / days;
  const averageDailyOutflow = totalOutflow / days;

  // Count surplus and deficit days
  const dailyNetFlows = calculateDailyNetFlows(transactions);
  const surplusDays = dailyNetFlows.filter((flow) => flow > 0).length;
  const deficitDays = dailyNetFlows.filter((flow) => flow < 0).length;

  return {
    totalInflow,
    totalOutflow,
    netCashFlow,
    averageDailyInflow,
    averageDailyOutflow,
    surplusDays,
    deficitDays,
  };
}

/**
 * Calculates net cash flow for each day
 *
 * @param transactions - Array of transactions
 * @returns number[] - Array of daily net flows
 */
function calculateDailyNetFlows(transactions: Transaction[]): number[] {
  const dailyFlows = new Map<string, number>();

  for (const transaction of transactions) {
    const dateKey = transaction.date.toISOString().split("T")[0];
    const current = dailyFlows.get(dateKey) || 0;

    if (transaction.type === "credit") {
      dailyFlows.set(dateKey, current + transaction.amount);
    } else {
      dailyFlows.set(dateKey, current - transaction.amount);
    }
  }

  return Array.from(dailyFlows.values());
}

/**
 * Calculates total income for a period
 *
 * @param transactions - Array of transactions
 * @param dateRange - Optional date range
 * @returns number - Total income (sum of credits)
 */
export function calculateTotalIncome(
  transactions: Transaction[],
  dateRange?: DateRange,
): number {
  let filtered = transactions;

  if (dateRange) {
    filtered = transactions.filter(
      (t) => t.date >= dateRange.start && t.date <= dateRange.end,
    );
  }

  return filtered
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculates total expenses for a period
 *
 * @param transactions - Array of transactions
 * @param dateRange - Optional date range
 * @returns number - Total expenses (sum of debits)
 */
export function calculateTotalExpenses(
  transactions: Transaction[],
  dateRange?: DateRange,
): number {
  let filtered = transactions;

  if (dateRange) {
    filtered = transactions.filter(
      (t) => t.date >= dateRange.start && t.date <= dateRange.end,
    );
  }

  return filtered
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculates net cash flow (income - expenses)
 *
 * @param transactions - Array of transactions
 * @param dateRange - Optional date range
 * @returns number - Net cash flow
 */
export function calculateNetCashFlow(
  transactions: Transaction[],
  dateRange?: DateRange,
): number {
  const income = calculateTotalIncome(transactions, dateRange);
  const expenses = calculateTotalExpenses(transactions, dateRange);
  return income - expenses;
}

/**
 * Calculates savings rate as percentage of income
 *
 * @param transactions - Array of transactions
 * @param dateRange - Optional date range
 * @returns number - Savings rate (0-100)
 */
export function calculateSavingsRate(
  transactions: Transaction[],
  dateRange?: DateRange,
): number {
  const income = calculateTotalIncome(transactions, dateRange);
  const expenses = calculateTotalExpenses(transactions, dateRange);

  if (income === 0) {
    return 0;
  }

  const savings = income - expenses;
  return (savings / income) * 100;
}

/**
 * Gets cash flow trend over time
 *
 * @param transactions - Array of transactions
 * @param granularity - Time granularity
 * @returns Array of {period, inflow, outflow, net} objects
 */
export function getCashFlowTrend(
  transactions: Transaction[],
  granularity: "daily" | "weekly" | "monthly" = "monthly",
): Array<{
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}> {
  const metrics = calculateCashFlow(transactions, granularity);

  return metrics.map((m, index) => ({
    period: getPeriodKey(transactions[index]?.date || new Date(), granularity),
    inflow: m.totalInflow,
    outflow: m.totalOutflow,
    net: m.netCashFlow,
  }));
}

/**
 * Identifies surplus and deficit periods
 *
 * @param transactions - Array of transactions
 * @param granularity - Time granularity
 * @returns Object with surplus and deficit periods
 */
export function identifySurplusDeficitPeriods(
  transactions: Transaction[],
  granularity: "daily" | "weekly" | "monthly" = "monthly",
): {
  surplus: string[];
  deficit: string[];
} {
  const grouped = groupByPeriod(transactions, granularity);
  const surplus: string[] = [];
  const deficit: string[] = [];

  for (const [period, txns] of grouped.entries()) {
    const metrics = calculatePeriodMetrics(txns, period);
    if (metrics.netCashFlow > 0) {
      surplus.push(period);
    } else if (metrics.netCashFlow < 0) {
      deficit.push(period);
    }
  }

  return { surplus, deficit };
}
