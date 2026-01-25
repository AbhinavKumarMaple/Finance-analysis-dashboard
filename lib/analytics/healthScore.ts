/**
 * Financial Health Score Module
 * Calculates overall financial health score and provides recommendations
 */

import type { Transaction } from "../../types/transaction";
import type { Budget } from "../../types/budget";
import type { HealthScore, HealthScoreComponent } from "../../types/analytics";

/**
 * Calculates financial health score (0-100)
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */
export function calculateHealthScore(
  transactions: Transaction[],
  budgets: Budget[],
): HealthScore {
  if (transactions.length === 0) {
    return {
      score: 0,
      components: {
        savingsRate: { score: 0, weight: 0.3, value: 0 },
        budgetAdherence: { score: 0, weight: 0.25, value: 0 },
        spendingDiversity: { score: 0, weight: 0.25, value: 0 },
        emergencyFund: { score: 0, weight: 0.2, value: 0 },
      },
      recommendations: ["Upload transaction data to calculate health score"],
      trend: "stable",
    };
  }

  // Calculate component scores
  const savingsRate = calculateSavingsRateScore(transactions);
  const budgetAdherence = calculateBudgetAdherenceScore(transactions, budgets);
  const spendingDiversity = calculateSpendingDiversityScore(transactions);
  const emergencyFund = calculateEmergencyFundScore(transactions);

  // Calculate weighted overall score
  const overallScore =
    savingsRate.score * savingsRate.weight +
    budgetAdherence.score * budgetAdherence.weight +
    spendingDiversity.score * spendingDiversity.weight +
    emergencyFund.score * emergencyFund.weight;

  // Ensure score is within bounds [0, 100]
  const finalScore = Math.max(0, Math.min(100, Math.round(overallScore)));

  // Generate recommendations
  const recommendations = generateRecommendations({
    savingsRate,
    budgetAdherence,
    spendingDiversity,
    emergencyFund,
  });

  // Determine trend (simplified - would need historical data for real trend)
  const trend = determineTrend(finalScore);

  return {
    score: finalScore,
    components: {
      savingsRate,
      budgetAdherence,
      spendingDiversity,
      emergencyFund,
    },
    recommendations,
    trend,
  };
}

/**
 * Calculates savings rate score
 * Requirement: 12.2
 */
function calculateSavingsRateScore(
  transactions: Transaction[],
): HealthScoreComponent {
  const totalIncome = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + (t.credit || 0), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + (t.debit || 0), 0);

  if (totalIncome === 0) {
    return { score: 0, weight: 0.3, value: 0 };
  }

  const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;

  // Score based on savings rate
  // 0-10%: 0-40 points
  // 10-20%: 40-70 points
  // 20-30%: 70-90 points
  // 30%+: 90-100 points
  let score = 0;
  if (savingsRate < 0) {
    score = 0; // Negative savings
  } else if (savingsRate < 10) {
    score = savingsRate * 4; // 0-40
  } else if (savingsRate < 20) {
    score = 40 + (savingsRate - 10) * 3; // 40-70
  } else if (savingsRate < 30) {
    score = 70 + (savingsRate - 20) * 2; // 70-90
  } else {
    score = Math.min(100, 90 + (savingsRate - 30)); // 90-100
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    weight: 0.3,
    value: Math.round(savingsRate * 10) / 10,
  };
}

/**
 * Calculates budget adherence score
 * Requirement: 12.3
 */
function calculateBudgetAdherenceScore(
  transactions: Transaction[],
  budgets: Budget[],
): HealthScoreComponent {
  if (budgets.length === 0) {
    // No budgets set - neutral score
    return { score: 50, weight: 0.25, value: 0 };
  }

  // Calculate adherence for each budget
  const adherenceScores: number[] = [];

  for (const budget of budgets) {
    // Get transactions for this budget's tag and period
    const budgetTransactions = transactions.filter((t) => {
      const transactionMonth = formatMonth(t.date);
      return (
        t.type === "debit" &&
        t.tagIds.includes(budget.tagId) &&
        transactionMonth === budget.period
      );
    });

    const spent = budgetTransactions.reduce(
      (sum, t) => sum + (t.debit || 0),
      0,
    );
    const percentUsed = (spent / budget.monthlyLimit) * 100;

    // Score based on budget usage
    // 0-80%: 100 points (on track)
    // 80-100%: 100-70 points (warning)
    // 100%+: 70-0 points (exceeded)
    let budgetScore = 0;
    if (percentUsed <= 80) {
      budgetScore = 100;
    } else if (percentUsed <= 100) {
      budgetScore = 100 - (percentUsed - 80) * 1.5; // 100-70
    } else {
      budgetScore = Math.max(0, 70 - (percentUsed - 100) * 0.7); // 70-0
    }

    adherenceScores.push(budgetScore);
  }

  // Average adherence score
  const avgAdherence =
    adherenceScores.reduce((sum, s) => sum + s, 0) / adherenceScores.length;

  return {
    score: Math.round(avgAdherence),
    weight: 0.25,
    value: Math.round(avgAdherence),
  };
}

/**
 * Calculates spending diversity score
 * Requirement: 12.4
 */
