/**
 * Tag Type Definitions
 * Types for transaction categorization and tagging system
 */

/**
 * Tag for categorizing transactions
 */
export interface Tag {
  id: string;
  name: string;
  keywords: string[];
  color: string;
  icon: string | null;
  isDefault: boolean;
  parentTagId: string | null; // For subcategories
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Template for creating default tags
 */
export interface TagTemplate {
  name: string;
  keywords: string[];
  color: string;
  icon: string;
  subcategories?: TagTemplate[];
}

/**
 * Information about a keyword match in a transaction
 */
export interface TagMatch {
  tagId: string;
  keyword: string;
  matchPosition: number;
}

/**
 * Result of categorizing a transaction
 */
export interface CategorizationResult {
  transactionId: string;
  matchedTags: TagMatch[];
  isManualOverride: boolean;
}
