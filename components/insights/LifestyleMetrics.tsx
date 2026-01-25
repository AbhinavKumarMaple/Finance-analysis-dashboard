"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeLifestyle } from "@/lib/analytics/lifestyle";
import type { Transaction } from "@/types/transaction";
import type { Tag } from "@/types/tag";
import { UtensilsCrossed, ShoppingBag, Zap, TrendingUp } from "lucide-react";

interface LifestyleMetricsProps {
    transactions: Transaction[];
    tags: Tag[];
}

export function LifestyleMetrics({ transactions, tags }: LifestyleMetricsProps) {
    const lifestyle = useMemo(() => {
        return analyzeLifestyle(transactions, tags);
    }, [transactions, tags]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                        <CardTitle>Food Delivery</CardTitle>
                    </div>
                    <CardDescription>
                        Your food ordering habits
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Orders</p>
                                <p className="text-2xl font-bold">
                                    {lifestyle.foodDelivery.frequency}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(lifestyle.foodDelivery.averageOrderValue)}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Spent</p>
                            <p className="text-3xl font-bold">
                                {formatCurrency(lifestyle.foodDelivery.totalSpend)}
                            </p>
                        </div>
                        {lifestyle.foodDelivery.topPlatforms.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Top Platforms</p>
                                <div className="space-y-2">
                                    {lifestyle.foodDelivery.topPlatforms.slice(0, 3).map((platform, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span>{platform.merchant}</span>
                                            <span className="font-medium">
                                                {formatCurrency(platform.totalAmount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-pink-500" />
                        <CardTitle>Shopping</CardTitle>
                    </div>
                    <CardDescription>
                        Your shopping patterns
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Transactions</p>
                                <p className="text-2xl font-bold">
                                    {lifestyle.shopping.frequency}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(lifestyle.shopping.averageTransaction)}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Spent</p>
                            <p className="text-3xl font-bold">
                                {formatCurrency(lifestyle.shopping.totalSpend)}
                            </p>
                        </div>
                        {lifestyle.shopping.topMerchants.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Top Merchants</p>
                                <div className="space-y-2">
                                    {lifestyle.shopping.topMerchants.slice(0, 3).map((merchant, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span>{merchant.merchant}</span>
                                            <span className="font-medium">
                                                {formatCurrency(merchant.totalAmount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <CardTitle>Utilities</CardTitle>
                    </div>
                    <CardDescription>
                        Monthly utility expenses
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Monthly Average</p>
                            <p className="text-3xl font-bold">
                                {formatCurrency(lifestyle.utilities.monthlyAverage)}
                            </p>
                        </div>
                        {lifestyle.utilities.trend.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Recent Months</p>
                                <div className="space-y-2">
                                    {lifestyle.utilities.trend.slice(-3).map((month, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span>{month.month}</span>
                                            <span className="font-medium">
                                                {formatCurrency(month.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <CardTitle>Investments</CardTitle>
                    </div>
                    <CardDescription>
                        Your investment discipline
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">SIP Detected</p>
                            <p className="text-2xl font-bold">
                                {lifestyle.investments.sipDetected ? "Yes" : "No"}
                            </p>
                        </div>
                        {lifestyle.investments.sipDetected && (
                            <>
                                <div>
                                    <p className="text-sm text-muted-foreground">Monthly Investment</p>
                                    <p className="text-3xl font-bold">
                                        {formatCurrency(lifestyle.investments.monthlyInvestment)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Consistency Score</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-muted rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{
                                                    width: `${lifestyle.investments.consistency}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium">
                                            {lifestyle.investments.consistency}%
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