function calculateSpendingDiversityScore(
  transactions: Transaction[],
): HealthScoreComponent {
  const debits = transactions.filter((t) => t.type === "debit");

  if (debits.length === 0) {
    return { score: 50, weight: 0.25, value: 0 };
  }

  // Group by tags
  const tagSpending = new Map<string, number>();
  for (const transaction of debits) {
    for (const tagId of transaction.tagIds) {
      const current = tagSpending.get(tagId) || 0;
      tagSpending.set(tagId, current + (transaction.debit || 0));
    }
  }

  const totalSpending = debits.reduce((sum, t) => sum + (t.debit || 0), 0);

  // Calculate concentration (Herfindahl index)
  let concentration = 0;
  for (const amount of tagSpending.values()) {
    const share = amount / totalSpending;
    concentration += share * share;
  }

  // Convert concentration to diversity score
  // Lower concentration = higher diversity = better score
  // Concentration ranges from 1/n (perfect diversity) to 1 (all in one category)
  const numCategories = tagSpending.size;
  const perfectDiversity = numCategories > 0 ? 1 / numCategories : 1;

  // Normalize: 0 (worst) to 100 (best)
  const diversityScore =
    numCategories > 1
      ? ((1 - concentration) / (1 - perfectDiversity)) * 100
      : 50;

  return {
    score: Math.max(0, Math.min(100, Math.round(diversityScore))),
    weight: 0.25,
    value: numCategories,
  };
}

/**
 * Calculates emergency fund score
 * Requirement: 12.5
 */
function calculateEmergencyFundScore(
  transactions: Transaction[],
): HealthScoreComponent {
  if (transactions.length === 0) {
    return { score: 0, weight: 0.2, value: 0 };
  }

  // Get current balance (most recent transaction)
  const sortedByDate = [...transactions].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
  const currentBalance = sortedByDate[0].balance;

  // Calculate average monthly expenses
  const debits = transactions.filter((t) => t.type === "debit");
  const totalExpenses = debits.reduce((sum, t) => sum + (t.debit || 0), 0);

  // Calculate number of months covered
  const dates = transactions.map((t) => t.date);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const monthsCovered =
    (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
    (maxDate.getMonth() - minDate.getMonth()) +
    1;

  const avgMonthlyExpenses =
    monthsCovered > 0 ? totalExpenses / monthsCovered : 0;

  if (avgMonthlyExpenses === 0) {
    return { score: 50, weight: 0.2, value: 0 };
  }

  // Calculate months of expenses covered by current balance
  const monthsOfExpenses = currentBalance / avgMonthlyExpenses;

  // Score based on emergency fund coverage
  // 0-1 months: 0-30 points
  // 1-3 months: 30-60 points
  // 3-6 months: 60-90 points
  // 6+ months: 90-100 points
  let score = 0;
  if (monthsOfExpenses < 1) {
    score = monthsOfExpenses * 30;
  } else if (monthsOfExpenses < 3) {
    score = 30 + (monthsOfExpenses - 1) * 15;
  } else if (monthsOfExpenses < 6) {
    score = 60 + (monthsOfExpenses - 3) * 10;
  } else {
    score = Math.min(100, 90 + (monthsOfExpenses - 6) * 2);
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    weight: 0.2,
    value: Math.round(monthsOfExpenses * 10) / 10,
  };
}

/**
 * Generates personalized recommendations
 * Requirement: 12.6
 */
function generateRecommendations(components: {
  savingsRate: HealthScoreComponent;
  budgetAdherence: HealthScoreComponent;
  spendingDiversity: HealthScoreComponent;
  emergencyFund: HealthScoreComponent;
}): string[] {
  const recommendations: string[] = [];

  // Savings rate recommendations
  if (components.savingsRate.score < 40) {
    recommendations.push(
      "Your savings rate is low. Try to save at least 10-20% of your income.",
    );
  } else if (components.savingsRate.score < 70) {
    recommendations.push(
      "Good savings rate! Aim for 20-30% to build wealth faster.",
    );
  } else {
    recommendations.push("Excellent savings rate! Keep up the great work.");
  }

  // Budget adherence recommendations
  if (components.budgetAdherence.score < 50) {
    recommendations.push(
      "You're exceeding your budgets. Review your spending categories and adjust limits.",
    );
  } else if (components.budgetAdherence.score < 80) {
    recommendations.push(
      "Budget adherence needs improvement. Track your spending more closely.",
    );
  }

  // Spending diversity recommendations
  if (components.spendingDiversity.score < 40) {
    recommendations.push(
      "Your spending is concentrated in few categories. Consider diversifying to reduce risk.",
    );
  }

  // Emergency fund recommendations
  if (components.emergencyFund.score < 30) {
    recommendations.push(
      "Build an emergency fund covering at least 3-6 months of expenses.",
    );
  } else if (components.emergencyFund.score < 60) {
    recommendations.push(
      "Your emergency fund is growing. Aim for 3-6 months of expenses.",
    );
  } else if (components.emergencyFund.score < 90) {
    recommendations.push(
      "Good emergency fund! Consider reaching 6 months of expenses for better security.",
    );
  }

  // General recommendations
  if (recommendations.length === 1) {
    recommendations.push(
      "Continue monitoring your finances regularly to maintain good health.",
    );
  }

  return recommendations;
}

/**
 * Determines trend based on score
 */
function determineTrend(score: number): "improving" | "stable" | "declining" {
  // Simplified trend determination
  // In a real implementation, this would compare with historical scores
  if (score >= 70) {
    return "improving";
  } else if (score >= 40) {
    return "stable";
  } else {
    return "declining";
  }
}

/**
 * Formats date to YYYY-MM format
 */
function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
