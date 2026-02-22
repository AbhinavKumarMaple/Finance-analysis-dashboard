"use client";

import { useMemo } from "react";
import { useTagStore } from "@/store";
import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { calculateSpendingBreakdown } from "@/lib/analytics/spending";
import { SpendingPieChart } from "@/components/charts/SpendingPieChart";
import { TopMerchantsChart } from "@/components/charts/TopMerchantsChart";
import { PieChart, TrendingDown } from "lucide-react";

export default function SpendingPage() {
    const transactions = useFilteredTransactions();
    const tags = useTagStore((state) => state.tags);

    const spendingData = useMemo(() => {
        if (transactions.length === 0) {
            return null;
        }
        return calculateSpendingBreakdown(transactions, tags);
    }, [transactions, tags]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const categoryChartData = useMemo(() => {
        if (!spendingData) return [];

        const colors = [
            "#3b82f6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#ec4899",
            "#06b6d4",
            "#84cc16",
            "#f97316",
            "#6366f1",
        ];

        return Array.from(spendingData.byTag.entries())
            .map(([tagId, amount], index) => {
                const tag = tags.find((t) => t.id === tagId);
                return {
                    name: tag?.name || "Uncategorized",
                    value: amount,
                    color: tag?.color || colors[index % colors.length],
                };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [spendingData, tags]);

    const totalSpending = useMemo(() => {
        return transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    }, [transactions]);

    if (transactions.length === 0) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Spending Breakdown
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Analyze your spending patterns
                    </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <p className="text-gray-500 dark:text-gray-400">
                        No transaction data available. Upload a statement to get started.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Spending Breakdown
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Analyze your spending patterns
                </p>
            </div>

            {/* Total Spending Card */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-red-100 p-3 dark:bg-red-950">
                        <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Total Spending
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(totalSpending)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Spending by Category */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <div className="mb-4 flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Spending by Category
                        </h2>
                    </div>
                    {categoryChartData.length > 0 ? (
                        <SpendingPieChart data={categoryChartData} />
                    ) : (
                        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                            No category data available
                        </p>
                    )}
                </div>

                {/* Category List */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Category Details
                    </h2>
                    <div className="space-y-3">
                        {categoryChartData.map((category, index) => {
                            const percentage =
                                totalSpending > 0
                                    ? ((category.value / totalSpending) * 100).toFixed(1)
                                    : "0";
                            return (
                                <div
                                    key={index}
                                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-4 w-4 rounded-full"
                                            style={{ backgroundColor: category.color }}
                                        />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {category.name}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(category.value)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {percentage}%
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Top Merchants */}
            {spendingData && spendingData.byMerchant.length > 0 && (
                <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Top Merchants
                    </h2>
                    <TopMerchantsChart data={spendingData.byMerchant} />
                </div>
            )}

            {/* Payment Method Breakdown */}
            {spendingData && spendingData.byPaymentMethod.size > 0 && (
                <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Payment Methods
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {Array.from(spendingData.byPaymentMethod.entries()).map(
                            ([method, amount]) => (
                                <div
                                    key={method}
                                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                                >
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {method}
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(amount)}
                                    </p>
                                </div>
                            ),
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
