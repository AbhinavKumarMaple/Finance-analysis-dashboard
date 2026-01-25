/**
 * Transaction Storage Operations
 * CRUD operations for transaction persistence in IndexedDB
 */

import { getDB, STORES } from "./db";
import type { Transaction, DateRange } from "@/types/transaction";

/**
 * Save a single transaction to IndexedDB
 *
 * @param transaction - Transaction to save
 * @returns Promise that resolves when save is complete
 */
export async function saveTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  await db.put(STORES.TRANSACTIONS, transaction);
}

/**
 * Save multiple transactions to IndexedDB in a single transaction
 *
 * @param transactions - Array of transactions to save
 * @returns Promise that resolves when all saves are complete
 */
export async function saveTransactions(
  transactions: Transaction[],
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.TRANSACTIONS, "readwrite");
  const store = tx.objectStore(STORES.TRANSACTIONS);

  for (const transaction of transactions) {
    await store.put(transaction);
  }

  await tx.done;
}

/**
 * Load all transactions from IndexedDB
 *
 * @returns Promise resolving to array of all transactions
 */
export async function loadTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return await db.getAll(STORES.TRANSACTIONS);
}

/**
 * Load a single transaction by ID
 *
 * @param id - Transaction ID
 * @returns Promise resolving to transaction or undefined if not found
 */
export async function loadTransaction(
  id: string,
): Promise<Transaction | undefined> {
  const db = await getDB();
  return await db.get(STORES.TRANSACTIONS, id);
}

/**
 * Load transactions within a date range
 *
 * @param dateRange - Date range to filter by
 * @returns Promise resolving to array of transactions in range
 */
export async function loadTransactionsByDateRange(
  dateRange: DateRange,
): Promise<Transaction[]> {
  const db = await getDB();
  const tx = db.transaction(STORES.TRANSACTIONS, "readonly");
  const index = tx.objectStore(STORES.TRANSACTIONS).index("date");

  const range = IDBKeyRange.bound(dateRange.start, dateRange.end);
  return await index.getAll(range);
}

/**
 * Load transactions by tag ID
 *
 * @param tagId - Tag ID to filter by
 * @returns Promise resolving to array of transactions with the tag
 */
export async function loadTransactionsByTag(
  tagId: string,
): Promise<Transaction[]> {
  const db = await getDB();
  const tx = db.transaction(STORES.TRANSACTIONS, "readonly");
  const index = tx.objectStore(STORES.TRANSACTIONS).index("tagIds-multi");

  return await index.getAll(tagId);
}

/**
 * Load transactions by source file
 *
 * @param sourceFile - Source file name to filter by
 * @returns Promise resolving to array of transactions from the file
 */
export async function loadTransactionsBySourceFile(
  sourceFile: string,
): Promise<Transaction[]> {
  const db = await getDB();
  const tx = db.transaction(STORES.TRANSACTIONS, "readonly");
  const index = tx.objectStore(STORES.TRANSACTIONS).index("sourceFile");

  return await index.getAll(sourceFile);
}

/**
 * Load transactions by reference number
 *
 * @param refNo - Reference number to search for
 * @returns Promise resolving to array of transactions with the reference number
 */
export async function loadTransactionsByRefNo(
  refNo: string,
): Promise<Transaction[]> {
  const db = await getDB();
  const tx = db.transaction(STORES.TRANSACTIONS, "readonly");
  const index = tx.objectStore(STORES.TRANSACTIONS).index("refNo");

  return await index.getAll(refNo);
}

/**
 * Update a transaction
 *
 * @param id - Transaction ID
 * @param updates - Partial transaction updates
 * @returns Promise resolving to updated transaction or undefined if not found
 */
export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>,
): Promise<Transaction | undefined> {
  const db = await getDB();
  const existing = await db.get(STORES.TRANSACTIONS, id);

  if (!existing) {
    return undefined;
  }

  const updated = { ...existing, ...updates };
  await db.put(STORES.TRANSACTIONS, updated);
  return updated;
}

/**
 * Delete a single transaction by ID
 *
 * @param id - Transaction ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.TRANSACTIONS, id);
}

/**
 * Delete multiple transactions by IDs
 *
 * @param ids - Array of transaction IDs to delete
 * @returns Promise that resolves when all deletions are complete
 */
export async function deleteTransactions(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.TRANSACTIONS, "readwrite");
  const store = tx.objectStore(STORES.TRANSACTIONS);

  for (const id of ids) {
    await store.delete(id);
  }

  await tx.done;
}

/**
 * Delete all transactions from a specific source file
 *
 * @param sourceFile - Source file name
 * @returns Promise resolving to number of transactions deleted
 */
export async function deleteTransactionsBySourceFile(
  sourceFile: string,
): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(STORES.TRANSACTIONS, "readwrite");
  const index = tx.objectStore(STORES.TRANSACTIONS).index("sourceFile");
  const transactions = await index.getAll(sourceFile);

  for (const transaction of transactions) {
    await tx.objectStore(STORES.TRANSACTIONS).delete(transaction.id);
  }

  await tx.done;
  return transactions.length;
}

/**
 * Delete all transactions
 *
 * @returns Promise that resolves when all transactions are deleted
 */
export async function deleteAllTransactions(): Promise<void> {
  const db = await getDB();
  await db.clear(STORES.TRANSACTIONS);
}

/**
 * Count total number of transactions
 *
 * @returns Promise resolving to transaction count
 */
export async function countTransactions(): Promise<number> {
  const db = await getDB();
  return await db.count(STORES.TRANSACTIONS);
}

/**
 * Count transactions by tag
 *
 * @param tagId - Tag ID to count
 * @returns Promise resolving to count of transactions with the tag
 */
export async function countTransactionsByTag(tagId: string): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(STORES.TRANSACTIONS, "readonly");
  const index = tx.objectStore(STORES.TRANSACTIONS).index("tagIds-multi");

  return await index.count(tagId);
}

/**
 * Check if a transaction exists by ID
 *
 * @param id - Transaction ID
 * @returns Promise resolving to true if transaction exists
 */
export async function transactionExists(id: string): Promise<boolean> {
  const db = await getDB();
  const transaction = await db.get(STORES.TRANSACTIONS, id);
  return transaction !== undefined;
}

/**
 * Check if transactions with a specific reference number exist
 *
 * @param refNo - Reference number to check
 * @returns Promise resolving to true if any transactions with the refNo exist
 */
export async function transactionExistsByRefNo(
  refNo: string,
): Promise<boolean> {
  const db = await getDB();
  const tx = db.transaction(STORES.TRANSACTIONS, "readonly");
  const index = tx.objectStore(STORES.TRANSACTIONS).index("refNo");
  const count = await index.count(refNo);

  return count > 0;
}
