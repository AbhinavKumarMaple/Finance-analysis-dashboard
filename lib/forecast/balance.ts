/**
 * Balance Forecasting Module
 * Predicts future account balances based on historical patterns and recurring payments
 * Requirements: 16.1, 16.3, 16.4
 */

import type { Transaction } from "../../types/transaction";
import type {
  RecurringPayment,
  BalanceForecast,
  ForecastWarning,
} from "../../types/analytics";

/**
 * Forecasts end-of-month balance
 * Requirement: 16.1, 16.4
 */
export function forecastEndOfMonthBalance(
  transactions: Transaction[],
  recurring: RecurringPayment[],
): BalanceForecast {
  if (transactions.length === 0) {
    return {
      date: getEndOfMonth(new Date()),
      predictedBalance: 0,
      confidenceInterval: { low: 0, high: 0 },
      assumptions: ["No transaction history available"],
    };
  }

  // Get current balance (most recent transaction)
  const sortedTransactions = [...transactions].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
  const currentBalance = sortedTransactions[0].balance;
  const currentDate = new Date();
  const endOfMonth = getEndOfMonth(currentDate);

  // Calculate days remaining in month
  const daysRemaining = Math.ceil(
    (endOfMonth.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysRemaining <= 0) {
    return {
      date: endOfMonth,
      predictedBalance: currentBalance,
      confidenceInterval: { low: currentBalance, high: currentBalance },
      assumptions: ["Already at end of month"],
    };
  }

  // Calculate historical daily averages
  const { avgDailyIncome, avgDailyExpense } =
    calculateDailyAverages(transactions);

  // Project income and expenses for remaining days
  const projectedIncome = avgDailyIncome * daysRemaining;
  const projectedExpenses = avgDailyExpense * daysRemaining;

  // Calculate recurring payments due before end of month
  const recurringPaymentsDue = calculateRecurringPaymentsDue(
    recurring,
    currentDate,
    endOfMonth,
  );

  // Calculate predicted balance
  const predictedBalance =
    currentBalance + projectedIncome - projectedExpenses - recurringPaymentsDue;

  // Calculate confidence interval (±20% based on historical variance)
  const variance = calculateVariance(transactions);
  const confidenceMargin = variance * daysRemaining;

  const assumptions: string[] = [
    `Based on ${transactions.length} historical transactions`,
    `Average daily income: ₹${avgDailyIncome.toFixed(2)}`,
    `Average daily expenses: ₹${avgDailyExpense.toFixed(2)}`,
    `${recurring.length} recurring payments detected`,
    `Recurring payments due: ₹${recurringPaymentsDue.toFixed(2)}`,
    `${daysRemaining} days remaining in month`,
  ];

  return {
    date: endOfMonth,
    predictedBalance,
    confidenceInterval: {
      low: predictedBalance - confidenceMargin,
      high: predictedBalance + confidenceMargin,
    },
    assumptions,
  };
}

/**
 * Generates warnings for low or negative balance forecasts
 * Requirement: 16.3
 */
export function generateWarnings(
  forecasts: BalanceForecast[],
  thresholds: { lowBalance: number },
): ForecastWarning[] {
  const warnings: ForecastWarning[] = [];

  for (const forecast of forecasts) {
    // Check for negative balance
    if (forecast.predictedBalance < 0) {
      warnings.push({
        type: "negative_balance",
        date: forecast.date,
        message: `Account balance is predicted to go negative (₹${forecast.predictedBalance.toFixed(2)}) by ${forecast.date.toLocaleDateString()}`,
        severity: "critical",
      });
    }
    // Check for low balance
    else if (forecast.predictedBalance < thresholds.lowBalance) {
      warnings.push({
        type: "low_balance",
        date: forecast.date,
        message: `Account balance is predicted to fall below threshold (₹${forecast.predictedBalance.toFixed(2)}) by ${forecast.date.toLocaleDateString()}`,
        severity: "warning",
      });
    }
    // Check if confidence interval includes negative balance
    else if (forecast.confidenceInterval.low < 0) {
      warnings.push({
        type: "negative_balance",
        date: forecast.date,
        message: `There is a risk of negative balance (worst case: ₹${forecast.confidenceInterval.low.toFixed(2)}) by ${forecast.date.toLocaleDateString()}`,
        severity: "warning",
      });
    }
  }

  return warnings;
}

/**
 * Helper: Gets the last day of the current month
 */
function getEndOfMonth(date: Date): Date {
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
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
 * Helper: Calculates total recurring payments due in a date range
 */
function calculateRecurringPaymentsDue(
  recurring: RecurringPayment[],
  startDate: Date,
  endDate: Date,
): number {
  let total = 0;

  for (const payment of recurring) {
    if (
      payment.nextExpectedDate >= startDate &&
      payment.nextExpectedDate <= endDate
    ) {
      total += payment.amount;
    }
  }

  return total;
}

/**
 * Helper: Calculates variance in daily cash flow
 */
function calculateVariance(transactions: Transaction[]): number {
  if (transactions.length < 2) {
    return 0;
  }

  // Group transactions by day
  const dailyCashFlow = new Map<string, number>();

  for (const transaction of transactions) {
    const dateKey = transaction.date.toISOString().split("T")[0];
    const netFlow = (transaction.credit || 0) - (transaction.debit || 0);
    dailyCashFlow.set(dateKey, (dailyCashFlow.get(dateKey) || 0) + netFlow);
  }

  // Calculate variance
  const flows = Array.from(dailyCashFlow.values());
  const mean = flows.reduce((sum, f) => sum + f, 0) / flows.length;
  const squaredDiffs = flows.map((f) => Math.pow(f - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / flows.length;

  return Math.sqrt(variance);
}
