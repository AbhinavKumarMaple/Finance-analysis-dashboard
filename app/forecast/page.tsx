"use client";

import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { BalanceForecast } from "@/components/forecast/BalanceForecast";
import { CashFlowProjection } from "@/components/forecast/CashFlowProjection";

export default function ForecastPage() {
    const transactions = useFilteredTransactions();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Financial Forecast</h1>
                <p className="text-muted-foreground mt-2">
                    Predict your future balance and cash flow
                </p>
            </div>

            {transactions.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        No transaction data available. Upload a statement to see forecasts.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    <BalanceForecast transactions={transactions} />
                    <CashFlowProjection transactions={transactions} />
                </div>
            )}
        </div>
    );
}
