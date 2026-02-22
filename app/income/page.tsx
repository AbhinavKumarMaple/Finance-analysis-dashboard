"use client";

import { useMemo } from "react";
import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { analyzeIncome } from "@/lib/analytics/income";
import { IncomeTrendChart } from "@/components/charts/IncomeTrendChart";
import {
    TrendingUp,
    Calendar,
    AlertCircle,
    DollarSign,
} from "lucide-react";

export default function IncomePage() {
    const transactions = useFilteredTransactions();

    const incomeAnalysis = useMemo(() => {
        if (transactions.length === 0) {
            return null;
        }
        return analyzeIncome(transactions);
    }, [transactions]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (transactions.length === 0) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Income Analysis
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Track your income sources and patterns
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

    if (!incomeAnalysis) {
        return null;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Income Analysis
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Track your income sources and patterns
                </p>
            </div>

            {/* Summary Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Total Income */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
                            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total Income
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(incomeAnalysis.totalIncome)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Salary Date */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
                            <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Detected Salary Date
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {incomeAnalysis.detectedSalaryDate
                                    ? `${incomeAnalysis.detectedSalaryDate}th`
                                    : "Not detected"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Unusual Incomes */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-950">
                            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Unusual Incomes
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {incomeAnalysis.unusualIncomes.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Income Trend Chart */}
            {incomeAnalysis.monthlyTrend.length > 0 && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Monthly Income Trend
                    </h2>
                    <IncomeTrendChart data={incomeAnalysis.monthlyTrend} />
                </div>
            )}

            {/* Income Sources */}
            {incomeAnalysis.bySource.size > 0 && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <div className="mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Income Sources
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {Array.from(incomeAnalysis.bySource.entries())
                            .sort((a, b) => b[1] - a[1])
                            .map(([source, amount], index) => {
                                const percentage =
                                    incomeAnalysis.totalIncome > 0
                                        ? ((amount / incomeAnalysis.totalIncome) * 100).toFixed(1)
                                        : "0";
                                return (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {source.length > 50
                                                    ? source.substring(0, 50) + "..."
                                                    : source}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(amount)}
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
            )}

            {/* Unusual Incomes */}
            {incomeAnalysis.unusualIncomes.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 shadow-sm dark:border-yellow-900 dark:bg-yellow-950/20">
                    <div className="mb-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Unusual Income Transactions
                        </h2>
                    </div>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        These transactions are significantly higher than your average income
                        (more than 2x average).
                    </p>
                    <div className="space-y-3">
                        {incomeAnalysis.unusualIncomes.slice(0, 5).map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between rounded-lg border border-yellow-300 bg-white p-4 dark:border-yellow-800 dark:bg-gray-950"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {transaction.details.length > 60
                                            ? transaction.details.substring(0, 60) + "..."
                                            : transaction.details}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(transaction.date).toLocaleDateString("en-IN")}
                                    </p>
                                </div>
                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                    {formatCurrency(transaction.credit || 0)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
