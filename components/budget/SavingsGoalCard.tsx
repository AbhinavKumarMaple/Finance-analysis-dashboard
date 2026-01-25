"use client";

/**
 * Savings Goal Card Component
 *
 * Displays a savings goal with progress tracking and what-if analysis.
 * Shows current progress, deadline, and required monthly savings.
 *
 * Requirements: 8.1, 8.2
 */

import type { SavingsGoal } from "@/types/budget";

interface SavingsGoalCardProps {
    goal: SavingsGoal & {
        currentAmount: number;
        percentComplete: number;
        remaining: number;
        monthsRemaining: number;
        requiredMonthlySavings: number;
        onTrack: boolean;
    };
    onEdit?: () => void;
    onDelete?: () => void;
    onWhatIf?: () => void;
}

export function SavingsGoalCard({
    goal,
    onEdit,
    onDelete,
    onWhatIf,
}: SavingsGoalCardProps) {
    const {
        name,
        targetAmount,
        deadline,
        currentAmount,
        percentComplete,
        remaining,
        monthsRemaining,
        requiredMonthlySavings,
        onTrack,
    } = goal;

    const deadlineDate = new Date(deadline);
    const isOverdue = deadlineDate < new Date() && percentComplete < 100;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Target: ₹{targetAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                </div>

                {/* Status Badge */}
                <span
                    className={`px-2 py-1 text-xs font-medium rounded ${percentComplete >= 100
                            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                            : isOverdue
                                ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                : onTrack
                                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                    : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                        }`}
                >
                    {percentComplete >= 100
                        ? "Completed"
                        : isOverdue
                            ? "Overdue"
                            : onTrack
                                ? "On Track"
                                : "Behind"}
                </span>
            </div>

            {/* Progress Info */}
            <div className="mb-3 space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Saved</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        ₹{currentAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        ₹{remaining.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Deadline</span>
                    <span className={`font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}>
                        {formatDate(deadlineDate)}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{Math.min(100, percentComplete).toFixed(0)}% complete</span>
                    <span>{monthsRemaining} months left</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${percentComplete >= 100
                                ? "bg-green-500"
                                : onTrack
                                    ? "bg-blue-500"
                                    : "bg-yellow-500"
                            }`}
                        style={{ width: `${Math.min(100, percentComplete)}%` }}
                    />
                </div>
            </div>

            {/* Required Monthly Savings */}
            {percentComplete < 100 && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                    <p className="text-blue-700 dark:text-blue-400">
                        Required monthly savings: ₹{requiredMonthlySavings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                </div>
            )}

            {/* Actions */}
            {(onEdit || onDelete || onWhatIf) && (
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {onWhatIf && percentComplete < 100 && (
                        <button
                            onClick={onWhatIf}
                            className="flex-1 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 rounded transition-colors"
                        >
                            What-If
                        </button>
                    )}
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
