"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { analyzeSpendingPatterns } from "@/lib/analytics/spending";
import type { Transaction } from "@/types/transaction";

interface SpendingPatternsProps {
    transactions: Transaction[];
}

export function SpendingPatterns({ transactions }: SpendingPatternsProps) {
    const patterns = useMemo(() => {
        return analyzeSpendingPatterns(transactions);
    }, [transactions]);

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined) return "N/A";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const dayOfWeekData = [
        { day: "Sun", amount: patterns.dayOfWeekDistribution[0] },
        { day: "Mon", amount: patterns.dayOfWeekDistribution[1] },
        { day: "Tue", amount: patterns.dayOfWeekDistribution[2] },
        { day: "Wed", amount: patterns.dayOfWeekDistribution[3] },
        { day: "Thu", amount: patterns.dayOfWeekDistribution[4] },
        { day: "Fri", amount: patterns.dayOfWeekDistribution[5] },
        { day: "Sat", amount: patterns.dayOfWeekDistribution[6] },
    ];

    const timeOfMonthData = [
        { period: "Early (1-10)", amount: patterns.timeOfMonthPattern.earlyMonth },
        { period: "Mid (11-20)", amount: patterns.timeOfMonthPattern.midMonth },
        { period: "Late (21-31)", amount: patterns.timeOfMonthPattern.lateMonth },
    ];

    const seasonalData = patterns.seasonalTrends.map((trend: { month: number; averageSpend: number }) => ({
        month: new Date(2024, trend.month - 1).toLocaleString("default", { month: "short" }),
        amount: trend.averageSpend,
    }));

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Day of Week Spending</CardTitle>
                    <CardDescription>
                        Average spending by day of the week
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Weekday Average</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(patterns.weekdayAverage)}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Weekend Average</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(patterns.weekendAverage)}
                                </p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={dayOfWeekData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip
                                    formatter={formatCurrency}
                                    contentStyle={{
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "0.5rem",
                                    }}
                                />
                                <Bar dataKey="amount" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Time of Month Pattern</CardTitle>
                    <CardDescription>
                        Spending distribution across the month
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={timeOfMonthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip
                                formatter={formatCurrency}
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "0.5rem",
                                }}
                            />
                            <Bar dataKey="amount" fill="#06b6d4" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {seasonalData.length > 0 && (
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Seasonal Trends</CardTitle>
                        <CardDescription>
                            Average monthly spending patterns
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={seasonalData}>
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
                                    dataKey="amount"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
