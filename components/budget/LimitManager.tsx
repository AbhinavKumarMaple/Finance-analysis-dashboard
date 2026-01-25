"use client";

/**
 * Limit Manager Component
 *
 * Interface for managing spending limits (daily, monthly, category, merchant).
 * Displays current limits with status and allows CRUD operations.
 *
 * Requirements: 7.1-7.6
 */

import { useState } from "react";
import type { SpendingLimit } from "@/types/budget";
import type { Tag } from "@/types/tag";

interface LimitManagerProps {
    limits: Array<SpendingLimit & { currentSpend: number; percentUsed: number; remaining: number }>;
    tags: Tag[];
    onCreateLimit: (limitData: Omit<SpendingLimit, "id" | "createdAt">) => void;
    onUpdateLimit: (limitId: string, updates: Partial<SpendingLimit>) => void;
    onDeleteLimit: (limitId: string) => void;
}

export function LimitManager({
    limits,
    tags,
    onCreateLimit,
    onUpdateLimit,
    onDeleteLimit,
}: LimitManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingLimitId, setEditingLimitId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Form state
    const [type, setType] = useState<SpendingLimit["type"]>("monthly");
    const [limit, setLimit] = useState("");
    const [targetId, setTargetId] = useState("");
    const [targetName, setTargetName] = useState("");

    const resetForm = () => {
        setType("monthly");
        setLimit("");
        setTargetId("");
        setTargetName("");
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();

        const limitNum = parseFloat(limit);
        if (isNaN(limitNum) || limitNum <= 0) return;

        onCreateLimit({
            type,
            limit: limitNum,
            targetId: targetId || null,
            targetName: targetName || getDefaultTargetName(type),
            isActive: true,
        });

        resetForm();
        setIsCreating(false);
    };

    const handleToggleActive = (limitId: string, isActive: boolean) => {
        onUpdateLimit(limitId, { isActive: !isActive });
    };

    const getDefaultTargetName = (limitType: SpendingLimit["type"]): string => {
        switch (limitType) {
            case "daily":
                return "Daily Spending";
            case "monthly":
                return "Monthly Spending";
            case "category":
                return "Category Spending";
            case "merchant":
                return "Merchant Spending";
        }
    };

    const getStatusColor = (percentUsed: number) => {
        if (percentUsed >= 100) return "text-red-600 dark:text-red-400";
        if (percentUsed >= 80) return "text-yellow-600 dark:text-yellow-400";
        return "text-green-600 dark:text-green-400";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Spending Limits
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Set and manage spending limits to control your expenses
                    </p>
                </div>

                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    + Add Limit
                </button>
            </div>

            {/* Limits List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {limits.map((limitItem) => (
                    <div
                        key={limitItem.id}
                        className={`p-4 border rounded-lg ${limitItem.isActive
                                ? "border-gray-200 dark:border-gray-700"
                                : "border-gray-300 dark:border-gray-600 opacity-60"
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {limitItem.targetName}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                    {limitItem.type} limit
                                </p>
                            </div>

                            <button
                                onClick={() => handleToggleActive(limitItem.id, limitItem.isActive)}
                                className={`px-2 py-1 text-xs rounded ${limitItem.isActive
                                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    }`}
                            >
                                {limitItem.isActive ? "Active" : "Inactive"}
                            </button>
                        </div>

                        {/* Spending Info */}
                        <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Spent</span>
                                <span className={`font-medium ${getStatusColor(limitItem.percentUsed)}`}>
                                    ₹{limitItem.currentSpend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Limit</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    ₹{limitItem.limit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                                <span className={`font-medium ${limitItem.remaining < 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}>
                                    ₹{Math.abs(limitItem.remaining).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                    {limitItem.remaining < 0 && " over"}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <span>{Math.min(100, limitItem.percentUsed).toFixed(0)}% used</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${limitItem.percentUsed >= 100
                                            ? "bg-red-500"
                                            : limitItem.percentUsed >= 80
                                                ? "bg-yellow-500"
                                                : "bg-green-500"
                                        }`}
                                    style={{ width: `${Math.min(100, limitItem.percentUsed)}%` }}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setDeleteConfirmId(limitItem.id)}
                                className="flex-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {limits.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        No spending limits set
                    </p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Create Your First Limit
                    </button>
                </div>
            )}

            {/* Create Limit Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Create Spending Limit
                        </h3>

                        <form onSubmit={handleCreate} className="space-y-4">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Limit Type
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as SpendingLimit["type"])}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="category">Category</option>
                                    <option value="merchant">Merchant</option>
                                </select>
                            </div>

                            {/* Category Selection (if type is category) */}
                            {type === "category" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={targetId}
                                        onChange={(e) => {
                                            setTargetId(e.target.value);
                                            const tag = tags.find((t) => t.id === e.target.value);
                                            if (tag) setTargetName(tag.name);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                        <option value="">Select a category</option>
                                        {tags.map((tag) => (
                                            <option key={tag.id} value={tag.id}>
                                                {tag.icon} {tag.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Merchant Name (if type is merchant) */}
                            {type === "merchant" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Merchant Name
                                    </label>
                                    <input
                                        type="text"
                                        value={targetName}
                                        onChange={(e) => {
                                            setTargetName(e.target.value);
                                            setTargetId(e.target.value.toLowerCase());
                                        }}
                                        placeholder="e.g., Amazon, Swiggy"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            )}

                            {/* Limit Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Limit Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={limit}
                                    onChange={(e) => setLimit(e.target.value)}
                                    placeholder="5000"
                                    min="0"
                                    step="100"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Delete Spending Limit
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete this spending limit? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onDeleteLimit(deleteConfirmId);
                                    setDeleteConfirmId(null);
                                }}
                                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
