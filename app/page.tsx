"use client";

import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { IncomeExpenseCard } from "@/components/dashboard/IncomeExpenseCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { WidgetGrid, Widget } from "@/components/dashboard/WidgetGrid";

export default function Home() {
  const widgets: Widget[] = [
    {
      id: "balance",
      title: "Balance",
      component: <BalanceCard />,
      defaultPosition: 0,
      isVisible: true,
    },
    {
      id: "income-expense",
      title: "Income & Expense",
      component: <IncomeExpenseCard />,
      defaultPosition: 1,
      isVisible: true,
    },
    {
      id: "recent-transactions",
      title: "Recent Transactions",
      component: <RecentTransactions />,
      defaultPosition: 2,
      isVisible: true,
    },
    {
      id: "alerts",
      title: "Alerts",
      component: <AlertsCard />,
      defaultPosition: 3,
      isVisible: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your financial health
        </p>
      </div>

      <WidgetGrid widgets={widgets} />
    </div>
  );
}
