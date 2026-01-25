"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import type { MerchantSpend } from "@/types/analytics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, ArrowRight } from "lucide-react";

interface TopMerchantsChartProps {
    data: MerchantSpend[];
}

export function TopMerchantsChart({ data }: TopMerchantsChartProps) {
    const router = useRouter();
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"amount" | "count">("amount");
    const [useRegex, setUseRegex] = useState(false);
    const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined) return "N/A";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
            notation: "compact",
        }).format(value);
    };

    // Filter and sort data
    const filteredData = useMemo(() => {
        let filtered = [...data];

        // Apply search filter
        if (searchTerm.trim()) {
            if (useRegex) {
                try {
                    const regex = new RegExp(searchTerm, "i");
                    filtered = filtered.filter((m) => regex.test(m.merchant));
                } catch (e) {
                    // Invalid regex, fall back to simple search
                    const term = searchTerm.toLowerCase();
                    filtered = filtered.filter((m) =>
                        m.merchant.toLowerCase().includes(term)
                    );
                }
            } else {
                // Check if search contains AND operator
                if (searchTerm.toUpperCase().includes(' AND ')) {
                    // Parse quoted terms: "TERM1" AND "TERM2" AND "TERM3"
                    const quotedTerms = searchTerm.match(/"([^"]+)"/g);

                    if (quotedTerms && quotedTerms.length > 0) {
                        // Remove quotes from terms
                        const terms = quotedTerms.map(t => t.replace(/"/g, '').toLowerCase());

                        // Filter: merchant must contain ALL terms
                        filtered = filtered.filter((m) => {
                            const merchantLower = m.merchant.toLowerCase();
                            return terms.every(term => merchantLower.includes(term));
                        });
                    } else {
                        // No quotes found, split by AND and trim
                        const terms = searchTerm
                            .split(/\s+AND\s+/i)
                            .map(t => t.trim().toLowerCase())
                            .filter(t => t.length > 0);

                        // Filter: merchant must contain ALL terms
                        filtered = filtered.filter((m) => {
                            const merchantLower = m.merchant.toLowerCase();
                            return terms.every(term => merchantLower.includes(term));
                        });
                    }
                } else if (searchTerm.toUpperCase().includes(' OR ')) {
                    // Parse quoted terms: "TERM1" OR "TERM2" OR "TERM3"
                    const quotedTerms = searchTerm.match(/"([^"]+)"/g);

                    if (quotedTerms && quotedTerms.length > 0) {
                        // Remove quotes from terms
                        const terms = quotedTerms.map(t => t.replace(/"/g, '').toLowerCase());

                        // Filter: merchant must contain ANY term
                        filtered = filtered.filter((m) => {
                            const merchantLower = m.merchant.toLowerCase();
                            return terms.some(term => merchantLower.includes(term));
                        });
                    } else {
                        // No quotes found, split by OR and trim
                        const terms = searchTerm
                            .split(/\s+OR\s+/i)
                            .map(t => t.trim().toLowerCase())
                            .filter(t => t.length > 0);

                        // Filter: merchant must contain ANY term
                        filtered = filtered.filter((m) => {
                            const merchantLower = m.merchant.toLowerCase();
                            return terms.some(term => merchantLower.includes(term));
                        });
                    }
                } else {
                    // Simple search (no AND/OR)
                    const term = searchTerm.toLowerCase();
                    filtered = filtered.filter((m) =>
                        m.merchant.toLowerCase().includes(term)
                    );
                }
            }
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === "amount") {
                return b.totalAmount - a.totalAmount;
            } else {
                return b.transactionCount - a.transactionCount;
            }
        });

        return filtered.slice(0, limit);
    }, [data, searchTerm, useRegex, sortBy, limit]);

    const chartData = filteredData.map((merchant) => ({
        name:
            merchant.merchant.length > 20
                ? merchant.merchant.substring(0, 20) + "..."
                : merchant.merchant,
        fullName: merchant.merchant,
        amount: merchant.totalAmount,
        count: merchant.transactionCount,
    }));

    // Calculate selected totals
    const selectedTotals = useMemo(() => {
        const selected = filteredData.filter(m => selectedMerchants.includes(m.merchant));
        return {
            totalAmount: selected.reduce((sum, m) => sum + m.totalAmount, 0),
            totalCount: selected.reduce((sum, m) => sum + m.transactionCount, 0),
            merchants: selected.length,
        };
    }, [filteredData, selectedMerchants]);

    // Handle bar click
    const handleBarClick = (data: any) => {
        if (data && data.fullName) {
            setSelectedMerchants(prev => {
                if (prev.includes(data.fullName)) {
                    // Deselect
                    return prev.filter(m => m !== data.fullName);
                } else {
                    // Select
                    return [...prev, data.fullName];
                }
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                    <Label htmlFor="merchant-search" className="text-xs text-gray-500 dark:text-gray-400">
                        Search Merchants
                    </Label>
                    <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="merchant-search"
                            placeholder={useRegex ? "Enter regex pattern..." : '"SWIGGY" OR "ZOMATO"'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="use-regex"
                            checked={useRegex}
                            onChange={(e) => setUseRegex(e.target.checked)}
                            className="h-3 w-3 rounded border-gray-300"
                        />
                        <label htmlFor="use-regex" className="text-xs text-gray-500 dark:text-gray-400">
                            Use regex | Or use AND/OR with quotes
                        </label>
                    </div>
                </div>

                {/* Sort By */}
                <div>
                    <Label htmlFor="sort-by" className="text-xs text-gray-500 dark:text-gray-400">
                        Sort By
                    </Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as "amount" | "count")}>
                        <SelectTrigger id="sort-by" className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="amount">Total Amount</SelectItem>
                            <SelectItem value="count">Transaction Count</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Limit */}
                <div>
                    <Label htmlFor="limit" className="text-xs text-gray-500 dark:text-gray-400">
                        Show Top
                    </Label>
                    <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                        <SelectTrigger id="limit" className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 merchants</SelectItem>
                            <SelectItem value="10">10 merchants</SelectItem>
                            <SelectItem value="15">15 merchants</SelectItem>
                            <SelectItem value="20">20 merchants</SelectItem>
                            <SelectItem value="30">30 merchants</SelectItem>
                            <SelectItem value="50">50 merchants</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Filter className="h-4 w-4" />
                    <span>
                        Showing {filteredData.length} of {data.length} merchants
                        {searchTerm && ` matching "${searchTerm}"`}
                    </span>
                </div>
                {selectedMerchants.length > 0 && (
                    <button
                        onClick={() => setSelectedMerchants([])}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        Clear selection
                    </button>
                )}
            </div>

            {/* Selection Stats */}
            {selectedMerchants.length > 0 && (
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Selected: {selectedTotals.merchants} merchant{selectedTotals.merchants !== 1 ? 's' : ''}
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">Total Spent</p>
                                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                        {formatCurrency(selectedTotals.totalAmount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">Transactions</p>
                                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                        {selectedTotals.totalCount}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                const merchantsParam = encodeURIComponent(selectedMerchants.join(','));
                                router.push(`/transactions?merchants=${merchantsParam}`);
                            }}
                            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                        >
                            View Transactions
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {selectedMerchants.map(merchant => (
                            <span
                                key={merchant}
                                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            >
                                {merchant.length > 30 ? merchant.substring(0, 30) + '...' : merchant}
                                <button
                                    onClick={() => setSelectedMerchants(prev => prev.filter(m => m !== merchant))}
                                    className="hover:text-blue-900 dark:hover:text-blue-100"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        💡 Click bars to add/remove from selection, then view their transactions
                    </p>
                </div>
            )}

            {/* No results message */}
            {filteredData.length === 0 && searchTerm && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        No merchants found
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {searchTerm.toUpperCase().includes(' AND ') ? (
                            <>
                                💡 Tip: AND requires ALL terms in the SAME merchant name.
                                <br />
                                Try using OR instead: <code className="bg-gray-100 px-1 dark:bg-gray-800">"SWIGGY" OR "ZOMATO"</code>
                            </>
                        ) : (
                            'Try adjusting your search terms or filters'
                        )}
                    </p>
                </div>
            )}

            {/* Chart */}
            {filteredData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%" minHeight={Math.max(300, filteredData.length * 40)}>
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                        <XAxis
                            type="number"
                            tickFormatter={formatCurrency}
                            className="text-xs text-gray-600 dark:text-gray-400"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            className="text-xs text-gray-600 dark:text-gray-400"
                            tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === "amount") return formatCurrency(value as number);
                                return value;
                            }}
                            labelFormatter={(label) => {
                                const item = chartData.find(d => d.name === label);
                                return item?.fullName || label;
                            }}
                            contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                border: "1px solid #e5e7eb",
                                borderRadius: "0.5rem",
                                fontSize: "0.875rem",
                            }}
                        />
                        <Bar
                            dataKey="amount"
                            fill="#3b82f6"
                            name="Total Spent"
                            onClick={handleBarClick}
                            cursor="pointer"
                            shape={(props: any) => {
                                const isSelected = selectedMerchants.includes(props.fullName);
                                return (
                                    <rect
                                        {...props}
                                        fill={isSelected ? "#1d4ed8" : "#3b82f6"}
                                        opacity={isSelected ? 1 : 0.8}
                                        stroke={isSelected ? "#1e40af" : "none"}
                                        strokeWidth={isSelected ? 2 : 0}
                                    />
                                );
                            }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}

            {/* Search examples */}
            {!useRegex && searchTerm && (
                <div className="mt-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                        Search Tips:
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                        <li>• Simple: <code className="bg-blue-100 px-1 dark:bg-blue-900">ZOMATO</code> - Contains "ZOMATO"</li>
                        <li>• OR (show multiple): <code className="bg-blue-100 px-1 dark:bg-blue-900">"SWIGGY" OR "ZOMATO"</code> - Shows both</li>
                        <li>• AND (same name): <code className="bg-blue-100 px-1 dark:bg-blue-900">"UPI" AND "PHONEPE"</code> - Both in same name</li>
                        <li>• Complex names: <code className="bg-blue-100 px-1 dark:bg-blue-900">"FOOD AND BEVERAGES"</code> - Use quotes</li>
                    </ul>
                    <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                        ⚠️ Use OR to show multiple different merchants (like Swiggy OR Zomato)
                    </p>
                </div>
            )}

            {/* Regex examples */}
            {useRegex && (
                <div className="mt-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                        Regex Examples:
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                        <li>• <code className="bg-blue-100 px-1 dark:bg-blue-900">^ANGEL</code> - Starts with "ANGEL"</li>
                        <li>• <code className="bg-blue-100 px-1 dark:bg-blue-900">UPI$</code> - Ends with "UPI"</li>
                        <li>• <code className="bg-blue-100 px-1 dark:bg-blue-900">.*PAYTM.*</code> - Contains "PAYTM"</li>
                        <li>• <code className="bg-blue-100 px-1 dark:bg-blue-900">^(ANGEL|ZERODHA)</code> - Starts with either</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
