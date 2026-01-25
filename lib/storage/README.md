# Storage Layer

This directory contains the IndexedDB storage implementation for the Financial Analytics Dashboard.

## Overview

The storage layer provides persistent local storage for all application data using IndexedDB. All data is stored entirely in the user's browser with no server communication, ensuring complete privacy.

## Database Schema

### Database: `FinancialAnalyticsDashboard` (Version 1)

The database contains 7 object stores:

#### 1. **transactions**

Stores all financial transactions from uploaded bank statements.

- **Key Path**: `id` (string)
- **Indexes**:
  - `date`: Transaction date (for date range queries)
  - `refNo`: Bank reference number (for duplicate detection)
  - `sourceFile`: Original file name (for file-based queries)
  - `tagIds-multi`: Tag IDs (multi-entry index for category queries)

#### 2. **tags**

Stores category tags for transaction categorization.

- **Key Path**: `id` (string)
- **Indexes**:
  - `name`: Tag name (for searching)
  - `isDefault`: Whether tag is a default template (for filtering)

#### 3. **budgets**

Stores monthly budgets for categories.

- **Key Path**: `id` (string)
- **Indexes**:
  - `tagId`: Associated tag ID (for category budgets)
  - `period`: Budget period in YYYY-MM format (for time-based queries)

#### 4. **limits**

Stores spending limits (daily, monthly, category, merchant).

- **Key Path**: `id` (string)
- **Indexes**:
  - `type`: Limit type (daily/monthly/category/merchant)
  - `isActive`: Whether limit is currently active

#### 5. **goals**

Stores savings goals.

- **Key Path**: `id` (string)
- **Indexes**:
  - `deadline`: Goal deadline date (for sorting by urgency)

#### 6. **preferences**

Stores user preferences (theme, currency, layout, etc.).

- **Key Path**: `id` (string)
- **No indexes** (single record store)

#### 7. **files**

Stores metadata about uploaded files to prevent duplicates.

- **Key Path**: `fileName` (string)
- **Indexes**:
  - `uploadedAt`: Upload timestamp (for chronological queries)
  - `checksum`: File checksum (for duplicate detection)

## API Reference

### Initialization

```typescript
import { initializeDB, getDB, closeDB } from "@/lib/storage/db";

// Initialize database (creates schema if needed)
const db = await initializeDB();

// Get existing database instance (initializes if needed)
const db = await getDB();

// Close database connection
closeDB();
```

### Database Operations

```typescript
import {
  deleteDatabase,
  getDatabaseStats,
  isIndexedDBAvailable,
} from "@/lib/storage/db";

// Check if IndexedDB is supported
if (isIndexedDBAvailable()) {
  // IndexedDB is available
}

// Get database statistics
const stats = await getDatabaseStats();
console.log(stats.name, stats.version, stats.stores);

// Delete entire database (WARNING: permanent data loss)
await deleteDatabase();
```

### Storage Statistics and Cleanup

```typescript
import {
  getStorageStats,
  clearAllData,
  clearSelectiveData,
  isStorageQuotaNearLimit,
  getStorageUsagePercent,
  getStorageQuotaStatus,
  formatBytes,
} from "@/lib/storage/stats";

// Get comprehensive storage statistics
const stats = await getStorageStats();
console.log(`Total size: ${formatBytes(stats.totalSize)}`);
console.log(`Transactions: ${stats.transactionCount}`);
console.log(`Tags: ${stats.tagCount}`);
console.log(`Quota used: ${formatBytes(stats.quotaUsed)}`);
console.log(`Quota available: ${formatBytes(stats.quotaAvailable)}`);

// Check storage quota status
const quotaStatus = await getStorageQuotaStatus();
if (quotaStatus.isExceeded) {
  alert(quotaStatus.message); // "Storage is full. Please remove old data..."
}

// Check if storage is near limit (default: 80%)
const isNearLimit = await isStorageQuotaNearLimit();
if (isNearLimit) {
  console.warn("Storage is running low");
}

// Get storage usage percentage
const usagePercent = await getStorageUsagePercent();
console.log(`Storage usage: ${usagePercent?.toFixed(1)}%`);

// Clear all data (WARNING: permanent data loss)
await clearAllData();

// Clear selective data types
await clearSelectiveData(["transactions", "files"]); // Keep tags, budgets, preferences
await clearSelectiveData(["budgets", "limits", "goals"]); // Clear only budget-related data
```

### Data Operations

```typescript
import { getDB, STORES } from "@/lib/storage/db";

const db = await getDB();

// Store a transaction
await db.put(STORES.TRANSACTIONS, transaction);

// Get a transaction by ID
const transaction = await db.get(STORES.TRANSACTIONS, "txn-123");

// Get all transactions
const allTransactions = await db.getAll(STORES.TRANSACTIONS);

// Delete a transaction
await db.delete(STORES.TRANSACTIONS, "txn-123");

// Query by index
const tx = db.transaction(STORES.TRANSACTIONS, "readonly");
const index = tx.objectStore(STORES.TRANSACTIONS).index("date");
const recentTransactions = await index.getAll();
```

## Migration Strategy

The database uses a version-based migration strategy. When the database version is incremented, the `upgrade` callback in `initializeDB()` handles schema changes:

```typescript
// Current version: 1
// Future migrations would be added like this:

if (oldVersion < 2) {
  // Add new index or store for version 2
  const store = transaction.objectStore(STORES.TRANSACTIONS);
  store.createIndex("newField", "newField", { unique: false });
}

if (oldVersion < 3) {
  // Add new object store for version 3
  db.createObjectStore("newStore", { keyPath: "id" });
}
```

### Migration Best Practices

1. **Never remove indexes or stores** - Only add new ones
2. **Increment DB_VERSION** when making schema changes
3. **Test migrations** with existing data before deploying
4. **Document changes** in this README
5. **Handle data transformation** if field types change

## Error Handling

The storage layer handles several error scenarios:

- **IndexedDB unavailable**: Check with `isIndexedDBAvailable()` before operations
- **Quota exceeded**: Monitor storage usage with `getDatabaseStats()`
- **Blocked upgrades**: Close other tabs with the app open
- **Connection terminated**: Database will reinitialize on next operation

## Testing

Tests are located in `db.test.ts` and use `fake-indexeddb` for testing:

```bash
npm test -- lib/storage/db.test.ts
```

Test coverage includes:

- Database initialization and schema creation
- All indexes are created correctly
- Data storage and retrieval
- Index queries (including multi-entry indexes)
- Database operations (close, delete, stats)
- Error handling

## Performance Considerations

1. **Indexes**: All frequently queried fields have indexes for fast lookups
2. **Multi-entry index**: `tagIds-multi` allows efficient queries by any tag
3. **Batch operations**: Use transactions for multiple operations
4. **Connection pooling**: Database instance is reused (singleton pattern)

## Privacy & Security

- **No network requests**: All data stays in the browser
- **Local storage only**: Data never leaves the user's device
- **User control**: Users can delete all data with `deleteDatabase()`
- **No encryption**: Data is stored in plain text in IndexedDB (browser-level security)

## Future Enhancements

Potential improvements for future versions:

- [ ] Add encryption for sensitive data
- [ ] Implement data export/import functionality
- [ ] Add data compression for large datasets
- [x] Implement automatic cleanup of old data
- [x] Add storage quota monitoring and alerts
