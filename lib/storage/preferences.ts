/**
 * Preferences Storage Operations
 * CRUD operations for user preferences persistence in IndexedDB
 */

import { getDB, STORES } from "./db";
import type { UserPreferences } from "@/types/analytics";

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "light",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  widgetLayout: [],
  lowBalanceThreshold: 1000,
  enableEncryption: false,
};

/**
 * Preferences storage key (single record)
 */
const PREFERENCES_KEY = "user-preferences";

/**
 * Save user preferences to IndexedDB
 *
 * @param preferences - User preferences to save
 * @returns Promise that resolves when save is complete
 */
export async function savePreferences(
  preferences: UserPreferences,
): Promise<void> {
  const db = await getDB();
  await db.put(STORES.PREFERENCES, {
    id: PREFERENCES_KEY,
    ...preferences,
  });
}

/**
 * Load user preferences from IndexedDB
 * Returns default preferences if none exist
 *
 * @returns Promise resolving to user preferences
 */
export async function loadPreferences(): Promise<UserPreferences> {
  const db = await getDB();
  const stored = await db.get(STORES.PREFERENCES, PREFERENCES_KEY);

  if (!stored) {
    // Return default preferences if none exist
    return DEFAULT_PREFERENCES;
  }

  // Remove the 'id' field added for storage
  const { id, ...preferences } = stored as UserPreferences & { id: string };
  return preferences;
}

/**
 * Update specific preference fields
 *
 * @param updates - Partial preferences to update
 * @returns Promise resolving to updated preferences
 */
export async function updatePreferences(
  updates: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const existing = await loadPreferences();
  const updated = { ...existing, ...updates };
  await savePreferences(updated);
  return updated;
}

/**
 * Reset preferences to defaults
 *
 * @returns Promise that resolves when reset is complete
 */
export async function resetPreferences(): Promise<void> {
  await savePreferences(DEFAULT_PREFERENCES);
}

/**
 * Delete all preferences
 *
 * @returns Promise that resolves when deletion is complete
 */
export async function deletePreferences(): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.PREFERENCES, PREFERENCES_KEY);
}

/**
 * Check if preferences exist
 *
 * @returns Promise resolving to true if preferences exist
 */
export async function preferencesExist(): Promise<boolean> {
  const db = await getDB();
  const stored = await db.get(STORES.PREFERENCES, PREFERENCES_KEY);
  return stored !== undefined;
}

/**
 * Get default preferences
 *
 * @returns Default user preferences
 */
export function getDefaultPreferences(): UserPreferences {
  return { ...DEFAULT_PREFERENCES };
}

// ============================================================================
// Specific Preference Operations
// ============================================================================

/**
 * Update theme preference
 *
 * @param theme - Theme to set
 * @returns Promise resolving to updated preferences
 */
export async function updateTheme(
  theme: "light" | "dark",
): Promise<UserPreferences> {
  return await updatePreferences({ theme });
}

/**
 * Update currency preference
 *
 * @param currency - Currency code to set
 * @returns Promise resolving to updated preferences
 */
export async function updateCurrency(
  currency: string,
): Promise<UserPreferences> {
  return await updatePreferences({ currency });
}

/**
 * Update date format preference
 *
 * @param dateFormat - Date format to set
 * @returns Promise resolving to updated preferences
 */
export async function updateDateFormat(
  dateFormat: string,
): Promise<UserPreferences> {
  return await updatePreferences({ dateFormat });
}

/**
 * Update low balance threshold preference
 *
 * @param threshold - Threshold amount to set
 * @returns Promise resolving to updated preferences
 */
export async function updateLowBalanceThreshold(
  threshold: number,
): Promise<UserPreferences> {
  return await updatePreferences({ lowBalanceThreshold: threshold });
}

/**
 * Update encryption preference
 *
 * @param enabled - Whether to enable encryption
 * @returns Promise resolving to updated preferences
 */
export async function updateEncryption(
  enabled: boolean,
): Promise<UserPreferences> {
  return await updatePreferences({ enableEncryption: enabled });
}

/**
 * Update widget layout preference
 *
 * @param widgetLayout - Widget layout configuration
 * @returns Promise resolving to updated preferences
 */
export async function updateWidgetLayout(
  widgetLayout: UserPreferences["widgetLayout"],
): Promise<UserPreferences> {
  return await updatePreferences({ widgetLayout });
}

/**
 * Get current theme
 *
 * @returns Promise resolving to current theme
 */
export async function getTheme(): Promise<"light" | "dark"> {
  const preferences = await loadPreferences();
  return preferences.theme;
}

/**
 * Get current currency
 *
 * @returns Promise resolving to current currency
 */
export async function getCurrency(): Promise<string> {
  const preferences = await loadPreferences();
  return preferences.currency;
}

/**
 * Get current date format
 *
 * @returns Promise resolving to current date format
 */
export async function getDateFormat(): Promise<string> {
  const preferences = await loadPreferences();
  return preferences.dateFormat;
}

/**
 * Get current low balance threshold
 *
 * @returns Promise resolving to current low balance threshold
 */
export async function getLowBalanceThreshold(): Promise<number> {
  const preferences = await loadPreferences();
  return preferences.lowBalanceThreshold;
}

/**
 * Get current encryption setting
 *
 * @returns Promise resolving to current encryption setting
 */
export async function getEncryptionEnabled(): Promise<boolean> {
  const preferences = await loadPreferences();
  return preferences.enableEncryption;
}

/**
 * Get current widget layout
 *
 * @returns Promise resolving to current widget layout
 */
export async function getWidgetLayout(): Promise<
  UserPreferences["widgetLayout"]
> {
  const preferences = await loadPreferences();
  return preferences.widgetLayout;
}
