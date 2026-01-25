"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { projectCashFlow } from "@/lib/forecast/cashflow";
import type { Transaction } from "@/types/transaction";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CashFlowProjectionProps {
    transactions: Transaction[];
}

export function CashFlowProjection({ transactions }: CashFlowProjectionProps) {
    const projections = useMemo(() => {
        return projectCashFlow(transactions, 90);
    }, [transactions]);

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined) return "N/A";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const chartData = projections.map((proj) => ({
        period: proj.period,
        inflow: proj.expectedInflow,
        outflow: -proj.expectedOutflow, // Negative for visual clarity
        net: proj.netFlow,
    }));

    const totalProjectedInflow = projections.reduce((sum, p) => sum + p.expectedInflow, 0);
    const totalProjectedOutflow = projections.reduce((sum, p) => sum + p.expectedOutflow, 0);
    const totalNetFlow = totalProjectedInflow - totalProjectedOutflow;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cash Flow Projection</CardTitle>
                <CardDescription>
                    Expected income and expenses for the next 90 days
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <p className="text-sm text-green-700">Expected Inflow</p>
                            </div>
                            <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(totalProjectedInflow)}
                            </p>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <p className="text-sm text-red-700">Expected Outflow</p>
                            </div>
                            <p className="text-2xl font-bold text-red-700">
                                {formatCurrency(totalProjectedOutflow)}
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Net Flow</p>
                            <p className={`text-2xl font-bold ${totalNetFlow >= 0 ? "text-green-600" : "text-red-600"
                                }`}>
                                {totalNetFlow >= 0 ? "+" : ""}
                                {formatCurrency(totalNetFlow)}
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number | undefined) => formatCurrency(Math.abs(value || 0))}
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "0.5rem",
                                }}
                            />
                            <Legend />
                            <Bar dataKey="inflow" fill="#10b981" name="Expected Inflow" />
                            <Bar dataKey="outflow" fill="#ef4444" name="Expected Outflow" />
                            <Bar dataKey="net" fill="#3b82f6" name="Net Flow" />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Period Details */}
                    <div>
                        <h3 className="font-semibold mb-3">Period Breakdown</h3>
                        <div className="space-y-3">
                            {projections.map((projection, index) => (
                                <div
                                    key={index}
                                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{projection.period}</span>
                                        <span className={`font-semibold ${projection.netFlow >= 0 ? "text-green-600" : "text-red-600"
                                            }`}>
                                            {projection.netFlow >= 0 ? "+" : ""}
                                            {formatCurrency(projection.netFlow)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Inflow</p>
                                            <p className="font-medium text-green-600">
                                                {formatCurrency(projection.expectedInflow)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Outflow</p>
                                            <p className="font-medium text-red-600">
                                                {formatCurrency(projection.expectedOutflow)}
                                            </p>
                                        </div>
                                    </div>
                                    {projection.recurringPayments.length > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Recurring Payments ({projection.recurringPayments.length})
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {projection.recurringPayments.slice(0, 3).map((payment, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs px-2 py-1 bg-muted rounded"
                                                    >
                                                        {payment.merchant}: {formatCurrency(payment.amount)}
                                                    </span>
                                                ))}
                                                {projection.recurringPayments.length > 3 && (
                                                    <span className="text-xs px-2 py-1 bg-muted rounded">
                                                        +{projection.recurringPayments.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
