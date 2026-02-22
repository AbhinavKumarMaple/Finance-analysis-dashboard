"use client";

import { ArrowUpCircle, ArrowDownCircle, TrendingUp, HelpCircle } from "lucide-react";
import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { useMemo } from "react";
import { Tooltip } from "../ui/tooltip";

export function IncomeExpenseCard() {
    const transactions = useFilteredTransactions();

    const summary = useMemo(() => {
        const totalIncome = transactions.reduce(
            (sum, t) => sum + (t.credit || 0),
            0,
        );
        const totalExpenses = transactions.reduce(
            (sum, t) => sum + (t.debit || 0),
            0,
        );
        const netCashFlow = totalIncome - totalExpenses;
        const savingsRate =
            totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

        return {
            totalIncome,
            totalExpenses,
            netCashFlow,
            savingsRate,
        };
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
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Income & Expenses
                </h2>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    No transaction data available.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Income & Expenses
                </h2>
                <Tooltip content="Summary of your financial activity. Shows total money received (Income), spent (Expenses), and the difference (Net Cash Flow). Savings Rate shows what % of income you're keeping.">
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                </Tooltip>
            </div>

            <div className="mt-6 space-y-4">
                {/* Income */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                            <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Income
                                </p>
                                <Tooltip content="All money credited to your account - salary, transfers received, refunds, etc.">
                                    <HelpCircle className="h-3 w-3 text-gray-300" />
                                </Tooltip>
                            </div>
                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(summary.totalIncome)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Expenses */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-red-100 p-2 dark:bg-red-950">
                            <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Expenses
                                </p>
                                <Tooltip content="All money debited from your account - purchases, bills, transfers sent, withdrawals, etc.">
                                    <HelpCircle className="h-3 w-3 text-gray-300" />
                                </Tooltip>
                            </div>
                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(summary.totalExpenses)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Net Cash Flow */}
                <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-950">
                                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Net Cash Flow
                                    </p>
                                    <Tooltip content="Income minus Expenses. Positive means you earned more than you spent. This is NOT your balance - it's the net change over the period.">
                                        <HelpCircle className="h-3 w-3 text-gray-300" />
                                    </Tooltip>
                                </div>
                                <p
                                    className={`text-xl font-semibold ${summary.netCashFlow >= 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                        }`}
                                >
                                    {formatCurrency(summary.netCashFlow)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Savings Rate
                                </p>
                                <Tooltip content="Percentage of your income that you're saving (Net Cash Flow ÷ Income × 100). Higher is better - aim for 20%+.">
                                    <HelpCircle className="h-3 w-3 text-gray-300" />
                                </Tooltip>
                            </div>
                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                {summary.savingsRate.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
