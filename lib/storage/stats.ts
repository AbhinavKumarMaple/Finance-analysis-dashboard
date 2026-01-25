/**
 * Storage Statistics and Cleanup Operations
 * Functions for monitoring storage usage and clearing data
 */

import { getDB, STORES, deleteDatabase } from "./db";
import type { StorageStats } from "@/types/analytics";
import { countTransactions } from "./transactions";
import { countTags } from "./tags";
import {
  countBudgets,
  countSpendingLimits,
  countSavingsGoals,
} from "./budgets";

/**
 * Get comprehensive storage statistics
 * Includes counts of all data types and storage quota information
 *
 * @returns Promise resolving to storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  try {
    // Get counts from all stores
    const [transactionCount, tagCount, budgetCount, limitCount, goalCount] =
      await Promise.all([
        countTransactions(),
        countTags(),
        countBudgets(),
        countSpendingLimits(),
        countSavingsGoals(),
      ]);

    // Get storage quota information if available
    let quotaUsed = 0;
    let quotaAvailable = 0;
    let totalSize = 0;

    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        quotaUsed = estimate.usage || 0;
        quotaAvailable = estimate.quota || 0;
        totalSize = quotaUsed;
      } catch (error) {
        console.warn("Could not get storage estimate:", error);
      }
    }

    return {
      totalSize,
      transactionCount,
      tagCount,
      quotaUsed,
      quotaAvailable,
    };
  } catch (error) {
    console.error("Failed to get storage stats:", error);
    throw new Error(
      `Failed to get storage statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Clear all data from IndexedDB
 * WARNING: This will permanently delete all stored data
 *
 * @returns Promise that resolves when all data is cleared
 */
export async function clearAllData(): Promise<void> {
  try {
    // Delete the entire database
    await deleteDatabase();
    console.log("All data cleared successfully");
  } catch (error) {
    console.error("Failed to clear all data:", error);
    throw new Error(
      `Failed to clear all data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Clear selective data types from IndexedDB
 * Allows clearing specific stores while preserving others
 *
 * @param types - Array of data types to clear
 * @returns Promise that resolves when selected data is cleared
 */
export async function clearSelectiveData(
  types: (
    | "transactions"
    | "tags"
    | "budgets"
    | "limits"
    | "goals"
    | "preferences"
    | "files"
  )[],
): Promise<void> {
  try {
    const db = await getDB();

    // Map user-friendly type names to store names
    const storeMap: Record<string, string> = {
      transactions: STORES.TRANSACTIONS,
      tags: STORES.TAGS,
      budgets: STORES.BUDGETS,
      limits: STORES.LIMITS,
      goals: STORES.GOALS,
      preferences: STORES.PREFERENCES,
      files: STORES.FILES,
    };

    // Clear each specified store
    for (const type of types) {
      const storeName = storeMap[type];
      if (storeName) {
        await db.clear(storeName);
        console.log(`Cleared ${type} data`);
      } else {
        console.warn(`Unknown data type: ${type}`);
      }
    }

    console.log("Selective data cleared successfully");
  } catch (error) {
    console.error("Failed to clear selective data:", error);
    throw new Error(
      `Failed to clear selective data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Check if storage quota is approaching limit
 * Returns true if usage is above the specified threshold percentage
 *
 * @param thresholdPercent - Threshold percentage (default: 80)
 * @returns Promise resolving to true if quota is near limit
 */
export async function isStorageQuotaNearLimit(
  thresholdPercent: number = 80,
): Promise<boolean> {
  try {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;

      if (quota === 0) {
        return false;
      }

      const usagePercent = (usage / quota) * 100;
      return usagePercent >= thresholdPercent;
    }

    return false;
  } catch (error) {
    console.warn("Could not check storage quota:", error);
    return false;
  }
}

/**
 * Get storage usage percentage
 *
 * @returns Promise resolving to usage percentage (0-100) or null if unavailable
 */
export async function getStorageUsagePercent(): Promise<number | null> {
  try {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;

      if (quota === 0) {
        return null;
      }

      return (usage / quota) * 100;
    }

    return null;
  } catch (error) {
    console.warn("Could not get storage usage percentage:", error);
    return null;
  }
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get detailed storage breakdown by store
 * Note: This is an approximation as IndexedDB doesn't provide per-store size
 *
 * @returns Promise resolving to storage breakdown
 */
export async function getStorageBreakdown(): Promise<{
  transactions: number;
  tags: number;
  budgets: number;
  limits: number;
  goals: number;
  preferences: number;
  files: number;
  total: number;
}> {
  try {
    const [
      transactionCount,
      tagCount,
      budgetCount,
      limitCount,
      goalCount,
      preferencesCount,
      filesCount,
    ] = await Promise.all([
      countTransactions(),
      countTags(),
      countBudgets(),
      countSpendingLimits(),
      countSavingsGoals(),
      (async () => {
        const db = await getDB();
        return await db.count(STORES.PREFERENCES);
      })(),
      (async () => {
        const db = await getDB();
        return await db.count(STORES.FILES);
      })(),
    ]);

    const total =
      transactionCount +
      tagCount +
      budgetCount +
      limitCount +
      goalCount +
      preferencesCount +
      filesCount;

    return {
      transactions: transactionCount,
      tags: tagCount,
      budgets: budgetCount,
      limits: limitCount,
      goals: goalCount,
      preferences: preferencesCount,
      files: filesCount,
      total,
    };
  } catch (error) {
    console.error("Failed to get storage breakdown:", error);
    throw new Error(
      `Failed to get storage breakdown: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Check if storage quota is exceeded
 * Returns true if storage operations are likely to fail
 *
 * @returns Promise resolving to true if quota is exceeded
 */
export async function isStorageQuotaExceeded(): Promise<boolean> {
  try {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;

      if (quota === 0) {
        return false;
      }

      // Consider quota exceeded if usage is at or above 95%
      const usagePercent = (usage / quota) * 100;
      return usagePercent >= 95;
    }

    return false;
  } catch (error) {
    console.warn("Could not check if storage quota is exceeded:", error);
    return false;
  }
}

/**
 * Get storage quota status with user-friendly message
 *
 * @returns Promise resolving to quota status
 */
export async function getStorageQuotaStatus(): Promise<{
  isNearLimit: boolean;
  isExceeded: boolean;
  usagePercent: number | null;
  message: string;
}> {
  try {
    const [isNearLimit, isExceeded, usagePercent] = await Promise.all([
      isStorageQuotaNearLimit(),
      isStorageQuotaExceeded(),
      getStorageUsagePercent(),
    ]);

    let message = "Storage is healthy";

    if (isExceeded) {
      message =
        "Storage is full. Please remove old data to continue using the app.";
    } else if (isNearLimit) {
      message =
        "Storage is running low. Consider removing old data to free up space.";
    }

    return {
      isNearLimit,
      isExceeded,
      usagePercent,
      message,
    };
  } catch (error) {
    console.error("Failed to get storage quota status:", error);
    return {
      isNearLimit: false,
      isExceeded: false,
      usagePercent: null,
      message: "Could not determine storage status",
    };
  }
}
