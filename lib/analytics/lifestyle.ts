/**
 * Lifestyle Analysis Module
 * Analyzes spending patterns to provide lifestyle insights
 */

import type { Transaction } from "../../types/transaction";
import type { Tag } from "../../types/tag";
import type {
  LifestyleMetrics,
  MerchantSpend,
  MonthlyAmount,
} from "../../types/analytics";

/**
 * Analyzes lifestyle spending patterns
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export function analyzeLifestyle(
  transactions: Transaction[],
  tags: Tag[],
): LifestyleMetrics {
  // Filter debit transactions only
  const debits = transactions.filter((t) => t.type === "debit");

  // Analyze food delivery
  const foodDelivery = analyzeFoodDelivery(debits, tags);

  // Analyze shopping
  const shopping = analyzeShopping(debits, tags);

  // Analyze utilities
  const utilities = analyzeUtilities(debits, tags);

  // Analyze investments
  const investments = analyzeInvestments(transactions, tags);

  return {
    foodDelivery,
    shopping,
    utilities,
    investments,
  };
}

/**
 * Analyzes food delivery spending patterns
 * Requirement: 11.1
 */
function analyzeFoodDelivery(
  transactions: Transaction[],
  tags: Tag[],
): LifestyleMetrics["foodDelivery"] {
  // Find food delivery tag
  const foodTag = tags.find(
    (t) =>
      t.name.toLowerCase().includes("food") &&
      t.name.toLowerCase().includes("delivery"),
  );

  // Filter food delivery transactions
  const foodTransactions = foodTag
    ? transactions.filter((t) => t.tagIds.includes(foodTag.id))
    : transactions.filter((t) =>
        isFoodDeliveryTransaction(t.details.toLowerCase()),
      );

  if (foodTransactions.length === 0) {
    return {
      frequency: 0,
      averageOrderValue: 0,
      totalSpend: 0,
      topPlatforms: [],
    };
  }

  const totalSpend = foodTransactions.reduce(
    (sum, t) => sum + (t.debit || 0),
    0,
  );
  const frequency = foodTransactions.length;
  const averageOrderValue = totalSpend / frequency;

  // Calculate top platforms
  const topPlatforms = calculateTopMerchants(foodTransactions, 5);

  return {
    frequency,
    averageOrderValue,
    totalSpend,
    topPlatforms,
  };
}

/**
 * Checks if transaction is food delivery
 */
function isFoodDeliveryTransaction(details: string): boolean {
  const foodKeywords = [
    "swiggy",
    "zomato",
    "ubereats",
    "dunzo",
    "food",
    "restaurant",
    "pizza",
    "burger",
  ];
  return foodKeywords.some((keyword) => details.includes(keyword));
}

/**
 * Analyzes shopping spending patterns
 * Requirement: 11.2
 */
function analyzeShopping(
  transactions: Transaction[],
  tags: Tag[],
): LifestyleMetrics["shopping"] {
  // Find shopping tag
  const shoppingTag = tags.find((t) =>
    t.name.toLowerCase().includes("shopping"),
  );

  // Filter shopping transactions
  const shoppingTransactions = shoppingTag
    ? transactions.filter((t) => t.tagIds.includes(shoppingTag.id))
    : transactions.filter((t) =>
        isShoppingTransaction(t.details.toLowerCase()),
      );

  if (shoppingTransactions.length === 0) {
    return {
      frequency: 0,
      averageTransaction: 0,
      totalSpend: 0,
      topMerchants: [],
    };
  }

  const totalSpend = shoppingTransactions.reduce(
    (sum, t) => sum + (t.debit || 0),
    0,
  );
  const frequency = shoppingTransactions.length;
  const averageTransaction = totalSpend / frequency;

  // Calculate top merchants
  const topMerchants = calculateTopMerchants(shoppingTransactions, 5);

  return {
    frequency,
    averageTransaction,
    totalSpend,
    topMerchants,
  };
}

/**
 * Checks if transaction is shopping
 */
function isShoppingTransaction(details: string): boolean {
  const shoppingKeywords = [
    "amazon",
    "flipkart",
    "myntra",
    "ajio",
    "shopping",
    "mall",
    "store",
  ];
  return shoppingKeywords.some((keyword) => details.includes(keyword));
}

/**
 * Analyzes utility spending patterns
 * Requirement: 11.3
 */
