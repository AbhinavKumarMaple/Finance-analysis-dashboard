"use client";

import { useEffect, useState } from "react";
import { Database, HardDrive, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStorageStats, formatBytes, getStorageBreakdown } from "@/lib/storage/stats";
import type { StorageStats } from "@/types/analytics";

export function StorageManager() {
    const [stats, setStats] = useState<StorageStats | null>(null);
    const [breakdown, setBreakdown] = useState<{
        transactions: number;
        tags: number;
        budgets: number;
        limits: number;
        goals: number;
        preferences: number;
        files: number;
        total: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const [storageStats, storageBreakdown] = await Promise.all([
                getStorageStats(),
                getStorageBreakdown(),
            ]);
            setStats(storageStats);
            setBreakdown(storageBreakdown);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load storage stats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const usagePercent = stats && stats.quotaAvailable > 0
        ? (stats.quotaUsed / stats.quotaAvailable) * 100
        : 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Storage Usage</CardTitle>
                        <CardDescription>
                            Monitor your local storage consumption
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadStats}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-400">
                        {error}
                    </div>
                )}

                {!error && stats && (
                    <>
                        {/* Storage Quota */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Storage Used
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatBytes(stats.quotaUsed)} / {formatBytes(stats.quotaAvailable)}
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                                <div
                                    className={`h-full transition-all ${usagePercent > 90
                                            ? "bg-red-500"
                                            : usagePercent > 70
                                                ? "bg-yellow-500"
                                                : "bg-green-500"
                                        }`}
                                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                {usagePercent.toFixed(1)}% of available storage used
                            </p>
                        </div>

                        {/* Data Breakdown */}
                        {breakdown && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    Data Breakdown
                                </h4>
                                <div className="space-y-2">
                                    <DataItem
                                        icon={<Database className="h-4 w-4" />}
                                        label="Transactions"
                                        count={breakdown.transactions}
                                    />
                                    <DataItem
                                        icon={<HardDrive className="h-4 w-4" />}
                                        label="Tags"
                                        count={breakdown.tags}
                                    />
                                    <DataItem
                                        icon={<HardDrive className="h-4 w-4" />}
                                        label="Budgets"
                                        count={breakdown.budgets}
                                    />
                                    <DataItem
                                        icon={<HardDrive className="h-4 w-4" />}
                                        label="Spending Limits"
                                        count={breakdown.limits}
                                    />
                                    <DataItem
                                        icon={<HardDrive className="h-4 w-4" />}
                                        label="Savings Goals"
                                        count={breakdown.goals}
                                    />
                                    <DataItem
                                        icon={<HardDrive className="h-4 w-4" />}
                                        label="Uploaded Files"
                                        count={breakdown.files}
                                    />
                                </div>
                                <div className="border-t border-gray-200 pt-2 dark:border-gray-800">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span className="text-gray-900 dark:text-white">Total Items</span>
                                        <span className="text-gray-900 dark:text-white">{breakdown.total}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Storage Warning */}
                        {usagePercent > 80 && (
                            <div className={`rounded-lg p-3 text-sm ${usagePercent > 90
                                    ? "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                                    : "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400"
                                }`}>
                                {usagePercent > 90
                                    ? "⚠️ Storage is almost full. Consider clearing old data."
                                    : "⚠️ Storage is running low. You may want to clear some data soon."}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function DataItem({
    icon,
    label,
    count,
}: {
    icon: React.ReactNode;
    label: string;
    count: number;
}) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                {icon}
                <span>{label}</span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
                {count.toLocaleString()}
            </span>
        </div>
    );
}
