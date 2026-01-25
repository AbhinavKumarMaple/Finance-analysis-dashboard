/**
 * Report Export Utilities
 * Export reports to various formats (CSV, JSON)
 */

import type { MonthlyReport, YearlyReport } from "@/types/analytics";
import type { Transaction } from "@/types/transaction";

/**
 * Export monthly report to CSV
 */
export function exportMonthlyReportToCSV(report: MonthlyReport): string {
  const lines: string[] = [];

  // Header
  lines.push(`Monthly Financial Report - ${report.period}`);
  lines.push(`Generated: ${report.generatedAt.toLocaleString()}`);
  lines.push("");

  // Summary
  lines.push("Summary");
  lines.push("Metric,Value");
  lines.push(`Total Income,${report.summary.totalIncome}`);
  lines.push(`Total Expenses,${report.summary.totalExpenses}`);
  lines.push(`Net Savings,${report.summary.netSavings}`);
  lines.push(`Savings Rate,${report.summary.savingsRate.toFixed(2)}%`);
  lines.push("");

  // Balance Metrics
  lines.push("Balance Metrics");
  lines.push("Metric,Value");
  lines.push(`Current Balance,${report.balanceMetrics.current}`);
  lines.push(`Highest Balance,${report.balanceMetrics.highest}`);
  lines.push(`Lowest Balance,${report.balanceMetrics.lowest}`);
  lines.push(`Average Balance,${report.balanceMetrics.average}`);
  lines.push("");

  // Spending by Category
  lines.push("Spending by Category");
  lines.push("Category,Amount");
  Array.from(report.spendingByTag.entries()).forEach(([tagId, amount]) => {
    lines.push(`${tagId},${amount}`);
  });
  lines.push("");

  // Top Merchants
  lines.push("Top Merchants");
  lines.push("Merchant,Total Amount,Transaction Count,Average Amount");
  report.topMerchants.forEach((merchant) => {
    lines.push(
      `${merchant.merchant},${merchant.totalAmount},${merchant.transactionCount},${merchant.averageAmount}`,
    );
  });
  lines.push("");

  // Budget Performance
  if (report.budgetPerformance.length > 0) {
    lines.push("Budget Performance");
    lines.push("Category,Limit,Spent,Remaining,Status");
    report.budgetPerformance.forEach((budget) => {
      lines.push(
        `${budget.budget.tagId},${budget.budget.monthlyLimit},${budget.budget.currentSpend},${budget.remaining},${budget.status}`,
      );
    });
    lines.push("");
  }

  // Health Score
  lines.push("Financial Health Score");
  lines.push(`Overall Score,${report.healthScore.score}`);
  lines.push(`Trend,${report.healthScore.trend}`);
  lines.push("");

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push("Recommendations");
    report.recommendations.forEach((rec, index) => {
      lines.push(`${index + 1}. ${rec}`);
    });
  }

  return lines.join("\n");
}

/**
 * Export yearly report to CSV
 */
export function exportYearlyReportToCSV(report: YearlyReport): string {
  const lines: string[] = [];

  // Header
  lines.push(`Yearly Financial Report - ${report.year}`);
  lines.push(`Generated: ${report.generatedAt.toLocaleString()}`);
  lines.push("");

  // Summary
  lines.push("Summary");
  lines.push("Metric,Value");
  lines.push(`Total Income,${report.summary.totalIncome}`);
  lines.push(`Total Expenses,${report.summary.totalExpenses}`);
  lines.push(`Net Savings,${report.summary.netSavings}`);
  lines.push(`Average Monthly Savings,${report.summary.averageMonthlySavings}`);
  lines.push("");

  // Year-over-Year Comparison
  if (report.yearOverYearComparison) {
    lines.push("Year-over-Year Comparison");
    lines.push("Metric,Change %");
    lines.push(
      `Income Change,${report.yearOverYearComparison.incomeChange.toFixed(2)}%`,
    );
    lines.push(
      `Expense Change,${report.yearOverYearComparison.expenseChange.toFixed(2)}%`,
    );
    lines.push(
      `Savings Change,${report.yearOverYearComparison.savingsChange.toFixed(2)}%`,
    );
    lines.push("");
  }

  // Monthly Breakdown
  lines.push("Monthly Breakdown");
  lines.push("Month,Income,Expenses,Savings,Savings Rate %");
  report.monthlyBreakdown.forEach((month) => {
    lines.push(
      `${month.period},${month.summary.totalIncome},${month.summary.totalExpenses},${month.summary.netSavings},${month.summary.savingsRate.toFixed(2)}`,
    );
  });
  lines.push("");

  // Top Categories
  lines.push("Top Spending Categories");
  lines.push("Category,Amount");
  report.topCategories.forEach((cat) => {
    lines.push(`${cat.tagId},${cat.amount}`);
  });
  lines.push("");

  // Top Merchants
  lines.push("Top Merchants");
  lines.push("Merchant,Total Amount,Transaction Count,Average Amount");
  report.topMerchants.forEach((merchant) => {
    lines.push(
      `${merchant.merchant},${merchant.totalAmount},${merchant.transactionCount},${merchant.averageAmount}`,
    );
  });
  lines.push("");

  // Investment Summary
  lines.push("Investment Summary");
  lines.push(`Total Invested,${report.investmentSummary.totalInvested}`);
  lines.push(
    `SIP Consistency,${report.investmentSummary.sipConsistency.toFixed(2)}%`,
  );

  return lines.join("\n");
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const lines: string[] = [];

  // Header
  lines.push(
    "Date,Details,Reference No,Debit,Credit,Balance,Type,Payment Method,Tags,Notes",
  );

  // Transactions
  transactions.forEach((t) => {
    const date = t.date.toISOString().split("T")[0];
    const details = `"${t.details.replace(/"/g, '""')}"`;
    const debit = t.debit !== null ? t.debit : "";
    const credit = t.credit !== null ? t.credit : "";
    const tags = t.tagIds.join(";");
    const notes = t.notes ? `"${t.notes.replace(/"/g, '""')}"` : "";

    lines.push(
      `${date},${details},${t.refNo},${debit},${credit},${t.balance},${t.type},${t.paymentMethod},${tags},${notes}`,
    );
  });

  return lines.join("\n");
}

/**
 * Export report to JSON
 */
export function exportToJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Download a file with the given content
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "text/plain",
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export monthly report and trigger download
 */
export function downloadMonthlyReport(
  report: MonthlyReport,
  format: "csv" | "json",
) {
  const filename = `monthly-report-${report.period}.${format}`;

  if (format === "csv") {
    const csv = exportMonthlyReportToCSV(report);
    downloadFile(csv, filename, "text/csv");
  } else {
    const json = exportToJSON(report);
    downloadFile(json, filename, "application/json");
  }
}

/**
 * Export yearly report and trigger download
 */
export function downloadYearlyReport(
  report: YearlyReport,
  format: "csv" | "json",
) {
  const filename = `yearly-report-${report.year}.${format}`;

  if (format === "csv") {
    const csv = exportYearlyReportToCSV(report);
    downloadFile(csv, filename, "text/csv");
  } else {
    const json = exportToJSON(report);
    downloadFile(json, filename, "application/json");
  }
}

/**
 * Export transactions and trigger download
 */
export function downloadTransactions(
  transactions: Transaction[],
  format: "csv" | "json",
) {
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `transactions-${timestamp}.${format}`;

  if (format === "csv") {
    const csv = exportTransactionsToCSV(transactions);
    downloadFile(csv, filename, "text/csv");
  } else {
    const json = exportToJSON(transactions);
    downloadFile(json, filename, "application/json");
  }
}
