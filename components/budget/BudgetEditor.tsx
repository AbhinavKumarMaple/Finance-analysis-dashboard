"use client";

/**
 * Budget Editor Component
 *
 * Modal form for creating and editing budgets.
 * Allows selecting category, setting monthly limit, and choosing period.
 *
 * Requirements: 6.1, 6.2
 */

import { useState, useEffect } from "react";
import type { Budget } from "@/types/budget";
import type { Tag } from "@/types/tag";

interface BudgetEditorProps {
    budget?: Budget;
    tags: Tag[];
    onSave: (budgetData: Omit<Budget, "id" | "createdAt" | "updatedAt"> | Partial<Budget>) => void;
    onCancel: () => void;
}

export function BudgetEditor({
    budget,
    tags,
    onSave,
    onCancel,
}: BudgetEditorProps) {
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [tagId, setTagId] = useState(budget?.tagId || "");
    const [monthlyLimit, setMonthlyLimit] = useState(
        budget?.monthlyLimit?.toString() || ""
    );
    const [period, setPeriod] = useState(budget?.period || defaultPeriod);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isEditing = !!budget;

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!tagId) {
            newErrors.tagId = "Please select a category";
        }

        const limitNum = parseFloat(monthlyLimit);
        if (!monthlyLimit || isNaN(limitNum) || limitNum <= 0) {
            newErrors.monthlyLimit = "Please enter a valid amount greater than 0";
        }

        if (!period) {
            newErrors.period = "Please select a period";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const budgetData = {
            tagId,
            monthlyLimit: parseFloat(monthlyLimit),
            period,
        };

        onSave(budgetData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {isEditing ? "Edit Budget" : "Create Budget"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category
                        </label>
                        <select
                            value={tagId}
                            onChange={(e) => setTagId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isEditing}
                        >
                            <option value="">Select a category</option>
                            {tags.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                    {tag.icon} {tag.name}
                                </option>
                            ))}
                        </select>
                        {errors.tagId && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {errors.tagId}
                            </p>
                        )}
                    </div>

                    {/* Monthly Limit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Monthly Limit (₹)
                        </label>
                        <input
                            type="number"
                            value={monthlyLimit}
                            onChange={(e) => setMonthlyLimit(e.target.value)}
                            placeholder="5000"
                            min="0"
                            step="100"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.monthlyLimit && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {errors.monthlyLimit}
                            </p>
                        )}
                    </div>

                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Period (YYYY-MM)
                        </label>
                        <input
                            type="month"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.period && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {errors.period}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            {isEditing ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
