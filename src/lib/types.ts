/**
 * ═══════════════════════════════════════════════════════════════
 * CENTRAL TYPE DEFINITIONS — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Single source of truth for all shared types across the app.
 * Eliminates `any` types and ensures type safety from DB → API → UI.
 * ═══════════════════════════════════════════════════════════════
 */

import type { users, members, accounts, transactions, investments, debts, bills, insurance, goals, budgets, watchlist, annualPlans, taxProfile, emergencyItems, netWorthSnapshots, aiQueries } from "@/db/schema";

// ─── Inferred DB Row Types ─────────────────────────────────────

export type UserRow = typeof users.$inferSelect;
export type MemberRow = typeof members.$inferSelect;
export type AccountRow = typeof accounts.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type InvestmentRow = typeof investments.$inferSelect;
export type DebtRow = typeof debts.$inferSelect;
export type BillRow = typeof bills.$inferSelect;
export type InsuranceRow = typeof insurance.$inferSelect;
export type GoalRow = typeof goals.$inferSelect;
export type BudgetRow = typeof budgets.$inferSelect;
export type WatchlistRow = typeof watchlist.$inferSelect;
export type AnnualPlanRow = typeof annualPlans.$inferSelect;
export type TaxProfileRow = typeof taxProfile.$inferSelect;
export type EmergencyItemRow = typeof emergencyItems.$inferSelect;
export type NetWorthSnapshotRow = typeof netWorthSnapshots.$inferSelect;

export type AIQueryRow = typeof aiQueries.$inferSelect;

// ─── Dashboard Data Bundle ─────────────────────────────────────

export type DashboardData = {
  txns: TransactionRow[];
  bills: BillRow[];
  debts: DebtRow[];
  goals: GoalRow[];
  invs: InvestmentRow[];
  accounts: AccountRow[];
  members: MemberRow[];
};

// ─── Markets Data Bundle ───────────────────────────────────────

export type MarketItem = {
  id: number;
  kind: "stock" | "mf";
  symbol: string | null;
  schemeCode: string | null;
  label: string;
  source?: "watchlist" | "investment";
  units?: string | null;
  invested?: string | null;
  currentValue?: string | null;
  currentPrice?: number;
  investmentId?: number;
  investmentType?: string;
};

export type MarketsData = {
  items: MarketItem[];
  investments: InvestmentRow[];
  accounts: AccountRow[];
};

// ─── Investment Form Types ─────────────────────────────────────

export type InvestmentFormData = {
  name: string;
  type: string;
  avgPrice: number;
  invested: number;
  currentValue: number;
  annualReturn: number;
  symbol: string;
  schemeCode: string;
  units: string;
  startDate: string;
  memberId?: number | null;
};

export type InvestmentInitialData = {
  name?: string;
  symbol?: string;
  schemeCode?: string;
  type?: string;
  price?: number;
  kind?: string;
};

// ─── Account Types ─────────────────────────────────────────────

export type AccountOption = {
  id: number;
  name: string;
  type: string;
};

// ─── Sell Investment Types ─────────────────────────────────────

export type SellFormState = {
  sellUnits: number;
  sellPrice: number;
  sellAmount: number;
  accountId: string;
  settled: boolean;
};

// ─── Pagination Types ──────────────────────────────────────────

export type PaginationParams = {
  page?: number;
  limit?: number;
  cursor?: number;
};

/** Alias used by data.ts */
export type PaginationInput = PaginationParams;

export type PaginatedResponse<T> = {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
};

// ─── API Response Types ────────────────────────────────────────

export type ApiSuccessResponse<T = unknown> = {
  ok: true;
  data?: T;
};

export type ApiErrorResponse = {
  ok: false;
  error: string;
  details?: Record<string, string>;
  requestId?: string;
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Health Score Types ────────────────────────────────────────

export type HealthScoreInput = {
  savingsRate: number;
  emergencyMonths: number;
  debtToIncome: number;
  investmentRate: number;
};

// ─── Spending View Types ───────────────────────────────────────

export type SpendingView = "daily" | "weekly" | "monthly" | "yearly";

// ─── Chart Types ───────────────────────────────────────────────

export type ChartPoint = {
  date: string;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
};

export type ChartRange = "1m" | "3m" | "6m" | "1y" | "3y" | "5y";
export type ChartType = "line" | "candle";
