/**
 * Budget CRUD Operations
 * Manages budgets per category with status tracking and suggestions
 */

import type { Budget, BudgetStatus } from "@/types/budget";
import type { Transaction } from "@/types/transaction";
import type { Tag } from "@/types/tag";

/**
 * Create a new budget for a specific tag/category
 */
export function createBudget(
  tagId: string,
  monthlyLimit: number,
  period?: string,
): Budget {
  const now = new Date();
  const budgetPeriod =
    period ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return {
    id: crypto.randomUUID(),
    tagId,
    monthlyLimit,
    period: budgetPeriod,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update an existing budget
 */
export function updateBudget(
  budget: Budget,
  updates: Partial<Omit<Budget, "id" | "createdAt">>,
): Budget {
  return {
    ...budget,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Delete a budget (returns true if budget should be removed from list)
 */
export function deleteBudget(budgetId: string, budgets: Budget[]): Budget[] {
  return budgets.filter((b) => b.id !== budgetId);
}

/**
 * Calculate current spending for a budget based on transactions
 */
function calculateCurrentSpend(
  budget: Budget,
  transactions: Transaction[],
): number {
  const [year, month] = budget.period.split("-").map(Number);

  return transactions
    .filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getFullYear() === year &&
        txDate.getMonth() + 1 === month &&
        t.type === "debit" &&
        t.tagIds.includes(budget.tagId)
      );
    })
    .reduce((sum, t) => sum + (t.debit || 0), 0);
}

/**
 * Project end-of-month spending based on current pace
 */
function projectEndOfMonthSpending(
  currentSpend: number,
  budget: Budget,
): number {
  const [year, month] = budget.period.split("-").map(Number);
  const now = new Date();

  // If budget is for a past month, return current spend
  if (
    year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth() + 1)
  ) {
    return currentSpend;
  }

  // If budget is for a future month, return 0
  if (
    year > now.getFullYear() ||
    (year === now.getFullYear() && month > now.getMonth() + 1)
  ) {
    return 0;
  }

  // Current month - project based on daily average
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = now.getDate();

  if (currentDay === 0) return 0;

  const dailyAverage = currentSpend / currentDay;
  return dailyAverage * daysInMonth;
}

/**
 * Get budget status with spending analysis
 */
export function getBudgetStatus(
  budget: Budget,
  transactions: Transaction[],
): BudgetStatus {
  const currentSpend = calculateCurrentSpend(budget, transactions);
  const percentUsed =
    budget.monthlyLimit > 0 ? (currentSpend / budget.monthlyLimit) * 100 : 0;
  const remaining = budget.monthlyLimit - currentSpend;
  const projectedEndOfMonth = projectEndOfMonthSpending(currentSpend, budget);

  let status: "on_track" | "warning" | "exceeded";
  if (percentUsed >= 100) {
    status = "exceeded";
  } else if (percentUsed >= 80) {
    status = "warning";
  } else {
    status = "on_track";
  }

  return {
    budget,
    percentUsed,
    remaining,
    projectedEndOfMonth,
    status,
    currentSpend,
  };
}

/**
 * Calculate average monthly spending for a tag over the last N months
 */
function calculateAverageMonthlySpending(
  tagId: string,
  transactions: Transaction[],
  months: number = 3,
): number {
  const now = new Date();
  const monthsData: Map<string, number> = new Map();

  transactions
    .filter((t) => t.type === "debit" && t.tagIds.includes(tagId))
    .forEach((t) => {
      const txDate = new Date(t.date);
      const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
      const current = monthsData.get(monthKey) || 0;
      monthsData.set(monthKey, current + (t.debit || 0));
    });

  // Get last N months
  const monthKeys: string[] = [];
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
  }

  const monthlySpends = monthKeys
    .map((key) => monthsData.get(key) || 0)
    .filter((spend) => spend > 0);

  if (monthlySpends.length === 0) return 0;

  return (
    monthlySpends.reduce((sum, spend) => sum + spend, 0) / monthlySpends.length
  );
}

/**
 * Suggest budgets based on historical spending patterns
 */
export function suggestBudgets(
  transactions: Transaction[],
  tags: Tag[],
  existingBudgets: Budget[] = [],
): Budget[] {
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Get tags that don't have budgets for current period
  const existingTagIds = new Set(
    existingBudgets
      .filter((b) => b.period === currentPeriod)
      .map((b) => b.tagId),
  );

  const suggestions: Budget[] = [];

  for (const tag of tags) {
    if (existingTagIds.has(tag.id)) continue;

    const avgSpending = calculateAverageMonthlySpending(
      tag.id,
      transactions,
      3,
    );

    // Only suggest if there's meaningful spending history (> 100)
    if (avgSpending > 100) {
      // Round up to nearest 100 and add 10% buffer
      const suggestedLimit = Math.ceil((avgSpending * 1.1) / 100) * 100;

      suggestions.push(createBudget(tag.id, suggestedLimit, currentPeriod));
    }
  }

  return suggestions;
}
