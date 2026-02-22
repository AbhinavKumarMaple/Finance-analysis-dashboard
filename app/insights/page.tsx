"use client";

import { useTagStore } from "@/store/tagStore";
import { useBudgetStore } from "@/store/budgetStore";
import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { SpendingPatterns } from "@/components/insights/SpendingPatterns";
import { RecurringPayments } from "@/components/insights/RecurringPayments";
import { LifestyleMetrics } from "@/components/insights/LifestyleMetrics";
import { HealthScoreGauge } from "@/components/insights/HealthScoreGauge";

export default function InsightsPage() {
    const transactions = useFilteredTransactions();
    const tags = useTagStore((state) => state.tags);
    const budgets = useBudgetStore((state) => state.budgets);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Financial Insights</h1>
                <p className="text-muted-foreground mt-2">
                    Discover patterns and trends in your spending behavior
                </p>
            </div>

            {transactions.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        No transaction data available. Upload a statement to see insights.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    <HealthScoreGauge
                        transactions={transactions}
                        budgets={budgets}
                    />

                    <SpendingPatterns transactions={transactions} />

                    <RecurringPayments transactions={transactions} />

                    <LifestyleMetrics transactions={transactions} tags={tags} />
                </div>
            )}
        </div>
    );
}
