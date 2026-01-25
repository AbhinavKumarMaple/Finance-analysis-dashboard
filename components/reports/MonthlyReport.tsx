"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMonthlyReport } from "@/lib/reports/monthly";
import { ExportButtons } from "./ExportButtons";
import type { Transaction } from "@/types/transaction";
import type { Tag } from "@/types/tag";
import type { Budget } from "@/types/budget";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MonthlyReportProps {
    transactions: Transaction[];
    tags: Tag[];
    budgets: Budget[];
    year: number;
    month: number;
}

export function MonthlyReport({ transactions, tags, budgets, year, month }: MonthlyReportProps) {
    const report = useMemo(() => {
        return generateMonthlyReport(transactions, tags, budgets, year, month);
    }, [transactions, tags, budgets, year, month]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getTagName = (tagId: string) => {
        const tag = tags.find((t) => t.id === tagId);
        return tag?.name || tagId;
    };

    return (
        <div className="space-y-6">
            {/* Header with Export */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>
                                {monthNames[month - 1]} {year} Report
                            </CardTitle>
                            <CardDescription>
                                Generated on {report.generatedAt.toLocaleDateString()}
                            </CardDescription>
                        </div>
                        <ExportButtons
                            reportType="monthly"
                            report={report}
                        />
                    </div>
                </CardHeader>
            </Card>

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <p className="text-sm text-green-700">Total Income</p>
                            </div>
                            <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(report.summary.totalIncome)}
                            </p>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <p className="text-sm text-red-700">Total Expenses</p>
                            </div>
                            <p className="text-2xl font-bold text-red-700">
                                {formatCurrency(report.summary.totalExpenses)}
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Net Savings</p>
                            <p className={`text-2xl font-bold ${report.summary.netSavings >= 0 ? "text-green-600" : "text-red-600"
                                }`}>
                                {formatCurrency(report.summary.netSavings)}
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Savings Rate</p>
                            <p className="text-2xl font-bold">
                                {report.summary.savingsRate.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Balance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Balance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Current</p>
                            <p className="text-xl font-bold">
                                {formatCurrency(report.balanceMetrics.current)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Highest</p>
                            <p className="text-xl font-bold text-green-600">
                                {formatCurrency(report.balanceMetrics.highest)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Lowest</p>
                            <p className="text-xl font-bold text-red-600">
                                {formatCurrency(report.balanceMetrics.lowest)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Average</p>
                            <p className="text-xl font-bold">
                                {formatCurrency(report.balanceMetrics.average)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Spending by Category */}
            <Card>
                <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from(report.spendingByTag.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10)
                            .map(([tagId, amount]) => {
                                const percentage = report.summary.totalExpenses > 0
                                    ? (amount / report.summary.totalExpenses) * 100
                                    : 0;
                                return (
                                    <div key={tagId} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>{getTagName(tagId)}</span>
                                            <span className="font-medium">
                                                {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </CardContent>
            </Card>

            {/* Top Merchants */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Merchants</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {report.topMerchants.map((merchant, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">{merchant.merchant}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {merchant.transactionCount} transactions • Avg: {formatCurrency(merchant.averageAmount)}
                                    </p>
                                </div>
                                <p className="font-semibold">
                                    {formatCurrency(merchant.totalAmount)}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Budget Performance */}
            {report.budgetPerformance.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Budget Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {report.budgetPerformance.map((budget, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">
                                            {getTagName(budget.budget.tagId)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">
                                                {formatCurrency(budget.currentSpend)} / {formatCurrency(budget.budget.monthlyLimit)}
                                            </span>
                                            <Badge
                                                variant={
                                                    budget.status === "exceeded"
                                                        ? "outline"
                                                        : budget.status === "warning"
                                                            ? "default"
                                                            : "secondary"
                                                }
                                                className={
                                                    budget.status === "exceeded"
                                                        ? "border-red-500 text-red-700"
                                                        : budget.status === "warning"
                                                            ? "border-yellow-500 text-yellow-700"
                                                            : ""
                                                }
                                            >
                                                {budget.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${budget.status === "exceeded"
                                                ? "bg-red-500"
                                                : budget.status === "warning"
                                                    ? "bg-yellow-500"
                                                    : "bg-green-500"
                                                }`}
                                            style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Health Score */}
            <Card>
                <CardHeader>
                    <CardTitle>Financial Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-5xl font-bold">{report.healthScore.score}</p>
                            <p className="text-sm text-muted-foreground">out of 100</p>
                        </div>
                        <div className="flex-1">
                            <Badge variant="outline" className="capitalize mb-2">
                                {report.healthScore.trend}
                            </Badge>
                            <div className="space-y-2">
                                {Object.entries(report.healthScore.components).map(([key, component]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                                        <span className="font-medium">{component.score}/100</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {report.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                    <span className="text-muted-foreground">•</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
