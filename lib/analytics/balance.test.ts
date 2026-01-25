/**
 * Property-Based Tests for Balance Metrics
 *
 * Feature: financial-analytics-dashboard
 * Property 3: Balance Metrics Correctness
 *
 * Validates: Requirements 2.1, 2.2
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { calculateBalanceMetrics } from "./balance";
import type { Transaction } from "../../types/transaction";

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

describe("Balance Metrics - Property 3: Balance Metrics Correctness", () => {
  it("Property 3: highest balance >= all balances, lowest <= all balances, current = most recent", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const metrics = calculateBalanceMetrics(transactions);

          // Get all balances
          const balances = transactions.map((t) => t.balance);

          // Property 1: highest >= all balances
          const allLessThanOrEqualHighest = balances.every(
            (b) => b <= metrics.highest,
          );

          // Property 2: lowest <= all balances
          const allGreaterThanOrEqualLowest = balances.every(
            (b) => b >= metrics.lowest,
          );

          // Property 3: current = most recent transaction's balance
          const sortedByDate = [...transactions].sort(
            (a, b) => a.date.getTime() - b.date.getTime(),
          );
          const mostRecentBalance =
            sortedByDate[sortedByDate.length - 1].balance;
          const currentIsCorrect =
            Math.abs(metrics.current - mostRecentBalance) < 0.01;

          return (
            allLessThanOrEqualHighest &&
            allGreaterThanOrEqualLowest &&
            currentIsCorrect
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 3: average balance is within [lowest, highest] range", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const metrics = calculateBalanceMetrics(transactions);

          // Average should be between lowest and highest
          return (
            metrics.average >= metrics.lowest &&
            metrics.average <= metrics.highest
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 3: highest >= lowest always holds", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const metrics = calculateBalanceMetrics(transactions);
          return metrics.highest >= metrics.lowest;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 3: period dates match transaction date range", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const metrics = calculateBalanceMetrics(transactions);

          const sortedByDate = [...transactions].sort(
            (a, b) => a.date.getTime() - b.date.getTime(),
          );

          const expectedStart = sortedByDate[0].date;
          const expectedEnd = sortedByDate[sortedByDate.length - 1].date;

          return (
            metrics.periodStart.getTime() === expectedStart.getTime() &&
            metrics.periodEnd.getTime() === expectedEnd.getTime()
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
