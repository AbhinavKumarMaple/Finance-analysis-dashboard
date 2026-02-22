"use client";

import { useState, useMemo } from "react";
import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { calculateCashFlow } from "@/lib/analytics/cashflow";
import { CashFlowChart } from "@/components/charts/CashFlowChart";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

type Granularity = "daily" | "weekly" | "monthly";

export default function CashFlowPage() {
    const [granularity, setGranularity] = useState<Granularity>("monthly");
    const transactions = useFilteredTransactions();

    const cashFlowData = useMemo(() => {
        if (transactions.length === 0) {
            return [];
        }
        return calculateCashFlow(transactions, granularity);
    }, [transactions, granularity]);

    const summary = useMemo(() => {
        if (cashFlowData.length === 0) {
            return {
                totalInflow: 0,
                totalOutflow: 0,
                netCashFlow: 0,
                surplusPeriods: 0,
                deficitPeriods: 0,
            };
        }

        const totalInflow = cashFlowData.reduce(
            (sum, item) => sum + item.totalInflow,
            0,
        );
        const totalOutflow = cashFlowData.reduce(
            (sum, item) => sum + item.totalOutflow,
            0,
        );
        const netCashFlow = totalInflow - totalOutflow;
        const surplusPeriods = cashFlowData.filter(
            (item) => item.netCashFlow > 0,
        ).length;
        const deficitPeriods = cashFlowData.filter(
            (item) => item.netCashFlow < 0,
        ).length;

        return {
            totalInflow,
            totalOutflow,
            netCashFlow,
            surplusPeriods,
            deficitPeriods,
        };
    }, [cashFlowData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                    Cash Flow Analysis
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Track your income and expenses over time
                </p>
            </div>

            {/* Granularity Toggle */}
            <div className="mb-4 flex flex-wrap gap-2 sm:mb-6">
                <button
                    onClick={() => setGranularity("daily")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${granularity === "daily"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                >
                    Daily
                </button>
                <button
                    onClick={() => setGranularity("weekly")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${granularity === "weekly"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                >
                    Weekly
                </button>
                <button
                    onClick={() => setGranularity("monthly")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${granularity === "monthly"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                >
                    Monthly
                </button>
            </div>

            {transactions.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-12">
                    <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                        No transaction data available. Upload a statement to get started.
                    </p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="mb-4 grid grid-cols-1 gap-4 sm:mb-6 md:grid-cols-3">
                        {/* Total Inflow */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-green-100 p-2 dark:bg-green-950 sm:p-3">
                                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                                        Total Inflow
                                    </p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white sm:text-2xl">
                                        {formatCurrency(summary.totalInflow)}
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        {summary.surplusPeriods} surplus periods
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Total Outflow */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-red-100 p-2 dark:bg-red-950 sm:p-3">
                                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                                        Total Outflow
                                    </p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white sm:text-2xl">
                                        {formatCurrency(summary.totalOutflow)}
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {summary.deficitPeriods} deficit periods
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Net Cash Flow */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-950 sm:p-3">
                                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                                        Net Cash Flow
                                    </p>
                                    <p
                                        className={`text-lg font-bold sm:text-2xl ${summary.netCashFlow >= 0
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-red-600 dark:text-red-400"
                                            }`}
                                    >
                                        {formatCurrency(summary.netCashFlow)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {summary.netCashFlow >= 0 ? "Positive" : "Negative"} flow
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-6">
                        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                            Cash Flow Trend
                        </h2>
                        <div className="h-[300px] sm:h-[400px]">
                            <CashFlowChart data={cashFlowData} granularity={granularity} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
