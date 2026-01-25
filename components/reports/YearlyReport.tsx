"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateYearlyReport } from "@/lib/reports/yearly";
import { ExportButtons } from "./ExportButtons";
import type { Transaction } from "@/types/transaction";
import type { Tag } from "@/types/tag";
import type { Budget } from "@/types/budget";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface YearlyReportProps {
    transactions: Transaction[];
    tags: Tag[];
    budgets: Budget[];
    year: number;
}

export function YearlyReport({ transactions, tags, budgets, year }: YearlyReportProps) {
    const report = useMemo(() => {
        return generateYearlyReport(transactions, tags, budgets, year);
    }, [transactions, tags, budgets, year]);

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined) return "N/A";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getTagName = (tagId: string) => {
        const tag = tags.find((t) => t.id === tagId);
        return tag?.name || tagId;
    };

    const monthlyChartData = report.monthlyBreakdown.map((month) => ({
        month: month.period.split("-")[1],
        income: month.summary.totalIncome,
        expenses: month.summary.totalExpenses,
        savings: month.summary.netSavings,
    }));

    return (
        <div className="space-y-6">
            {/* Header with Export */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{year} Annual Report</CardTitle>
                            <CardDescription>
                                Generated on {report.generatedAt.toLocaleDateString()}
                            </CardDescription>
                        </div>
                        <ExportButtons
                            reportType="yearly"
                            report={report}
                        />
                    </div>
                </CardHeader>
            </Card>

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Annual Summary</CardTitle>
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
                            <p className="text-sm text-muted-foreground mb-1">Avg Monthly Savings</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(report.summary.averageMonthlySavings)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Year-over-Year Comparison */}
            {report.yearOverYearComparison && (
                <Card>
                    <CardHeader>
                        <CardTitle>Year-over-Year Comparison</CardTitle>
                        <CardDescription>
                            Changes compared to {year - 1}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="p-4 border rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Income Change</p>
                                <p className={`text-2xl font-bold ${report.yearOverYearComparison.incomeChange >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}>
                                    {report.yearOverYearComparison.incomeChange >= 0 ? "+" : ""}
                                    {report.yearOverYearComparison.incomeChange.toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Expense Change</p>
                                <p className={`text-2xl font-bold ${report.yearOverYearComparison.expenseChange <= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}>
                                    {report.yearOverYearComparison.expenseChange >= 0 ? "+" : ""}
                                    {report.yearOverYearComparison.expenseChange.toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Savings Change</p>
                                <p className={`text-2xl font-bold ${report.yearOverYearComparison.savingsChange >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}>
                                    {report.yearOverYearComparison.savingsChange >= 0 ? "+" : ""}
                                    {report.yearOverYearComparison.savingsChange.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Monthly Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip
                                formatter={formatCurrency}
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "0.5rem",
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="income"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="Income"
                            />
                            <Line
                                type="monotone"
                                dataKey="expenses"
                                stroke="#ef4444"
                                strokeWidth={2}
                                name="Expenses"
                            />
                            <Line
                                type="monotone"
                                dataKey="savings"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Savings"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Spending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {report.topCategories.map((category, index) => {
                            const percentage = report.summary.totalExpenses > 0
                                ? (category.amount / report.summary.totalExpenses) * 100
                                : 0;
                            return (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>{getTagName(category.tagId)}</span>
                                        <span className="font-medium">
                                            {formatCurrency(category.amount)} ({percentage.toFixed(1)}%)
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

            {/* Investment Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Investment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
                            <p className="text-3xl font-bold">
                                {formatCurrency(report.investmentSummary.totalInvested)}
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">SIP Consistency</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-background rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{
                                            width: `${report.investmentSummary.sipConsistency}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xl font-bold">
                                    {report.investmentSummary.sipConsistency.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Breakdown Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Monthly Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Month</th>
                                    <th className="text-right p-2">Income</th>
                                    <th className="text-right p-2">Expenses</th>
                                    <th className="text-right p-2">Savings</th>
                                    <th className="text-right p-2">Savings Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.monthlyBreakdown.map((month, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/50">
                                        <td className="p-2">{month.period}</td>
                                        <td className="text-right p-2 text-green-600">
                                            {formatCurrency(month.summary.totalIncome)}
                                        </td>
                                        <td className="text-right p-2 text-red-600">
                                            {formatCurrency(month.summary.totalExpenses)}
                                        </td>
                                        <td className={`text-right p-2 font-medium ${month.summary.netSavings >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                            }`}>
                                            {formatCurrency(month.summary.netSavings)}
                                        </td>
                                        <td className="text-right p-2">
                                            {month.summary.savingsRate.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
