"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTransactionStore } from "@/store/transactionStore";
import { useTagStore } from "@/store/tagStore";
import TransactionList from "@/components/transactions/TransactionList";
import SearchBar from "@/components/transactions/SearchBar";
import FilterPanel from "@/components/transactions/FilterPanel";
import type { Transaction } from "@/types/transaction";

export default function TransactionsPage() {
    const searchParams = useSearchParams();
    const transactions = useTransactionStore((state) => state.transactions);
    const tags = useTagStore((state) => state.tags);

    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        dateRange: { start: null as Date | null, end: null as Date | null },
        tagIds: [] as string[],
        amountRange: { min: null as number | null, max: null as number | null },
        type: null as "debit" | "credit" | null,
        paymentMethods: [] as string[],
        isReviewed: null as boolean | null,
        merchants: [] as string[],
    });

    // Load merchant filter from URL params
    useEffect(() => {
        const merchantsParam = searchParams.get('merchants');
        if (merchantsParam) {
            const merchantsList = decodeURIComponent(merchantsParam).split(',');
            setFilters(prev => ({ ...prev, merchants: merchantsList }));
        }
    }, [searchParams]);

    // Apply search and filters
    const filteredTransactions = transactions.filter((transaction) => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                transaction.details.toLowerCase().includes(query) ||
                transaction.refNo.toLowerCase().includes(query) ||
                transaction.notes?.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }

        // Merchant filter (from URL params)
        if (filters.merchants.length > 0) {
            const matchesMerchant = filters.merchants.some(merchant =>
                transaction.details.toLowerCase().includes(merchant.toLowerCase())
            );
            if (!matchesMerchant) return false;
        }

        // Date range filter
        if (filters.dateRange.start && transaction.date < filters.dateRange.start) {
            return false;
        }
        if (filters.dateRange.end && transaction.date > filters.dateRange.end) {
            return false;
        }

        // Tag filter
        if (filters.tagIds.length > 0) {
            const hasMatchingTag = filters.tagIds.some((tagId) =>
                transaction.tagIds.includes(tagId)
            );
            if (!hasMatchingTag) return false;
        }

        // Amount range filter
        if (
            filters.amountRange.min !== null &&
            transaction.amount < filters.amountRange.min
        ) {
            return false;
        }
        if (
            filters.amountRange.max !== null &&
            transaction.amount > filters.amountRange.max
        ) {
            return false;
        }

        // Type filter
        if (filters.type && transaction.type !== filters.type) {
            return false;
        }

        // Payment method filter
        if (
            filters.paymentMethods.length > 0 &&
            !filters.paymentMethods.includes(transaction.paymentMethod)
        ) {
            return false;
        }

        // Reviewed filter
        if (
            filters.isReviewed !== null &&
            transaction.isReviewed !== filters.isReviewed
        ) {
            return false;
        }

        return true;
    });

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Transactions</h1>
                <p className="text-muted-foreground">
                    View and manage all your transactions
                </p>
            </div>

            {/* Merchant Filter Badge */}
            {filters.merchants.length > 0 && (
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Filtering by {filters.merchants.length} merchant{filters.merchants.length !== 1 ? 's' : ''}:
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {filters.merchants.map((merchant, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                    >
                                        {merchant}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, merchants: [] }))}
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        >
                            Clear Filter
                        </button>
                    </div>
                </div>
            )}

            <SearchBar value={searchQuery} onChange={setSearchQuery} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <FilterPanel
                        filters={filters}
                        onFiltersChange={(newFilters) => setFilters({ ...newFilters, merchants: filters.merchants })}
                        tags={tags}
                        transactions={transactions}
                    />
                </div>

                <div className="lg:col-span-3">
                    <TransactionList
                        transactions={filteredTransactions}
                        tags={tags}
                        totalCount={transactions.length}
                        filteredCount={filteredTransactions.length}
                    />
                </div>
            </div>
        </div>
    );
}
