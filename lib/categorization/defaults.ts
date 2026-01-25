/**
 * Default Tag Templates
 *
 * Predefined tag templates with common categories and keywords
 * for automatic transaction categorization.
 *
 * Requirements: 18.1-18.11
 */

import type { Tag, TagTemplate } from "../../types/tag";

/**
 * Default tag templates with predefined categories and keywords
 */
export const DEFAULT_TAG_TEMPLATES: TagTemplate[] = [
  {
    name: "Food & Delivery",
    keywords: [
      "swiggy",
      "zomato",
      "uber eats",
      "dominos",
      "pizza",
      "mcdonald",
      "kfc",
      "burger",
      "restaurant",
      "food",
      "cafe",
      "coffee",
      "starbucks",
    ],
    color: "#ef4444", // red
    icon: "🍔",
  },
  {
    name: "Shopping",
    keywords: [
      "amazon",
      "flipkart",
      "myntra",
      "ajio",
      "meesho",
      "shopping",
      "retail",
      "store",
      "mall",
      "supermarket",
      "grocery",
      "bigbasket",
      "blinkit",
      "zepto",
    ],
    color: "#8b5cf6", // purple
    icon: "🛒",
  },
  {
    name: "Utilities",
    keywords: [
      "electricity",
      "water",
      "gas",
      "internet",
      "broadband",
      "mobile",
      "recharge",
      "bill",
      "utility",
      "airtel",
      "jio",
      "vodafone",
      "bsnl",
    ],
    color: "#3b82f6", // blue
    icon: "💡",
  },
  {
    name: "Investments",
    keywords: [
      "mutual fund",
      "sip",
      "stock",
      "zerodha",
      "groww",
      "upstox",
      "investment",
      "trading",
      "equity",
      "gold",
      "bond",
      "fd",
      "fixed deposit",
    ],
    color: "#10b981", // green
    icon: "📈",
  },
  {
    name: "EMI & Loans",
    keywords: [
      "emi",
      "loan",
      "credit card",
      "installment",
      "repayment",
      "hdfc",
      "icici",
      "sbi",
      "axis",
      "kotak",
      "mortgage",
      "personal loan",
      "home loan",
    ],
    color: "#f59e0b", // amber
    icon: "💳",
  },
  {
    name: "ATM Withdrawals",
    keywords: ["atm", "cash withdrawal", "cwd", "withdrawal", "cash"],
    color: "#6366f1", // indigo
    icon: "🏧",
  },
  {
    name: "Refunds",
    keywords: [
      "refund",
      "reversal",
      "cashback",
      "return",
      "credit",
      "reimbursement",
    ],
    color: "#14b8a6", // teal
    icon: "↩️",
  },
  {
    name: "Insurance",
    keywords: [
      "insurance",
      "premium",
      "policy",
      "lic",
      "health insurance",
      "life insurance",
      "car insurance",
      "term insurance",
    ],
    color: "#ec4899", // pink
    icon: "🛡️",
  },
  {
    name: "Entertainment",
    keywords: [
      "netflix",
      "prime video",
      "hotstar",
      "spotify",
      "youtube",
      "movie",
      "cinema",
      "pvr",
      "inox",
      "entertainment",
      "subscription",
      "gaming",
    ],
    color: "#f97316", // orange
    icon: "🎬",
  },
  {
    name: "Transportation",
    keywords: [
      "uber",
      "ola",
      "rapido",
      "metro",
      "bus",
      "train",
      "taxi",
      "fuel",
      "petrol",
      "diesel",
      "parking",
      "toll",
    ],
    color: "#06b6d4", // cyan
    icon: "🚗",
  },
  {
    name: "Healthcare",
    keywords: [
      "hospital",
      "doctor",
      "pharmacy",
      "medicine",
      "medical",
      "health",
      "clinic",
      "apollo",
      "fortis",
      "max",
      "diagnostic",
      "lab",
    ],
    color: "#dc2626", // red-600
    icon: "🏥",
  },
];

/**
 * Creates Tag objects from templates
 *
 * @param templates - Array of tag templates
 * @param startId - Starting ID number (default: 1)
 * @returns Tag[] - Array of Tag objects
 */
export function createTagsFromTemplates(
  templates: TagTemplate[],
  startId: number = 1,
): Tag[] {
  const now = new Date();

  return templates.map((template, index) => ({
    id: `tag-${startId + index}`,
    name: template.name,
    keywords: template.keywords,
    color: template.color,
    icon: template.icon,
    isDefault: true,
    parentTagId: null,
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Gets default tags for initial setup
 *
 * @returns Tag[] - Array of default tags
 */
export function getDefaultTags(): Tag[] {
  return createTagsFromTemplates(DEFAULT_TAG_TEMPLATES);
}

/**
 * Creates a custom tag
 *
 * @param name - Tag name
 * @param keywords - Array of keywords
 * @param color - Hex color code
 * @param icon - Optional emoji icon
 * @returns Tag - New tag object
 */
export function createCustomTag(
  name: string,
  keywords: string[],
  color: string,
  icon: string | null = null,
): Tag {
  const now = new Date();

  return {
    id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    keywords,
    color,
    icon,
    isDefault: false,
    parentTagId: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Updates an existing tag
 *
 * @param tag - Tag to update
 * @param updates - Partial tag updates
 * @returns Tag - Updated tag object
 */
export function updateTag(tag: Tag, updates: Partial<Tag>): Tag {
  return {
    ...tag,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Predefined color palette for tags
 */
export const TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#10b981", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#a855f7", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
];

/**
 * Gets a random color from the palette
 *
 * @returns string - Hex color code
 */
export function getRandomTagColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

/**
 * Common emoji icons for tags
 */
export const TAG_ICONS = [
  "🍔", // Food
  "🛒", // Shopping
  "💡", // Utilities
  "📈", // Investments
  "💳", // EMI/Loans
  "🏧", // ATM
  "↩️", // Refunds
  "🛡️", // Insurance
  "🎬", // Entertainment
  "🚗", // Transportation
  "🏥", // Healthcare
  "🏠", // Home
  "✈️", // Travel
  "📚", // Education
  "💼", // Business
  "🎁", // Gifts
  "👕", // Clothing
  "⚽", // Sports
  "🎮", // Gaming
  "📱", // Electronics
];

/**
 * Validates tag data
 *
 * @param name - Tag name
 * @param keywords - Array of keywords
 * @returns string | null - Error message or null if valid
 */
export function validateTagData(
  name: string,
  keywords: string[],
): string | null {
  if (!name || name.trim().length === 0) {
    return "Tag name is required";
  }

  if (name.length > 50) {
    return "Tag name must be 50 characters or less";
  }

  if (!keywords || keywords.length === 0) {
    return "At least one keyword is required";
  }

  if (keywords.some((k) => !k || k.trim().length === 0)) {
    return "Keywords cannot be empty";
  }

  return null;
}

/**
 * Merges user tags with default tags
 *
 * Ensures default tags are present and adds user-created tags.
 *
 * @param userTags - User-created tags
 * @returns Tag[] - Merged array of tags
 */
export function mergeWithDefaultTags(userTags: Tag[]): Tag[] {
  const defaultTags = getDefaultTags();
  const userTagNames = new Set(userTags.map((t) => t.name.toLowerCase()));

  // Filter out default tags that user has already created
  const filteredDefaults = defaultTags.filter(
    (tag) => !userTagNames.has(tag.name.toLowerCase()),
  );

  return [...filteredDefaults, ...userTags];
}
