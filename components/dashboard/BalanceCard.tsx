"use client";

import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { calculateBalanceMetrics } from "@/lib/analytics/balance";
import { useMemo } from "react";
import { Tooltip } from "../ui/tooltip";

export function BalanceCard() {
    const transactions = useFilteredTransactions();

    const metrics = useMemo(() => {
        if (transactions.length === 0) {
            return null;
        }

        const sortedTransactions = [...transactions].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        const dateRange = {
            start: sortedTransactions[0].date,
            end: sortedTransactions[sortedTransactions.length - 1].date,
        };

        return calculateBalanceMetrics(transactions, dateRange);
    }, [transactions]);

    if (!metrics) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Balance Overview
                </h2>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    No transaction data available. Upload a statement to get started.
                </p>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Balance Overview
                </h2>
                <Tooltip content="Shows your account balance metrics. Current Balance is your latest balance, Average is the mean balance over time, Highest/Lowest show your balance range.">
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                </Tooltip>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                {/* Current Balance */}
                <div>
                    <div className="flex items-center gap-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Current Balance
                        </p>
                        <Tooltip content="Your most recent account balance from the latest transaction in your statement.">
                            <HelpCircle className="h-3 w-3 text-gray-300" />
                        </Tooltip>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(metrics.current)}
                    </p>
                </div>

                {/* Average Balance */}
                <div>
                    <div className="flex items-center gap-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Average Balance
                        </p>
                        <Tooltip content="The mean of all your daily balances. Useful for understanding your typical account balance and meeting minimum balance requirements.">
                            <HelpCircle className="h-3 w-3 text-gray-300" />
                        </Tooltip>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(metrics.average)}
                    </p>
                </div>

                {/* Highest Balance */}
                <div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <div className="flex items-center gap-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Highest</p>
                            <Tooltip content="The maximum balance you reached during this period. Shows your peak financial position.">
                                <HelpCircle className="h-3 w-3 text-gray-300" />
                            </Tooltip>
                        </div>
                    </div>
                    <p className="mt-1 text-xl font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(metrics.highest)}
                    </p>
                </div>

                {/* Lowest Balance */}
                <div>
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <div className="flex items-center gap-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Lowest</p>
                            <Tooltip content="The minimum balance during this period. Important for avoiding overdraft fees and maintaining minimum balance requirements.">
                                <HelpCircle className="h-3 w-3 text-gray-300" />
                            </Tooltip>
                        </div>
                    </div>
                    <p className="mt-1 text-xl font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(metrics.lowest)}
                    </p>
                </div>
            </div>
        </div>
    );
}
