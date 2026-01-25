/**
 * Property-Based Tests for Duplicate Transaction Detection
 *
 * Feature: financial-analytics-dashboard
 * Property 14: Duplicate Transaction Detection
 *
 * Validates: Requirements 13.2
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { detectDuplicates } from "./anomalies";
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
 * Creates duplicate transactions with identical amount, merchant, and date
 */
function createDuplicateTransactions(
  amount: number,
  merchant: string,
  date: Date,
  count: number,
): Transaction[] {
  const transactions: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    transactions.push({
      id: `duplicate-${i}`,
      date,
      details: `Payment to ${merchant}`,
      refNo: `REF${i}`, // Different ref numbers
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

describe("Duplicate Detection - Property 14: Duplicate Transaction Detection", () => {
  it("Property 14: Identical amount+merchant+date transactions are flagged as duplicates", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 10000, noNaN: true }),
        fc.integer({ min: 2, max: 5 }),
        fc.date({ min: new Date("2023-01-01"), max: new Date("2024-12-31") }),
        (amount, duplicateCount, date) => {
          const merchant = "TestMerchant";
          const duplicates = createDuplicateTransactions(
            amount,
            merchant,
            date,
            duplicateCount,
          );

          const duplicateGroups = detectDuplicates(duplicates);

          // Should detect exactly one group with all duplicates
          return (
            duplicateGroups.length === 1 &&
            duplicateGroups[0].length === duplicateCount
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 14: Different amounts are not flagged as duplicates", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 100, max: 10000 }), {
          // Use integers to avoid floating point issues
          minLength: 3,
          maxLength: 10,
        }),
        fc.date({ min: new Date("2023-01-01"), max: new Date("2024-12-31") }),
        (amounts, date) => {
          const merchant = "TestMerchant";

          // Create transactions with different amounts (ensure uniqueness)
          const uniqueAmounts = Array.from(new Set(amounts));
          const transactions: Transaction[] = uniqueAmounts.map(
            (amount, i) => ({
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
            }),
          );

          const duplicateGroups = detectDuplicates(transactions);

          // Should not detect duplicates since all amounts are different
          return duplicateGroups.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 14: Different dates are not flagged as duplicates", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 10000, noNaN: true }),
        fc.array(
          fc.integer({ min: 1, max: 365 }), // Use day numbers instead of dates
          { minLength: 3, maxLength: 10 },
        ),
        (amount, dayNumbers) => {
          const merchant = "TestMerchant";

          // Create transactions with same amount but different dates (different days)
          const uniqueDays = Array.from(new Set(dayNumbers));
          const transactions: Transaction[] = uniqueDays.map((dayNum, i) => ({
            id: `tx-${i}`,
            date: new Date(2023, 0, dayNum), // Different days
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
          }));

          const duplicateGroups = detectDuplicates(transactions);

          // Should not detect duplicates since all dates are different days
          return duplicateGroups.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 14: Different merchants are not flagged as duplicates", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 10000, noNaN: true }),
        fc.date({ min: new Date("2023-01-01"), max: new Date("2024-12-31") }),
        fc.integer({ min: 3, max: 10 }),
        (amount, date, count) => {
          // Create transactions with same amount and date but different merchants
          // Use completely distinct merchant names to avoid extraction collisions
          const merchantNames = [
            "AmazonIndia",
            "FlipkartSeller",
            "SwiggyDelivery",
            "ZomatoFood",
            "PaytmMall",
            "BigBasketGrocery",
            "MyntraFashion",
            "BookMyShowTickets",
            "UberRides",
            "OlaTransport",
          ];

          const transactions: Transaction[] = [];
          for (let i = 0; i < count; i++) {
            transactions.push({
              id: `tx-${i}`,
              date,
              details: `UPI/${merchantNames[i]}@paytm/Payment/${merchantNames[i]}`, // UPI format with unique merchants
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

          const duplicateGroups = detectDuplicates(transactions);

          // Should not detect duplicates since all merchants are different
          return duplicateGroups.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 14: Multiple duplicate groups are detected independently", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 5000, noNaN: true }),
        fc.float({ min: 5001, max: 10000, noNaN: true }),
        fc.integer({ min: 2, max: 4 }),
        fc.integer({ min: 2, max: 4 }),
        (amount1, amount2, count1, count2) => {
          const merchant1 = "Merchant1";
          const merchant2 = "Merchant2";
          const date = new Date(2023, 0, 15);

          // Create two separate groups of duplicates
          const group1 = createDuplicateTransactions(
            amount1,
            merchant1,
            date,
            count1,
          );
          const group2 = createDuplicateTransactions(
            amount2,
            merchant2,
            date,
            count2,
          );

          const allTransactions = [...group1, ...group2];
          const duplicateGroups = detectDuplicates(allTransactions);

          // Should detect exactly two groups
          return duplicateGroups.length === 2;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 14: Single transactions are not flagged as duplicates", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 5, maxLength: 20 }),
        (transactions) => {
          // Ensure all transactions are unique by modifying amounts
          const uniqueTransactions = transactions.map((t, i) => ({
            ...t,
            type: "debit" as const,
            debit: 1000 + i, // Unique amounts
            credit: null,
            details: `Unique transaction ${i}`,
          }));

          const duplicateGroups = detectDuplicates(uniqueTransactions);

          // Should not detect any duplicates
          return duplicateGroups.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 14: Credit transactions are not checked for duplicates", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 10000, noNaN: true }),
        fc.integer({ min: 2, max: 5 }),
        fc.date({ min: new Date("2023-01-01"), max: new Date("2024-12-31") }),
        (amount, count, date) => {
          const merchant = "TestMerchant";

          // Create duplicate credit transactions
          const transactions: Transaction[] = [];
          for (let i = 0; i < count; i++) {
            transactions.push({
              id: `credit-${i}`,
              date,
              details: `Payment from ${merchant}`,
              refNo: `REF${i}`,
              debit: null,
              credit: amount,
              balance: 10000,
              amount,
              type: "credit",
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

          const duplicateGroups = detectDuplicates(transactions);

          // Should not detect duplicates for credit transactions
          return duplicateGroups.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 14: All transactions in a duplicate group have identical key properties", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 10000, noNaN: true }),
        fc.integer({ min: 2, max: 5 }),
        fc.date({ min: new Date("2023-01-01"), max: new Date("2024-12-31") }),
        (amount, count, date) => {
          // Skip invalid dates
          if (isNaN(date.getTime())) {
            return true;
          }

          const merchant = "TestMerchant";
          const duplicates = createDuplicateTransactions(
            amount,
            merchant,
            date,
            count,
          );

          const duplicateGroups = detectDuplicates(duplicates);

          if (duplicateGroups.length === 0) {
            return true;
          }

          // Check that all transactions in each group have identical key properties
          for (const group of duplicateGroups) {
            const firstTx = group[0];
            const firstAmount = firstTx.debit || 0;

            // Skip if date is invalid
            if (isNaN(firstTx.date.getTime())) {
              continue;
            }

            const firstDate = firstTx.date.toISOString();

            const allIdentical = group.every((tx) => {
              const txAmount = tx.debit || 0;

              // Skip if date is invalid
              if (isNaN(tx.date.getTime())) {
                return true;
              }

              const txDate = tx.date.toISOString();
              return (
                Math.abs(txAmount - firstAmount) < 0.01 && txDate === firstDate
              );
            });

            if (!allIdentical) {
              return false;
            }
          }

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
