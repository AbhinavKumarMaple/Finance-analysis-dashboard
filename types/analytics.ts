/**
 * Analytics Type Definitions
 * Types for financial analytics, metrics, insights, and reports
 */

import type { Transaction, DateRange } from "./transaction";
import type { Tag } from "./tag";
import type { Budget, BudgetStatus } from "./budget";

/**
 * Configuration for analytics engine
 */
export interface AnalyticsConfig {
  anomalyThreshold: number; // multiplier for anomaly detection
  trendPeriods: number; // number of periods for trend calculation
  forecastDays: number; // days to forecast ahead
}

/**
 * Balance metrics for a given period
 */
export interface BalanceMetrics {
  current: number;
  highest: number;
  lowest: number;
  average: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Cash flow metrics
 */
export interface CashFlowMetrics {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  averageDailyInflow: number;
  averageDailyOutflow: number;
  surplusDays: number;
  deficitDays: number;
}

/**
 * Merchant spending information
 */
export interface MerchantSpend {
  merchant: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  lastTransaction: Date;
}

/**
 * Spending breakdown by various dimensions
 */
export interface SpendingBreakdown {
  byTag: Map<string, number>;
  byMerchant: MerchantSpend[];
  byPaymentMethod: Map<string, number>;
  byDayOfWeek: number[];
  byTimeOfMonth: { early: number; mid: number; late: number };
}

/**
 * Monthly amount for trend analysis
 */
export interface MonthlyAmount {
  month: string; // YYYY-MM format
  amount: number;
}

/**
 * Income analysis results
 */
export interface IncomeAnalysis {
  totalIncome: number;
  bySource: Map<string, number>;
  monthlyTrend: MonthlyAmount[];
  detectedSalaryDate: number | null;
  unusualIncomes: Transaction[];
}

/**
 * Time of month spending pattern
 */
export interface TimeOfMonthPattern {
  earlyMonth: number; // days 1-10
  midMonth: number; // days 11-20
  lateMonth: number; // days 21-31
}

/**
 * Seasonal spending trend
 */
export interface SeasonalTrend {
  month: number;
  averageSpend: number;
  yearOverYearChange?: number;
}

/**
 * Spending patterns analysis
 */
export interface SpendingPattern {
  weekdayAverage: number;
  weekendAverage: number;
  dayOfWeekDistribution: number[];
  timeOfMonthPattern: TimeOfMonthPattern;
  seasonalTrends: SeasonalTrend[];
}

/**
 * Recurring payment detection
 */
export interface RecurringPayment {
  merchant: string;
  amount: number;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  nextExpectedDate: Date;
  category: "subscription" | "emi" | "utility" | "other";
  confidence: number;
}

/**
 * Lifestyle metrics analysis
 */
export interface LifestyleMetrics {
  foodDelivery: {
    frequency: number;
    averageOrderValue: number;
    totalSpend: number;
    topPlatforms: MerchantSpend[];
  };
  shopping: {
    frequency: number;
    averageTransaction: number;
    totalSpend: number;
    topMerchants: MerchantSpend[];
  };
  utilities: {
    monthlyAverage: number;
    trend: MonthlyAmount[];
  };
  investments: {
    sipDetected: boolean;
    monthlyInvestment: number;
    consistency: number; // 0-100 score
  };
}

/**
 * Financial health score component
 */
export interface HealthScoreComponent {
  score: number;
  weight: number;
  value: number;
}

/**
 * Financial health score
 */
export interface HealthScore {
  score: number; // 0-100
  components: {
    savingsRate: HealthScoreComponent;
    budgetAdherence: HealthScoreComponent;
    spendingDiversity: HealthScoreComponent;
    emergencyFund: HealthScoreComponent;
  };
  recommendations: string[];
  trend: "improving" | "stable" | "declining";
}

/**
 * Anomaly detection result
 */
export interface Anomaly {
  transaction: Transaction;
  type: "high_amount" | "duplicate" | "unusual_merchant" | "spending_spike";
  severity: "low" | "medium" | "high";
  description: string;
}

/**
 * Forecast configuration
 */
export interface ForecastConfig {
  horizonDays: number;
  confidenceLevel: number;
  includeRecurring: boolean;
}

/**
 * Balance forecast
 */
export interface BalanceForecast {
  date: Date;
  predictedBalance: number;
  confidenceInterval: { low: number; high: number };
  assumptions: string[];
}

/**
 * Cash flow projection
 */
export interface CashFlowProjection {
  period: string;
  expectedInflow: number;
  expectedOutflow: number;
  netFlow: number;
  recurringPayments: RecurringPayment[];
}

/**
 * Forecast warning
 */
export interface ForecastWarning {
  type: "low_balance" | "negative_balance" | "budget_exceeded";
  date: Date;
  message: string;
  severity: "info" | "warning" | "critical";
}

/**
 * Monthly report
 */
export interface MonthlyReport {
  period: string; // YYYY-MM format
  generatedAt: Date;

  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
  };

  balanceMetrics: BalanceMetrics;
  cashFlow: CashFlowMetrics;
  spendingByTag: Map<string, number>;
  topMerchants: MerchantSpend[];
  budgetPerformance: BudgetStatus[];
  healthScore: HealthScore;
  anomalies: Anomaly[];
  recommendations: string[];
}

/**
 * Yearly report
 */
export interface YearlyReport {
  year: number;
  generatedAt: Date;

  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    averageMonthlySavings: number;
  };

  monthlyBreakdown: MonthlyReport[];
  yearOverYearComparison?: {
    incomeChange: number;
    expenseChange: number;
    savingsChange: number;
  };

  topCategories: { tagId: string; amount: number }[];
  topMerchants: MerchantSpend[];
  investmentSummary: {
    totalInvested: number;
    sipConsistency: number;
  };
}

/**
 * Alert type
 */
export type AlertType =
  | "low_balance"
  | "unusual_spending"
  | "budget_warning"
  | "budget_exceeded"
  | "duplicate_transaction"
  | "anomaly_detected"
  | "recurring_payment_due"
  | "savings_goal_progress";

/**
 * Alert
 */
export interface Alert {
  id: string;
  type: AlertType;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  relatedTransactionId?: string;
  relatedBudgetId?: string;
  createdAt: Date;
  isRead: boolean;
  isDismissed: boolean;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: "light" | "dark";
  currency: string;
  dateFormat: string;
  widgetLayout: WidgetLayout[];
  lowBalanceThreshold: number;
  enableEncryption: boolean;
  globalDateRange: { start: string | null; end: string | null };
}

/**
 * Widget layout configuration
 */
export interface WidgetLayout {
  widgetId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVisible: boolean;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalSize: number;
  transactionCount: number;
  tagCount: number;
  quotaUsed: number;
  quotaAvailable: number;
}
