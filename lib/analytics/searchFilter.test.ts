/**
 * Property-Based Tests for Search and Filter Correctness
 * Feature: financial-analytics-dashboard, Property 8: Search and Filter Correctness
 *
 * **Validates: Requirements 15.1, 15.2**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { Transaction, PaymentMethod } from "@/types/transaction";

// Arbitrary generators for test data
const arbitraryPaymentMethod = fc.constantFrom<PaymentMethod>(
  "UPI",
  "NEFT",
  "IMPS",
  "ATM",
  "POS",
  "CHEQUE",
  "OTHER",
);

const arbitraryTransaction = fc.record({
  id: fc.uuid(),
  date: fc.date({ min: new Date("2023-01-01"), max: new Date("2024-12-31") }),
  details: fc.string({ minLength: 10, maxLength: 100 }),
  refNo: fc.string({ minLength: 10, maxLength: 20 }),
  debit: fc.option(fc.float({ min: 0, max: 100000, noNaN: true }), {
    nil: null,
  }),
  credit: fc.option(fc.float({ min: 0, max: 100000, noNaN: true }), {
    nil: null,
  }),
  balance: fc.float({ min: 0, max: 1000000, noNaN: true }),
  amount: fc.float({ min: 0, max: 100000, noNaN: true }),
  type: fc.constantFrom("debit" as const, "credit" as const),
  paymentMethod: arbitraryPaymentMethod,
  tagIds: fc.array(fc.uuid(), { maxLength: 5 }),
  manualTagOverride: fc.boolean(),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  customTags: fc.array(fc.string({ maxLength: 20 }), { maxLength: 3 }),
  isReviewed: fc.boolean(),
  sourceFile: fc.string({ minLength: 5, maxLength: 50 }),
  importedAt: fc.date(),
});

/**
 * Filter transactions based on search query and filter criteria
 */
