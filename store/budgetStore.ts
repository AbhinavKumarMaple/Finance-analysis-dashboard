/**
 * Budget Store
 * Manages budget, spending limits, and savings goals state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  Budget,
  SpendingLimit,
  SavingsGoal,
  BudgetStatus,
} from "@/types/budget";

/**
 * Budget store state
 */
interface BudgetState {
  // State
  budgets: Budget[];
  spendingLimits: SpendingLimit[];
  savingsGoals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;

  // Budget actions
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  clearBudgets: () => void;

  // Spending limit actions
  setSpendingLimits: (limits: SpendingLimit[]) => void;
  addSpendingLimit: (limit: SpendingLimit) => void;
  updateSpendingLimit: (id: string, updates: Partial<SpendingLimit>) => void;
  deleteSpendingLimit: (id: string) => void;
  clearSpendingLimits: () => void;

  // Savings goal actions
  setSavingsGoals: (goals: SavingsGoal[]) => void;
  addSavingsGoal: (goal: SavingsGoal) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  clearSavingsGoals: () => void;

  // Queries
  getBudgetById: (id: string) => Budget | undefined;
  getBudgetsByPeriod: (period: string) => Budget[];
  getBudgetByTagId: (tagId: string, period: string) => Budget | undefined;
  getSpendingLimitById: (id: string) => SpendingLimit | undefined;
  getActiveSpendingLimits: () => SpendingLimit[];
  getSavingsGoalById: (id: string) => SavingsGoal | undefined;
  getActiveSavingsGoals: () => SavingsGoal[];

  // Loading state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Create budget store with Zustand
 */
export const useBudgetStore = create<BudgetState>()(
  devtools(
    (set, get) => ({
      // Initial state
      budgets: [],
      spendingLimits: [],
      savingsGoals: [],
      isLoading: false,
      error: null,

      // Budget actions
      setBudgets: (budgets) => set({ budgets }, false, "setBudgets"),

      addBudget: (budget) =>
        set(
          (state) => ({
            budgets: [...state.budgets, budget],
          }),
          false,
          "addBudget",
        ),

      updateBudget: (id, updates) =>
        set(
          (state) => ({
            budgets: state.budgets.map((b) =>
              b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b,
            ),
          }),
          false,
          "updateBudget",
        ),

      deleteBudget: (id) =>
        set(
          (state) => ({
            budgets: state.budgets.filter((b) => b.id !== id),
          }),
          false,
          "deleteBudget",
        ),

      clearBudgets: () => set({ budgets: [] }, false, "clearBudgets"),

      // Spending limit actions
      setSpendingLimits: (limits) =>
        set({ spendingLimits: limits }, false, "setSpendingLimits"),

      addSpendingLimit: (limit) =>
        set(
          (state) => ({
            spendingLimits: [...state.spendingLimits, limit],
          }),
          false,
          "addSpendingLimit",
        ),

      updateSpendingLimit: (id, updates) =>
        set(
          (state) => ({
            spendingLimits: state.spendingLimits.map((l) =>
              l.id === id ? { ...l, ...updates } : l,
            ),
          }),
          false,
          "updateSpendingLimit",
        ),

      deleteSpendingLimit: (id) =>
        set(
          (state) => ({
            spendingLimits: state.spendingLimits.filter((l) => l.id !== id),
          }),
          false,
          "deleteSpendingLimit",
        ),

      clearSpendingLimits: () =>
        set({ spendingLimits: [] }, false, "clearSpendingLimits"),

      // Savings goal actions
      setSavingsGoals: (goals) =>
        set({ savingsGoals: goals }, false, "setSavingsGoals"),

      addSavingsGoal: (goal) =>
        set(
          (state) => ({
            savingsGoals: [...state.savingsGoals, goal],
          }),
          false,
          "addSavingsGoal",
        ),

      updateSavingsGoal: (id, updates) =>
        set(
          (state) => ({
            savingsGoals: state.savingsGoals.map((g) =>
              g.id === id ? { ...g, ...updates, updatedAt: new Date() } : g,
            ),
          }),
          false,
          "updateSavingsGoal",
        ),

      deleteSavingsGoal: (id) =>
        set(
          (state) => ({
            savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
          }),
          false,
          "deleteSavingsGoal",
        ),

      clearSavingsGoals: () =>
        set({ savingsGoals: [] }, false, "clearSavingsGoals"),

      // Queries
      getBudgetById: (id) => get().budgets.find((b) => b.id === id),

      getBudgetsByPeriod: (period) =>
        get().budgets.filter((b) => b.period === period),

      getBudgetByTagId: (tagId, period) =>
        get().budgets.find((b) => b.tagId === tagId && b.period === period),

      getSpendingLimitById: (id) =>
        get().spendingLimits.find((l) => l.id === id),

      getActiveSpendingLimits: () =>
        get().spendingLimits.filter((l) => l.isActive),

      getSavingsGoalById: (id) => get().savingsGoals.find((g) => g.id === id),

      getActiveSavingsGoals: () => {
        const now = new Date();
        return get().savingsGoals.filter((g) => g.deadline >= now);
      },

      // Loading state
      setLoading: (loading) => set({ isLoading: loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),
    }),
    { name: "BudgetStore" },
  ),
);
