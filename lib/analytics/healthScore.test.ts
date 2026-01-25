/**
 * Property-Based Tests for Financial Health Score
 *
 * Feature: financial-analytics-dashboard
 * Property 11: Health Score Bounds
 *
 * Validates: Requirements 12.1
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { calculateHealthScore } from "./healthScore";
import type { Transaction } from "../../types/transaction";
import type { Budget } from "../../types/budget";

/**
 * Arbitrary transaction generator for property tests
 */
const arbitraryTransaction = fc
  .record({
    id: fc.uuid(),
    date: fc.date({ min: new Date("2023-01-01"), max: new Date("2024-12-31") }),
    details: fc.string({ minLength: 10, maxLength: 100 }),
    refNo: fc.string({ minLength: 10, maxLength: 20 }),
    balance: fc.float({ min: 0, max: 1000000, noNaN: true }),
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
  })
  .chain((base) => {
    // Ensure debit/credit match the type
    const amount = fc.float({ min: 1, max: 100000, noNaN: true });
    return amount.map((amt) => ({
      ...base,
      debit: base.type === "debit" ? amt : null,
      credit: base.type === "credit" ? amt : null,
      amount: amt,
    }));
  }) as fc.Arbitrary<Transaction>;

/**
 * Arbitrary budget generator for property tests
 */
const arbitraryBudget = fc.record({
  id: fc.uuid(),
  tagId: fc.uuid(),
  monthlyLimit: fc.float({ min: 1000, max: 100000, noNaN: true }),
  period: fc
    .date({ min: new Date("2023-01-01"), max: new Date("2024-12-31") })
    .map((d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      return `${year}-${month}`;
    }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<Budget>;

describe("Health Score - Property 11: Health Score Bounds", () => {
  it("Property 11: Health score is always within [0, 100] range", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 0, maxLength: 100 }),
        fc.array(arbitraryBudget, { maxLength: 10 }),
        (transactions, budgets) => {
          const healthScore = calculateHealthScore(transactions, budgets);

          // Main property: score must be within [0, 100]
          return healthScore.score >= 0 && healthScore.score <= 100;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 11: All component scores are within [0, 100] range", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 0, maxLength: 100 }),
        fc.array(arbitraryBudget, { maxLength: 10 }),
        (transactions, budgets) => {
          const healthScore = calculateHealthScore(transactions, budgets);

          // All component scores must be within [0, 100]
          const {
            savingsRate,
            budgetAdherence,
            spendingDiversity,
            emergencyFund,
          } = healthScore.components;

          return (
            savingsRate.score >= 0 &&
            savingsRate.score <= 100 &&
            budgetAdherence.score >= 0 &&
            budgetAdherence.score <= 100 &&
            spendingDiversity.score >= 0 &&
            spendingDiversity.score <= 100 &&
            emergencyFund.score >= 0 &&
            emergencyFund.score <= 100
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 11: Component weights sum to 1.0", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.array(arbitraryBudget, { maxLength: 5 }),
        (transactions, budgets) => {
          const healthScore = calculateHealthScore(transactions, budgets);

          const {
            savingsRate,
            budgetAdherence,
            spendingDiversity,
            emergencyFund,
          } = healthScore.components;

          const totalWeight =
            savingsRate.weight +
            budgetAdherence.weight +
            spendingDiversity.weight +
            emergencyFund.weight;

          // Weights should sum to 1.0 (with floating point tolerance)
          return Math.abs(totalWeight - 1.0) < 0.001;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 11: Score increases when savings rate improves", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }),
        fc.array(arbitraryBudget, { maxLength: 5 }),
        (numTransactions, budgets) => {
          // Create two scenarios with controlled savings rates
          // Low savings: 10% income, 90% expenses
          const lowSavingsTransactions: Transaction[] = [];
          for (let i = 0; i < numTransactions; i++) {
            const isIncome = i % 10 === 0; // 10% income
            lowSavingsTransactions.push({
              id: `low-${i}`,
              date: new Date(2023, 0, (i % 28) + 1),
              details: `Transaction ${i}`,
              refNo: `REF${i}`,
              balance: 10000,
              type: isIncome ? "credit" : "debit",
              paymentMethod: "UPI",
              tagIds: [],
              manualTagOverride: false,
              notes: null,
              customTags: [],
              isReviewed: false,
              sourceFile: "test.xlsx",
              importedAt: new Date(),
              debit: isIncome ? null : 1000,
              credit: isIncome ? 10000 : null,
              amount: isIncome ? 10000 : 1000,
            });
          }

          // High savings: 50% income, 50% expenses
          const highSavingsTransactions: Transaction[] = [];
          for (let i = 0; i < numTransactions; i++) {
            const isIncome = i % 2 === 0; // 50% income
            highSavingsTransactions.push({
              id: `high-${i}`,
              date: new Date(2023, 0, (i % 28) + 1),
              details: `Transaction ${i}`,
              refNo: `REF${i}`,
              balance: 10000,
              type: isIncome ? "credit" : "debit",
              paymentMethod: "UPI",
              tagIds: [],
              manualTagOverride: false,
              notes: null,
              customTags: [],
              isReviewed: false,
              sourceFile: "test.xlsx",
              importedAt: new Date(),
              debit: isIncome ? null : 1000,
              credit: isIncome ? 10000 : null,
              amount: isIncome ? 10000 : 1000,
            });
          }

          const lowScore = calculateHealthScore(
            lowSavingsTransactions,
            budgets,
          );
          const highScore = calculateHealthScore(
            highSavingsTransactions,
            budgets,
          );

          // High savings should result in higher or equal score
          return highScore.score >= lowScore.score;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 11: Empty transactions result in valid score", () => {
    fc.assert(
      fc.property(fc.array(arbitraryBudget, { maxLength: 5 }), (budgets) => {
        const healthScore = calculateHealthScore([], budgets);

        // Should return valid score even with no transactions
        return (
          healthScore.score >= 0 &&
          healthScore.score <= 100 &&
          healthScore.recommendations.length > 0
        );
      }),
      { numRuns: 100 },
    );
  });

  it("Property 11: Score is deterministic for same input", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 5, maxLength: 30 }),
        fc.array(arbitraryBudget, { maxLength: 5 }),
        (transactions, budgets) => {
          const score1 = calculateHealthScore(transactions, budgets);
          const score2 = calculateHealthScore(transactions, budgets);

          // Same input should produce same score
          return score1.score === score2.score;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 11: Recommendations array is always present", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 0, maxLength: 50 }),
        fc.array(arbitraryBudget, { maxLength: 5 }),
        (transactions, budgets) => {
          const healthScore = calculateHealthScore(transactions, budgets);

          // Recommendations should always be an array
          return (
            Array.isArray(healthScore.recommendations) &&
            healthScore.recommendations.length > 0
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 11: Trend is one of valid values", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 0, maxLength: 50 }),
        fc.array(arbitraryBudget, { maxLength: 5 }),
        (transactions, budgets) => {
          const healthScore = calculateHealthScore(transactions, budgets);

          // Trend must be one of the valid values
          const validTrends = ["improving", "stable", "declining"];
          return validTrends.includes(healthScore.trend);
        },
      ),
      { numRuns: 100 },
    );
  });
});
