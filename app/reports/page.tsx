"use client";

import { useState } from "react";
import { useTagStore } from "@/store/tagStore";
import { useBudgetStore } from "@/store/budgetStore";
import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { MonthlyReport } from "@/components/reports/MonthlyReport";
import { YearlyReport } from "@/components/reports/YearlyReport";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAvailableMonths } from "@/lib/reports/monthly";
import { getAvailableYears } from "@/lib/reports/yearly";

export default function ReportsPage() {
    const transactions = useFilteredTransactions();
    const tags = useTagStore((state) => state.tags);
    const budgets = useBudgetStore((state) => state.budgets);

    const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly");
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

    const availableYears = getAvailableYears(transactions);
    const availableMonths = getAvailableMonths(transactions);

    // Set default selections
    if (selectedYear === null && availableYears.length > 0) {
        setSelectedYear(availableYears[0]);
    }
    if (selectedMonth === null && availableMonths.length > 0) {
        const latest = availableMonths[availableMonths.length - 1];
        setSelectedYear(latest.year);
        setSelectedMonth(latest.month);
    }

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Financial Reports</h1>
                <p className="text-muted-foreground mt-2">
                    Generate and export comprehensive financial reports
                </p>
            </div>

            {transactions.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        No transaction data available. Upload a statement to generate reports.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Report Controls */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Report Settings</CardTitle>
                            <CardDescription>
                                Select report type and period
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Report Type
                                    </label>
                                    <Select
                                        value={reportType}
                                        onValueChange={(value) => setReportType(value as "monthly" | "yearly")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly Report</SelectItem>
                                            <SelectItem value="yearly">Yearly Report</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {reportType === "monthly" && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">
                                                Year
                                            </label>
                                            <Select
                                                value={selectedYear?.toString() || ""}
                                                onValueChange={(value) => setSelectedYear(Number(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableYears.map((year) => (
                                                        <SelectItem key={year} value={year.toString()}>
                                                            {year}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">
                                                Month
                                            </label>
                                            <Select
                                                value={selectedMonth?.toString() || ""}
                                                onValueChange={(value) => setSelectedMonth(Number(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableMonths
                                                        .filter((m) => m.year === selectedYear)
                                                        .map((m) => (
                                                            <SelectItem key={m.month} value={m.month.toString()}>
                                                                {monthNames[m.month - 1]}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {reportType === "yearly" && (
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">
                                            Year
                                        </label>
                                        <Select
                                            value={selectedYear?.toString() || ""}
                                            onValueChange={(value) => setSelectedYear(Number(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableYears.map((year) => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report Display */}
                    {reportType === "monthly" && selectedYear && selectedMonth && (
                        <MonthlyReport
                            transactions={transactions}
                            tags={tags}
                            budgets={budgets}
                            year={selectedYear}
                            month={selectedMonth}
                        />
                    )}

                    {reportType === "yearly" && selectedYear && (
                        <YearlyReport
                            transactions={transactions}
                            tags={tags}
                            budgets={budgets}
                            year={selectedYear}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
