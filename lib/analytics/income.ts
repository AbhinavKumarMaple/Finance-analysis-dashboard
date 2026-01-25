/**
 * Income Analysis Module
 * Analyzes income transactions, detects salary patterns, and identifies unusual income
 */

import type { Transaction } from "../../types/transaction";
import type { IncomeAnalysis, MonthlyAmount } from "../../types/analytics";

/**
 * Analyzes income transactions and provides insights
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function analyzeIncome(transactions: Transaction[]): IncomeAnalysis {
  // Filter credit transactions (income)
  const incomeTransactions = transactions.filter((t) => t.type === "credit");

  if (incomeTransactions.length === 0) {
    return {
      totalIncome: 0,
      bySource: new Map(),
      monthlyTrend: [],
      detectedSalaryDate: null,
      unusualIncomes: [],
    };
  }

  // Calculate total income
  const totalIncome = incomeTransactions.reduce(
    (sum, t) => sum + (t.credit || 0),
    0,
  );

  // Categorize income by source (extracted from transaction details)
  const bySource = categorizeIncomeBySource(incomeTransactions);

  // Calculate monthly trend
  const monthlyTrend = calculateMonthlyTrend(incomeTransactions);

  // Detect salary date pattern
  const detectedSalaryDate = detectSalaryDate(incomeTransactions);

  // Flag unusual income (>2x average)
  const unusualIncomes = detectUnusualIncome(incomeTransactions);

  return {
    totalIncome,
    bySource,
    monthlyTrend,
    detectedSalaryDate,
    unusualIncomes,
  };
}

/**
 * Categorizes income by source based on transaction details
 * Requirement: 5.1
 */
function categorizeIncomeBySource(
  transactions: Transaction[],
): Map<string, number> {
  const sourceMap = new Map<string, number>();

  for (const transaction of transactions) {
    const source = extractIncomeSource(transaction.details);
    const currentAmount = sourceMap.get(source) || 0;
    sourceMap.set(source, currentAmount + (transaction.credit || 0));
  }

  return sourceMap;
}

/**
 * Extracts income source from transaction details
 */
function extractIncomeSource(details: string): string {
  const lowerDetails = details.toLowerCase();

  // Salary patterns
  if (
    lowerDetails.includes("salary") ||
    lowerDetails.includes("sal cr") ||
    lowerDetails.includes("payroll")
  ) {
    return "Salary";
  }

  // Interest patterns
  if (
    lowerDetails.includes("interest") ||
    lowerDetails.includes("int cr") ||
    lowerDetails.includes("int.cr")
  ) {
    return "Interest";
  }

  // Refund patterns
  if (
    lowerDetails.includes("refund") ||
    lowerDetails.includes("reversal") ||
    lowerDetails.includes("cashback")
  ) {
    return "Refunds";
  }

  // Investment returns
  if (
    lowerDetails.includes("dividend") ||
    lowerDetails.includes("mutual fund") ||
    lowerDetails.includes("redemption")
  ) {
    return "Investments";
  }

  // Transfer from own accounts
  if (
    lowerDetails.includes("transfer") ||
    lowerDetails.includes("neft") ||
    lowerDetails.includes("imps") ||
    lowerDetails.includes("upi")
  ) {
    return "Transfers";
  }

  // Default category
  return "Other Income";
}

/**
 * Calculates monthly income trend
 * Requirement: 5.2
 */
function calculateMonthlyTrend(transactions: Transaction[]): MonthlyAmount[] {
  const monthlyMap = new Map<string, number>();

  for (const transaction of transactions) {
    const month = formatMonth(transaction.date);
    const currentAmount = monthlyMap.get(month) || 0;
    monthlyMap.set(month, currentAmount + (transaction.credit || 0));
  }

  // Convert to array and sort by month
  const trend = Array.from(monthlyMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return trend;
}

/**
 * Formats date to YYYY-MM format
 */
function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Detects salary date pattern by finding the most common day of month for large credits
 * Requirement: 5.3
 */
function detectSalaryDate(transactions: Transaction[]): number | null {
  // Filter for potentially salary transactions (larger amounts)
  const amounts = transactions.map((t) => t.credit || 0);
  const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const medianAmount = calculateMedian(amounts);

  // Consider transactions above median as potential salary
  const threshold = Math.max(medianAmount, avgAmount * 0.5);
  const potentialSalary = transactions.filter(
    (t) => (t.credit || 0) >= threshold,
  );

  if (potentialSalary.length < 2) {
    return null;
  }

  // Count occurrences of each day of month
  const dayCount = new Map<number, number>();
  for (const transaction of potentialSalary) {
    const day = transaction.date.getDate();
    dayCount.set(day, (dayCount.get(day) || 0) + 1);
  }

  // Find the most common day
  let maxCount = 0;
  let salaryDay: number | null = null;

  for (const [day, count] of dayCount.entries()) {
    if (count > maxCount) {
      maxCount = count;
      salaryDay = day;
    }
  }

  // Only return if we have at least 2 occurrences
  return maxCount >= 2 ? salaryDay : null;
}

/**
 * Calculates median of an array of numbers
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Detects unusual income transactions (>2x average)
 * Requirement: 5.4
 */
function detectUnusualIncome(transactions: Transaction[]): Transaction[] {
  if (transactions.length === 0) return [];

  // Calculate average income
  const totalIncome = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
  const avgIncome = totalIncome / transactions.length;

  // Flag transactions > 2x average
  const threshold = avgIncome * 2;
  return transactions.filter((t) => (t.credit || 0) > threshold);
}
