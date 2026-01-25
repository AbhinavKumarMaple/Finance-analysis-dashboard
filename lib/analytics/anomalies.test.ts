/**
 * Property-Based Tests for Threshold Alert Triggering
 *
 * Feature: financial-analytics-dashboard
 * Property 5: Threshold Alert Triggering
 *
 * Validates: Requirements 2.5, 2.6, 5.4, 6.3, 6.4, 13.1, 13.3
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { detectAnomalies } from "./anomalies";
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

/**
 * Generator for transactions with controlled amounts for testing thresholds
 */
function generateMerchantTransactions(
  merchant: string,
  baseAmount: number,
  count: number,
  highAmountMultiplier: number,
): Transaction[] {
  const transactions: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const amount =
      i === count - 1 ? baseAmount * highAmountMultiplier : baseAmount;

    transactions.push({
      id: `tx-${i}`,
      date: new Date(2023, 0, i + 1),
      details: `Payment to ${merchant}`,
      refNo: `REF${i}`,
      debit: amount,
      credit: null,
      balance: 10000,
      amount,
      type: "debit",
      paymentMethod: "UPI",
      tagIds: [],
      manualTagOverride: false,
      notes: null,
      customTags: [],
      isReviewed: false,
      sourceFile: "test.xlsx",
      importedAt: new Date(),
    });
  }

  return transactions;
}

describe("Anomaly Detection - Property 5: Threshold Alert Triggering", () => {
  it("Property 5: High amount alerts trigger at >3x merchant average", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 5000, noNaN: true }),
        fc.integer({ min: 5, max: 10 }), // More transactions for better average
        fc.integer({ min: 4, max: 10 }), // Use integer multiplier instead of float
        (baseAmount, count, multiplier) => {
          const merchant = "TestMerchant";
          const transactions = generateMerchantTransactions(
            merchant,
            baseAmount,
            count,
            multiplier,
          );

          const anomalies = detectAnomalies(transactions);

          // Should detect high amount anomaly for the last transaction
          const highAmountAnomalies = anomalies.filter(
            (a) => a.type === "high_amount",
          );

          // Calculate what the average would be including the high transaction
          const totalAmount =
            baseAmount * (count - 1) + baseAmount * multiplier;
          const avgAmount = totalAmount / count;
          const highAmount = baseAmount * multiplier;

          // If high amount > 3x average, should detect anomaly
          if (highAmount > avgAmount * 3) {
            return highAmountAnomalies.length > 0;
          } else {
            return true; // Below threshold, may or may not detect
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 5: Spending spike alerts trigger at >2x daily average", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 5000, noNaN: true }),
        fc.integer({ min: 7, max: 15 }), // Increase minimum days to avoid edge cases
        (baseAmount, numDays) => {
          // Create transactions with normal spending for most days
          const transactions: Transaction[] = [];

          for (let i = 0; i < numDays; i++) {
            const amount = i === numDays - 1 ? baseAmount * 2.5 : baseAmount;

            transactions.push({
              id: `tx-${i}`,
              date: new Date(2023, 0, i + 1),
              details: `Transaction ${i}`,
              refNo: `REF${i}`,
              debit: amount,
              credit: null,
              balance: 10000,
              amount,
              type: "debit",
              paymentMethod: "UPI",
              tagIds: [],
              manualTagOverride: false,
              notes: null,
              customTags: [],
              isReviewed: false,
              sourceFile: "test.xlsx",
              importedAt: new Date(),
            });
          }

          const anomalies = detectAnomalies(transactions);

          // Should detect spending spike for the last day
          const spendingSpikes = anomalies.filter(
            (a) => a.type === "spending_spike",
          );

          return spendingSpikes.length > 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 5: Duplicate alerts trigger for identical amount+merchant+date", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 5000, noNaN: true }),
        fc.integer({ min: 2, max: 5 }),
        (amount, duplicateCount) => {
          const merchant = "DuplicateMerchant";
          const date = new Date(2023, 0, 15);

          // Create duplicate transactions
          const transactions: Transaction[] = [];
          for (let i = 0; i < duplicateCount; i++) {
            transactions.push({
              id: `tx-${i}`,
              date,
              details: `Payment to ${merchant}`,
              refNo: `REF${i}`,
              debit: amount,
              credit: null,
              balance: 10000,
              amount,
              type: "debit",
              paymentMethod: "UPI",
              tagIds: [],
              manualTagOverride: false,
              notes: null,
              customTags: [],
              isReviewed: false,
              sourceFile: "test.xlsx",
              importedAt: new Date(),
            });
          }

          const anomalies = detectAnomalies(transactions);

          // Should detect duplicates
          const duplicateAnomalies = anomalies.filter(
            (a) => a.type === "duplicate",
          );

          // Should have duplicateCount anomalies (one for each duplicate)
          return duplicateAnomalies.length === duplicateCount;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 5: No alerts for transactions below thresholds", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 1000, noNaN: true }),
        fc.integer({ min: 5, max: 10 }),
        (baseAmount, count) => {
          const merchant = "NormalMerchant";

          // Create transactions with similar amounts (within threshold)
          const transactions: Transaction[] = [];
          for (let i = 0; i < count; i++) {
            // Vary amount by ±10% (well below 3x threshold)
            const variance = (Math.random() - 0.5) * 0.2 * baseAmount;
            const amount = baseAmount + variance;

            transactions.push({
              id: `tx-${i}`,
              date: new Date(2023, 0, i + 1),
              details: `Payment to ${merchant}`,
              refNo: `REF${i}`,
              debit: amount,
              credit: null,
              balance: 10000,
              amount,
              type: "debit",
              paymentMethod: "UPI",
              tagIds: [],
              manualTagOverride: false,
              notes: null,
              customTags: [],
              isReviewed: false,
              sourceFile: "test.xlsx",
              importedAt: new Date(),
            });
          }

          const anomalies = detectAnomalies(transactions);

          // Should not detect high amount anomalies
          const highAmountAnomalies = anomalies.filter(
            (a) => a.type === "high_amount",
          );

          return highAmountAnomalies.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 5: Severity levels are correctly assigned", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 5, maxLength: 50 }),
        (transactions) => {
          const anomalies = detectAnomalies(transactions);

          // All anomalies should have valid severity levels
          const validSeverities = ["low", "medium", "high"];
          return anomalies.every((a) => validSeverities.includes(a.severity));
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 5: Anomaly types are correctly assigned", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 5, maxLength: 50 }),
        (transactions) => {
          const anomalies = detectAnomalies(transactions);

          // All anomalies should have valid types
          const validTypes = [
            "high_amount",
            "duplicate",
            "unusual_merchant",
            "spending_spike",
          ];
          return anomalies.every((a) => validTypes.includes(a.type));
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 5: Each anomaly has a description", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 5, maxLength: 50 }),
        (transactions) => {
          const anomalies = detectAnomalies(transactions);

          // All anomalies should have non-empty descriptions
          return anomalies.every(
            (a) =>
              typeof a.description === "string" && a.description.length > 0,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 5: Anomalies reference valid transactions", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 5, maxLength: 50 }),
        (transactions) => {
          const anomalies = detectAnomalies(transactions);

          // All anomalies should reference transactions from the input
          const transactionIds = new Set(transactions.map((t) => t.id));
          return anomalies.every((a) => transactionIds.has(a.transaction.id));
        },
      ),
      { numRuns: 100 },
    );
  });
});
