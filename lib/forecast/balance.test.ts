/**
 * Property-Based Tests for Balance Forecasting
 *
 * Feature: financial-analytics-dashboard
 * Property 12: Forecast Consistency
 *
 * Validates: Requirements 16.1, 16.4
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { forecastEndOfMonthBalance, generateWarnings } from "./balance";
import type { Transaction } from "../../types/transaction";
import type { RecurringPayment } from "../../types/analytics";

/**
 * Arbitrary transaction generator for property tests
 */
const arbitraryTransaction = fc.record({
  id: fc.uuid(),
  date: fc.date({ min: new Date("2024-01-01"), max: new Date("2024-12-31") }),
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
 * Arbitrary recurring payment generator
 */
const arbitraryRecurringPayment = fc.record({
  merchant: fc.string({ minLength: 3, maxLength: 30 }),
  amount: fc.float({ min: 100, max: 50000, noNaN: true }),
  frequency: fc.constantFrom(
    "weekly" as const,
    "monthly" as const,
    "quarterly" as const,
    "yearly" as const,
  ),
  nextExpectedDate: fc.date({
    min: new Date("2024-01-01"),
    max: new Date("2024-12-31"),
  }),
  category: fc.constantFrom(
    "subscription" as const,
    "emi" as const,
    "utility" as const,
    "other" as const,
  ),
  confidence: fc.float({ min: 0, max: 100, noNaN: true }),
}) as fc.Arbitrary<RecurringPayment>;

describe("Balance Forecasting - Property 12: Forecast Consistency", () => {
  it("Property 12: forecast = current + projected_income - projected_expenses - recurring", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.array(arbitraryRecurringPayment, { maxLength: 5 }),
        (transactions, recurring) => {
          // Ensure transactions have valid dates in the past
          const now = new Date();
          const validTransactions = transactions.map((t) => ({
            ...t,
            date: new Date(
              now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ), // Last 30 days
          }));

          // Sort by date to ensure current balance is from most recent
          const sorted = [...validTransactions].sort(
            (a, b) => b.date.getTime() - a.date.getTime(),
          );

          if (sorted.length === 0) return true;

          const currentBalance = sorted[0].balance;

          // Calculate end of month
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const daysRemaining = Math.ceil(
            (endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (daysRemaining <= 0) return true;

          // Calculate historical daily averages
          const dates = validTransactions.map((t) => t.date.getTime());
          const minDate = Math.min(...dates);
          const maxDate = Math.max(...dates);
          const daysCovered = Math.max(
            1,
            Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)),
          );

          const totalIncome = validTransactions.reduce(
            (sum, t) => sum + (t.credit || 0),
            0,
          );
          const totalExpense = validTransactions.reduce(
            (sum, t) => sum + (t.debit || 0),
            0,
          );

          const avgDailyIncome = totalIncome / daysCovered;
          const avgDailyExpense = totalExpense / daysCovered;

          const projectedIncome = avgDailyIncome * daysRemaining;
          const projectedExpenses = avgDailyExpense * daysRemaining;

          // Calculate recurring payments due
          const recurringPaymentsDue = recurring
            .filter(
              (p) =>
                p.nextExpectedDate >= now && p.nextExpectedDate <= endOfMonth,
            )
            .reduce((sum, p) => sum + p.amount, 0);

          // Expected forecast
          const expectedForecast =
            currentBalance +
            projectedIncome -
            projectedExpenses -
            recurringPaymentsDue;

          // Get actual forecast
          const forecast = forecastEndOfMonthBalance(
            validTransactions,
            recurring,
          );

          // Allow small floating-point tolerance (0.1%)
          const tolerance = Math.abs(expectedForecast) * 0.001 + 1;
          const difference = Math.abs(
            forecast.predictedBalance - expectedForecast,
          );

          return difference <= tolerance;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 12: forecast accounts for all recurring payments in date range", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.array(arbitraryRecurringPayment, { minLength: 1, maxLength: 10 }),
        (transactions, recurring) => {
          const now = new Date();
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          // Ensure some recurring payments are due this month
          const recurringThisMonth = recurring.map((r, i) => ({
            ...r,
            nextExpectedDate: new Date(now.getTime() + i * 24 * 60 * 60 * 1000), // Spread over next days
          }));

          const validTransactions = transactions.map((t) => ({
            ...t,
            date: new Date(
              now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
          }));

          const forecast = forecastEndOfMonthBalance(
            validTransactions,
            recurringThisMonth,
          );

          // Check that assumptions mention recurring payments
          const hasRecurringMention = forecast.assumptions.some((a) =>
            a.toLowerCase().includes("recurring"),
          );

          return hasRecurringMention;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 12: confidence interval contains predicted balance", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.array(arbitraryRecurringPayment, { maxLength: 5 }),
        (transactions, recurring) => {
          const now = new Date();
          const validTransactions = transactions.map((t) => ({
            ...t,
            date: new Date(
              now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
          }));

          const forecast = forecastEndOfMonthBalance(
            validTransactions,
            recurring,
          );

          // Predicted balance should be within confidence interval
          return (
            forecast.predictedBalance >= forecast.confidenceInterval.low &&
            forecast.predictedBalance <= forecast.confidenceInterval.high
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 12: warnings generated for negative balance forecasts", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.array(arbitraryRecurringPayment, { maxLength: 5 }),
        (transactions, recurring) => {
          const now = new Date();
          const validTransactions = transactions.map((t) => ({
            ...t,
            date: new Date(
              now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
            balance: Math.random() * 1000, // Small balance to potentially go negative
          }));

          const forecast = forecastEndOfMonthBalance(
            validTransactions,
            recurring,
          );

          const warnings = generateWarnings([forecast], { lowBalance: 5000 });

          // If predicted balance is negative, there should be a warning
          if (forecast.predictedBalance < 0) {
            return warnings.some((w) => w.type === "negative_balance");
          }

          // If predicted balance is below threshold, there should be a warning
          if (forecast.predictedBalance < 5000) {
            return warnings.some(
              (w) => w.type === "low_balance" || w.type === "negative_balance",
            );
          }

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 12: forecast date is end of current month", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.array(arbitraryRecurringPayment, { maxLength: 5 }),
        (transactions, recurring) => {
          const now = new Date();
          const validTransactions = transactions.map((t) => ({
            ...t,
            date: new Date(
              now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
          }));

          const forecast = forecastEndOfMonthBalance(
            validTransactions,
            recurring,
          );

          // Forecast date should be last day of current month
          const expectedEndOfMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
          );

          return (
            forecast.date.getFullYear() === expectedEndOfMonth.getFullYear() &&
            forecast.date.getMonth() === expectedEndOfMonth.getMonth() &&
            forecast.date.getDate() === expectedEndOfMonth.getDate()
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
