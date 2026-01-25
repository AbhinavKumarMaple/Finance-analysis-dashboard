/**
 * Tag Store
 * Manages tag/category state and operations
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Tag, TagTemplate, CategorizationResult } from "@/types/tag";

/**
 * Tag store state
 */
interface TagState {
  // State
  tags: Tag[];
  categorizationResults: Map<string, CategorizationResult>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  clearTags: () => void;

  // Categorization
  setCategorizationResult: (
    transactionId: string,
    result: CategorizationResult,
  ) => void;
  getCategorizationResult: (
    transactionId: string,
  ) => CategorizationResult | undefined;
  clearCategorizationResults: () => void;

  // Queries
  getTagById: (id: string) => Tag | undefined;
  getTagsByIds: (ids: string[]) => Tag[];
  getDefaultTags: () => Tag[];
  getCustomTags: () => Tag[];
  searchTags: (query: string) => Tag[];

  // Loading state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Create tag store with Zustand
 */
export const useTagStore = create<TagState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tags: [],
      categorizationResults: new Map(),
      isLoading: false,
      error: null,

      // Actions
      setTags: (tags) => set({ tags }, false, "setTags"),

      addTag: (tag) =>
        set(
          (state) => ({
            tags: [...state.tags, tag],
          }),
          false,
          "addTag",
        ),

      updateTag: (id, updates) =>
        set(
          (state) => ({
            tags: state.tags.map((t) =>
              t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t,
            ),
          }),
          false,
          "updateTag",
        ),

      deleteTag: (id) =>
        set(
          (state) => ({
            tags: state.tags.filter((t) => t.id !== id),
          }),
          false,
          "deleteTag",
        ),

      clearTags: () => set({ tags: [] }, false, "clearTags"),

      // Categorization
      setCategorizationResult: (transactionId, result) =>
        set(
          (state) => {
            const newResults = new Map(state.categorizationResults);
            newResults.set(transactionId, result);
            return { categorizationResults: newResults };
          },
          false,
          "setCategorizationResult",
        ),

      getCategorizationResult: (transactionId) =>
        get().categorizationResults.get(transactionId),

      clearCategorizationResults: () =>
        set(
          { categorizationResults: new Map() },
          false,
          "clearCategorizationResults",
        ),

      // Queries
      getTagById: (id) => get().tags.find((t) => t.id === id),

      getTagsByIds: (ids) => get().tags.filter((t) => ids.includes(t.id)),

      getDefaultTags: () => get().tags.filter((t) => t.isDefault),

      getCustomTags: () => get().tags.filter((t) => !t.isDefault),

      searchTags: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().tags.filter(
          (t) =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.keywords.some((k) => k.toLowerCase().includes(lowerQuery)),
        );
      },

      // Loading state
      setLoading: (loading) => set({ isLoading: loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),
    }),
    { name: "TagStore" },
  ),
);
