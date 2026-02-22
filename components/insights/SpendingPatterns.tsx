"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import type { Transaction } from "@/types/transaction";

type ViewMode = "week" | "month" | "year" | "custom";

interface SpendingPatternsProps {
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

function getDebits(transactions: Transaction[]) {
    return transactions.filter((t) => t.type === "debit");
}

// ─── Week View ───
function WeekView({ transactions }: { transactions: Transaction[] }) {
    const debits = getDebits(transactions);
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    debits.forEach((t) => {
        const day = new Date(t.date).getDay();
        dayTotals[day] += t.debit || 0;
        dayCounts[day] += 1;
    });
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = dayNames.map((name, i) => ({
        name,
        total: dayTotals[i],
        avg: dayCounts[i] > 0 ? dayTotals[i] / dayCounts[i] : 0,
        count: dayCounts[i],
    }));
    const weekdayTotal = dayTotals.slice(1, 6).reduce((s, v) => s + v, 0);
    const weekendTotal = dayTotals[0] + dayTotals[6];
    const weekdayCount = dayCounts.slice(1, 6).reduce((s, v) => s + v, 0);
    const weekendCount = dayCounts[0] + dayCounts[6];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <p className="text-muted-foreground">Weekday Avg</p>
                    <p className="text-xl font-bold">{formatCurrency(weekdayCount > 0 ? weekdayTotal / weekdayCount : 0)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <p className="text-muted-foreground">Weekend Avg</p>
                    <p className="text-xl font-bold">{formatCurrency(weekendCount > 0 ? weekendTotal / weekendCount : 0)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <p className="text-muted-foreground">Total Txns</p>
                    <p className="text-xl font-bold">{debits.length}</p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }} />
                    <Bar dataKey="total" fill="#8b5cf6" name="Total Spent" />
                </BarChart>
            </ResponsiveContainer>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 pr-4">Day</th>
                            <th className="pb-2 pr-4 text-right">Total</th>
                            <th className="pb-2 pr-4 text-right">Avg/Txn</th>
                            <th className="pb-2 text-right">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((d) => (
                            <tr key={d.name} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 pr-4 font-medium">{d.name}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.total)}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.avg)}</td>
                                <td className="py-2 text-right">{d.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Month View ───
function MonthView({ transactions }: { transactions: Transaction[] }) {
    const debits = getDebits(transactions);
    const monthMap = new Map<string, { total: number; count: number; month: number; year: number }>();
    debits.forEach((t) => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const existing = monthMap.get(key) || { total: 0, count: 0, month: d.getMonth(), year: d.getFullYear() };
        monthMap.set(key, { total: existing.total + (t.debit || 0), count: existing.count + 1, month: d.getMonth(), year: d.getFullYear() });
    });
    const data = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => ({
            name: new Date(v.year, v.month).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
            total: v.total,
            avg: v.count > 0 ? v.total / v.count : 0,
            count: v.count,
        }));

    // Time of month pattern
    const earlyMonth = debits.filter((t) => new Date(t.date).getDate() <= 10).reduce((s, t) => s + (t.debit || 0), 0);
    const midMonth = debits.filter((t) => { const d = new Date(t.date).getDate(); return d > 10 && d <= 20; }).reduce((s, t) => s + (t.debit || 0), 0);
    const lateMonth = debits.filter((t) => new Date(t.date).getDate() > 20).reduce((s, t) => s + (t.debit || 0), 0);
    const totalSpend = earlyMonth + midMonth + lateMonth;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <p className="text-muted-foreground">Early (1-10)</p>
                    <p className="text-xl font-bold">{formatCurrency(earlyMonth)}</p>
                    <p className="text-xs text-muted-foreground">{totalSpend > 0 ? ((earlyMonth / totalSpend) * 100).toFixed(0) : 0}%</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <p className="text-muted-foreground">Mid (11-20)</p>
                    <p className="text-xl font-bold">{formatCurrency(midMonth)}</p>
                    <p className="text-xs text-muted-foreground">{totalSpend > 0 ? ((midMonth / totalSpend) * 100).toFixed(0) : 0}%</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <p className="text-muted-foreground">Late (21-31)</p>
                    <p className="text-xl font-bold">{formatCurrency(lateMonth)}</p>
                    <p className="text-xs text-muted-foreground">{totalSpend > 0 ? ((lateMonth / totalSpend) * 100).toFixed(0) : 0}%</p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }} />
                    <Bar dataKey="total" fill="#06b6d4" name="Total Spent" />
                </BarChart>
            </ResponsiveContainer>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 pr-4">Month</th>
                            <th className="pb-2 pr-4 text-right">Total</th>
                            <th className="pb-2 pr-4 text-right">Avg/Txn</th>
                            <th className="pb-2 text-right">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((d) => (
                            <tr key={d.name} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 pr-4 font-medium">{d.name}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.total)}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.avg)}</td>
                                <td className="py-2 text-right">{d.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Year View ───
function YearView({ transactions }: { transactions: Transaction[] }) {
    const debits = getDebits(transactions);
    const yearMap = new Map<number, { total: number; count: number }>();
    debits.forEach((t) => {
        const year = new Date(t.date).getFullYear();
        const existing = yearMap.get(year) || { total: 0, count: 0 };
        yearMap.set(year, { total: existing.total + (t.debit || 0), count: existing.count + 1 });
    });
    const data = Array.from(yearMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, v]) => ({
            name: String(year),
            total: v.total,
            avg: v.count > 0 ? v.total / v.count : 0,
            count: v.count,
            monthlyAvg: v.total / 12,
        }));

    // Monthly averages per year for the line chart
    const monthlyByYear = new Map<string, number>();
    debits.forEach((t) => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyByYear.set(key, (monthlyByYear.get(key) || 0) + (t.debit || 0));
    });
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const years = Array.from(yearMap.keys()).sort();
    const seasonalData = monthNames.map((month, i) => {
        const entry: Record<string, string | number> = { month };
        years.forEach((year) => {
            entry[String(year)] = monthlyByYear.get(`${year}-${i}`) || 0;
        });
        return entry;
    });
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                {data.map((d) => (
                    <div key={d.name} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <p className="text-muted-foreground">{d.name}</p>
                        <p className="text-xl font-bold">{formatCurrency(d.total)}</p>
                        <p className="text-xs text-muted-foreground">{d.count} transactions</p>
                    </div>
                ))}
            </div>
            {seasonalData.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={seasonalData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }} />
                        {years.map((year, i) => (
                            <Line key={year} type="monotone" dataKey={String(year)} stroke={colors[i % colors.length]} strokeWidth={2} name={String(year)} />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 pr-4">Year</th>
                            <th className="pb-2 pr-4 text-right">Total</th>
                            <th className="pb-2 pr-4 text-right">Monthly Avg</th>
                            <th className="pb-2 pr-4 text-right">Avg/Txn</th>
                            <th className="pb-2 text-right">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((d) => (
                            <tr key={d.name} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 pr-4 font-medium">{d.name}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.total)}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.monthlyAvg)}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.avg)}</td>
                                <td className="py-2 text-right">{d.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Custom Range View ───
function CustomRangeView({ transactions }: { transactions: Transaction[] }) {
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

    const debits = getDebits(filtered);
    const totalSpent = debits.reduce((s, t) => s + (t.debit || 0), 0);
    const avgPerTxn = debits.length > 0 ? totalSpent / debits.length : 0;

    // Daily breakdown for chart
    const dailyMap = new Map<string, number>();
    debits.forEach((t) => {
        const key = new Date(t.date).toISOString().split("T")[0];
        dailyMap.set(key, (dailyMap.get(key) || 0) + (t.debit || 0));
    });
    const dailyData = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({
            name: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
            total,
        }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="custom-start" className="text-sm">From</Label>
                    <Input id="custom-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="custom-end" className="text-sm">To</Label>
                    <Input id="custom-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <p className="text-muted-foreground">Total Spent</p>
                    <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <p className="text-muted-foreground">Avg/Transaction</p>
                    <p className="text-xl font-bold">{formatCurrency(avgPerTxn)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <p className="text-muted-foreground">Transactions</p>
                    <p className="text-xl font-bold">{debits.length}</p>
                </div>
            </div>
            {dailyData.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={Math.max(0, Math.floor(dailyData.length / 15))} />
                        <YAxis />
                        <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }} />
                        <Bar dataKey="total" fill="#f59e0b" name="Daily Spend" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

// ─── Main Component ───
export function SpendingPatterns({ transactions }: SpendingPatternsProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("week");

    const tabs: { key: ViewMode; label: string }[] = [
        { key: "week", label: "Week" },
        { key: "month", label: "Month" },
        { key: "year", label: "Year" },
        { key: "custom", label: "Custom" },
    ];

    const descriptions: Record<ViewMode, string> = {
        week: "Average spending by day of the week",
        month: "Spending breakdown by month and time of month",
        year: "Yearly spending trends and seasonal patterns",
        custom: "Analyze spending for a custom date range",
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Spending Patterns</CardTitle>
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
                {viewMode === "week" && <WeekView transactions={transactions} />}
                {viewMode === "month" && <MonthView transactions={transactions} />}
                {viewMode === "year" && <YearView transactions={transactions} />}
                {viewMode === "custom" && <CustomRangeView transactions={transactions} />}
            </CardContent>
        </Card>
    );
}
