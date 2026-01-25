/**
 * Preferences Store
 * Manages user preferences and application settings
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { UserPreferences, WidgetLayout } from "@/types/analytics";

/**
 * Default user preferences
 */
const defaultPreferences: UserPreferences = {
  theme: "light",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  widgetLayout: [],
  lowBalanceThreshold: 10000,
  enableEncryption: false,
};

/**
 * Preferences store state
 */
interface PreferencesState {
  // State
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPreferences: (preferences: UserPreferences) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;

  // Theme
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;

  // Currency and format
  setCurrency: (currency: string) => void;
  setDateFormat: (format: string) => void;

  // Widget layout
  setWidgetLayout: (layout: WidgetLayout[]) => void;
  updateWidgetLayout: (
    widgetId: string,
    updates: Partial<WidgetLayout>,
  ) => void;
  addWidget: (widget: WidgetLayout) => void;
  removeWidget: (widgetId: string) => void;
  toggleWidgetVisibility: (widgetId: string) => void;

  // Thresholds
  setLowBalanceThreshold: (threshold: number) => void;

  // Security
  setEnableEncryption: (enabled: boolean) => void;

  // Loading state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Create preferences store with Zustand
 * Uses persist middleware to save preferences to localStorage
 */
export const usePreferencesStore = create<PreferencesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        preferences: defaultPreferences,
        isLoading: false,
        error: null,

        // Actions
        setPreferences: (preferences) =>
          set({ preferences }, false, "setPreferences"),

        updatePreferences: (updates) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, ...updates },
            }),
            false,
            "updatePreferences",
          ),

        resetPreferences: () =>
          set({ preferences: defaultPreferences }, false, "resetPreferences"),

        // Theme
        setTheme: (theme) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, theme },
            }),
            false,
            "setTheme",
          ),

        toggleTheme: () =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                theme: state.preferences.theme === "light" ? "dark" : "light",
              },
            }),
            false,
            "toggleTheme",
          ),

        // Currency and format
        setCurrency: (currency) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, currency },
            }),
            false,
            "setCurrency",
          ),

        setDateFormat: (dateFormat) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, dateFormat },
            }),
            false,
            "setDateFormat",
          ),

        // Widget layout
        setWidgetLayout: (widgetLayout) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, widgetLayout },
            }),
            false,
            "setWidgetLayout",
          ),

        updateWidgetLayout: (widgetId, updates) =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                widgetLayout: state.preferences.widgetLayout.map((w) =>
                  w.widgetId === widgetId ? { ...w, ...updates } : w,
                ),
              },
            }),
            false,
            "updateWidgetLayout",
          ),

        addWidget: (widget) =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                widgetLayout: [...state.preferences.widgetLayout, widget],
              },
            }),
            false,
            "addWidget",
          ),

        removeWidget: (widgetId) =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                widgetLayout: state.preferences.widgetLayout.filter(
                  (w) => w.widgetId !== widgetId,
                ),
              },
            }),
            false,
            "removeWidget",
          ),

        toggleWidgetVisibility: (widgetId) =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                widgetLayout: state.preferences.widgetLayout.map((w) =>
                  w.widgetId === widgetId
                    ? { ...w, isVisible: !w.isVisible }
                    : w,
                ),
              },
            }),
            false,
            "toggleWidgetVisibility",
          ),

        // Thresholds
        setLowBalanceThreshold: (lowBalanceThreshold) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, lowBalanceThreshold },
            }),
            false,
            "setLowBalanceThreshold",
          ),

        // Security
        setEnableEncryption: (enableEncryption) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, enableEncryption },
            }),
            false,
            "setEnableEncryption",
          ),

        // Loading state
        setLoading: (loading) =>
          set({ isLoading: loading }, false, "setLoading"),

        setError: (error) => set({ error }, false, "setError"),
      }),
      {
        name: "preferences-storage", // localStorage key
        partialize: (state) => ({ preferences: state.preferences }), // Only persist preferences
      },
    ),
    { name: "PreferencesStore" },
  ),
);
