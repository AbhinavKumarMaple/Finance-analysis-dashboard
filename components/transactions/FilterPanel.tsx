"use client";

import { useState } from "react";
import { Calendar, Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Tag } from "@/types/tag";
import type { Transaction, PaymentMethod } from "@/types/transaction";

interface FilterPanelProps {
    filters: {
        dateRange: { start: Date | null; end: Date | null };
        tagIds: string[];
        amountRange: { min: number | null; max: number | null };
        type: "debit" | "credit" | null;
        paymentMethods: string[];
        isReviewed: boolean | null;
        merchants?: string[];
    };
    onFiltersChange: (filters: FilterPanelProps["filters"]) => void;
    tags: Tag[];
    transactions: Transaction[];
}

const PAYMENT_METHODS: PaymentMethod[] = [
    "UPI",
    "NEFT",
    "IMPS",
    "ATM",
    "POS",
    "CHEQUE",
    "OTHER",
];

export default function FilterPanel({
    filters,
    onFiltersChange,
    tags,
    transactions,
}: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const updateFilters = (updates: Partial<FilterPanelProps["filters"]>) => {
        onFiltersChange({ ...filters, ...updates });
    };

    const clearAllFilters = () => {
        onFiltersChange({
            dateRange: { start: null, end: null },
            tagIds: [],
            amountRange: { min: null, max: null },
            type: null,
            paymentMethods: [],
            isReviewed: null,
        });
    };

    const activeFilterCount = [
        filters.dateRange.start || filters.dateRange.end,
        filters.tagIds.length > 0,
        filters.amountRange.min !== null || filters.amountRange.max !== null,
        filters.type !== null,
        filters.paymentMethods.length > 0,
        filters.isReviewed !== null,
    ].filter(Boolean).length;

    const toggleTag = (tagId: string) => {
        const newTagIds = filters.tagIds.includes(tagId)
            ? filters.tagIds.filter((id) => id !== tagId)
            : [...filters.tagIds, tagId];
        updateFilters({ tagIds: newTagIds });
    };

    const togglePaymentMethod = (method: string) => {
        const newMethods = filters.paymentMethods.includes(method)
            ? filters.paymentMethods.filter((m) => m !== method)
            : [...filters.paymentMethods, method];
        updateFilters({ paymentMethods: newMethods });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        <CardTitle>Filters</CardTitle>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary">{activeFilterCount}</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeFilterCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="h-8 px-2"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Date Range */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date Range
                    </Label>
                    <div className="space-y-2">
                        <Input
                            type="date"
                            value={
                                filters.dateRange.start
                                    ? filters.dateRange.start.toISOString().split("T")[0]
                                    : ""
                            }
                            onChange={(e) =>
                                updateFilters({
                                    dateRange: {
                                        ...filters.dateRange,
                                        start: e.target.value ? new Date(e.target.value) : null,
                                    },
                                })
                            }
                            placeholder="Start date"
                        />
                        <Input
                            type="date"
                            value={
                                filters.dateRange.end
                                    ? filters.dateRange.end.toISOString().split("T")[0]
                                    : ""
                            }
                            onChange={(e) =>
                                updateFilters({
                                    dateRange: {
                                        ...filters.dateRange,
                                        end: e.target.value ? new Date(e.target.value) : null,
                                    },
                                })
                            }
                            placeholder="End date"
                        />
                    </div>
                </div>

                {/* Transaction Type */}
                <div className="space-y-2">
                    <Label>Transaction Type</Label>
                    <Select
                        value={filters.type || "all"}
                        onValueChange={(value) =>
                            updateFilters({
                                type: value === "all" ? null : (value as "debit" | "credit"),
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="debit">Debit</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                    <Label>Amount Range</Label>
                    <div className="space-y-2">
                        <Input
                            type="number"
                            placeholder="Min amount"
                            value={filters.amountRange.min ?? ""}
                            onChange={(e) =>
                                updateFilters({
                                    amountRange: {
                                        ...filters.amountRange,
                                        min: e.target.value ? parseFloat(e.target.value) : null,
                                    },
                                })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Max amount"
                            value={filters.amountRange.max ?? ""}
                            onChange={(e) =>
                                updateFilters({
                                    amountRange: {
                                        ...filters.amountRange,
                                        max: e.target.value ? parseFloat(e.target.value) : null,
                                    },
                                })
                            }
                        />
                    </div>
                </div>

                {/* Categories */}
                {tags.length > 0 && (
                    <div className="space-y-2">
                        <Label>Categories</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {tags.map((tag) => (
                                <div key={tag.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`tag-${tag.id}`}
                                        checked={filters.tagIds.includes(tag.id)}
                                        onCheckedChange={() => toggleTag(tag.id)}
                                    />
                                    <label
                                        htmlFor={`tag-${tag.id}`}
                                        className="flex items-center gap-2 text-sm cursor-pointer"
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Methods */}
                <div className="space-y-2">
                    <Label>Payment Methods</Label>
                    <div className="space-y-2">
                        {PAYMENT_METHODS.map((method) => (
                            <div key={method} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`method-${method}`}
                                    checked={filters.paymentMethods.includes(method)}
                                    onCheckedChange={() => togglePaymentMethod(method)}
                                />
                                <label
                                    htmlFor={`method-${method}`}
                                    className="text-sm cursor-pointer"
                                >
                                    {method}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Review Status */}
                <div className="space-y-2">
                    <Label>Review Status</Label>
                    <Select
                        value={
                            filters.isReviewed === null
                                ? "all"
                                : filters.isReviewed
                                    ? "reviewed"
                                    : "unreviewed"
                        }
                        onValueChange={(value) =>
                            updateFilters({
                                isReviewed:
                                    value === "all" ? null : value === "reviewed" ? true : false,
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All transactions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All transactions</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="unreviewed">Unreviewed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
