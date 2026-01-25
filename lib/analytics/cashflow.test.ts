/**
 * Property-Based Tests for Cash Flow Calculations
 *
 * Feature: financial-analytics-dashboard
 * Property 4: Income and Expense Calculation
 *
 * Validates: Requirements 2.3, 3.2
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateNetCashFlow,
  calculateCashFlow,
} from "./cashflow";
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

describe("Cash Flow - Property 4: Income and Expense Calculation", () => {
  it("Property 4: total income equals sum of all credit amounts", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const totalIncome = calculateTotalIncome(transactions);

          // Calculate expected income (sum of credits)
          const expectedIncome = transactions
            .filter((t) => t.type === "credit")
            .reduce((sum, t) => sum + t.amount, 0);

          // Allow for floating point tolerance
          return Math.abs(totalIncome - expectedIncome) < 0.01;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4: total expenses equals sum of all debit amounts", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const totalExpenses = calculateTotalExpenses(transactions);

          // Calculate expected expenses (sum of debits)
          const expectedExpenses = transactions
            .filter((t) => t.type === "debit")
            .reduce((sum, t) => sum + t.amount, 0);

          // Allow for floating point tolerance
          return Math.abs(totalExpenses - expectedExpenses) < 0.01;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4: net cash flow equals income minus expenses", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const income = calculateTotalIncome(transactions);
          const expenses = calculateTotalExpenses(transactions);
          const netCashFlow = calculateNetCashFlow(transactions);

          const expectedNet = income - expenses;

          // Allow for floating point tolerance
          return Math.abs(netCashFlow - expectedNet) < 0.01;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4: cash flow metrics maintain income - expenses = net invariant", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          if (transactions.length === 0) return true;

          const metrics = calculateCashFlow(transactions, "monthly");

          // Check each period maintains the invariant
          for (const metric of metrics) {
            const expectedNet = metric.totalInflow - metric.totalOutflow;

            if (Math.abs(metric.netCashFlow - expectedNet) >= 0.01) {
              return false;
            }
          }

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4: income is always non-negative", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const income = calculateTotalIncome(transactions);
          return income >= 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4: expenses are always non-negative", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const expenses = calculateTotalExpenses(transactions);
          return expenses >= 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4: net cash flow can be positive, negative, or zero", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          const netCashFlow = calculateNetCashFlow(transactions);
          // Net can be any value, just checking it's a valid number
          return typeof netCashFlow === "number" && !isNaN(netCashFlow);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4: sum of period cash flows equals total cash flow", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 100 }),
        (transactions) => {
          if (transactions.length === 0) return true;

          const totalIncome = calculateTotalIncome(transactions);
          const totalExpenses = calculateTotalExpenses(transactions);

          const metrics = calculateCashFlow(transactions, "daily");

          const sumInflow = metrics.reduce((sum, m) => sum + m.totalInflow, 0);
          const sumOutflow = metrics.reduce(
            (sum, m) => sum + m.totalOutflow,
            0,
          );

          // Sum of period inflows should equal total income
          // Sum of period outflows should equal total expenses
          return (
            Math.abs(sumInflow - totalIncome) < 0.01 &&
            Math.abs(sumOutflow - totalExpenses) < 0.01
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
