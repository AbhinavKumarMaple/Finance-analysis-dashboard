"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { forecastEndOfMonthBalance, generateWarnings } from "@/lib/forecast/balance";
import { detectRecurringPayments } from "@/lib/analytics/recurring";
import type { Transaction } from "@/types/transaction";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BalanceForecastProps {
    transactions: Transaction[];
}

export function BalanceForecast({ transactions }: BalanceForecastProps) {
    const recurringPayments = useMemo(() => {
        return detectRecurringPayments(transactions);
    }, [transactions]);

    const forecast = useMemo(() => {
        return forecastEndOfMonthBalance(transactions, recurringPayments);
    }, [transactions, recurringPayments]);

    const warnings = useMemo(() => {
        return generateWarnings([forecast], { lowBalance: 10000 });
    }, [forecast]);

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined) return "N/A";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(date);
    };

    const currentBalance = transactions.length > 0
        ? transactions[transactions.length - 1].balance
        : 0;

    const chartData = [
        {
            date: "Current",
            balance: currentBalance,
            low: currentBalance,
            high: currentBalance,
        },
        {
            date: formatDate(forecast.date),
            balance: forecast.predictedBalance,
            low: forecast.confidenceInterval.low,
            high: forecast.confidenceInterval.high,
        },
    ];

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "critical":
                return <AlertTriangle className="h-4 w-4" />;
            case "warning":
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "bg-red-100 text-red-800 border-red-200";
            case "warning":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            default:
                return "bg-blue-100 text-blue-800 border-blue-200";
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>End of Month Balance Forecast</CardTitle>
                    <CardDescription>
                        Predicted balance based on current trends and recurring payments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Current Balance</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(currentBalance)}
                                </p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Predicted Balance</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(forecast.predictedBalance)}
                                </p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Change</p>
                                <p className={`text-2xl font-bold ${forecast.predictedBalance >= currentBalance
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}>
                                    {forecast.predictedBalance >= currentBalance ? "+" : ""}
                                    {formatCurrency(forecast.predictedBalance - currentBalance)}
                                </p>
                            </div>
                        </div>

                        {/* Chart */}
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip
                                    formatter={formatCurrency}
                                    contentStyle={{
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "0.5rem",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="high"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.1}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="low"
                                    stroke="#ef4444"
                                    fill="#ef4444"
                                    fillOpacity={0.1}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 6 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>

                        {/* Confidence Interval */}
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">Confidence Range</p>
                            <div className="flex justify-between text-sm">
                                <span>
                                    Low: {formatCurrency(forecast.confidenceInterval.low)}
                                </span>
                                <span>
                                    High: {formatCurrency(forecast.confidenceInterval.high)}
                                </span>
                            </div>
                        </div>

                        {/* Assumptions */}
                        {forecast.assumptions.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Forecast Assumptions</p>
                                <ul className="space-y-1">
                                    {forecast.assumptions.map((assumption, index) => (
                                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span>•</span>
                                            <span>{assumption}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Warnings */}
            {warnings.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Forecast Warnings</CardTitle>
                        <CardDescription>
                            Potential issues detected in your forecast
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {warnings.map((warning, index) => (
                                <div
                                    key={index}
                                    className={`p-4 border rounded-lg ${getSeverityColor(warning.severity)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        {getSeverityIcon(warning.severity)}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="capitalize">
                                                    {warning.type.replace("_", " ")}
                                                </Badge>
                                                <span className="text-xs">
                                                    {formatDate(warning.date)}
                                                </span>
                                            </div>
                                            <p className="text-sm">{warning.message}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
