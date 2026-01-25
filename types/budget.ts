/**
 * Budget Type Definitions
 * Types for budgets, spending limits, and savings goals
 */

/**
 * Budget for a specific category/tag
 */
export interface Budget {
  id: string;
  tagId: string;
  monthlyLimit: number;
  period: string; // YYYY-MM format
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Spending limit configuration
 */
export interface SpendingLimit {
  id: string;
  type: "daily" | "monthly" | "category" | "merchant";
  targetId: string | null; // tagId or merchant identifier
  targetName: string; // Display name
  limit: number;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Savings goal
 */
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status of a budget with current spending
 */
export interface BudgetStatus {
  budget: Budget;
  percentUsed: number;
  remaining: number;
  projectedEndOfMonth: number;
  status: "on_track" | "warning" | "exceeded";
  currentSpend: number;
}

/**
 * Result of what-if analysis for savings goals
 */
export interface WhatIfResult {
  savingsRate: number;
  monthsToGoal: number;
  projectedCompletionDate: Date;
  requiredMonthlySavings: number;
}
