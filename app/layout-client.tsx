"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useTransactionStore, useTagStore, useBudgetStore } from "@/store";
import { loadTransactions } from "@/lib/storage/transactions";
import { loadTags } from "@/lib/storage/tags";
import { loadBudgets, loadSpendingLimits, loadSavingsGoals } from "@/lib/storage/budgets";

export default function LayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const setTransactions = useTransactionStore((state) => state.setTransactions);
    const setTags = useTagStore((state) => state.setTags);
    const setBudgets = useBudgetStore((state) => state.setBudgets);
    const setSpendingLimits = useBudgetStore((state) => state.setSpendingLimits);
    const setSavingsGoals = useBudgetStore((state) => state.setSavingsGoals);

    // Load data from IndexedDB on mount
    useEffect(() => {
        async function initializeData() {
            try {
                // Load all data from IndexedDB
                const [transactions, tags, budgets, limits, goals] = await Promise.all([
                    loadTransactions(),
                    loadTags(),
                    loadBudgets(),
                    loadSpendingLimits(),
                    loadSavingsGoals(),
                ]);

                // Update stores with loaded data
                setTransactions(transactions);
                setTags(tags);
                setBudgets(budgets);
                setSpendingLimits(limits);
                setSavingsGoals(goals);

                setIsInitialized(true);
            } catch (error) {
                console.error("Failed to load data from storage:", error);
                setIsInitialized(true); // Still mark as initialized to show UI
            }
        }

        initializeData();
    }, [setTransactions, setTags, setBudgets, setSpendingLimits, setSavingsGoals]);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex flex-1 flex-col lg:pl-64">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 pt-16">
                    {isInitialized ? children : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading your data...</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
