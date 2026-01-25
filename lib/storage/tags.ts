/**
 * Tag Storage Operations
 * CRUD operations for tag persistence in IndexedDB
 */

import { getDB, STORES } from "./db";
import type { Tag } from "@/types/tag";

/**
 * Save a single tag to IndexedDB
 *
 * @param tag - Tag to save
 * @returns Promise that resolves when save is complete
 */
export async function saveTag(tag: Tag): Promise<void> {
  const db = await getDB();
  await db.put(STORES.TAGS, tag);
}

/**
 * Save multiple tags to IndexedDB in a single transaction
 *
 * @param tags - Array of tags to save
 * @returns Promise that resolves when all saves are complete
 */
export async function saveTags(tags: Tag[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.TAGS, "readwrite");
  const store = tx.objectStore(STORES.TAGS);

  for (const tag of tags) {
    await store.put(tag);
  }

  await tx.done;
}

/**
 * Load all tags from IndexedDB
 *
 * @returns Promise resolving to array of all tags
 */
export async function loadTags(): Promise<Tag[]> {
  const db = await getDB();
  return await db.getAll(STORES.TAGS);
}

/**
 * Load a single tag by ID
 *
 * @param id - Tag ID
 * @returns Promise resolving to tag or undefined if not found
 */
export async function loadTag(id: string): Promise<Tag | undefined> {
  const db = await getDB();
  return await db.get(STORES.TAGS, id);
}

/**
 * Load all default tags
 *
 * @returns Promise resolving to array of default tags
 */
export async function loadDefaultTags(): Promise<Tag[]> {
  const db = await getDB();
  const allTags = await db.getAll(STORES.TAGS);
  return allTags.filter((tag) => tag.isDefault);
}

/**
 * Load all custom (non-default) tags
 *
 * @returns Promise resolving to array of custom tags
 */
export async function loadCustomTags(): Promise<Tag[]> {
  const db = await getDB();
  const allTags = await db.getAll(STORES.TAGS);
  return allTags.filter((tag) => !tag.isDefault);
}

/**
 * Load tags by parent tag ID (subcategories)
 *
 * @param parentTagId - Parent tag ID
 * @returns Promise resolving to array of child tags
 */
export async function loadTagsByParent(parentTagId: string): Promise<Tag[]> {
  const db = await getDB();
  const allTags = await db.getAll(STORES.TAGS);
  return allTags.filter((tag) => tag.parentTagId === parentTagId);
}

/**
 * Load root tags (tags without a parent)
 *
 * @returns Promise resolving to array of root tags
 */
export async function loadRootTags(): Promise<Tag[]> {
  const db = await getDB();
  const allTags = await db.getAll(STORES.TAGS);
  return allTags.filter((tag) => tag.parentTagId === null);
}

/**
 * Search tags by name (case-insensitive partial match)
 *
 * @param searchTerm - Search term
 * @returns Promise resolving to array of matching tags
 */
export async function searchTagsByName(searchTerm: string): Promise<Tag[]> {
  const db = await getDB();
  const allTags = await db.getAll(STORES.TAGS);
  const lowerSearch = searchTerm.toLowerCase();

  return allTags.filter((tag) => tag.name.toLowerCase().includes(lowerSearch));
}

/**
 * Search tags by keyword (case-insensitive partial match)
 *
 * @param keyword - Keyword to search for
 * @returns Promise resolving to array of tags containing the keyword
 */
export async function searchTagsByKeyword(keyword: string): Promise<Tag[]> {
  const db = await getDB();
  const allTags = await db.getAll(STORES.TAGS);
  const lowerKeyword = keyword.toLowerCase();

  return allTags.filter((tag) =>
    tag.keywords.some((k: string) => k.toLowerCase().includes(lowerKeyword)),
  );
}

/**
 * Update a tag
 *
 * @param id - Tag ID
 * @param updates - Partial tag updates
 * @returns Promise resolving to updated tag or undefined if not found
 */
export async function updateTag(
  id: string,
  updates: Partial<Tag>,
): Promise<Tag | undefined> {
  const db = await getDB();
  const existing = await db.get(STORES.TAGS, id);

  if (!existing) {
    return undefined;
  }

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  await db.put(STORES.TAGS, updated);
  return updated;
}

/**
 * Delete a single tag by ID
 *
 * @param id - Tag ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteTag(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.TAGS, id);
}

/**
 * Delete multiple tags by IDs
 *
 * @param ids - Array of tag IDs to delete
 * @returns Promise that resolves when all deletions are complete
 */
export async function deleteTags(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.TAGS, "readwrite");
  const store = tx.objectStore(STORES.TAGS);

  for (const id of ids) {
    await store.delete(id);
  }

  await tx.done;
}

/**
 * Delete all custom (non-default) tags
 *
 * @returns Promise resolving to number of tags deleted
 */
export async function deleteAllCustomTags(): Promise<number> {
  const db = await getDB();
  const customTags = await loadCustomTags();

  const tx = db.transaction(STORES.TAGS, "readwrite");
  const store = tx.objectStore(STORES.TAGS);

  for (const tag of customTags) {
    await store.delete(tag.id);
  }

  await tx.done;
  return customTags.length;
}

/**
 * Delete all tags
 *
 * @returns Promise that resolves when all tags are deleted
 */
export async function deleteAllTags(): Promise<void> {
  const db = await getDB();
  await db.clear(STORES.TAGS);
}

/**
 * Count total number of tags
 *
 * @returns Promise resolving to tag count
 */
export async function countTags(): Promise<number> {
  const db = await getDB();
  return await db.count(STORES.TAGS);
}

/**
 * Count default tags
 *
 * @returns Promise resolving to count of default tags
 */
export async function countDefaultTags(): Promise<number> {
  const defaultTags = await loadDefaultTags();
  return defaultTags.length;
}

/**
 * Count custom tags
 *
 * @returns Promise resolving to count of custom tags
 */
export async function countCustomTags(): Promise<number> {
  const customTags = await loadCustomTags();
  return customTags.length;
}

/**
 * Check if a tag exists by ID
 *
 * @param id - Tag ID
 * @returns Promise resolving to true if tag exists
 */
export async function tagExists(id: string): Promise<boolean> {
  const db = await getDB();
  const tag = await db.get(STORES.TAGS, id);
  return tag !== undefined;
}

/**
 * Check if a tag with a specific name exists (case-insensitive)
 *
 * @param name - Tag name to check
 * @returns Promise resolving to true if a tag with the name exists
 */
export async function tagExistsByName(name: string): Promise<boolean> {
  const db = await getDB();
  const allTags = await db.getAll(STORES.TAGS);
  const lowerName = name.toLowerCase();

  return allTags.some((tag) => tag.name.toLowerCase() === lowerName);
}
