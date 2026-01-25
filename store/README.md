# Zustand Store Structure

This directory contains all Zustand stores for the Financial Analytics Dashboard application.

## Store Files

### 1. `transactionStore.ts`

Manages transaction state and operations.

**State:**

- `transactions`: Array of all transactions
- `uploadedFiles`: Record of uploaded statement files
- `isLoading`: Loading state
- `error`: Error messages

**Key Actions:**

- `setTransactions()`: Replace all transactions
- `addTransactions()`: Add new transactions
- `updateTransaction()`: Update a single transaction
- `deleteTransaction()`: Remove a transaction
- `getTransactionsByDateRange()`: Filter by date
- `getTransactionsByTag()`: Filter by tag
- `searchTransactions()`: Search by query

### 2. `tagStore.ts`

Manages tag/category state and categorization results.

**State:**

- `tags`: Array of all tags
- `categorizationResults`: Map of transaction categorization results
- `isLoading`: Loading state
- `error`: Error messages

**Key Actions:**

- `setTags()`: Replace all tags
- `addTag()`: Add a new tag
- `updateTag()`: Update a tag
- `deleteTag()`: Remove a tag
- `setCategorizationResult()`: Store categorization result
- `getDefaultTags()`: Get system default tags
- `getCustomTags()`: Get user-created tags

### 3. `budgetStore.ts`

Manages budgets, spending limits, and savings goals.

**State:**

- `budgets`: Array of budgets
- `spendingLimits`: Array of spending limits
- `savingsGoals`: Array of savings goals
- `isLoading`: Loading state
- `error`: Error messages

**Key Actions:**

- Budget CRUD: `setBudgets()`, `addBudget()`, `updateBudget()`, `deleteBudget()`
- Spending Limit CRUD: `setSpendingLimits()`, `addSpendingLimit()`, etc.
- Savings Goal CRUD: `setSavingsGoals()`, `addSavingsGoal()`, etc.
- Queries: `getBudgetsByPeriod()`, `getActiveSpendingLimits()`, etc.

### 4. `preferencesStore.ts`

Manages user preferences and application settings.

**State:**

- `preferences`: User preferences object
  - `theme`: Light or dark mode
  - `currency`: Currency code (e.g., "INR")
  - `dateFormat`: Date format string
  - `widgetLayout`: Dashboard widget configuration
  - `lowBalanceThreshold`: Alert threshold
  - `enableEncryption`: Encryption setting
- `isLoading`: Loading state
- `error`: Error messages

**Key Actions:**

- `setTheme()`: Change theme
- `toggleTheme()`: Toggle between light/dark
- `setCurrency()`: Set currency
- `setWidgetLayout()`: Configure dashboard widgets
- `setLowBalanceThreshold()`: Set alert threshold

**Note:** This store uses the `persist` middleware to automatically save preferences to localStorage.

### 5. `index.ts`

Central export point for all stores.

**Exports:**

- All individual stores
- Type re-exports for convenience
- Utility hooks:
  - `useClearAllStores()`: Clear all store data
  - `useGlobalLoadingState()`: Get combined loading state
  - `useGlobalErrorState()`: Get combined error state

## Usage Examples

### Basic Usage

```typescript
import { useTransactionStore, useTagStore } from "@/store";

function MyComponent() {
  // Get state
  const transactions = useTransactionStore((state) => state.transactions);
  const tags = useTagStore((state) => state.tags);

  // Get actions
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTag = useTagStore((state) => state.updateTag);

  // Use them
  // ...
}
```

### Using Selectors

```typescript
// Only re-render when specific state changes
const transactionCount = useTransactionStore(
  (state) => state.transactions.length,
);

const isLoading = useTransactionStore((state) => state.isLoading);
```

### Using Utility Hooks

```typescript
import { useClearAllStores, useGlobalLoadingState } from "@/store";

function SettingsPage() {
  const clearAll = useClearAllStores();
  const isLoading = useGlobalLoadingState();

  const handleClearData = () => {
    if (confirm("Clear all data?")) {
      clearAll();
    }
  };

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      <button onClick={handleClearData}>Clear All Data</button>
    </div>
  );
}
```

## Store Architecture

All stores follow a consistent pattern:

1. **State**: Core data and metadata (loading, error)
2. **Actions**: Functions to modify state
3. **Queries**: Functions to retrieve computed/filtered data
4. **DevTools**: All stores use Zustand DevTools for debugging

## Best Practices

1. **Use selectors**: Only subscribe to the state you need
2. **Avoid derived state**: Compute values in components or use queries
3. **Keep actions simple**: Complex logic should be in separate utility functions
4. **Use TypeScript**: All stores are fully typed
5. **DevTools**: Use Redux DevTools extension to debug state changes

## Integration with IndexedDB

These stores manage in-memory state. For persistence:

- The `preferencesStore` uses `persist` middleware for localStorage
- Other stores will integrate with IndexedDB through the storage layer (Task 2.x)
- Storage operations will call store actions to update state after persistence

## Requirements Mapping

This implementation satisfies the following requirements:

- **21.3**: Transaction state management
- **21.4**: Tag/category state management
- **21.5**: Budget and goals state management
- **21.6**: User preferences state management
