"use client";

import { BudgetCard } from "@/components/budget/BudgetCard";
import { BudgetEditor } from "@/components/budget/BudgetEditor";
import { LimitManager } from "@/components/budget/LimitManager";
import { SavingsGoalCard } from "@/components/budget/SavingsGoalCard";
import { useBudgetStore, useTagStore } from "@/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target, TrendingDown, Wallet } from "lucide-react";
import { useState, useMemo } from "react";
import type { SpendingLimit } from "@/types/budget";

export default function BudgetsPage() {
    const budgets = useBudgetStore((state) => state.budgets);
    const limits = useBudgetStore((state) => state.spendingLimits);
    const goals = useBudgetStore((state) => state.savingsGoals);
    const addSpendingLimit = useBudgetStore((state) => state.addSpendingLimit);
    const updateSpendingLimit = useBudgetStore((state) => state.updateSpendingLimit);
    const deleteSpendingLimit = useBudgetStore((state) => state.deleteSpendingLimit);
    const tags = useTagStore((state) => state.tags);
    const [showBudgetEditor, setShowBudgetEditor] = useState(false);
    const [showLimitManager, setShowLimitManager] = useState(false);

    // Calculate current spend for each limit
    const limitsWithSpend = useMemo(() => {
        return limits.map(limit => {
            // For now, return dummy data - will be calculated from transactions later
            const currentSpend = 0;
            const percentUsed = 0;
            const remaining = limit.amount;

            return {
                ...limit,
                currentSpend,
                percentUsed,
                remaining
            };
        });
    }, [limits]);

    const handleCreateLimit = (limitData: Omit<SpendingLimit, "id" | "createdAt">) => {
        const newLimit: SpendingLimit = {
            ...limitData,
            id: `limit-${Date.now()}`,
            createdAt: new Date(),
        };
        addSpendingLimit(newLimit);
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Budgets & Goals
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage your budgets, spending limits, and savings goals
                </p>
            </div>

            {/* Quick Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                            <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Active Budgets</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {budgets.length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900">
                            <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Spending Limits</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {limits.length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                            <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Savings Goals</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {goals.length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Budgets Section */}
            <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Category Budgets
                    </h2>
                    <Button
                        onClick={() => setShowBudgetEditor(true)}
                        size="sm"
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Budget
                    </Button>
                </div>

                {budgets.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 font-medium text-gray-900 dark:text-white">
                            No budgets yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Create your first budget to track spending by category
                        </p>
                        <Button
                            onClick={() => setShowBudgetEditor(true)}
                            className="mt-4 gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create Budget
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {budgets.map((budget) => (
                            <BudgetCard key={budget.id} budget={budget} />
                        ))}
                    </div>
                )}
            </div>

            {/* Spending Limits Section */}
            <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Spending Limits
                    </h2>
                    <Button
                        onClick={() => setShowLimitManager(true)}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Limit
                    </Button>
                </div>

                <LimitManager
                    limits={limitsWithSpend}
                    tags={tags}
                    onCreateLimit={handleCreateLimit}
                    onUpdateLimit={updateSpendingLimit}
                    onDeleteLimit={deleteSpendingLimit}
                />
            </div>

            {/* Savings Goals Section */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Savings Goals
                    </h2>
                </div>

                {goals.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Target className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 font-medium text-gray-900 dark:text-white">
                            No savings goals yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Set savings goals to track your progress
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {goals.map((goal) => (
                            <SavingsGoalCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showBudgetEditor && (
                <BudgetEditor onClose={() => setShowBudgetEditor(false)} />
            )}
        </div>
    );
}
