/**
 * Monthly Report Generation
 * Generates comprehensive monthly financial reports
 */

import type { Transaction } from "@/types/transaction";
import type { Tag } from "@/types/tag";
import type { Budget } from "@/types/budget";
import type { MonthlyReport } from "@/types/analytics";
import { calculateBalanceMetrics } from "@/lib/analytics/balance";
import { calculateCashFlow } from "@/lib/analytics/cashflow";
import { calculateSpendingBreakdown } from "@/lib/analytics/spending";
import { getBudgetStatus } from "@/lib/budget/budgets";
import { calculateHealthScore } from "@/lib/analytics/healthScore";
import { detectAnomalies } from "@/lib/analytics/anomalies";

/**
 * Generate a monthly report for a specific period
 */
export function generateMonthlyReport(
  transactions: Transaction[],
  tags: Tag[],
  budgets: Budget[],
  year: number,
  month: number, // 1-12
): MonthlyReport {
  const period = `${year}-${String(month).padStart(2, "0")}`;

  // Filter transactions for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const monthTransactions = transactions.filter(
    (t) => t.date >= startDate && t.date <= endDate,
  );

  // Calculate metrics
  const balanceMetrics = calculateBalanceMetrics(monthTransactions, {
    start: startDate,
    end: endDate,
  });

  const cashFlowData = calculateCashFlow(monthTransactions, "monthly");
  const cashFlow =
    cashFlowData.length > 0
      ? cashFlowData[0]
      : {
          totalInflow: 0,
          totalOutflow: 0,
          netCashFlow: 0,
          averageDailyInflow: 0,
          averageDailyOutflow: 0,
          surplusDays: 0,
          deficitDays: 0,
        };

  const spendingBreakdown = calculateSpendingBreakdown(monthTransactions, tags);

  // Calculate budget performance
  const monthBudgets = budgets.filter((b) => b.period === period);
  const budgetPerformance = monthBudgets.map((budget) =>
    getBudgetStatus(budget, monthTransactions),
  );

  const healthScore = calculateHealthScore(monthTransactions, budgets);
  const anomalies = detectAnomalies(monthTransactions);

  // Calculate summary
  const totalIncome = cashFlow.totalInflow;
  const totalExpenses = cashFlow.totalOutflow;
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Generate recommendations
  const recommendations = generateRecommendations(
    cashFlow,
    budgetPerformance,
    healthScore,
    anomalies,
  );

  return {
    period,
    generatedAt: new Date(),
    summary: {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
    },
    balanceMetrics,
    cashFlow,
    spendingByTag: spendingBreakdown.byTag,
    topMerchants: spendingBreakdown.byMerchant.slice(0, 10),
    budgetPerformance,
    healthScore,
    anomalies,
    recommendations,
  };
}

/**
 * Generate recommendations based on report data
 */
function generateRecommendations(
  cashFlow: any,
  budgetPerformance: any[],
  healthScore: any,
  anomalies: any[],
): string[] {
  const recommendations: string[] = [];

  // Cash flow recommendations
  if (cashFlow.netCashFlow < 0) {
    recommendations.push(
      "Your expenses exceeded income this month. Consider reviewing your spending patterns.",
    );
  }

  // Budget recommendations
  const exceededBudgets = budgetPerformance.filter(
    (b) => b.status === "exceeded",
  );
  if (exceededBudgets.length > 0) {
    recommendations.push(
      `You exceeded ${exceededBudgets.length} budget(s) this month. Review these categories to stay on track.`,
    );
  }

  // Health score recommendations
  if (healthScore.score < 60) {
    recommendations.push(
      "Your financial health score is below average. Focus on increasing savings and reducing unnecessary expenses.",
    );
  }

  // Anomaly recommendations
  const highSeverityAnomalies = anomalies.filter((a) => a.severity === "high");
  if (highSeverityAnomalies.length > 0) {
    recommendations.push(
      `${highSeverityAnomalies.length} unusual transaction(s) detected. Review these for accuracy.`,
    );
  }

  // Add health score recommendations
  recommendations.push(...healthScore.recommendations);

  return recommendations;
}

/**
 * Get available months with transaction data
 */
export function getAvailableMonths(
  transactions: Transaction[],
): { year: number; month: number }[] {
  const monthSet = new Set<string>();

  transactions.forEach((t) => {
    const year = t.date.getFullYear();
    const month = t.date.getMonth() + 1;
    monthSet.add(`${year}-${month}`);
  });

  return Array.from(monthSet)
    .sort()
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month };
    });
}
