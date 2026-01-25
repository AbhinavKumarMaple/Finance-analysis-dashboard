/**
 * Store Index
 * Central export point for all Zustand stores
 */

// Import stores
import { useTransactionStore } from "./transactionStore";
import { useTagStore } from "./tagStore";
import { useBudgetStore } from "./budgetStore";
import { usePreferencesStore } from "./preferencesStore";

// Export individual stores
export {
  useTransactionStore,
  useTagStore,
  useBudgetStore,
  usePreferencesStore,
};

// Re-export store types for convenience
export type {
  Transaction,
  ParseResult,
  UploadedFileRecord,
} from "@/types/transaction";
export type { Tag, TagTemplate, CategorizationResult } from "@/types/tag";
export type {
  Budget,
  SpendingLimit,
  SavingsGoal,
  BudgetStatus,
} from "@/types/budget";
export type { UserPreferences, WidgetLayout } from "@/types/analytics";

/**
 * Hook to clear all store data
 * Useful for logout or data reset functionality
 */
export const useClearAllStores = () => {
  const clearTransactions = useTransactionStore(
    (state) => state.clearTransactions,
  );
  const clearTags = useTagStore((state) => state.clearTags);
  const clearBudgets = useBudgetStore((state) => state.clearBudgets);
  const clearSpendingLimits = useBudgetStore(
    (state) => state.clearSpendingLimits,
  );
  const clearSavingsGoals = useBudgetStore((state) => state.clearSavingsGoals);
  const resetPreferences = usePreferencesStore(
    (state) => state.resetPreferences,
  );

  return () => {
    clearTransactions();
    clearTags();
    clearBudgets();
    clearSpendingLimits();
    clearSavingsGoals();
    resetPreferences();
  };
};

/**
 * Hook to get loading state from all stores
 * Useful for showing a global loading indicator
 */
export const useGlobalLoadingState = () => {
  const transactionLoading = useTransactionStore((state) => state.isLoading);
  const tagLoading = useTagStore((state) => state.isLoading);
  const budgetLoading = useBudgetStore((state) => state.isLoading);
  const preferencesLoading = usePreferencesStore((state) => state.isLoading);

  return (
    transactionLoading || tagLoading || budgetLoading || preferencesLoading
  );
};

/**
 * Hook to get error state from all stores
 * Useful for showing global error messages
 */
export const useGlobalErrorState = () => {
  const transactionError = useTransactionStore((state) => state.error);
  const tagError = useTagStore((state) => state.error);
  const budgetError = useBudgetStore((state) => state.error);
  const preferencesError = usePreferencesStore((state) => state.error);

  return {
    transactionError,
    tagError,
    budgetError,
    preferencesError,
    hasError: !!(
      transactionError ||
      tagError ||
      budgetError ||
      preferencesError
    ),
  };
};
