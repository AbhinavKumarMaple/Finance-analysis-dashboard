/**
 * Budget Storage Operations
 * CRUD operations for budget, spending limit, and savings goal persistence in IndexedDB
 */

import { getDB, STORES } from "./db";
import type { Budget, SpendingLimit, SavingsGoal } from "@/types/budget";

// ============================================================================
// Budget Operations
// ============================================================================

/**
 * Save a single budget to IndexedDB
 *
 * @param budget - Budget to save
 * @returns Promise that resolves when save is complete
 */
export async function saveBudget(budget: Budget): Promise<void> {
  const db = await getDB();
  await db.put(STORES.BUDGETS, budget);
}

/**
 * Save multiple budgets to IndexedDB in a single transaction
 *
 * @param budgets - Array of budgets to save
 * @returns Promise that resolves when all saves are complete
 */
export async function saveBudgets(budgets: Budget[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.BUDGETS, "readwrite");
  const store = tx.objectStore(STORES.BUDGETS);

  for (const budget of budgets) {
    await store.put(budget);
  }

  await tx.done;
}

/**
 * Load all budgets from IndexedDB
 *
 * @returns Promise resolving to array of all budgets
 */
export async function loadBudgets(): Promise<Budget[]> {
  const db = await getDB();
  return await db.getAll(STORES.BUDGETS);
}

/**
 * Load a single budget by ID
 *
 * @param id - Budget ID
 * @returns Promise resolving to budget or undefined if not found
 */
export async function loadBudget(id: string): Promise<Budget | undefined> {
  const db = await getDB();
  return await db.get(STORES.BUDGETS, id);
}

/**
 * Load budgets by tag ID
 *
 * @param tagId - Tag ID to filter by
 * @returns Promise resolving to array of budgets for the tag
 */
export async function loadBudgetsByTag(tagId: string): Promise<Budget[]> {
  const db = await getDB();
  const tx = db.transaction(STORES.BUDGETS, "readonly");
  const index = tx.objectStore(STORES.BUDGETS).index("tagId");

  return await index.getAll(tagId);
}

/**
 * Load budgets by period
 *
 * @param period - Period in YYYY-MM format
 * @returns Promise resolving to array of budgets for the period
 */
export async function loadBudgetsByPeriod(period: string): Promise<Budget[]> {
  const db = await getDB();
  const tx = db.transaction(STORES.BUDGETS, "readonly");
  const index = tx.objectStore(STORES.BUDGETS).index("period");

  return await index.getAll(period);
}

/**
 * Load budget for a specific tag and period
 *
 * @param tagId - Tag ID
 * @param period - Period in YYYY-MM format
 * @returns Promise resolving to budget or undefined if not found
 */
export async function loadBudgetByTagAndPeriod(
  tagId: string,
  period: string,
): Promise<Budget | undefined> {
  const budgets = await loadBudgetsByTag(tagId);
  return budgets.find((b) => b.period === period);
}

/**
 * Update a budget
 *
 * @param id - Budget ID
 * @param updates - Partial budget updates
 * @returns Promise resolving to updated budget or undefined if not found
 */
export async function updateBudget(
  id: string,
  updates: Partial<Budget>,
): Promise<Budget | undefined> {
  const db = await getDB();
  const existing = await db.get(STORES.BUDGETS, id);

  if (!existing) {
    return undefined;
  }

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  await db.put(STORES.BUDGETS, updated);
  return updated;
}

/**
 * Delete a single budget by ID
 *
 * @param id - Budget ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteBudget(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.BUDGETS, id);
}

/**
 * Delete multiple budgets by IDs
 *
 * @param ids - Array of budget IDs to delete
 * @returns Promise that resolves when all deletions are complete
 */
export async function deleteBudgets(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.BUDGETS, "readwrite");
  const store = tx.objectStore(STORES.BUDGETS);

  for (const id of ids) {
    await store.delete(id);
  }

  await tx.done;
}

/**
 * Delete all budgets for a specific tag
 *
 * @param tagId - Tag ID
 * @returns Promise resolving to number of budgets deleted
 */
export async function deleteBudgetsByTag(tagId: string): Promise<number> {
  const budgets = await loadBudgetsByTag(tagId);

  const db = await getDB();
  const tx = db.transaction(STORES.BUDGETS, "readwrite");
  const store = tx.objectStore(STORES.BUDGETS);

  for (const budget of budgets) {
    await store.delete(budget.id);
  }

  await tx.done;
  return budgets.length;
}

/**
 * Delete all budgets
 *
 * @returns Promise that resolves when all budgets are deleted
 */
export async function deleteAllBudgets(): Promise<void> {
  const db = await getDB();
  await db.clear(STORES.BUDGETS);
}

