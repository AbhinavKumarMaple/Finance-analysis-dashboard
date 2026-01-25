"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import type { CashFlowMetrics } from "@/types/analytics";

interface CashFlowChartProps {
    data: CashFlowMetrics[];
    granularity: "daily" | "weekly" | "monthly";
}

export function CashFlowChart({ data, granularity }: CashFlowChartProps) {
    const formatCurrency = (value: number | undefined) => {
        if (value === undefined) return "N/A";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
            notation: "compact",
        }).format(value);
    };

    const chartData = data.map((item, index) => ({
        name: `Period ${index + 1}`,
        inflow: item.totalInflow,
        outflow: item.totalOutflow,
        net: item.netCashFlow,
    }));

    return (
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis
                    dataKey="name"
                    className="text-xs text-gray-600 dark:text-gray-400"
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    tickFormatter={formatCurrency}
                    className="text-xs text-gray-600 dark:text-gray-400"
                    tick={{ fontSize: 12 }}
                />
                <Tooltip
                    formatter={formatCurrency}
                    contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                    }}
                />
                <Legend wrapperStyle={{ fontSize: "0.875rem" }} />
                <Bar dataKey="inflow" fill="#10b981" name="Inflow" />
                <Bar dataKey="outflow" fill="#ef4444" name="Outflow" />
                <Bar dataKey="net" fill="#3b82f6" name="Net" />
            </BarChart>
        </ResponsiveContainer>
    );
}
