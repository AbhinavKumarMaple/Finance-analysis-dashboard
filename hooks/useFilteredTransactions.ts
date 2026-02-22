"use client";

import { useMemo } from "react";
import { useTransactionStore } from "@/store/transactionStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import type { Transaction } from "@/types/transaction";

/**
 * Hook that returns transactions filtered by the global date range.
 * All pages should use this instead of reading raw transactions from the store.
 */
export function useFilteredTransactions(): Transaction[] {
  const transactions = useTransactionStore((state) => state.transactions);
  const globalDateRange = usePreferencesStore(
    (state) => state.preferences.globalDateRange,
  );

  return useMemo(() => {
    if (!globalDateRange.start && !globalDateRange.end) {
      return transactions;
    }

    const startDate = globalDateRange.start
      ? new Date(globalDateRange.start)
      : null;
    const endDate = globalDateRange.end ? new Date(globalDateRange.end) : null;

    // Set end date to end of day
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    return transactions.filter((t) => {
      const txDate = new Date(t.date);
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
      return true;
    });
  }, [transactions, globalDateRange]);
}

/**
 * Hook that returns the available date range from all transactions.
 */
export function useAvailableDateRange(): {
  min: Date | null;
  max: Date | null;
} {
  const transactions = useTransactionStore((state) => state.transactions);

  return useMemo(() => {
    if (transactions.length === 0) return { min: null, max: null };

    let min = new Date(transactions[0].date);
    let max = new Date(transactions[0].date);

    for (const t of transactions) {
      const d = new Date(t.date);
      if (d < min) min = d;
      if (d > max) max = d;
    }

    return { min, max };
  }, [transactions]);
}
