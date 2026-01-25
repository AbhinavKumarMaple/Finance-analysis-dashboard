/**
 * Property Test: Sorted List Correctness
 * Feature: financial-analytics-dashboard, Property 9: Sorted List Correctness
 *
 * Validates: Requirements 2.7, 4.3
 *
 * Tests that:
 * 1. Recent transactions are sorted by date descending
 * 2. Recent transactions are limited to 10 items
 * 3. Top merchants are sorted by amount descending
 * 4. Top merchants are limited to 10 items
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { Transaction, MerchantSpend } from "@/types";

/**
 * Get recent transactions (sorted by date descending, limited to 10)
 */
function getRecentTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

/**
 * Get top merchants (sorted by amount descending, limited to 10)
 */
function getTopMerchants(merchants: MerchantSpend[]): MerchantSpend[] {
  return [...merchants]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);
}

/**
 * Check if array is sorted in descending order by a key
 */
function isSortedDescending<T>(arr: T[], getKey: (item: T) => number): boolean {
  for (let i = 0; i < arr.length - 1; i++) {
    if (getKey(arr[i]) < getKey(arr[i + 1])) {
      return false;
    }
  }
  return true;
}

describe("Property 9: Sorted List Correctness", () => {
  describe("Recent Transactions", () => {
    it("should always be sorted by date descending", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              date: fc.date({
                min: new Date("2023-01-01"),
                max: new Date("2024-12-31"),
              }),
              details: fc.string({ minLength: 5, maxLength: 50 }),
              refNo: fc.string({ minLength: 10, maxLength: 20 }),
              debit: fc.option(fc.float({ min: 0, max: 100000, noNaN: true }), {
                nil: null,
              }),
              credit: fc.option(
                fc.float({ min: 0, max: 100000, noNaN: true }),
                { nil: null },
              ),
              balance: fc.float({ min: 0, max: 1000000, noNaN: true }),
              amount: fc.float({ min: 0, max: 100000, noNaN: true }),
              type: fc.constantFrom("debit" as const, "credit" as const),
              paymentMethod: fc.constantFrom(
                "UPI" as const,
                "NEFT" as const,
                "IMPS" as const,
                "ATM" as const,
                "POS" as const,
                "CHEQUE" as const,
                "OTHER" as const,
              ),
              tagIds: fc.array(fc.uuid(), { maxLength: 3 }),
              manualTagOverride: fc.boolean(),
              notes: fc.option(fc.string(), { nil: null }),
              customTags: fc.array(fc.string(), { maxLength: 3 }),
              isReviewed: fc.boolean(),
              sourceFile: fc.string(),
              importedAt: fc.date(),
            }),
            { minLength: 0, maxLength: 50 },
          ),
          (transactions) => {
            const recent = getRecentTransactions(transactions);

            // Property: Must be sorted by date descending
            const sorted = isSortedDescending(recent, (t) =>
              new Date(t.date).getTime(),
            );

            return sorted;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should always be limited to 10 items", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              date: fc.date({
                min: new Date("2023-01-01"),
                max: new Date("2024-12-31"),
              }),
              details: fc.string({ minLength: 5, maxLength: 50 }),
              refNo: fc.string({ minLength: 10, maxLength: 20 }),
              debit: fc.option(fc.float({ min: 0, max: 100000, noNaN: true }), {
                nil: null,
              }),
              credit: fc.option(
                fc.float({ min: 0, max: 100000, noNaN: true }),
                { nil: null },
              ),
              balance: fc.float({ min: 0, max: 1000000, noNaN: true }),
              amount: fc.float({ min: 0, max: 100000, noNaN: true }),
              type: fc.constantFrom("debit" as const, "credit" as const),
              paymentMethod: fc.constantFrom(
                "UPI" as const,
                "NEFT" as const,
                "IMPS" as const,
                "ATM" as const,
                "POS" as const,
                "CHEQUE" as const,
                "OTHER" as const,
              ),
              tagIds: fc.array(fc.uuid(), { maxLength: 3 }),
              manualTagOverride: fc.boolean(),
              notes: fc.option(fc.string(), { nil: null }),
              customTags: fc.array(fc.string(), { maxLength: 3 }),
              isReviewed: fc.boolean(),
              sourceFile: fc.string(),
              importedAt: fc.date(),
            }),
            { minLength: 0, maxLength: 50 },
          ),
          (transactions) => {
            const recent = getRecentTransactions(transactions);

            // Property: Must be limited to 10 items
            return recent.length <= 10;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return all transactions if less than 10", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              date: fc.date({
                min: new Date("2023-01-01"),
                max: new Date("2024-12-31"),
              }),
              details: fc.string({ minLength: 5, maxLength: 50 }),
              refNo: fc.string({ minLength: 10, maxLength: 20 }),
              debit: fc.option(fc.float({ min: 0, max: 100000, noNaN: true }), {
                nil: null,
              }),
              credit: fc.option(
                fc.float({ min: 0, max: 100000, noNaN: true }),
                { nil: null },
              ),
              balance: fc.float({ min: 0, max: 1000000, noNaN: true }),
              amount: fc.float({ min: 0, max: 100000, noNaN: true }),
              type: fc.constantFrom("debit" as const, "credit" as const),
              paymentMethod: fc.constantFrom(
                "UPI" as const,
                "NEFT" as const,
                "IMPS" as const,
                "ATM" as const,
                "POS" as const,
                "CHEQUE" as const,
                "OTHER" as const,
              ),
              tagIds: fc.array(fc.uuid(), { maxLength: 3 }),
              manualTagOverride: fc.boolean(),
              notes: fc.option(fc.string(), { nil: null }),
              customTags: fc.array(fc.string(), { maxLength: 3 }),
              isReviewed: fc.boolean(),
              sourceFile: fc.string(),
              importedAt: fc.date(),
            }),
            { minLength: 0, maxLength: 9 },
          ),
          (transactions) => {
            const recent = getRecentTransactions(transactions);

            // Property: If input has < 10 items, output should have same count
            return recent.length === transactions.length;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Top Merchants", () => {
    it("should always be sorted by total amount descending", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              merchant: fc.string({ minLength: 3, maxLength: 30 }),
              totalAmount: fc.float({ min: 0, max: 1000000, noNaN: true }),
              transactionCount: fc.integer({ min: 1, max: 100 }),
              averageAmount: fc.float({ min: 0, max: 100000, noNaN: true }),
              lastTransaction: fc.date({
                min: new Date("2023-01-01"),
                max: new Date("2024-12-31"),
              }),
            }),
            { minLength: 0, maxLength: 50 },
          ),
          (merchants) => {
            const topMerchants = getTopMerchants(merchants);

            // Property: Must be sorted by totalAmount descending
            const sorted = isSortedDescending(
              topMerchants,
              (m) => m.totalAmount,
            );

            return sorted;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should always be limited to 10 items", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              merchant: fc.string({ minLength: 3, maxLength: 30 }),
              totalAmount: fc.float({ min: 0, max: 1000000, noNaN: true }),
              transactionCount: fc.integer({ min: 1, max: 100 }),
              averageAmount: fc.float({ min: 0, max: 100000, noNaN: true }),
              lastTransaction: fc.date({
                min: new Date("2023-01-01"),
                max: new Date("2024-12-31"),
              }),
            }),
            { minLength: 0, maxLength: 50 },
          ),
          (merchants) => {
            const topMerchants = getTopMerchants(merchants);

            // Property: Must be limited to 10 items
            return topMerchants.length <= 10;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return all merchants if less than 10", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              merchant: fc.string({ minLength: 3, maxLength: 30 }),
              totalAmount: fc.float({ min: 0, max: 1000000, noNaN: true }),
              transactionCount: fc.integer({ min: 1, max: 100 }),
              averageAmount: fc.float({ min: 0, max: 100000, noNaN: true }),
              lastTransaction: fc.date({
                min: new Date("2023-01-01"),
                max: new Date("2024-12-31"),
              }),
            }),
            { minLength: 0, maxLength: 9 },
          ),
          (merchants) => {
            const topMerchants = getTopMerchants(merchants);

            // Property: If input has < 10 items, output should have same count
            return topMerchants.length === merchants.length;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
