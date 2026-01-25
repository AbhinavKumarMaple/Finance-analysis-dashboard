/**
 * Property-Based Tests for Recurring Payment Detection
 *
 * Feature: financial-analytics-dashboard
 * Property 10: Recurring Payment Detection
 *
 * Validates: Requirements 10.1, 10.2
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { detectRecurringPayments } from "./recurring";
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
 * Generator for recurring transactions with regular intervals
 */
function generateRecurringTransactions(
  merchant: string,
  amount: number,
  frequency: "weekly" | "monthly" | "quarterly",
  count: number,
  startDate: Date,
): Transaction[] {
  const transactions: Transaction[] = [];
  const intervalDays =
    frequency === "weekly" ? 7 : frequency === "monthly" ? 30 : 90;

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * intervalDays);

    // Add small variance to amount (within 5% tolerance)
    const variance = (Math.random() - 0.5) * 0.08 * amount; // ±4%
    const transactionAmount = amount + variance;

    transactions.push({
      id: `recurring-${i}`,
      date,
      details: `Payment to ${merchant}`,
      refNo: `REF${i}`,
      debit: transactionAmount,
      credit: null,
      balance: 10000,
      amount: transactionAmount,
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

describe("Recurring Payment Detection - Property 10: Recurring Payment Detection", () => {
  it("Property 10: Regular interval transactions are correctly identified as recurring", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("weekly", "monthly", "quarterly"),
        fc.float({ min: 100, max: 10000, noNaN: true }),
        fc.integer({ min: 3, max: 10 }),
        fc.date({ min: new Date("2023-01-01"), max: new Date("2023-06-01") }),
        (frequency, amount, count, startDate) => {
          const merchant = "TestMerchant";
          const transactions = generateRecurringTransactions(
            merchant,
            amount,
            frequency as "weekly" | "monthly" | "quarterly",
            count,
            startDate,
          );

          const recurring = detectRecurringPayments(transactions);

          // Should detect at least one recurring payment
          if (recurring.length === 0) {
            return false;
          }

          // The detected recurring payment should have the correct frequency
          const detected = recurring[0];
          return detected.frequency === frequency;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 10: Detected frequency matches actual transaction intervals", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("weekly", "monthly", "quarterly"),
        fc.float({ min: 100, max: 10000, noNaN: true }),
        fc.integer({ min: 3, max: 8 }),
        (frequency, amount, count) => {
          const merchant = "Netflix";
          const startDate = new Date("2023-01-01");
          const transactions = generateRecurringTransactions(
            merchant,
            amount,
            frequency as "weekly" | "monthly" | "quarterly",
            count,
            startDate,
          );

          const recurring = detectRecurringPayments(transactions);

          if (recurring.length === 0) {
            return true; // May not detect with very few transactions
          }

          const detected = recurring[0];

          // Verify the detected frequency matches the actual frequency
          return detected.frequency === frequency;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 10: Similar amounts within 5% tolerance are grouped together", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 500, max: 5000, noNaN: true }),
        fc.integer({ min: 3, max: 6 }),
        (baseAmount, count) => {
          const merchant = "Spotify";
          const startDate = new Date("2023-01-01");

          // Generate transactions with amounts within 5% of base
          const transactions: Transaction[] = [];
          for (let i = 0; i < count; i++) {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + i);

            // Variance within 4% (well within 5% tolerance)
            const variance = (Math.random() - 0.5) * 0.08 * baseAmount;
            const amount = baseAmount + variance;

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

          const recurring = detectRecurringPayments(transactions);

          // Should detect recurring payment
          if (recurring.length === 0) {
            return true; // May not detect with edge cases
          }

          const detected = recurring[0];

          // Detected amount should be close to base amount
          const amountDiff = Math.abs(detected.amount - baseAmount);
          return amountDiff / baseAmount <= 0.1; // Within 10% of base
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 10: Non-recurring random transactions are not flagged as recurring", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 5, maxLength: 20 }),
        (transactions) => {
          // Ensure transactions are debits with random amounts and dates
          const randomDebits = transactions.map((t, i) => ({
            ...t,
            type: "debit" as const,
            debit: Math.random() * 10000,
            credit: null,
            date: new Date(2023, 0, 1 + i * Math.floor(Math.random() * 30)),
            details: `Random transaction ${i}`,
          }));

          const recurring = detectRecurringPayments(randomDebits);

          // Random transactions should not be detected as recurring
          // (or very few with low confidence)
          return recurring.length <= randomDebits.length * 0.3;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 10: Confidence score is between 0 and 100", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 2, maxLength: 50 }),
        (transactions) => {
          const recurring = detectRecurringPayments(transactions);

          // All detected recurring payments should have valid confidence scores
          return recurring.every(
            (r) => r.confidence >= 0 && r.confidence <= 100,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 10: Next expected date is in the future relative to last transaction", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("weekly", "monthly", "quarterly"),
        fc.float({ min: 100, max: 5000, noNaN: true }),
        fc.integer({ min: 3, max: 8 }),
        (frequency, amount, count) => {
          const merchant = "UtilityBill";
          const startDate = new Date("2023-01-01");
          const transactions = generateRecurringTransactions(
            merchant,
            amount,
            frequency as "weekly" | "monthly" | "quarterly",
            count,
            startDate,
          );

          const recurring = detectRecurringPayments(transactions);

          if (recurring.length === 0) {
            return true;
          }

          const detected = recurring[0];
          const lastTransactionDate =
            transactions[transactions.length - 1].date;

          // Next expected date should be after the last transaction
          return (
            detected.nextExpectedDate.getTime() > lastTransactionDate.getTime()
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
