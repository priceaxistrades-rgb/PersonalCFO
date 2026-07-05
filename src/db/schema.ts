import {
  pgTable,
  serial,
  text,
  numeric,
  date,
  boolean,
  timestamp,
  integer,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(), // hashed
  name: text("name").notNull(),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Family members for per-person budget tracking
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(), // Self, Spouse, Child, Parent, Household
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("members_user_id_idx").on(table.userId),
]);

// Accounts / Assets (cash, bank, gold, property, etc.)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // Cash, Bank, Wallet, Gold, RealEstate, Other
  category: text("category").notNull().default("asset"), // asset | liquid
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("0"),
  memberId: integer("member_id"), // Owner of this account
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("accounts_user_id_idx").on(table.userId),
  index("accounts_member_id_idx").on(table.memberId),
]);

// Income & Expense transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // income | expense
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  txnDate: date("txn_date").notNull(),
  memberId: integer("member_id"),
  accountId: integer("account_id"), // Bank/cash/wallet account affected by this transaction
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("transactions_user_id_idx").on(table.userId),
  index("transactions_txn_date_idx").on(table.txnDate),
  index("transactions_type_idx").on(table.type),
  index("transactions_account_id_idx").on(table.accountId),
  index("transactions_user_date_idx").on(table.userId, table.txnDate),
]);

// Monthly budgets per category
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  monthlyLimit: numeric("monthly_limit", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("budgets_user_id_idx").on(table.userId),
]);

// Savings goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(), // Emergency, Vacation, House, Car, Education, Wedding, Retirement, Custom
  target: numeric("target", { precision: 14, scale: 2 }).notNull(),
  saved: numeric("saved", { precision: 14, scale: 2 }).notNull().default("0"),
  deadline: date("deadline"),
  icon: text("icon").notNull().default("🎯"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("goals_user_id_idx").on(table.userId),
]);

// Investments
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // Stocks, MutualFunds, PPF, EPF, NPS, FD, RD, Gold, Silver, Bonds, Crypto, RealEstate, Other
  invested: numeric("invested", { precision: 14, scale: 2 }).notNull(),
  currentValue: numeric("current_value", { precision: 14, scale: 2 }).notNull(),
  annualReturn: numeric("annual_return", { precision: 6, scale: 2 }).default("0"),
  // Live-tracking fields
  symbol: text("symbol"), // Yahoo Finance symbol for stocks, e.g. RELIANCE.NS
  schemeCode: text("scheme_code"), // mfapi.in scheme code for mutual funds
  units: numeric("units", { precision: 16, scale: 4 }), // quantity of shares / MF units held
  startDate: date("start_date"), // first purchase date, used for CAGR
  memberId: integer("member_id"), // Owner of this investment
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("investments_user_id_idx").on(table.userId),
  index("investments_member_id_idx").on(table.memberId),
]);

// Watchlist for live market tracking (stocks + mutual funds)
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // stock | mf
  symbol: text("symbol"), // Yahoo symbol for stocks
  schemeCode: text("scheme_code"), // mfapi code for MFs
  label: text("label").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("watchlist_user_id_idx").on(table.userId),
]);

// Loans / Debts
export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // HomeLoan, CarLoan, EducationLoan, CreditCard, PersonalLoan
  principal: numeric("principal", { precision: 14, scale: 2 }).notNull(),
  outstanding: numeric("outstanding", { precision: 14, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 2 }).notNull(),
  emi: numeric("emi", { precision: 14, scale: 2 }).notNull(),
  tenureMonths: integer("tenure_months").notNull(),
  memberId: integer("member_id"), // Primary borrower
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("debts_user_id_idx").on(table.userId),
]);

// Bills
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  frequency: text("frequency").notNull().default("Monthly"), // Monthly, Quarterly, Yearly
  paid: boolean("paid").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("bills_user_id_idx").on(table.userId),
  index("bills_due_date_idx").on(table.dueDate),
]);

// Insurance policies
export const insurance = pgTable("insurance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // Health, Life, Vehicle, Property
  provider: text("provider").notNull(),
  premium: numeric("premium", { precision: 14, scale: 2 }).notNull(),
  coverage: numeric("coverage", { precision: 14, scale: 2 }).notNull(),
  renewalDate: date("renewal_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("insurance_user_id_idx").on(table.userId),
  index("insurance_renewal_date_idx").on(table.renewalDate),
]);

// Net worth historical snapshots
export const netWorthSnapshots = pgTable("net_worth_snapshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  snapshotDate: date("snapshot_date").notNull(),
  assets: numeric("assets", { precision: 14, scale: 2 }).notNull(),
  liabilities: numeric("liabilities", { precision: 14, scale: 2 }).notNull(),
}, (table) => [
  index("net_worth_snapshots_user_id_idx").on(table.userId),
  index("net_worth_snapshots_date_idx").on(table.snapshotDate),
]);

// Annual plan items
export const annualPlans = pgTable("annual_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(), // Financial, Savings, Investment, Tax, Purchase
  targetAmount: numeric("target_amount", { precision: 14, scale: 2 }).default("0"),
  progress: integer("progress").notNull().default(0), // 0-100
  status: text("status").notNull().default("Planned"), // Planned, InProgress, Done
}, (table) => [
  index("annual_plans_user_id_idx").on(table.userId),
]);

// Single-row tax profile
export const taxProfile = pgTable("tax_profile", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  regime: text("regime").notNull().default("new"), // old | new
  grossSalary: numeric("gross_salary", { precision: 14, scale: 2 }).notNull().default("0"),
  businessIncome: numeric("business_income", { precision: 14, scale: 2 }).notNull().default("0"),
  capitalGains: numeric("capital_gains", { precision: 14, scale: 2 }).notNull().default("0"),
  section80c: numeric("section_80c", { precision: 14, scale: 2 }).notNull().default("0"),
  section80d: numeric("section_80d", { precision: 14, scale: 2 }).notNull().default("0"),
  hraExemption: numeric("hra_exemption", { precision: 14, scale: 2 }).notNull().default("0"),
  homeLoanInterest: numeric("home_loan_interest", { precision: 14, scale: 2 }).notNull().default("0"),
}, (table) => [
  index("tax_profile_user_id_idx").on(table.userId),
]);

// Emergency contacts & documents checklist
export const emergencyItems = pgTable("emergency_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // contact | document
  label: text("label").notNull(),
  detail: text("detail"),
  done: boolean("done").notNull().default(false),
}, (table) => [
  index("emergency_items_user_id_idx").on(table.userId),
]);