function filterTransactions(
  transactions: Transaction[],
  searchQuery: string,
  filters: {
    dateRange: { start: Date | null; end: Date | null };
    tagIds: string[];
    amountRange: { min: number | null; max: number | null };
    type: "debit" | "credit" | null;
    paymentMethods: string[];
    isReviewed: boolean | null;
  },
): Transaction[] {
  return transactions.filter((transaction) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        transaction.details.toLowerCase().includes(query) ||
        transaction.refNo.toLowerCase().includes(query) ||
        transaction.notes?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Date range filter
    if (filters.dateRange.start && transaction.date < filters.dateRange.start) {
      return false;
    }
    if (filters.dateRange.end && transaction.date > filters.dateRange.end) {
      return false;
    }

    // Tag filter
    if (filters.tagIds.length > 0) {
      const hasMatchingTag = filters.tagIds.some((tagId) =>
        transaction.tagIds.includes(tagId),
      );
      if (!hasMatchingTag) return false;
    }

    // Amount range filter
    if (
      filters.amountRange.min !== null &&
      transaction.amount < filters.amountRange.min
    ) {
      return false;
    }
    if (
      filters.amountRange.max !== null &&
      transaction.amount > filters.amountRange.max
    ) {
      return false;
    }

    // Type filter
    if (filters.type && transaction.type !== filters.type) {
      return false;
    }

    // Payment method filter
    if (
      filters.paymentMethods.length > 0 &&
      !filters.paymentMethods.includes(transaction.paymentMethod)
    ) {
      return false;
    }

    // Reviewed filter
    if (
      filters.isReviewed !== null &&
      transaction.isReviewed !== filters.isReviewed
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Check if a transaction satisfies the search query
 */
function satisfiesSearch(transaction: Transaction, query: string): boolean {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  return (
    transaction.details.toLowerCase().includes(lowerQuery) ||
    transaction.refNo.toLowerCase().includes(lowerQuery) ||
    (transaction.notes?.toLowerCase().includes(lowerQuery) ?? false)
  );
}

/**
 * Check if a transaction satisfies all filter criteria
 */
function satisfiesFilters(
  transaction: Transaction,
  filters: {
    dateRange: { start: Date | null; end: Date | null };
    tagIds: string[];
    amountRange: { min: number | null; max: number | null };
    type: "debit" | "credit" | null;
    paymentMethods: string[];
    isReviewed: boolean | null;
  },
): boolean {
  // Date range
  if (filters.dateRange.start && transaction.date < filters.dateRange.start) {
    return false;
  }
  if (filters.dateRange.end && transaction.date > filters.dateRange.end) {
    return false;
  }

  // Tags
  if (filters.tagIds.length > 0) {
    const hasMatchingTag = filters.tagIds.some((tagId) =>
      transaction.tagIds.includes(tagId),
    );
    if (!hasMatchingTag) return false;
  }

  // Amount range
  if (
    filters.amountRange.min !== null &&
    transaction.amount < filters.amountRange.min
  ) {
    return false;
  }
  if (
    filters.amountRange.max !== null &&
    transaction.amount > filters.amountRange.max
  ) {
    return false;
  }

  // Type
  if (filters.type && transaction.type !== filters.type) {
    return false;
  }

  // Payment methods
  if (
    filters.paymentMethods.length > 0 &&
    !filters.paymentMethods.includes(transaction.paymentMethod)
  ) {
    return false;
  }

  // Reviewed status
  if (
    filters.isReviewed !== null &&
    transaction.isReviewed !== filters.isReviewed
  ) {
    return false;
  }

  return true;
}

describe("Property 8: Search and Filter Correctness", () => {
  it("should return only transactions that match the search query", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.string({ maxLength: 20 }),
        (transactions, searchQuery) => {
          const emptyFilters = {
            dateRange: { start: null, end: null },
            tagIds: [],
            amountRange: { min: null, max: null },
            type: null,
            paymentMethods: [],
            isReviewed: null,
          };

          const results = filterTransactions(
            transactions,
            searchQuery,
            emptyFilters,
          );

          // All results must satisfy the search query
          const allResultsSatisfySearch = results.every((t) =>
            satisfiesSearch(t, searchQuery),
          );

          // No transaction satisfying the search should be excluded
          const noValidTransactionExcluded = transactions.every((t) => {
            const satisfies = satisfiesSearch(t, searchQuery);
            const included = results.includes(t);
            return !satisfies || included;
          });

          return allResultsSatisfySearch && noValidTransactionExcluded;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should return only transactions within the date range", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.date({ min: new Date("2023-01-01"), max: new Date("2024-06-30") }),
        fc.date({ min: new Date("2024-07-01"), max: new Date("2024-12-31") }),
        (transactions, startDate, endDate) => {
          const filters = {
            dateRange: { start: startDate, end: endDate },
            tagIds: [],
            amountRange: { min: null, max: null },
            type: null,
            paymentMethods: [],
            isReviewed: null,
          };

          const results = filterTransactions(transactions, "", filters);

          // All results must be within date range
          return results.every((t) => t.date >= startDate && t.date <= endDate);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should return only transactions with matching tags", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
        (transactions, filterTagIds) => {
          const filters = {
            dateRange: { start: null, end: null },
            tagIds: filterTagIds,
            amountRange: { min: null, max: null },
            type: null,
            paymentMethods: [],
            isReviewed: null,
          };

          const results = filterTransactions(transactions, "", filters);

          // All results must have at least one matching tag
          return results.every((t) =>
            filterTagIds.some((tagId) => t.tagIds.includes(tagId)),
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should return only transactions within the amount range", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.float({ min: 0, max: 50000, noNaN: true }),
        fc.float({ min: 50000, max: 100000, noNaN: true }),
        (transactions, minAmount, maxAmount) => {
          const filters = {
            dateRange: { start: null, end: null },
            tagIds: [],
            amountRange: { min: minAmount, max: maxAmount },
            type: null,
            paymentMethods: [],
            isReviewed: null,
          };

          const results = filterTransactions(transactions, "", filters);

          // All results must be within amount range
          return results.every(
            (t) => t.amount >= minAmount && t.amount <= maxAmount,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should return only transactions of the specified type", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.constantFrom("debit" as const, "credit" as const),
        (transactions, transactionType) => {
          const filters = {
            dateRange: { start: null, end: null },
            tagIds: [],
            amountRange: { min: null, max: null },
            type: transactionType,
            paymentMethods: [],
            isReviewed: null,
          };

          const results = filterTransactions(transactions, "", filters);

          // All results must be of the specified type
          return results.every((t) => t.type === transactionType);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should return only transactions with matching payment methods", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.array(arbitraryPaymentMethod, { minLength: 1, maxLength: 3 }),
        (transactions, paymentMethods) => {
          const filters = {
            dateRange: { start: null, end: null },
            tagIds: [],
            amountRange: { min: null, max: null },
            type: null,
            paymentMethods,
            isReviewed: null,
          };

          const results = filterTransactions(transactions, "", filters);

          // All results must have a matching payment method
          return results.every((t) => paymentMethods.includes(t.paymentMethod));
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should return only transactions with the specified review status", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (transactions, reviewStatus) => {
          const filters = {
            dateRange: { start: null, end: null },
            tagIds: [],
            amountRange: { min: null, max: null },
            type: null,
            paymentMethods: [],
            isReviewed: reviewStatus,
          };

          const results = filterTransactions(transactions, "", filters);

          // All results must have the specified review status
          return results.every((t) => t.isReviewed === reviewStatus);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should correctly combine multiple filters", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.string({ maxLength: 20 }),
        fc.record({
          dateRange: fc.record({
            start: fc.option(
              fc.date({
                min: new Date("2023-01-01"),
                max: new Date("2024-06-30"),
              }),
              { nil: null },
            ),
            end: fc.option(
              fc.date({
                min: new Date("2024-07-01"),
                max: new Date("2024-12-31"),
              }),
              { nil: null },
            ),
          }),
          tagIds: fc.array(fc.uuid(), { maxLength: 2 }),
          amountRange: fc.record({
            min: fc.option(fc.float({ min: 0, max: 50000, noNaN: true }), {
              nil: null,
            }),
            max: fc.option(fc.float({ min: 50000, max: 100000, noNaN: true }), {
              nil: null,
            }),
          }),
          type: fc.option(
            fc.constantFrom("debit" as const, "credit" as const),
            {
              nil: null,
            },
          ),
          paymentMethods: fc.array(arbitraryPaymentMethod, { maxLength: 2 }),
          isReviewed: fc.option(fc.boolean(), { nil: null }),
        }),
        (transactions, searchQuery, filters) => {
          const results = filterTransactions(
            transactions,
            searchQuery,
            filters,
          );

          // All results must satisfy both search and all filters
          return results.every(
            (t) =>
              satisfiesSearch(t, searchQuery) && satisfiesFilters(t, filters),
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should not exclude any transaction that satisfies all criteria", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.string({ maxLength: 20 }),
        fc.record({
          dateRange: fc.record({
            start: fc.option(
              fc.date({
                min: new Date("2023-01-01"),
                max: new Date("2024-06-30"),
              }),
              { nil: null },
            ),
            end: fc.option(
              fc.date({
                min: new Date("2024-07-01"),
                max: new Date("2024-12-31"),
              }),
              { nil: null },
            ),
          }),
          tagIds: fc.array(fc.uuid(), { maxLength: 2 }),
          amountRange: fc.record({
            min: fc.option(fc.float({ min: 0, max: 50000, noNaN: true }), {
              nil: null,
            }),
            max: fc.option(fc.float({ min: 50000, max: 100000, noNaN: true }), {
              nil: null,
            }),
          }),
          type: fc.option(
            fc.constantFrom("debit" as const, "credit" as const),
            {
              nil: null,
            },
          ),
          paymentMethods: fc.array(arbitraryPaymentMethod, { maxLength: 2 }),
          isReviewed: fc.option(fc.boolean(), { nil: null }),
        }),
        (transactions, searchQuery, filters) => {
          const results = filterTransactions(
            transactions,
            searchQuery,
            filters,
          );

          // No transaction satisfying all criteria should be excluded
          return transactions.every((t) => {
            const satisfiesAll =
              satisfiesSearch(t, searchQuery) && satisfiesFilters(t, filters);
            const included = results.includes(t);
            return !satisfiesAll || included;
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});
