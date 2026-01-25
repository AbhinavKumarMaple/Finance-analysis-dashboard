"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";

interface SpendingPieChartProps {
    data: { name: string; value: number; color: string }[];
}

export function SpendingPieChart({ data }: SpendingPieChartProps) {
    const formatCurrency = (value: number | undefined) => {
        if (value === undefined) return "N/A";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const total = data.reduce((sum, item) => sum + item.value, 0);

    const chartData = data.map((item) => ({
        ...item,
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0",
    }));

    const renderLabel = (entry: any) => {
        // Hide labels on small screens
        if (typeof window !== "undefined" && window.innerWidth < 640) {
            return "";
        }
        return `${entry.name}: ${entry.percentage}%`;
    };

    return (
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderLabel}
                    outerRadius="70%"
                    fill="#8884d8"
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
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
            </PieChart>
        </ResponsiveContainer>
    );
}
