/**
 * Property-Based Tests for Spending Breakdown
 *
 * Feature: financial-analytics-dashboard
 * Property 2: Sum Invariants for Financial Calculations
 * Property 15: Percentage Calculations
 *
 * Validates: Requirements 3.1, 4.1, 4.4, 4.5, 6.2, 8.2, 8.4, 9.1, 9.2, 9.3
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateSpendingBreakdown,
  calculateSpendingByTag,
  calculateSpendingByPaymentMethod,
  calculateSpendingByDayOfWeek,
  calculateSpendingByTimeOfMonth,
  calculateSpendingPercentages,
} from "./spending";
import type { Transaction } from "../../types/transaction";
import type { Tag } from "../../types/tag";

/**
 * Arbitrary transaction generator for property tests
 */
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
  paymentMethod: fc.constantFrom(
    "UPI",
    "NEFT",
    "IMPS",
    "ATM",
    "POS",
    "CHEQUE",
    "OTHER",
  ),
  tagIds: fc.array(fc.uuid(), { maxLength: 3 }),
  manualTagOverride: fc.boolean(),
  notes: fc.option(fc.string(), { nil: null }),
  customTags: fc.array(fc.string(), { maxLength: 3 }),
  isReviewed: fc.boolean(),
  sourceFile: fc.string(),
  importedAt: fc.date(),
}) as fc.Arbitrary<Transaction>;

/**
 * Arbitrary tag generator
 */
const arbitraryTag = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  keywords: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
    minLength: 1,
    maxLength: 5,
  }),
  color: fc
    .stringOf(fc.constantFrom(..."0123456789ABCDEF"), {
      minLength: 6,
      maxLength: 6,
    })
    .map((s) => `#${s}`),
  icon: fc.option(fc.string(), { nil: null }),
  isDefault: fc.boolean(),
  parentTagId: fc.option(fc.uuid(), { nil: null }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<Tag>;

describe("Spending Breakdown - Property 2: Sum Invariants", () => {
  it("Property 2: sum of spending by tag equals total debit amount", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        fc.array(arbitraryTag, { minLength: 1, maxLength: 10 }),
        (transactions, tags) => {
          // Ensure transactions have valid tag IDs from the tags array
          const tagIds = tags.map((t) => t.id);
          const validTransactions = transactions.map((t) => ({
            ...t,
            tagIds: t.tagIds.filter((id) => tagIds.includes(id)),
          }));

          const spendingByTag = calculateSpendingByTag(validTransactions, tags);

          // Sum all tag spending
          const tagSum = Array.from(spendingByTag.values()).reduce(
            (sum, amount) => sum + amount,
            0,
          );

          // Calculate total debit amount
          const totalDebits = validTransactions
            .filter((t) => t.type === "debit")
            .reduce((sum, t) => sum + t.amount, 0);

          // Allow for floating point tolerance
          return Math.abs(tagSum - totalDebits) < 0.01;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 2: sum of spending by payment method equals total debit amount", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const spendingByMethod =
            calculateSpendingByPaymentMethod(transactions);

          // Sum all payment method spending
          const methodSum = Array.from(spendingByMethod.values()).reduce(
            (sum, amount) => sum + amount,
            0,
          );

          // Calculate total debit amount
          const totalDebits = transactions
            .filter((t) => t.type === "debit")
            .reduce((sum, t) => sum + t.amount, 0);

          // Allow for floating point tolerance
          return Math.abs(methodSum - totalDebits) < 0.01;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 2: sum of spending by day of week equals total debit amount", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const spendingByDay = calculateSpendingByDayOfWeek(transactions);

          // Sum all day spending
          const daySum = spendingByDay.reduce((sum, amount) => sum + amount, 0);

          // Calculate total debit amount
          const totalDebits = transactions
            .filter((t) => t.type === "debit")
            .reduce((sum, t) => sum + t.amount, 0);

          // Allow for floating point tolerance
          return Math.abs(daySum - totalDebits) < 0.01;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 2: sum of spending by time of month equals total debit amount", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const spendingByTime = calculateSpendingByTimeOfMonth(transactions);

          // Sum early, mid, late
          const timeSum =
            spendingByTime.early + spendingByTime.mid + spendingByTime.late;

          // Calculate total debit amount
          const totalDebits = transactions
            .filter((t) => t.type === "debit")
            .reduce((sum, t) => sum + t.amount, 0);

          // Allow for floating point tolerance
          return Math.abs(timeSum - totalDebits) < 0.01;
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Spending Breakdown - Property 15: Percentage Calculations", () => {
  it("Property 15: category percentages sum to 100% (within tolerance)", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        fc.array(arbitraryTag, { minLength: 1, maxLength: 10 }),
        (transactions, tags) => {
          // Ensure transactions have valid tag IDs
          const tagIds = tags.map((t) => t.id);
          const validTransactions = transactions.map((t) => ({
            ...t,
            tagIds: t.tagIds.filter((id) => tagIds.includes(id)),
          }));

          const spendingByTag = calculateSpendingByTag(validTransactions, tags);
          const percentages = calculateSpendingPercentages(spendingByTag);

          // Sum all percentages
          const percentageSum = Array.from(percentages.values()).reduce(
            (sum, pct) => sum + pct,
            0,
          );

          // Should sum to 100% within tolerance (±0.1%)
          // Or be 0 if no spending
          const totalSpending = Array.from(spendingByTag.values()).reduce(
            (sum, amount) => sum + amount,
            0,
          );

          if (totalSpending === 0) {
            return percentageSum === 0;
          }

          return Math.abs(percentageSum - 100) < 0.1;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 15: each percentage is mathematically correct (part/whole * 100)", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        fc.array(arbitraryTag, { minLength: 1, maxLength: 10 }),
        (transactions, tags) => {
          // Ensure transactions have valid tag IDs
          const tagIds = tags.map((t) => t.id);
          const validTransactions = transactions.map((t) => ({
            ...t,
            tagIds: t.tagIds.filter((id) => tagIds.includes(id)),
          }));

          const spendingByTag = calculateSpendingByTag(validTransactions, tags);
          const percentages = calculateSpendingPercentages(spendingByTag);

          const totalSpending = Array.from(spendingByTag.values()).reduce(
            (sum, amount) => sum + amount,
            0,
          );

          if (totalSpending === 0) {
            return true; // Skip if no spending
          }

          // Check each percentage is correct
          for (const [tagId, amount] of spendingByTag.entries()) {
            const expectedPercentage = (amount / totalSpending) * 100;
            const actualPercentage = percentages.get(tagId) || 0;

            if (Math.abs(actualPercentage - expectedPercentage) >= 0.01) {
              return false;
            }
          }

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 15: percentages are always non-negative", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        fc.array(arbitraryTag, { minLength: 1, maxLength: 10 }),
        (transactions, tags) => {
          const tagIds = tags.map((t) => t.id);
          const validTransactions = transactions.map((t) => ({
            ...t,
            tagIds: t.tagIds.filter((id) => tagIds.includes(id)),
          }));

          const spendingByTag = calculateSpendingByTag(validTransactions, tags);
          const percentages = calculateSpendingPercentages(spendingByTag);

          // All percentages should be >= 0
          return Array.from(percentages.values()).every((pct) => pct >= 0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
