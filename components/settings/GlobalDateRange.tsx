"use client";

import { usePreferencesStore } from "@/store/preferencesStore";
import { useAvailableDateRange } from "@/hooks/useFilteredTransactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, RotateCcw } from "lucide-react";

function formatDateForInput(date: Date | null): string {
    if (!date) return "";
    return date.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string | null): string {
    if (!dateStr) return "Not set";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function GlobalDateRange() {
    const globalDateRange = usePreferencesStore((state) => state.preferences.globalDateRange);
    const setGlobalDateRange = usePreferencesStore((state) => state.setGlobalDateRange);
    const available = useAvailableDateRange();

    const isActive = globalDateRange.start !== null || globalDateRange.end !== null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle>Global Date Range</CardTitle>
                </div>
                <CardDescription>
                    Filter all data across the entire app to a specific date range
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Available Range Info */}
                {available.min && available.max ? (
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Available data range
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {available.min.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            {" → "}
                            {available.max.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No transaction data uploaded yet
                        </p>
                    </div>
                )}

                {/* Status Badge */}
                {isActive && (
                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            🔵 Global filter active: {formatDateDisplay(globalDateRange.start)} → {formatDateDisplay(globalDateRange.end)}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            All pages are showing data only within this range
                        </p>
                    </div>
                )}

                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="global-start-date" className="text-sm">From</Label>
                        <Input
                            id="global-start-date"
                            type="date"
                            value={globalDateRange.start || ""}
                            min={available.min ? formatDateForInput(available.min) : undefined}
                            max={globalDateRange.end || (available.max ? formatDateForInput(available.max) : undefined)}
                            onChange={(e) => setGlobalDateRange({
                                start: e.target.value || null,
                                end: globalDateRange.end,
                            })}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="global-end-date" className="text-sm">To</Label>
                        <Input
                            id="global-end-date"
                            type="date"
                            value={globalDateRange.end || ""}
                            min={globalDateRange.start || (available.min ? formatDateForInput(available.min) : undefined)}
                            max={available.max ? formatDateForInput(available.max) : undefined}
                            onChange={(e) => setGlobalDateRange({
                                start: globalDateRange.start,
                                end: e.target.value || null,
                            })}
                            className="mt-1"
                        />
                    </div>
                </div>

                {/* Quick Presets */}
                <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick presets</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: "Last 30 days", days: 30 },
                            { label: "Last 90 days", days: 90 },
                            { label: "Last 6 months", days: 180 },
                            { label: "Last 1 year", days: 365 },
                        ].map(({ label, days }) => (
                            <Button
                                key={label}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const end = available.max || new Date();
                                    const start = new Date(end);
                                    start.setDate(start.getDate() - days);
                                    setGlobalDateRange({
                                        start: formatDateForInput(start),
                                        end: formatDateForInput(end),
                                    });
                                }}
                                className="text-xs"
                            >
                                {label}
                            </Button>
                        ))}
                        {available.min && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setGlobalDateRange({
                                    start: formatDateForInput(available.min),
                                    end: formatDateForInput(available.max),
                                })}
                                className="text-xs"
                            >
                                All data
                            </Button>
                        )}
                    </div>
                </div>

                {/* Reset Button */}
                {isActive && (
                    <Button
                        variant="outline"
                        onClick={() => setGlobalDateRange({ start: null, end: null })}
                        className="w-full"
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset to All Data
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
