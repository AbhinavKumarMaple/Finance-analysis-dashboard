/**
 * Spending Limits Management
 * Supports daily, monthly, category, and merchant spending limits
 */

import type { SpendingLimit } from "@/types/budget";
import type { Transaction } from "@/types/transaction";

/**
 * Create a new spending limit
 */
export function createSpendingLimit(
  type: SpendingLimit["type"],
  limit: number,
  targetId?: string,
  targetName?: string,
): SpendingLimit {
  return {
    id: crypto.randomUUID(),
    type,
    targetId: targetId || null,
    targetName: targetName || getDefaultTargetName(type),
    limit,
    isActive: true,
    createdAt: new Date(),
  };
}

/**
 * Get default target name based on limit type
 */
function getDefaultTargetName(type: SpendingLimit["type"]): string {
  switch (type) {
    case "daily":
      return "Daily Spending";
    case "monthly":
      return "Monthly Spending";
    case "category":
      return "Category Spending";
    case "merchant":
      return "Merchant Spending";
  }
}

/**
 * Update an existing spending limit
 */
export function updateSpendingLimit(
  limit: SpendingLimit,
  updates: Partial<Omit<SpendingLimit, "id" | "createdAt">>,
): SpendingLimit {
  return {
    ...limit,
    ...updates,
  };
}

/**
 * Delete a spending limit
 */
export function deleteSpendingLimit(
  limitId: string,
  limits: SpendingLimit[],
): SpendingLimit[] {
  return limits.filter((l) => l.id !== limitId);
}

/**
 * Calculate current spending for a daily limit
 */
function calculateDailySpending(transactions: Transaction[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return transactions
    .filter((t) => {
      const txDate = new Date(t.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === today.getTime() && t.type === "debit";
    })
    .reduce((sum, t) => sum + (t.debit || 0), 0);
}

/**
 * Calculate current spending for a monthly limit
 */
function calculateMonthlySpending(transactions: Transaction[]): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return transactions
    .filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth &&
        t.type === "debit"
      );
    })
    .reduce((sum, t) => sum + (t.debit || 0), 0);
}

/**
 * Calculate current spending for a category limit
 */
function calculateCategorySpending(
  tagId: string,
  transactions: Transaction[],
): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return transactions
    .filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth &&
        t.type === "debit" &&
        t.tagIds.includes(tagId)
      );
    })
    .reduce((sum, t) => sum + (t.debit || 0), 0);
}

/**
 * Extract merchant identifier from transaction details
 */
function extractMerchantId(details: string): string {
  // Simple extraction - take first meaningful word
  const cleaned = details.trim().split(/[\s/]+/)[0];
  return cleaned.toLowerCase();
}

/**
 * Calculate current spending for a merchant limit
 */
function calculateMerchantSpending(
  merchantId: string,
  transactions: Transaction[],
): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return transactions
    .filter((t) => {
      const txDate = new Date(t.date);
      const txMerchant = extractMerchantId(t.details);
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth &&
        t.type === "debit" &&
        txMerchant === merchantId.toLowerCase()
      );
    })
    .reduce((sum, t) => sum + (t.debit || 0), 0);
}

/**
 * Calculate current spending for a limit
 */
export function calculateCurrentSpending(
  limit: SpendingLimit,
  transactions: Transaction[],
): number {
  switch (limit.type) {
    case "daily":
      return calculateDailySpending(transactions);
    case "monthly":
      return calculateMonthlySpending(transactions);
    case "category":
      return limit.targetId
        ? calculateCategorySpending(limit.targetId, transactions)
        : 0;
    case "merchant":
      return limit.targetId
        ? calculateMerchantSpending(limit.targetId, transactions)
        : 0;
  }
}

/**
 * Check if a transaction would exceed any spending limits
 */
export function checkSpendingLimits(
  transaction: Transaction,
  limits: SpendingLimit[],
  transactions: Transaction[],
): SpendingLimit[] {
  if (transaction.type !== "debit") {
    return [];
  }

  const exceededLimits: SpendingLimit[] = [];

  for (const limit of limits) {
    if (!limit.isActive) continue;

    const currentSpending = calculateCurrentSpending(limit, transactions);
    const newTotal = currentSpending + (transaction.debit || 0);

    // Check if this transaction would cause limit to be exceeded
    if (newTotal > limit.limit) {
      exceededLimits.push(limit);
    }
  }

  return exceededLimits;
}

/**
 * Get all spending limits with current spending
 */
export function getSpendingLimitsWithStatus(
  limits: SpendingLimit[],
  transactions: Transaction[],
): Array<
  SpendingLimit & {
    currentSpend: number;
    percentUsed: number;
    remaining: number;
  }
> {
  return limits.map((limit) => {
    const currentSpend = calculateCurrentSpending(limit, transactions);
    const percentUsed =
      limit.limit > 0 ? (currentSpend / limit.limit) * 100 : 0;
    const remaining = limit.limit - currentSpend;

    return {
      ...limit,
      currentSpend,
      percentUsed,
      remaining,
    };
  });
}

/**
 * Check if any limits are close to being exceeded (>80%)
 */
export function getWarningLimits(
  limits: SpendingLimit[],
  transactions: Transaction[],
): SpendingLimit[] {
  return limits.filter((limit) => {
    if (!limit.isActive) return false;

    const currentSpending = calculateCurrentSpending(limit, transactions);
    const percentUsed =
      limit.limit > 0 ? (currentSpending / limit.limit) * 100 : 0;

    return percentUsed >= 80 && percentUsed < 100;
  });
}

/**
 * Check if any limits have been exceeded
 */
export function getExceededLimits(
  limits: SpendingLimit[],
  transactions: Transaction[],
): SpendingLimit[] {
  return limits.filter((limit) => {
    if (!limit.isActive) return false;

    const currentSpending = calculateCurrentSpending(limit, transactions);
    return currentSpending > limit.limit;
  });
}
