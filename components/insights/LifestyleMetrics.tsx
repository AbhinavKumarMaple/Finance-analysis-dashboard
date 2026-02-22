"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeLifestyle } from "@/lib/analytics/lifestyle";
import type { Transaction } from "@/types/transaction";
import type { Tag } from "@/types/tag";
import { UtensilsCrossed, ShoppingBag, Zap, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

type ViewMode = "overview" | "month" | "year" | "custom";

interface LifestyleMetricsProps {
    transactions: Transaction[];
    tags: Tag[];
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

// Category detection helpers
function isFoodDelivery(details: string) {
    const kw = ["swiggy", "zomato", "ubereats", "dunzo", "food", "restaurant", "pizza", "burger"];
    const d = details.toLowerCase();
    return kw.some((k) => d.includes(k));
}
function isShopping(details: string) {
    const kw = ["amazon", "flipkart", "myntra", "ajio", "shopping", "mall", "store"];
    const d = details.toLowerCase();
    return kw.some((k) => d.includes(k));
}
function isUtility(details: string) {
    const kw = ["electric", "water", "gas", "internet", "broadband", "mobile", "phone", "utility"];
    const d = details.toLowerCase();
    return kw.some((k) => d.includes(k));
}
function isInvestment(details: string) {
    const kw = ["mutual fund", "sip", "investment", "equity", "stock", "zerodha", "groww", "upstox"];
    const d = details.toLowerCase();
    return kw.some((k) => d.includes(k));
}

function categorize(t: Transaction, tags: Tag[]): string {
    // Check tags first
    for (const tag of tags) {
        if (t.tagIds.includes(tag.id)) {
            const name = tag.name.toLowerCase();
            if (name.includes("food") && name.includes("delivery")) return "food";
            if (name.includes("shopping")) return "shopping";
            if (name.includes("utilities")) return "utility";
            if (name.includes("investment")) return "investment";
        }
    }
    if (isFoodDelivery(t.details)) return "food";
    if (isShopping(t.details)) return "shopping";
    if (isUtility(t.details)) return "utility";
    if (isInvestment(t.details)) return "investment";
    return "other";
}

// ─── Overview (original cards) ───
function OverviewView({ transactions, tags }: { transactions: Transaction[]; tags: Tag[] }) {
    const lifestyle = useMemo(() => analyzeLifestyle(transactions, tags), [transactions, tags]);

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                        <CardTitle>Food Delivery</CardTitle>
                    </div>
                    <CardDescription>Your food ordering habits</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Orders</p>
                                <p className="text-2xl font-bold">{lifestyle.foodDelivery.frequency}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                                <p className="text-2xl font-bold">{formatCurrency(lifestyle.foodDelivery.averageOrderValue)}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Spent</p>
                            <p className="text-3xl font-bold">{formatCurrency(lifestyle.foodDelivery.totalSpend)}</p>
                        </div>
                        {lifestyle.foodDelivery.topPlatforms.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Top Platforms</p>
                                <div className="space-y-2">
                                    {lifestyle.foodDelivery.topPlatforms.slice(0, 3).map((platform, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span>{platform.merchant}</span>
                                            <span className="font-medium">{formatCurrency(platform.totalAmount)}</span>
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
                    <CardDescription>Your shopping patterns</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Transactions</p>
                                <p className="text-2xl font-bold">{lifestyle.shopping.frequency}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                                <p className="text-2xl font-bold">{formatCurrency(lifestyle.shopping.averageTransaction)}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Spent</p>
                            <p className="text-3xl font-bold">{formatCurrency(lifestyle.shopping.totalSpend)}</p>
                        </div>
                        {lifestyle.shopping.topMerchants.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Top Merchants</p>
                                <div className="space-y-2">
                                    {lifestyle.shopping.topMerchants.slice(0, 3).map((merchant, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span>{merchant.merchant}</span>
                                            <span className="font-medium">{formatCurrency(merchant.totalAmount)}</span>
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
                    <CardDescription>Monthly utility expenses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Monthly Average</p>
                            <p className="text-3xl font-bold">{formatCurrency(lifestyle.utilities.monthlyAverage)}</p>
                        </div>
                        {lifestyle.utilities.trend.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Recent Months</p>
                                <div className="space-y-2">
                                    {lifestyle.utilities.trend.slice(-3).map((month, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span>{month.month}</span>
                                            <span className="font-medium">{formatCurrency(month.amount)}</span>
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
                    <CardDescription>Your investment discipline</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">SIP Detected</p>
                            <p className="text-2xl font-bold">{lifestyle.investments.sipDetected ? "Yes" : "No"}</p>
                        </div>
                        {lifestyle.investments.sipDetected && (
                            <>
                                <div>
                                    <p className="text-sm text-muted-foreground">Monthly Investment</p>
                                    <p className="text-3xl font-bold">{formatCurrency(lifestyle.investments.monthlyInvestment)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Consistency Score</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-muted rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${lifestyle.investments.consistency}%` }} />
                                        </div>
                                        <span className="text-sm font-medium">{lifestyle.investments.consistency}%</span>
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

// ─── Month View ───
function MonthView({ transactions, tags }: { transactions: Transaction[]; tags: Tag[] }) {
    const debits = getDebits(transactions);

    const monthlyData = useMemo(() => {
        const monthMap = new Map<string, { food: number; shopping: number; utility: number; investment: number }>();
        debits.forEach((t) => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (!monthMap.has(key)) monthMap.set(key, { food: 0, shopping: 0, utility: 0, investment: 0 });
            const entry = monthMap.get(key)!;
            const cat = categorize(t, tags);
            if (cat === "food") entry.food += t.debit || 0;
            else if (cat === "shopping") entry.shopping += t.debit || 0;
            else if (cat === "utility") entry.utility += t.debit || 0;
            else if (cat === "investment") entry.investment += t.debit || 0;
        });
        return Array.from(monthMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, v]) => {
                const [y, m] = key.split("-");
                return {
                    name: new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
                    food: v.food,
                    shopping: v.shopping,
                    utility: v.utility,
                    investment: v.investment,
                };
            });
    }, [debits, tags]);

    return (
        <div className="space-y-4">
            {monthlyData.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }} />
                        <Bar dataKey="food" fill="#f97316" name="Food" stackId="a" />
                        <Bar dataKey="shopping" fill="#ec4899" name="Shopping" stackId="a" />
                        <Bar dataKey="utility" fill="#eab308" name="Utilities" stackId="a" />
                        <Bar dataKey="investment" fill="#10b981" name="Investment" stackId="a" />
                    </BarChart>
                </ResponsiveContainer>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 pr-4">Month</th>
                            <th className="pb-2 pr-4 text-right">Food</th>
                            <th className="pb-2 pr-4 text-right">Shopping</th>
                            <th className="pb-2 pr-4 text-right">Utilities</th>
                            <th className="pb-2 text-right">Investment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthlyData.map((d) => (
                            <tr key={d.name} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 pr-4 font-medium">{d.name}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.food)}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.shopping)}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.utility)}</td>
                                <td className="py-2 text-right">{formatCurrency(d.investment)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Year View ───
function YearView({ transactions, tags }: { transactions: Transaction[]; tags: Tag[] }) {
    const debits = getDebits(transactions);

    const yearlyData = useMemo(() => {
        const yearMap = new Map<number, { food: number; shopping: number; utility: number; investment: number }>();
        debits.forEach((t) => {
            const year = new Date(t.date).getFullYear();
            if (!yearMap.has(year)) yearMap.set(year, { food: 0, shopping: 0, utility: 0, investment: 0 });
            const entry = yearMap.get(year)!;
            const cat = categorize(t, tags);
            if (cat === "food") entry.food += t.debit || 0;
            else if (cat === "shopping") entry.shopping += t.debit || 0;
            else if (cat === "utility") entry.utility += t.debit || 0;
            else if (cat === "investment") entry.investment += t.debit || 0;
        });
        return Array.from(yearMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([year, v]) => ({ name: String(year), ...v, total: v.food + v.shopping + v.utility + v.investment }));
    }, [debits, tags]);

    // Trend lines per category across years
    const trendData = useMemo(() => {
        const categories = ["food", "shopping", "utility", "investment"] as const;
        return yearlyData.map((d) => ({
            name: d.name,
            food: d.food,
            shopping: d.shopping,
            utility: d.utility,
            investment: d.investment,
        }));
    }, [yearlyData]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                {yearlyData.map((d) => (
                    <div key={d.name} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <p className="text-muted-foreground">{d.name}</p>
                        <p className="text-xl font-bold">{formatCurrency(d.total)}</p>
                    </div>
                ))}
            </div>
            {trendData.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }} />
                        <Line type="monotone" dataKey="food" stroke="#f97316" strokeWidth={2} name="Food" />
                        <Line type="monotone" dataKey="shopping" stroke="#ec4899" strokeWidth={2} name="Shopping" />
                        <Line type="monotone" dataKey="utility" stroke="#eab308" strokeWidth={2} name="Utilities" />
                        <Line type="monotone" dataKey="investment" stroke="#10b981" strokeWidth={2} name="Investment" />
                    </LineChart>
                </ResponsiveContainer>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 pr-4">Year</th>
                            <th className="pb-2 pr-4 text-right">Food</th>
                            <th className="pb-2 pr-4 text-right">Shopping</th>
                            <th className="pb-2 pr-4 text-right">Utilities</th>
                            <th className="pb-2 pr-4 text-right">Investment</th>
                            <th className="pb-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {yearlyData.map((d) => (
                            <tr key={d.name} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 pr-4 font-medium">{d.name}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.food)}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.shopping)}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.utility)}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(d.investment)}</td>
                                <td className="py-2 text-right font-bold">{formatCurrency(d.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Custom Range View ───
function CustomView({ transactions, tags }: { transactions: Transaction[]; tags: Tag[] }) {
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

    const lifestyle = useMemo(() => analyzeLifestyle(filtered, tags), [filtered, tags]);
    const debits = getDebits(filtered);

    const summary = useMemo(() => {
        const catTotals = { food: 0, shopping: 0, utility: 0, investment: 0 };
        debits.forEach((t) => {
            const cat = categorize(t, tags);
            if (cat in catTotals) catTotals[cat as keyof typeof catTotals] += t.debit || 0;
        });
        return catTotals;
    }, [debits, tags]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="life-start" className="text-sm">From</Label>
                    <Input id="life-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="life-end" className="text-sm">To</Label>
                    <Input id="life-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                    <p className="text-muted-foreground">Food</p>
                    <p className="text-xl font-bold">{formatCurrency(summary.food)}</p>
                    <p className="text-xs text-muted-foreground">{lifestyle.foodDelivery.frequency} orders</p>
                </div>
                <div className="rounded-lg bg-pink-50 p-3 dark:bg-pink-900/20">
                    <p className="text-muted-foreground">Shopping</p>
                    <p className="text-xl font-bold">{formatCurrency(summary.shopping)}</p>
                    <p className="text-xs text-muted-foreground">{lifestyle.shopping.frequency} txns</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                    <p className="text-muted-foreground">Utilities</p>
                    <p className="text-xl font-bold">{formatCurrency(summary.utility)}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <p className="text-muted-foreground">Investment</p>
                    <p className="text-xl font-bold">{formatCurrency(summary.investment)}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───
export function LifestyleMetrics({ transactions, tags }: LifestyleMetricsProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("overview");

    const tabs: { key: ViewMode; label: string }[] = [
        { key: "overview", label: "Overview" },
        { key: "month", label: "Month" },
        { key: "year", label: "Year" },
        { key: "custom", label: "Custom" },
    ];

    const descriptions: Record<ViewMode, string> = {
        overview: "Lifestyle spending breakdown by category",
        month: "Monthly lifestyle category trends",
        year: "Yearly lifestyle spending comparison",
        custom: "Analyze lifestyle spending for a custom date range",
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Lifestyle Metrics</CardTitle>
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
                {viewMode === "overview" && <OverviewView transactions={transactions} tags={tags} />}
                {viewMode === "month" && <MonthView transactions={transactions} tags={tags} />}
                {viewMode === "year" && <YearView transactions={transactions} tags={tags} />}
                {viewMode === "custom" && <CustomView transactions={transactions} tags={tags} />}
            </CardContent>
        </Card>
    );
}
