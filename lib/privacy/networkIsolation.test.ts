/**
 * Property-Based Tests for Network Isolation
 *
 * Feature: financial-analytics-dashboard
 * Property 13: Network Isolation
 *
 * Validates: Requirements 1.8, 20.1, 20.2
 *
 * Tests that no network requests containing user data are made during
 * data processing operations. All processing must occur entirely within
 * the browser.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import type { Transaction } from "../../types/transaction";
import type { Tag } from "../../types/tag";

// Import functions that process user data
import { calculateBalanceMetrics } from "../analytics/balance";
import { calculateCashFlow } from "../analytics/cashflow";
import { calculateSpendingBreakdown } from "../analytics/spending";
import { analyzeIncome } from "../analytics/income";
import { detectRecurringPayments } from "../analytics/recurring";
import { calculateHealthScore } from "../analytics/healthScore";
import { detectAnomalies } from "../analytics/anomalies";
import { forecastEndOfMonthBalance } from "../forecast/balance";

/**
 * Network request tracker
 */
class NetworkRequestTracker {
  private requests: Array<{ url: string; method: string; data?: any }> = [];
  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;

  constructor() {
    this.originalFetch = global.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  start() {
    this.requests = [];

    // Mock fetch
    global.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      this.requests.push({
        url: url.toString(),
        method: init?.method || "GET",
        data: init?.body,
      });
      throw new Error(
        "Network requests are not allowed during data processing",
      );
    });

    // Mock XMLHttpRequest
    const tracker = this;
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
    ) {
      tracker.requests.push({
        url: url.toString(),
        method,
      });
      throw new Error(
        "Network requests are not allowed during data processing",
      );
    };

    XMLHttpRequest.prototype.send = function (
      body?: Document | XMLHttpRequestBodyInit | null,
    ) {
      throw new Error(
        "Network requests are not allowed during data processing",
      );
    };
  }

  stop() {
    global.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
  }

  getRequests() {
    return this.requests;
  }

  hasRequests() {
    return this.requests.length > 0;
  }
}

/**
 * Arbitrary transaction generator
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
  name: fc.string({ minLength: 3, maxLength: 20 }),
  keywords: fc.array(fc.string({ minLength: 3, maxLength: 15 }), {
    minLength: 1,
    maxLength: 5,
  }),
  color: fc
    .integer({ min: 0, max: 0xffffff })
    .map((n) => `#${n.toString(16).padStart(6, "0")}`),
  icon: fc.option(fc.string(), { nil: null }),
  isDefault: fc.boolean(),
  parentTagId: fc.option(fc.uuid(), { nil: null }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<Tag>;

describe("Network Isolation - Property 13: Network Isolation", () => {
  let tracker: NetworkRequestTracker;

  beforeEach(() => {
    tracker = new NetworkRequestTracker();
  });

  afterEach(() => {
    tracker.stop();
  });

  it("Property 13: No network requests during balance metrics calculation", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        (transactions) => {
          tracker.start();
          try {
            calculateBalanceMetrics(transactions);
            tracker.stop();
            return !tracker.hasRequests();
          } catch (error) {
            tracker.stop();
            // If error is about network requests, test fails
            if (
              error instanceof Error &&
              error.message.includes("Network requests are not allowed")
            ) {
              return false;
            }
            // Other errors are acceptable (e.g., validation errors)
            return true;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 13: No network requests during cash flow calculation", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        (transactions) => {
          tracker.start();
          try {
            calculateCashFlow(transactions, "daily");
            tracker.stop();
            return !tracker.hasRequests();
          } catch (error) {
            tracker.stop();
            if (
              error instanceof Error &&
              error.message.includes("Network requests are not allowed")
            ) {
              return false;
            }
            return true;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 13: No network requests during spending breakdown calculation", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        fc.array(arbitraryTag, { minLength: 1, maxLength: 10 }),
        (transactions, tags) => {
          tracker.start();
          try {
            calculateSpendingBreakdown(transactions, tags);
            tracker.stop();
            return !tracker.hasRequests();
          } catch (error) {
            tracker.stop();
            if (
              error instanceof Error &&
              error.message.includes("Network requests are not allowed")
            ) {
              return false;
            }
            return true;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 13: No network requests during income analysis", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        (transactions) => {
          tracker.start();
          try {
            analyzeIncome(transactions);
            tracker.stop();
            return !tracker.hasRequests();
          } catch (error) {
            tracker.stop();
            if (
              error instanceof Error &&
              error.message.includes("Network requests are not allowed")
            ) {
              return false;
            }
            return true;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 13: No network requests during recurring payment detection", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        (transactions) => {
          tracker.start();
          try {
            detectRecurringPayments(transactions);
            tracker.stop();
            return !tracker.hasRequests();
          } catch (error) {
            tracker.stop();
            if (
              error instanceof Error &&
              error.message.includes("Network requests are not allowed")
            ) {
              return false;
            }
            return true;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 13: No network requests during health score calculation", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        (transactions) => {
          tracker.start();
          try {
            calculateHealthScore(transactions, []);
            tracker.stop();
            return !tracker.hasRequests();
          } catch (error) {
            tracker.stop();
            if (
              error instanceof Error &&
              error.message.includes("Network requests are not allowed")
            ) {
              return false;
            }
            return true;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 13: No network requests during anomaly detection", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        (transactions) => {
          tracker.start();
          try {
            detectAnomalies(transactions);
            tracker.stop();
            return !tracker.hasRequests();
          } catch (error) {
            tracker.stop();
            if (
              error instanceof Error &&
              error.message.includes("Network requests are not allowed")
            ) {
              return false;
            }
            return true;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 13: No network requests during balance forecasting", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction, { minLength: 1, maxLength: 50 }),
        (transactions) => {
          tracker.start();
          try {
            forecastEndOfMonthBalance(transactions, []);
            tracker.stop();
            return !tracker.hasRequests();
          } catch (error) {
            tracker.stop();
            if (
              error instanceof Error &&
              error.message.includes("Network requests are not allowed")
            ) {
              return false;
            }
            return true;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Simple non-property test to verify the tracker works
  it("Property 13: Tracker correctly detects network requests", () => {
    tracker.start();

    // This should be caught by the tracker
    let caughtError = false;
    try {
      fetch("https://example.com/api");
    } catch (error) {
      caughtError = true;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(
        "Network requests are not allowed",
      );
    }

    tracker.stop();
    expect(caughtError).toBe(true);
    expect(tracker.hasRequests()).toBe(true);
  });
});
