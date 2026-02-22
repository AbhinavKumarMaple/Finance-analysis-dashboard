"use client";

import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { useMemo } from "react";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Link from "next/link";

export function RecentTransactions() {
    const transactions = useFilteredTransactions();

    const recentTransactions = useMemo(() => {
        return [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    }, [transactions]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(new Date(date));
    };

    if (transactions.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Transactions
                </h2>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    No transactions available.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Transactions
                </h2>
                <Link
                    href="/transactions"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    View all
                </Link>
            </div>

            <div className="mt-4 space-y-3">
                {recentTransactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`rounded-full p-2 ${transaction.type === "credit"
                                    ? "bg-green-100 dark:bg-green-950"
                                    : "bg-red-100 dark:bg-red-950"
                                    }`}
                            >
                                {transaction.type === "credit" ? (
                                    <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                    <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {transaction.details.length > 40
                                        ? transaction.details.substring(0, 40) + "..."
                                        : transaction.details}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(transaction.date)} • {transaction.paymentMethod}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p
                                className={`text-sm font-semibold ${transaction.type === "credit"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                    }`}
                            >
                                {transaction.type === "credit" ? "+" : "-"}
                                {formatCurrency(transaction.amount)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
