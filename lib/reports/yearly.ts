/**
 * Yearly Report Generation
 * Generates comprehensive yearly financial reports
 */

import type { Transaction } from "@/types/transaction";
import type { Tag } from "@/types/tag";
import type { Budget } from "@/types/budget";
import type { YearlyReport } from "@/types/analytics";
import { generateMonthlyReport } from "./monthly";
import { calculateSpendingBreakdown } from "@/lib/analytics/spending";

/**
 * Generate a yearly report for a specific year
 */
export function generateYearlyReport(
  transactions: Transaction[],
  tags: Tag[],
  budgets: Budget[],
  year: number,
): YearlyReport {
  // Filter transactions for the year
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);
  const yearTransactions = transactions.filter(
    (t) => t.date >= startDate && t.date <= endDate,
  );

  // Generate monthly breakdown
  const monthlyBreakdown = [];
  for (let month = 1; month <= 12; month++) {
    const monthReport = generateMonthlyReport(
      transactions,
      tags,
      budgets,
      year,
      month,
    );
    // Only include months with transactions
    if (
      monthReport.summary.totalIncome > 0 ||
      monthReport.summary.totalExpenses > 0
    ) {
      monthlyBreakdown.push(monthReport);
    }
  }

  // Calculate yearly summary
  const totalIncome = monthlyBreakdown.reduce(
    (sum, m) => sum + m.summary.totalIncome,
    0,
  );
  const totalExpenses = monthlyBreakdown.reduce(
    (sum, m) => sum + m.summary.totalExpenses,
    0,
  );
  const netSavings = totalIncome - totalExpenses;
  const averageMonthlySavings =
    monthlyBreakdown.length > 0 ? netSavings / monthlyBreakdown.length : 0;

  // Calculate spending breakdown for the year
  const spendingBreakdown = calculateSpendingBreakdown(yearTransactions, tags);

  // Get top categories
  const topCategories = Array.from(spendingBreakdown.byTag.entries())
    .map(([tagId, amount]) => ({ tagId, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Get top merchants
  const topMerchants = spendingBreakdown.byMerchant.slice(0, 10);

  // Calculate investment summary
  const investmentTag = tags.find(
    (t) =>
      t.name.toLowerCase().includes("investment") ||
      t.name.toLowerCase().includes("sip") ||
      t.name.toLowerCase().includes("mutual"),
  );

  let totalInvested = 0;
  let investmentMonths = 0;

  if (investmentTag) {
    const investmentTransactions = yearTransactions.filter((t) =>
      t.tagIds.includes(investmentTag.id),
    );
    totalInvested = investmentTransactions.reduce(
      (sum, t) => sum + (t.debit || 0),
      0,
    );

    // Calculate consistency (months with investments / total months)
    const monthsWithInvestments = new Set(
      investmentTransactions.map(
        (t) => `${t.date.getFullYear()}-${t.date.getMonth()}`,
      ),
    );
    investmentMonths = monthsWithInvestments.size;
  }

  const sipConsistency =
    monthlyBreakdown.length > 0
      ? (investmentMonths / monthlyBreakdown.length) * 100
      : 0;

  // Calculate year-over-year comparison if previous year data exists
  const previousYearTransactions = transactions.filter((t) => {
    const txYear = t.date.getFullYear();
    return txYear === year - 1;
  });

  let yearOverYearComparison;
  if (previousYearTransactions.length > 0) {
    const prevYearIncome = previousYearTransactions
      .filter((t) => t.credit !== null)
      .reduce((sum, t) => sum + (t.credit || 0), 0);
    const prevYearExpenses = previousYearTransactions
      .filter((t) => t.debit !== null)
      .reduce((sum, t) => sum + (t.debit || 0), 0);
    const prevYearSavings = prevYearIncome - prevYearExpenses;

    yearOverYearComparison = {
      incomeChange:
        prevYearIncome > 0
          ? ((totalIncome - prevYearIncome) / prevYearIncome) * 100
          : 0,
      expenseChange:
        prevYearExpenses > 0
          ? ((totalExpenses - prevYearExpenses) / prevYearExpenses) * 100
          : 0,
      savingsChange:
        prevYearSavings !== 0
          ? ((netSavings - prevYearSavings) / Math.abs(prevYearSavings)) * 100
          : 0,
    };
  }

  return {
    year,
    generatedAt: new Date(),
    summary: {
      totalIncome,
      totalExpenses,
      netSavings,
      averageMonthlySavings,
    },
    monthlyBreakdown,
    yearOverYearComparison,
    topCategories,
    topMerchants,
    investmentSummary: {
      totalInvested,
      sipConsistency,
    },
  };
}

/**
 * Get available years with transaction data
 */
export function getAvailableYears(transactions: Transaction[]): number[] {
  const yearSet = new Set<number>();

  transactions.forEach((t) => {
    yearSet.add(t.date.getFullYear());
  });

  return Array.from(yearSet).sort((a, b) => b - a);
}
