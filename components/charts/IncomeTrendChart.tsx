"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import type { MonthlyAmount } from "@/types/analytics";

interface IncomeTrendChartProps {
    data: MonthlyAmount[];
}

export function IncomeTrendChart({ data }: IncomeTrendChartProps) {
    const formatCurrency = (value: number | undefined) => {
        if (value === undefined) return "N/A";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
            notation: "compact",
        }).format(value);
    };

    const chartData = data.map((item) => ({
        month: item.month,
        amount: item.amount,
    }));

    return (
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis
                    dataKey="month"
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
                <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Income"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
