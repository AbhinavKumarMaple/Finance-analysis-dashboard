"use client";

/**
 * Budget Card Component
 *
 * Displays a budget with progress bar and status indicator.
 * Shows current spending, remaining amount, and projected end-of-month spending.
 *
 * Requirements: 6.1, 6.2
 */

import type { BudgetStatus } from "@/types/budget";
import type { Tag } from "@/types/tag";

interface BudgetCardProps {
    budgetStatus: BudgetStatus;
    tag?: Tag;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function BudgetCard({
    budgetStatus,
    tag,
    onEdit,
    onDelete,
}: BudgetCardProps) {
    const { budget, percentUsed, remaining, projectedEndOfMonth, status, currentSpend } = budgetStatus;

    // Determine status color
    const statusColors = {
        on_track: "bg-green-500",
        warning: "bg-yellow-500",
        exceeded: "bg-red-500",
    };

    const statusTextColors = {
        on_track: "text-green-700 dark:text-green-400",
        warning: "text-yellow-700 dark:text-yellow-400",
        exceeded: "text-red-700 dark:text-red-400",
    };

    const statusLabels = {
        on_track: "On Track",
        warning: "Warning",
        exceeded: "Exceeded",
    };

    return (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {tag?.icon && <span className="text-2xl">{tag.icon}</span>}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {tag?.name || "Unknown Category"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {budget.period}
                        </p>
                    </div>
                </div>

                {tag && (
                    <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: tag.color }}
                    />
                )}
            </div>

            {/* Status Badge */}
            <div className="mb-3">
                <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusTextColors[status]}`}
                >
                    {statusLabels[status]}
                </span>
            </div>

            {/* Spending Info */}
            <div className="mb-3 space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Spent</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        ₹{currentSpend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Budget</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        ₹{budget.monthlyLimit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                    <span className={`font-medium ${remaining < 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}>
                        ₹{Math.abs(remaining).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        {remaining < 0 && " over"}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{Math.min(100, percentUsed).toFixed(0)}% used</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${statusColors[status]} transition-all duration-300`}
                        style={{ width: `${Math.min(100, percentUsed)}%` }}
                    />
                </div>
            </div>

            {/* Projected Spending */}
            {projectedEndOfMonth > currentSpend && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                    <p className="text-blue-700 dark:text-blue-400">
                        Projected: ₹{projectedEndOfMonth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                </div>
            )}

            {/* Actions */}
            {(onEdit || onDelete) && (
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="flex-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                        >
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="flex-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
