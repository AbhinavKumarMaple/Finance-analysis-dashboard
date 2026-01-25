"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { detectRecurringPayments } from "@/lib/analytics/recurring";
import type { Transaction } from "@/types/transaction";
import { Calendar, TrendingUp, Repeat } from "lucide-react";

interface RecurringPaymentsProps {
    transactions: Transaction[];
}

export function RecurringPayments({ transactions }: RecurringPaymentsProps) {
    const recurringPayments = useMemo(() => {
        return detectRecurringPayments(transactions);
    }, [transactions]);

    const formatCurrency = (value: number) => {
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

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "subscription":
                return "bg-blue-100 text-blue-800";
            case "emi":
                return "bg-purple-100 text-purple-800";
            case "utility":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getFrequencyIcon = (frequency: string) => {
        switch (frequency) {
            case "weekly":
                return <Repeat className="h-4 w-4" />;
            case "monthly":
                return <Calendar className="h-4 w-4" />;
            case "quarterly":
            case "yearly":
                return <TrendingUp className="h-4 w-4" />;
            default:
                return <Repeat className="h-4 w-4" />;
        }
    };

    const totalMonthlyRecurring = recurringPayments
        .filter((p) => p.frequency === "monthly")
        .reduce((sum, p) => sum + p.amount, 0);

    const totalYearlyRecurring = recurringPayments.reduce((sum, p) => {
        switch (p.frequency) {
            case "weekly":
                return sum + p.amount * 52;
            case "monthly":
                return sum + p.amount * 12;
            case "quarterly":
                return sum + p.amount * 4;
            case "yearly":
                return sum + p.amount;
            default:
                return sum;
        }
    }, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recurring Payments</CardTitle>
                <CardDescription>
                    Detected subscriptions, EMIs, and regular payments
                </CardDescription>
            </CardHeader>
            <CardContent>
                {recurringPayments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        No recurring payments detected
                    </p>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Monthly Recurring</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(totalMonthlyRecurring)}
                                </p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Yearly Estimate</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(totalYearlyRecurring)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {recurringPayments.map((payment, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getFrequencyIcon(payment.frequency)}
                                            <p className="font-medium">{payment.merchant}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Badge
                                                variant="secondary"
                                                className={getCategoryColor(payment.category)}
                                            >
                                                {payment.category}
                                            </Badge>
                                            <span>•</span>
                                            <span className="capitalize">{payment.frequency}</span>
                                            <span>•</span>
                                            <span>
                                                Confidence: {(payment.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">
                                            {formatCurrency(payment.amount)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Next: {formatDate(payment.nextExpectedDate)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