function analyzeUtilities(
  transactions: Transaction[],
  tags: Tag[],
): LifestyleMetrics["utilities"] {
  // Find utilities tag
  const utilitiesTag = tags.find((t) =>
    t.name.toLowerCase().includes("utilities"),
  );

  // Filter utility transactions
  const utilityTransactions = utilitiesTag
    ? transactions.filter((t) => t.tagIds.includes(utilitiesTag.id))
    : transactions.filter((t) => isUtilityTransaction(t.details.toLowerCase()));

  if (utilityTransactions.length === 0) {
    return {
      monthlyAverage: 0,
      trend: [],
    };
  }

  // Calculate monthly trend
  const monthlyMap = new Map<string, number>();

  for (const transaction of utilityTransactions) {
    const month = formatMonth(transaction.date);
    const currentAmount = monthlyMap.get(month) || 0;
    monthlyMap.set(month, currentAmount + (transaction.debit || 0));
  }

  const trend = Array.from(monthlyMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate monthly average
  const totalSpend = utilityTransactions.reduce(
    (sum, t) => sum + (t.debit || 0),
    0,
  );
  const monthlyAverage = trend.length > 0 ? totalSpend / trend.length : 0;

  return {
    monthlyAverage,
    trend,
  };
}

/**
 * Checks if transaction is utility
 */
function isUtilityTransaction(details: string): boolean {
  const utilityKeywords = [
    "electric",
    "water",
    "gas",
    "internet",
    "broadband",
    "mobile",
    "phone",
    "utility",
  ];
  return utilityKeywords.some((keyword) => details.includes(keyword));
}

/**
 * Analyzes investment patterns
 * Requirement: 11.4
 */
function analyzeInvestments(
  transactions: Transaction[],
  tags: Tag[],
): LifestyleMetrics["investments"] {
  // Find investments tag
  const investmentsTag = tags.find((t) =>
    t.name.toLowerCase().includes("investment"),
  );

  // Filter investment transactions (debits for investments)
  const investmentTransactions = investmentsTag
    ? transactions.filter(
        (t) => t.type === "debit" && t.tagIds.includes(investmentsTag.id),
      )
    : transactions.filter(
        (t) =>
          t.type === "debit" &&
          isInvestmentTransaction(t.details.toLowerCase()),
      );

  if (investmentTransactions.length === 0) {
    return {
      sipDetected: false,
      monthlyInvestment: 0,
      consistency: 0,
    };
  }

  // Detect SIP (Systematic Investment Plan) pattern
  const sipDetected = detectSIPPattern(investmentTransactions);

  // Calculate monthly investment
  const monthlyMap = new Map<string, number>();
  for (const transaction of investmentTransactions) {
    const month = formatMonth(transaction.date);
    const currentAmount = monthlyMap.get(month) || 0;
    monthlyMap.set(month, currentAmount + (transaction.debit || 0));
  }

  const monthlyInvestment =
    monthlyMap.size > 0
      ? Array.from(monthlyMap.values()).reduce((sum, a) => sum + a, 0) /
        monthlyMap.size
      : 0;

  // Calculate consistency (0-100 score)
  const consistency = calculateInvestmentConsistency(
    investmentTransactions,
    monthlyMap,
  );

  return {
    sipDetected,
    monthlyInvestment,
    consistency,
  };
}

/**
 * Checks if transaction is investment
 */
function isInvestmentTransaction(details: string): boolean {
  const investmentKeywords = [
    "mutual fund",
    "sip",
    "investment",
    "equity",
    "stock",
    "zerodha",
    "groww",
    "upstox",
  ];
  return investmentKeywords.some((keyword) => details.includes(keyword));
}

/**
 * Detects SIP pattern in investment transactions
 */
function detectSIPPattern(transactions: Transaction[]): boolean {
  if (transactions.length < 3) {
    return false;
  }

  // Sort by date
  const sorted = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Check for regular monthly pattern
  let regularCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    const daysDiff = Math.round(
      (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Monthly pattern (25-35 days)
    if (daysDiff >= 25 && daysDiff <= 35) {
      regularCount++;
    }
  }

  // If at least 50% of intervals are monthly, consider it SIP
  return regularCount >= sorted.length * 0.5 - 1;
}

/**
 * Calculates investment consistency score (0-100)
 */
function calculateInvestmentConsistency(
  transactions: Transaction[],
  monthlyMap: Map<string, number>,
): number {
  if (monthlyMap.size === 0) {
    return 0;
  }

  // Get date range
  const dates = transactions.map((t) => t.date);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Calculate total months in range
  const totalMonths =
    (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
    (maxDate.getMonth() - minDate.getMonth()) +
    1;

  // Consistency = (months with investments / total months) * 100
  const consistency = (monthlyMap.size / totalMonths) * 100;

  return Math.round(Math.min(100, consistency));
}

/**
 * Calculates top merchants by spending
 */
function calculateTopMerchants(
  transactions: Transaction[],
  limit: number,
): MerchantSpend[] {
  const merchantMap = new Map<string, MerchantSpend>();

  for (const transaction of transactions) {
    const merchant = extractMerchantName(transaction.details);
    const existing = merchantMap.get(merchant);

    if (existing) {
      existing.totalAmount += transaction.debit || 0;
      existing.transactionCount++;
      existing.averageAmount = existing.totalAmount / existing.transactionCount;
      if (transaction.date > existing.lastTransaction) {
        existing.lastTransaction = transaction.date;
      }
    } else {
      merchantMap.set(merchant, {
        merchant,
        totalAmount: transaction.debit || 0,
        transactionCount: 1,
        averageAmount: transaction.debit || 0,
        lastTransaction: transaction.date,
      });
    }
  }

  // Sort by total amount and return top N
  return Array.from(merchantMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}

/**
 * Extracts merchant name from transaction details
 */
function extractMerchantName(details: string): string {
  // Try to extract from UPI format
  const upiMatch = details.match(/UPI\/[^/]+\/[^/]+\/([^/]+)/);
  if (upiMatch) {
    return upiMatch[1];
  }

  // Fallback: use first meaningful word
  const words = details.split(/[\s/]+/).filter((w) => w.length > 3);
  return words[0] || details.substring(0, 20);
}

/**
 * Formats date to YYYY-MM format
 */
function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
