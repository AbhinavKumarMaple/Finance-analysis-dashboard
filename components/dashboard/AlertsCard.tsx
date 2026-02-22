"use client";

import { useBudgetStore } from "@/store";
import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { useMemo } from "react";
import {
    AlertTriangle,
    AlertCircle,
    Info,
    TrendingDown,
    Copy,
} from "lucide-react";
import { detectAnomalies } from "@/lib/analytics/anomalies";
import type { Alert } from "@/types/analytics";

export function AlertsCard() {
    const transactions = useFilteredTransactions();
    const budgets = useBudgetStore((state) => state.budgets);

    const alerts = useMemo(() => {
        const alertList: Alert[] = [];

        if (transactions.length === 0) {
            return alertList;
        }

        // Get current balance
        const sortedTransactions = [...transactions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        const currentBalance = sortedTransactions[0]?.balance || 0;

        // Low balance alert (threshold: 10000)
        if (currentBalance < 10000) {
            alertList.push({
                id: "low-balance",
                type: "low_balance",
                severity: currentBalance < 5000 ? "critical" : "warning",
                title: "Low Balance Alert",
                message: `Your current balance is ${new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                }).format(currentBalance)}`,
                createdAt: new Date(),
                isRead: false,
                isDismissed: false,
            });
        }

        // Detect anomalies
        const anomalies = detectAnomalies(transactions);
        anomalies.slice(0, 3).forEach((anomaly, index) => {
            alertList.push({
                id: `anomaly-${index}`,
                type: "anomaly_detected",
                severity: anomaly.severity === "high" ? "critical" : "warning",
                title: "Unusual Transaction Detected",
                message: anomaly.description,
                relatedTransactionId: anomaly.transaction.id,
                createdAt: new Date(),
                isRead: false,
                isDismissed: false,
            });
        });

        // Budget alerts
        const currentMonth = new Date().toISOString().slice(0, 7);
        budgets.forEach((budget) => {
            const monthlySpend = transactions
                .filter(
                    (t) =>
                        t.type === "debit" &&
                        t.tagIds.includes(budget.tagId) &&
                        new Date(t.date).toISOString().slice(0, 7) === currentMonth,
                )
                .reduce((sum, t) => sum + (t.debit || 0), 0);

            const percentUsed = (monthlySpend / budget.monthlyLimit) * 100;

            if (percentUsed >= 100) {
                alertList.push({
                    id: `budget-exceeded-${budget.id}`,
                    type: "budget_exceeded",
                    severity: "critical",
                    title: "Budget Exceeded",
                    message: `You've exceeded your budget limit`,
                    relatedBudgetId: budget.id,
                    createdAt: new Date(),
                    isRead: false,
                    isDismissed: false,
                });
            } else if (percentUsed >= 80) {
                alertList.push({
                    id: `budget-warning-${budget.id}`,
                    type: "budget_warning",
                    severity: "warning",
                    title: "Budget Warning",
                    message: `You've used ${percentUsed.toFixed(0)}% of your budget`,
                    relatedBudgetId: budget.id,
                    createdAt: new Date(),
                    isRead: false,
                    isDismissed: false,
                });
            }
        });

        return alertList.slice(0, 5); // Show top 5 alerts
    }, [transactions, budgets]);

    const getAlertIcon = (severity: string) => {
        switch (severity) {
            case "critical":
                return <AlertTriangle className="h-5 w-5 text-red-600" />;
            case "warning":
                return <AlertCircle className="h-5 w-5 text-yellow-600" />;
            default:
                return <Info className="h-5 w-5 text-blue-600" />;
        }
    };

    const getAlertColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20";
            case "warning":
                return "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20";
            default:
                return "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20";
        }
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Alerts & Notifications
            </h2>

            {alerts.length === 0 ? (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
                    <Info className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-800 dark:text-green-300">
                        All good! No alerts at this time.
                    </p>
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`flex items-start gap-3 rounded-lg border p-4 ${getAlertColor(
                                alert.severity,
                            )}`}
                        >
                            {getAlertIcon(alert.severity)}
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {alert.title}
                                </p>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    {alert.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
