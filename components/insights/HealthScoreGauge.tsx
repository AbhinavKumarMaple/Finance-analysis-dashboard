"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateHealthScore } from "@/lib/analytics/healthScore";
import type { Transaction } from "@/types/transaction";
import type { Budget } from "@/types/budget";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

interface HealthScoreGaugeProps {
    transactions: Transaction[];
    budgets: Budget[];
}

export function HealthScoreGauge({ transactions, budgets }: HealthScoreGaugeProps) {
    const healthScore = useMemo(() => {
        return calculateHealthScore(transactions, budgets);
    }, [transactions, budgets]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        if (score >= 40) return "text-orange-600";
        return "text-red-600";
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return "bg-green-500";
        if (score >= 60) return "bg-yellow-500";
        if (score >= 40) return "bg-orange-500";
        return "bg-red-500";
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "improving":
                return <TrendingUp className="h-4 w-4 text-green-600" />;
            case "declining":
                return <TrendingDown className="h-4 w-4 text-red-600" />;
            default:
                return <Minus className="h-4 w-4 text-gray-600" />;
        }
    };

    const components = [
        {
            name: "Savings Rate",
            ...healthScore.components.savingsRate,
        },
        {
            name: "Budget Adherence",
            ...healthScore.components.budgetAdherence,
        },
        {
            name: "Spending Diversity",
            ...healthScore.components.spendingDiversity,
        },
        {
            name: "Emergency Fund",
            ...healthScore.components.emergencyFund,
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Financial Health Score</CardTitle>
                <CardDescription>
                    Overall assessment of your financial wellness
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Main Score Display */}
                    <div className="flex items-center justify-center">
                        <div className="relative">
                            <svg className="w-48 h-48 transform -rotate-90">
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="none"
                                    className="text-muted"
                                />
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={`${(healthScore.score / 100) * 553} 553`}
                                    className={getScoreBgColor(healthScore.score)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-5xl font-bold ${getScoreColor(healthScore.score)}`}>
                                    {healthScore.score}
                                </span>
                                <span className="text-sm text-muted-foreground">out of 100</span>
                                <div className="flex items-center gap-1 mt-1">
                                    {getTrendIcon(healthScore.trend)}
                                    <span className="text-xs capitalize">{healthScore.trend}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Component Breakdown */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Score Breakdown</h3>
                        {components.map((component, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{component.name}</span>
                                    <span className="font-medium">
                                        {component.score}/100 (Weight: {(component.weight * 100).toFixed(0)}%)
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${getScoreBgColor(component.score)}`}
                                        style={{ width: `${component.score}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recommendations */}
                    {healthScore.recommendations.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Recommendations
                            </h3>
                            <ul className="space-y-2">
                                {healthScore.recommendations.map((rec, index) => (
                                    <li
                                        key={index}
                                        className="text-sm p-3 bg-muted rounded-lg flex items-start gap-2"
                                    >
                                        <span className="text-muted-foreground">•</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
