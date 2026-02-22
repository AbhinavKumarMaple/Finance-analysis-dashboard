"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { detectRecurringPayments } from "@/lib/analytics/recurring";
import type { Transaction } from "@/types/transaction";
import { Calendar, TrendingUp, Repeat } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type ViewMode = "all" | "month" | "year" | "custom";

interface RecurringPaymentsProps {
    transactions: Transaction[];
}

function formatCurrency(value: number | undefined) {
    if (value === undefined) return "N/A";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getCategoryColor(category: string) {
    switch (category) {
        case "subscription": return "bg-blue-100 text-blue-800";
        case "emi": return "bg-purple-100 text-purple-800";
        case "utility": return "bg-green-100 text-green-800";
        default: return "bg-gray-100 text-gray-800";
    }
}

function getFrequencyIcon(frequency: string) {
    switch (frequency) {
        case "weekly": return <Repeat className="h-4 w-4" />;
        case "monthly": return <Calendar className="h-4 w-4" />;
        default: return <TrendingUp className="h-4 w-4" />;
    }
}

// ─── Payment List (shared) ───
function PaymentList({ payments }: { payments: ReturnType<typeof detectRecurringPayments> }) {
    if (payments.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No recurring payments detected</p>;
    }

    const totalMonthlyRecurring = payments
        .filter((p) => p.frequency === "monthly")
        .reduce((sum, p) => sum + p.amount, 0);

    const totalYearlyRecurring = payments.reduce((sum, p) => {
        switch (p.frequency) {
            case "weekly": return sum + p.amount * 52;
            case "monthly": return sum + p.amount * 12;
            case "quarterly": return sum + p.amount * 4;
            case "yearly": return sum + p.amount;
            default: return sum;
        }
    }, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Monthly Recurring</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalMonthlyRecurring)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Yearly Estimate</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalYearlyRecurring)}</p>
                </div>
            </div>
            <div className="space-y-3">
                {payments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {getFrequencyIcon(payment.frequency)}
                                <p className="font-medium">{payment.merchant}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary" className={getCategoryColor(payment.category)}>{payment.category}</Badge>
                                <span>•</span>
                                <span className="capitalize">{payment.frequency}</span>
                                <span>•</span>
                                <span>Confidence: {(payment.confidence * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-muted-foreground">Next: {formatDate(payment.nextExpectedDate)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── All View (original) ───
function AllView({ transactions }: { transactions: Transaction[] }) {
    const payments = useMemo(() => detectRecurringPayments(transactions), [transactions]);
    return <PaymentList payments={payments} />;
}

// ─── Month View ───
function MonthView({ transactions }: { transactions: Transaction[] }) {
    const allPayments = useMemo(() => detectRecurringPayments(transactions), [transactions]);
    const debits = transactions.filter((t) => t.type === "debit");

    const monthlyData = useMemo(() => {
        const monthMap = new Map<string, { subscriptions: number; emi: number; utility: number; other: number }>();
        debits.forEach((t) => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (!monthMap.has(key)) monthMap.set(key, { subscriptions: 0, emi: 0, utility: 0, other: 0 });
            const entry = monthMap.get(key)!;
            const details = t.details.toLowerCase();
            // Simple categorization for chart
            if (details.includes("netflix") || details.includes("spotify") || details.includes("prime") || details.includes("subscription")) {
                entry.subscriptions += t.debit || 0;
            } else if (details.includes("emi") || details.includes("loan") || details.includes("finance")) {
                entry.emi += t.debit || 0;
            } else if (details.includes("electric") || details.includes("water") || details.includes("internet") || details.includes("broadband")) {
                entry.utility += t.debit || 0;
            }
        });
        return Array.from(monthMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, v]) => {
                const [y, m] = key.split("-");
                return {
                    name: new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
                    subscriptions: v.subscriptions,
                    emi: v.emi,
                    utility: v.utility,
                };
            });
    }, [debits]);

    return (
        <div className="space-y-4">
            {monthlyData.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }} />
                        <Bar dataKey="subscriptions" fill="#3b82f6" name="Subscriptions" stackId="a" />
                        <Bar dataKey="emi" fill="#8b5cf6" name="EMI" stackId="a" />
                        <Bar dataKey="utility" fill="#10b981" name="Utilities" stackId="a" />
                    </BarChart>
                </ResponsiveContainer>
            )}
            <PaymentList payments={allPayments} />
        </div>
    );
}

