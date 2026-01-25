/**
 * Savings Goals Management
 * Create and track savings goals with progress calculation and what-if analysis
 */

import type { SavingsGoal, WhatIfResult } from "@/types/budget";
import type { Transaction } from "@/types/transaction";

/**
 * Create a new savings goal
 */
export function createSavingsGoal(
  name: string,
  targetAmount: number,
  deadline: Date,
): SavingsGoal {
  return {
    id: crypto.randomUUID(),
    name,
    targetAmount,
    deadline,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update an existing savings goal
 */
export function updateSavingsGoal(
  goal: SavingsGoal,
  updates: Partial<Omit<SavingsGoal, "id" | "createdAt">>,
): SavingsGoal {
  return {
    ...goal,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Delete a savings goal
 */
export function deleteSavingsGoal(
  goalId: string,
  goals: SavingsGoal[],
): SavingsGoal[] {
  return goals.filter((g) => g.id !== goalId);
}

/**
 * Calculate savings rate from transactions
 * Savings rate = (Total Income - Total Expenses) / Total Income * 100
 */
export function calculateSavingsRate(transactions: Transaction[]): number {
  const totalIncome = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + (t.credit || 0), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + (t.debit || 0), 0);

  if (totalIncome === 0) return 0;

  const savings = totalIncome - totalExpenses;
  return (savings / totalIncome) * 100;
}

/**
 * Calculate monthly savings from recent transactions
 */
function calculateMonthlySavings(transactions: Transaction[]): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return (
      txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth
    );
  });

  const income = monthlyTransactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + (t.credit || 0), 0);

  const expenses = monthlyTransactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + (t.debit || 0), 0);

  return income - expenses;
}

/**
 * Calculate average monthly savings over the last N months
 */
function calculateAverageMonthlySavings(
  transactions: Transaction[],
  months: number = 3,
): number {
  const now = new Date();
  const monthlyData: Map<string, { income: number; expenses: number }> =
    new Map();

  transactions.forEach((t) => {
    const txDate = new Date(t.date);
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;

    const current = monthlyData.get(monthKey) || { income: 0, expenses: 0 };

    if (t.type === "credit") {
      current.income += t.credit || 0;
    } else {
      current.expenses += t.debit || 0;
    }

    monthlyData.set(monthKey, current);
  });

  // Get last N months
  const monthKeys: string[] = [];
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
  }

  const monthlySavings = monthKeys
    .map((key) => {
      const data = monthlyData.get(key);
      return data ? data.income - data.expenses : 0;
    })
    .filter((savings) => savings !== 0);

  if (monthlySavings.length === 0) return 0;

  return monthlySavings.reduce((sum, s) => sum + s, 0) / monthlySavings.length;
}

/**
 * Calculate progress towards a savings goal
 */
export function calculateGoalProgress(
  goal: SavingsGoal,
  transactions: Transaction[],
): {
  currentAmount: number;
  percentComplete: number;
  remaining: number;
  monthsRemaining: number;
  requiredMonthlySavings: number;
  onTrack: boolean;
} {
  // Calculate total savings since goal creation
  const goalTransactions = transactions.filter(
    (t) => new Date(t.date) >= new Date(goal.createdAt),
  );

  const income = goalTransactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + (t.credit || 0), 0);

  const expenses = goalTransactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + (t.debit || 0), 0);

  const currentAmount = income - expenses;
  const percentComplete =
    goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = goal.targetAmount - currentAmount;

  // Calculate months remaining
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const monthsRemaining = Math.max(
    0,
    (deadline.getFullYear() - now.getFullYear()) * 12 +
      (deadline.getMonth() - now.getMonth()),
  );

  // Calculate required monthly savings
  const requiredMonthlySavings =
    monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

  // Check if on track based on average monthly savings
  const avgMonthlySavings = calculateAverageMonthlySavings(transactions, 3);
  const onTrack = avgMonthlySavings >= requiredMonthlySavings;

  return {
    currentAmount: Math.max(0, currentAmount),
    percentComplete: Math.min(100, Math.max(0, percentComplete)),
    remaining: Math.max(0, remaining),
    monthsRemaining,
    requiredMonthlySavings: Math.max(0, requiredMonthlySavings),
    onTrack,
  };
}

/**
 * Update savings goal progress based on transactions
 */
export function updateSavingsProgress(
  goal: SavingsGoal,
  transactions: Transaction[],
): SavingsGoal {
  const progress = calculateGoalProgress(goal, transactions);

  return {
    ...goal,
    updatedAt: new Date(),
  };
}

/**
 * Calculate what-if scenario for a savings goal
 * Shows what would happen with a different savings rate
 */
export function calculateWhatIf(
  goal: SavingsGoal,
  transactions: Transaction[],
  newSavingsRate: number,
): WhatIfResult {
  const progress = calculateGoalProgress(goal, transactions);

  // Calculate average monthly income
  const avgMonthlyIncome = calculateAverageMonthlyIncome(transactions, 3);

  // Calculate monthly savings with new rate
  const monthlySavings = (avgMonthlyIncome * newSavingsRate) / 100;

  // Calculate months to goal
  const monthsToGoal =
    monthlySavings > 0
      ? Math.ceil(progress.remaining / monthlySavings)
      : Infinity;

  // Calculate projected completion date
  const now = new Date();
  const projectedCompletionDate = new Date(
    now.getFullYear(),
    now.getMonth() + monthsToGoal,
    now.getDate(),
  );

  return {
    savingsRate: newSavingsRate,
    monthsToGoal: monthsToGoal === Infinity ? 0 : monthsToGoal,
    projectedCompletionDate,
    requiredMonthlySavings: monthlySavings,
  };
}

/**
 * Calculate average monthly income
 */
function calculateAverageMonthlyIncome(
  transactions: Transaction[],
  months: number = 3,
): number {
  const now = new Date();
  const monthlyData: Map<string, number> = new Map();

  transactions
    .filter((t) => t.type === "credit")
    .forEach((t) => {
      const txDate = new Date(t.date);
      const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
      const current = monthlyData.get(monthKey) || 0;
      monthlyData.set(monthKey, current + (t.credit || 0));
    });

  // Get last N months
  const monthKeys: string[] = [];
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
  }

  const monthlyIncomes = monthKeys
    .map((key) => monthlyData.get(key) || 0)
    .filter((income) => income > 0);

  if (monthlyIncomes.length === 0) return 0;

  return (
    monthlyIncomes.reduce((sum, income) => sum + income, 0) /
    monthlyIncomes.length
  );
}

/**
 * Get all savings goals with progress
 */
export function getSavingsGoalsWithProgress(
  goals: SavingsGoal[],
  transactions: Transaction[],
): Array<SavingsGoal & ReturnType<typeof calculateGoalProgress>> {
  return goals.map((goal) => ({
    ...goal,
    ...calculateGoalProgress(goal, transactions),
  }));
}
