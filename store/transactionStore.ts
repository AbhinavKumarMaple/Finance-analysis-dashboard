/**
 * Transaction Store
 * Manages transaction state and operations
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  Transaction,
  ParseResult,
  UploadedFileRecord,
} from "@/types/transaction";

/**
 * Transaction store state
 */
interface TransactionState {
  // State
  transactions: Transaction[];
  uploadedFiles: UploadedFileRecord[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  addTransactions: (transactions: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;

  // File management
  addUploadedFile: (file: UploadedFileRecord) => void;
  getUploadedFiles: () => UploadedFileRecord[];

  // Filtering and search
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByDateRange: (start: Date, end: Date) => Transaction[];
  getTransactionsByTag: (tagId: string) => Transaction[];
  searchTransactions: (query: string) => Transaction[];

  // Loading state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Create transaction store with Zustand
 */
export const useTransactionStore = create<TransactionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      transactions: [],
      uploadedFiles: [],
      isLoading: false,
      error: null,

      // Actions
      setTransactions: (transactions) =>
        set({ transactions }, false, "setTransactions"),

      addTransactions: (newTransactions) =>
        set(
          (state) => ({
            transactions: [...state.transactions, ...newTransactions],
          }),
          false,
          "addTransactions",
        ),

      updateTransaction: (id, updates) =>
        set(
          (state) => ({
            transactions: state.transactions.map((t) =>
              t.id === id ? { ...t, ...updates } : t,
            ),
          }),
          false,
          "updateTransaction",
        ),

      deleteTransaction: (id) =>
        set(
          (state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
          }),
          false,
          "deleteTransaction",
        ),

      clearTransactions: () =>
        set(
          { transactions: [], uploadedFiles: [] },
          false,
          "clearTransactions",
        ),

      // File management
      addUploadedFile: (file) =>
        set(
          (state) => ({
            uploadedFiles: [...state.uploadedFiles, file],
          }),
          false,
          "addUploadedFile",
        ),

      getUploadedFiles: () => get().uploadedFiles,

      // Filtering and search
      getTransactionById: (id) => get().transactions.find((t) => t.id === id),

      getTransactionsByDateRange: (start, end) =>
        get().transactions.filter((t) => t.date >= start && t.date <= end),

      getTransactionsByTag: (tagId) =>
        get().transactions.filter((t) => t.tagIds.includes(tagId)),

      searchTransactions: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().transactions.filter(
          (t) =>
            t.details.toLowerCase().includes(lowerQuery) ||
            t.refNo.toLowerCase().includes(lowerQuery) ||
            t.notes?.toLowerCase().includes(lowerQuery),
        );
      },

      // Loading state
      setLoading: (loading) => set({ isLoading: loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),
    }),
    { name: "TransactionStore" },
  ),
);