/**
 * Count total number of budgets
 *
 * @returns Promise resolving to budget count
 */
export async function countBudgets(): Promise<number> {
  const db = await getDB();
  return await db.count(STORES.BUDGETS);
}

/**
 * Check if a budget exists by ID
 *
 * @param id - Budget ID
 * @returns Promise resolving to true if budget exists
 */
export async function budgetExists(id: string): Promise<boolean> {
  const db = await getDB();
  const budget = await db.get(STORES.BUDGETS, id);
  return budget !== undefined;
}

// ============================================================================
// Spending Limit Operations
// ============================================================================

/**
 * Save a single spending limit to IndexedDB
 *
 * @param limit - Spending limit to save
 * @returns Promise that resolves when save is complete
 */
export async function saveSpendingLimit(limit: SpendingLimit): Promise<void> {
  const db = await getDB();
  await db.put(STORES.LIMITS, limit);
}

/**
 * Save multiple spending limits to IndexedDB in a single transaction
 *
 * @param limits - Array of spending limits to save
 * @returns Promise that resolves when all saves are complete
 */
export async function saveSpendingLimits(
  limits: SpendingLimit[],
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.LIMITS, "readwrite");
  const store = tx.objectStore(STORES.LIMITS);

  for (const limit of limits) {
    await store.put(limit);
  }

  await tx.done;
}

/**
 * Load all spending limits from IndexedDB
 *
 * @returns Promise resolving to array of all spending limits
 */
export async function loadSpendingLimits(): Promise<SpendingLimit[]> {
  const db = await getDB();
  return await db.getAll(STORES.LIMITS);
}

/**
 * Load a single spending limit by ID
 *
 * @param id - Spending limit ID
 * @returns Promise resolving to spending limit or undefined if not found
 */
export async function loadSpendingLimit(
  id: string,
): Promise<SpendingLimit | undefined> {
  const db = await getDB();
  return await db.get(STORES.LIMITS, id);
}

/**
 * Load spending limits by type
 *
 * @param type - Limit type
 * @returns Promise resolving to array of spending limits of the type
 */
export async function loadSpendingLimitsByType(
  type: SpendingLimit["type"],
): Promise<SpendingLimit[]> {
  const db = await getDB();
  const tx = db.transaction(STORES.LIMITS, "readonly");
  const index = tx.objectStore(STORES.LIMITS).index("type");

  return await index.getAll(type);
}

/**
 * Load active spending limits
 *
 * @returns Promise resolving to array of active spending limits
 */
export async function loadActiveSpendingLimits(): Promise<SpendingLimit[]> {
  const db = await getDB();
  const allLimits = await db.getAll(STORES.LIMITS);
  return allLimits.filter((limit) => limit.isActive);
}

/**
 * Load inactive spending limits
 *
 * @returns Promise resolving to array of inactive spending limits
 */
export async function loadInactiveSpendingLimits(): Promise<SpendingLimit[]> {
  const db = await getDB();
  const allLimits = await db.getAll(STORES.LIMITS);
  return allLimits.filter((limit) => !limit.isActive);
}

/**
 * Update a spending limit
 *
 * @param id - Spending limit ID
 * @param updates - Partial spending limit updates
 * @returns Promise resolving to updated spending limit or undefined if not found
 */
export async function updateSpendingLimit(
  id: string,
  updates: Partial<SpendingLimit>,
): Promise<SpendingLimit | undefined> {
  const db = await getDB();
  const existing = await db.get(STORES.LIMITS, id);

  if (!existing) {
    return undefined;
  }

  const updated = { ...existing, ...updates };
  await db.put(STORES.LIMITS, updated);
  return updated;
}

/**
 * Delete a single spending limit by ID
 *
 * @param id - Spending limit ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteSpendingLimit(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.LIMITS, id);
}

/**
 * Delete multiple spending limits by IDs
 *
 * @param ids - Array of spending limit IDs to delete
 * @returns Promise that resolves when all deletions are complete
 */
export async function deleteSpendingLimits(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.LIMITS, "readwrite");
  const store = tx.objectStore(STORES.LIMITS);

  for (const id of ids) {
    await store.delete(id);
  }

  await tx.done;
}

/**
 * Delete all spending limits
 *
 * @returns Promise that resolves when all spending limits are deleted
 */
export async function deleteAllSpendingLimits(): Promise<void> {
  const db = await getDB();
  await db.clear(STORES.LIMITS);
}

/**
 * Count total number of spending limits
 *
 * @returns Promise resolving to spending limit count
 */
export async function countSpendingLimits(): Promise<number> {
  const db = await getDB();
  return await db.count(STORES.LIMITS);
}