// ─── Year View ───
function YearView({ transactions }: { transactions: Transaction[] }) {
    const allPayments = useMemo(() => detectRecurringPayments(transactions), [transactions]);

    const yearlyData = useMemo(() => {
        const yearMap = new Map<number, { total: number; count: number }>();
        allPayments.forEach((p) => {
            // Estimate yearly cost per payment
            let yearlyCost = 0;
            switch (p.frequency) {
                case "weekly": yearlyCost = p.amount * 52; break;
                case "monthly": yearlyCost = p.amount * 12; break;
                case "quarterly": yearlyCost = p.amount * 4; break;
                case "yearly": yearlyCost = p.amount; break;
            }
            const year = p.nextExpectedDate.getFullYear();
            const existing = yearMap.get(year) || { total: 0, count: 0 };
            yearMap.set(year, { total: existing.total + yearlyCost, count: existing.count + 1 });
        });
        return Array.from(yearMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([year, v]) => ({ name: String(year), total: v.total, count: v.count }));
    }, [allPayments]);

    const byCategoryData = useMemo(() => {
        const catMap = new Map<string, number>();
        allPayments.forEach((p) => {
            let yearlyCost = 0;
            switch (p.frequency) {
                case "weekly": yearlyCost = p.amount * 52; break;
                case "monthly": yearlyCost = p.amount * 12; break;
                case "quarterly": yearlyCost = p.amount * 4; break;
                case "yearly": yearlyCost = p.amount; break;
            }
            catMap.set(p.category, (catMap.get(p.category) || 0) + yearlyCost);
        });
        return Array.from(catMap.entries()).map(([cat, total]) => ({ name: cat, total }));
    }, [allPayments]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                {byCategoryData.map((d) => (
                    <div key={d.name} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <p className="text-muted-foreground capitalize">{d.name}</p>
                        <p className="text-xl font-bold">{formatCurrency(d.total)}/yr</p>
                    </div>
                ))}
            </div>
            {yearlyData.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }} />
                        <Bar dataKey="total" fill="#f59e0b" name="Yearly Cost" />
                    </BarChart>
                </ResponsiveContainer>
            )}
            <PaymentList payments={allPayments} />
        </div>
    );
}

// ─── Custom Range View ───
function CustomView({ transactions }: { transactions: Transaction[] }) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const filtered = useMemo(() => {
        if (!startDate && !endDate) return transactions;
        return transactions.filter((t) => {
            const d = new Date(t.date);
            if (startDate && d < new Date(startDate)) return false;
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (d > end) return false;
            }
            return true;
        });
    }, [transactions, startDate, endDate]);

    const payments = useMemo(() => detectRecurringPayments(filtered), [filtered]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="rec-start" className="text-sm">From</Label>
                    <Input id="rec-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="rec-end" className="text-sm">To</Label>
                    <Input id="rec-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
                </div>
            </div>
            <PaymentList payments={payments} />
        </div>
    );
}

// ─── Main Component ───
export function RecurringPayments({ transactions }: RecurringPaymentsProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("all");

    const tabs: { key: ViewMode; label: string }[] = [
        { key: "all", label: "All" },
        { key: "month", label: "Month" },
        { key: "year", label: "Year" },
        { key: "custom", label: "Custom" },
    ];

    const descriptions: Record<ViewMode, string> = {
        all: "Detected subscriptions, EMIs, and regular payments",
        month: "Monthly breakdown of recurring costs",
        year: "Yearly recurring cost estimates by category",
        custom: "Analyze recurring payments in a custom date range",
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Recurring Payments</CardTitle>
                        <CardDescription>{descriptions[viewMode]}</CardDescription>
                    </div>
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setViewMode(tab.key)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === tab.key
                                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {viewMode === "all" && <AllView transactions={transactions} />}
                {viewMode === "month" && <MonthView transactions={transactions} />}
                {viewMode === "year" && <YearView transactions={transactions} />}
                {viewMode === "custom" && <CustomView transactions={transactions} />}
            </CardContent>
        </Card>
    );
}
