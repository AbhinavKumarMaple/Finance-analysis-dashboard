# Analytics Engine - Property-Based Tests

## Overview

This document describes the property-based tests implemented for the Analytics Engine (Task 7).

## Completed Tasks

### ✅ 7.1 Implement balance metrics calculations

- **File**: `lib/analytics/balance.ts`
- **Status**: Already implemented
- **Functions**: `calculateBalanceMetrics`, `getCurrentBalance`, `getBalanceAtDate`, etc.

### ✅ 7.2 Write property test for balance metrics

- **File**: `lib/analytics/balance.test.ts`
- **Property**: Property 3 - Balance Metrics Correctness
- **Validates**: Requirements 2.1, 2.2
- **Tests**:
  - Highest balance >= all balances
  - Lowest balance <= all balances
  - Current balance = most recent transaction balance
  - Average balance within [lowest, highest] range
  - Period dates match transaction date range

### ✅ 7.3 Implement income and expense calculations

- **File**: `lib/analytics/cashflow.ts`
- **Status**: Already implemented
- **Functions**: `calculateCashFlow`, `calculateTotalIncome`, `calculateTotalExpenses`, etc.

### ✅ 7.4 Write property test for sum invariants

- **File**: `lib/analytics/spending.test.ts`
- **Property**: Property 2 - Sum Invariants for Financial Calculations
- **Validates**: Requirements 3.1, 4.1, 4.4, 9.1, 9.2, 9.3
- **Tests**:
  - Sum of spending by tag equals total debit amount
  - Sum of spending by payment method equals total debit amount
  - Sum of spending by day of week equals total debit amount
  - Sum of spending by time of month equals total debit amount

### ✅ 7.5 Write property test for income/expense calculation

- **File**: `lib/analytics/cashflow.test.ts`
- **Property**: Property 4 - Income and Expense Calculation
- **Validates**: Requirements 2.3, 3.2
- **Tests**:
  - Total income = sum of all credit amounts
  - Total expenses = sum of all debit amounts
  - Net cash flow = income - expenses
  - Cash flow metrics maintain invariant
  - Income and expenses are non-negative
  - Sum of period cash flows equals total cash flow

### ✅ 7.6 Implement spending breakdown calculations

- **File**: `lib/analytics/spending.ts`
- **Status**: Already implemented
- **Functions**: `calculateSpendingBreakdown`, `calculateSpendingByTag`, `getTopMerchants`, etc.

### ✅ 7.7 Write property test for percentage calculations

- **File**: `lib/analytics/spending.test.ts`
- **Property**: Property 15 - Percentage Calculations
- **Validates**: Requirements 4.5, 6.2, 8.2, 8.4
- **Tests**:
  - Category percentages sum to 100% (within ±0.1% tolerance)
  - Each percentage is mathematically correct: (part/whole) × 100
  - Percentages are always non-negative

## Running the Tests

### Option 1: Run all analytics tests

```bash
npm run test:run lib/analytics/
```

### Option 2: Run individual test files

```bash
# Balance metrics tests
npm run test:run lib/analytics/balance.test.ts

# Cash flow tests
npm run test:run lib/analytics/cashflow.test.ts

# Spending breakdown tests
npm run test:run lib/analytics/spending.test.ts
```

### Option 3: Use the batch script (Windows)

```bash
.\run-analytics-tests.bat
```

### Option 4: Run in watch mode (for development)

```bash
npm test lib/analytics/
```

## Test Configuration

- **Testing Framework**: Vitest
- **Property-Based Testing Library**: fast-check
- **Number of Runs per Property**: 100 iterations
- **Floating Point Tolerance**: ±0.01 for financial calculations
- **Percentage Tolerance**: ±0.1% for percentage sums

## Property Test Generators

All tests use custom arbitrary generators for:

- **Transactions**: Random transactions with valid dates, amounts, types, and payment methods
- **Tags**: Random tags with keywords, colors, and metadata
- **Date Ranges**: Random date ranges within 2023-2024

## Expected Results

All property tests should pass, validating that:

1. Balance calculations are mathematically correct
2. Financial sums are preserved across groupings (no money lost/created)
3. Income/expense calculations follow the fundamental equation
4. Percentages are accurate and sum to 100%

## Troubleshooting

If tests fail:

1. Check the failing example provided by fast-check
2. Review the specific property that failed
3. Verify the implementation logic in the corresponding analytics file
4. Ensure floating-point tolerance is appropriate for the calculation

## Next Steps

After all tests pass:

- Proceed to Task 8: Analytics Engine - Advanced Features
- Implement income analysis, recurring payment detection, lifestyle analysis, etc.
- Add corresponding property-based tests for those features