/**
 * Check if a spending limit exists by ID
 *
 * @param id - Spending limit ID
 * @returns Promise resolving to true if spending limit exists
 */
export async function spendingLimitExists(id: string): Promise<boolean> {
  const db = await getDB();
  const limit = await db.get(STORES.LIMITS, id);
  return limit !== undefined;
}

// ============================================================================
// Savings Goal Operations
// ============================================================================

/**
 * Save a single savings goal to IndexedDB
 *
 * @param goal - Savings goal to save
 * @returns Promise that resolves when save is complete
 */
export async function saveSavingsGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDB();
  await db.put(STORES.GOALS, goal);
}

/**
 * Save multiple savings goals to IndexedDB in a single transaction
 *
 * @param goals - Array of savings goals to save
 * @returns Promise that resolves when all saves are complete
 */
export async function saveSavingsGoals(goals: SavingsGoal[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.GOALS, "readwrite");
  const store = tx.objectStore(STORES.GOALS);

  for (const goal of goals) {
    await store.put(goal);
  }

  await tx.done;
}

/**
 * Load all savings goals from IndexedDB
 *
 * @returns Promise resolving to array of all savings goals
 */
export async function loadSavingsGoals(): Promise<SavingsGoal[]> {
  const db = await getDB();
  return await db.getAll(STORES.GOALS);
}

/**
 * Load a single savings goal by ID
 *
 * @param id - Savings goal ID
 * @returns Promise resolving to savings goal or undefined if not found
 */
export async function loadSavingsGoal(
  id: string,
): Promise<SavingsGoal | undefined> {
  const db = await getDB();
  return await db.get(STORES.GOALS, id);
}

/**
 * Load savings goals sorted by deadline (ascending)
 *
 * @returns Promise resolving to array of savings goals sorted by deadline
 */
export async function loadSavingsGoalsByDeadline(): Promise<SavingsGoal[]> {
  const db = await getDB();
  const tx = db.transaction(STORES.GOALS, "readonly");
  const index = tx.objectStore(STORES.GOALS).index("deadline");

  return await index.getAll();
}

/**
 * Load active savings goals (deadline in the future)
 *
 * @returns Promise resolving to array of active savings goals
 */
export async function loadActiveSavingsGoals(): Promise<SavingsGoal[]> {
  const goals = await loadSavingsGoals();
  const now = new Date();
  return goals.filter((goal) => goal.deadline > now);
}

/**
 * Load completed savings goals (deadline in the past)
 *
 * @returns Promise resolving to array of completed savings goals
 */
export async function loadCompletedSavingsGoals(): Promise<SavingsGoal[]> {
  const goals = await loadSavingsGoals();
  const now = new Date();
  return goals.filter((goal) => goal.deadline <= now);
}

/**
 * Update a savings goal
 *
 * @param id - Savings goal ID
 * @param updates - Partial savings goal updates
 * @returns Promise resolving to updated savings goal or undefined if not found
 */
export async function updateSavingsGoal(
  id: string,
  updates: Partial<SavingsGoal>,
): Promise<SavingsGoal | undefined> {
  const db = await getDB();
  const existing = await db.get(STORES.GOALS, id);

  if (!existing) {
    return undefined;
  }

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  await db.put(STORES.GOALS, updated);
  return updated;
}

/**
 * Delete a single savings goal by ID
 *
 * @param id - Savings goal ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteSavingsGoal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.GOALS, id);
}

/**
 * Delete multiple savings goals by IDs
 *
 * @param ids - Array of savings goal IDs to delete
 * @returns Promise that resolves when all deletions are complete
 */
export async function deleteSavingsGoals(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.GOALS, "readwrite");
  const store = tx.objectStore(STORES.GOALS);

  for (const id of ids) {
    await store.delete(id);
  }

  await tx.done;
}

/**
 * Delete all savings goals
 *
 * @returns Promise that resolves when all savings goals are deleted
 */
export async function deleteAllSavingsGoals(): Promise<void> {
  const db = await getDB();
  await db.clear(STORES.GOALS);
}

/**
 * Count total number of savings goals
 *
 * @returns Promise resolving to savings goal count
 */
export async function countSavingsGoals(): Promise<number> {
  const db = await getDB();
  return await db.count(STORES.GOALS);
}

/**
 * Check if a savings goal exists by ID
 *
 * @param id - Savings goal ID
 * @returns Promise resolving to true if savings goal exists
 */
export async function savingsGoalExists(id: string): Promise<boolean> {
  const db = await getDB();
  const goal = await db.get(STORES.GOALS, id);
  return goal !== undefined;
}
