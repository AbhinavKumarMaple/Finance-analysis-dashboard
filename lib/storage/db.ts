/**
 * IndexedDB Database Wrapper
 * Provides initialization, schema definition, and version migration for local storage
 */

import { openDB, type IDBPDatabase } from "idb";
import type { Transaction, UploadedFileRecord } from "@/types/transaction";
import type { Tag } from "@/types/tag";
import type { Budget, SpendingLimit, SavingsGoal } from "@/types/budget";
import type { UserPreferences } from "@/types/analytics";

/**
 * Database name and version
 */
const DB_NAME = "FinancialAnalyticsDashboard";
const DB_VERSION = 1;

/**
 * Object store names
 */
export const STORES = {
  TRANSACTIONS: "transactions",
  TAGS: "tags",
  BUDGETS: "budgets",
  LIMITS: "limits",
  GOALS: "goals",
  PREFERENCES: "preferences",
  FILES: "files",
} as const;

/**
 * Database schema interface for type safety
 */
export interface FinancialDBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      date: Date;
      refNo: string;
      sourceFile: string;
      "tagIds-multi": string;
    };
  };
  tags: {
    key: string;
    value: Tag;
    indexes: {
      name: string;
      isDefault: boolean;
    };
  };
  budgets: {
    key: string;
    value: Budget;
    indexes: {
      tagId: string;
      period: string;
    };
  };
  limits: {
    key: string;
    value: SpendingLimit;
    indexes: {
      type: string;
      isActive: boolean;
    };
  };
  goals: {
    key: string;
    value: SavingsGoal;
    indexes: {
      deadline: Date;
    };
  };
  preferences: {
    key: string;
    value: UserPreferences;
  };
  files: {
    key: string;
    value: UploadedFileRecord;
    indexes: {
      uploadedAt: Date;
      checksum: string;
    };
  };
}

/**
 * Database instance (singleton)
 */
let dbInstance: IDBPDatabase<FinancialDBSchema> | null = null;

/**
 * Initialize the IndexedDB database with schema and indexes
 * Implements version migration strategy for future schema changes
 *
 * @returns Promise resolving to the database instance
 */
export async function initializeDB(): Promise<IDBPDatabase<FinancialDBSchema>> {
  // Return existing instance if already initialized
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<FinancialDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(
          `Upgrading database from version ${oldVersion} to ${newVersion}`,
        );

        // Version 1: Initial schema
        if (oldVersion < 1) {
          // Create transactions store
          if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
            const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, {
              keyPath: "id",
            });
            transactionStore.createIndex("date", "date", { unique: false });
            transactionStore.createIndex("refNo", "refNo", { unique: false });
            transactionStore.createIndex("sourceFile", "sourceFile", {
              unique: false,
            });
            transactionStore.createIndex("tagIds-multi", "tagIds", {
              unique: false,
              multiEntry: true,
            });
            console.log("Created transactions store with indexes");
          }

          // Create tags store
          if (!db.objectStoreNames.contains(STORES.TAGS)) {
            const tagStore = db.createObjectStore(STORES.TAGS, {
              keyPath: "id",
            });
            tagStore.createIndex("name", "name", { unique: false });
            tagStore.createIndex("isDefault", "isDefault", { unique: false });
            console.log("Created tags store with indexes");
          }

          // Create budgets store
          if (!db.objectStoreNames.contains(STORES.BUDGETS)) {
            const budgetStore = db.createObjectStore(STORES.BUDGETS, {
              keyPath: "id",
            });
            budgetStore.createIndex("tagId", "tagId", { unique: false });
            budgetStore.createIndex("period", "period", { unique: false });
            console.log("Created budgets store with indexes");
          }

          // Create spending limits store
          if (!db.objectStoreNames.contains(STORES.LIMITS)) {
            const limitStore = db.createObjectStore(STORES.LIMITS, {
              keyPath: "id",
            });
            limitStore.createIndex("type", "type", { unique: false });
            limitStore.createIndex("isActive", "isActive", { unique: false });
            console.log("Created limits store with indexes");
          }

          // Create savings goals store
          if (!db.objectStoreNames.contains(STORES.GOALS)) {
            const goalStore = db.createObjectStore(STORES.GOALS, {
              keyPath: "id",
            });
            goalStore.createIndex("deadline", "deadline", { unique: false });
            console.log("Created goals store with indexes");
          }

          // Create preferences store (single record)
          if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
            db.createObjectStore(STORES.PREFERENCES, {
              keyPath: "id",
            });
            console.log("Created preferences store");
          }

          // Create uploaded files store
          if (!db.objectStoreNames.contains(STORES.FILES)) {
            const fileStore = db.createObjectStore(STORES.FILES, {
              keyPath: "fileName",
            });
            fileStore.createIndex("uploadedAt", "uploadedAt", {
              unique: false,
            });
            fileStore.createIndex("checksum", "checksum", { unique: false });
            console.log("Created files store with indexes");
          }
        }

        // Future migrations would go here
        // Example:
        // if (oldVersion < 2) {
        //   // Add new index or store for version 2
        //   const store = transaction.objectStore(STORES.TRANSACTIONS);
        //   store.createIndex("newField", "newField", { unique: false });
        // }
      },
      blocked() {
        console.warn(
          "Database upgrade blocked. Please close other tabs with this app.",
        );
      },
      blocking() {
        console.warn(
          "This connection is blocking a database upgrade. Closing...",
        );
        // Close the database to allow the upgrade
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
        }
      },
      terminated() {
        console.error("Database connection was unexpectedly terminated");
        dbInstance = null;
      },
    });

    console.log("Database initialized successfully");
    return dbInstance;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw new Error(
      `Database initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get the database instance, initializing if necessary
 *
 * @returns Promise resolving to the database instance
 */
export async function getDB(): Promise<IDBPDatabase<FinancialDBSchema>> {
  if (!dbInstance) {
    return await initializeDB();
  }
  return dbInstance;
}

/**
 * Close the database connection
 * Useful for cleanup or before major operations
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log("Database connection closed");
  }
}

/**
 * Delete the entire database
 * WARNING: This will permanently delete all stored data
 *
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteDatabase(): Promise<void> {
  try {
    // Close existing connection first
    closeDB();

    // Delete the database
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);

      request.onsuccess = () => {
        console.log("Database deleted successfully");
        resolve();
      };

      request.onerror = () => {
        console.error("Failed to delete database:", request.error);
        reject(
          new Error(
            `Database deletion failed: ${request.error?.message || "Unknown error"}`,
          ),
        );
      };

      request.onblocked = () => {
        console.warn(
          "Database deletion blocked. Please close other tabs with this app.",
        );
      };
    });
  } catch (error) {
    console.error("Error during database deletion:", error);
    throw error;
  }
}

/**
 * Check if IndexedDB is available in the current environment
 *
 * @returns true if IndexedDB is supported, false otherwise
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return (
      typeof indexedDB !== "undefined" &&
      indexedDB !== null &&
      typeof indexedDB.open === "function"
    );
  } catch {
    return false;
  }
}

/**
 * Get database statistics
 *
 * @returns Promise resolving to database statistics
 */
export async function getDatabaseStats(): Promise<{
  name: string;
  version: number;
  stores: string[];
  size?: number;
}> {
  const db = await getDB();

  const stats = {
    name: db.name,
    version: db.version,
    stores: Array.from(db.objectStoreNames),
  };

  // Try to get storage estimate if available
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        ...stats,
        size: estimate.usage,
      };
    } catch (error) {
      console.warn("Could not get storage estimate:", error);
    }
  }

  return stats;
}
