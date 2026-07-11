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
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums for type safety ─────────────────────────────────────

export const auditActionEnum = pgEnum("audit_action", [
  "create", "update", "delete", "login", "logout", "sell", "import", "sync",
]);

export const accountTypeEnum = pgEnum("account_type", ["Cash", "Bank", "Wallet", "Gold", "RealEstate", "Other"]);
export const accountCategoryEnum = pgEnum("account_category", ["asset", "liquid"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);
export const investmentTypeEnum = pgEnum("investment_type", [
  "Stocks", "MutualFunds", "PPF", "EPF", "NPS", "FD", "RD",
  "Gold", "Silver", "Bonds", "Crypto", "RealEstate", "Other",
]);
export const debtTypeEnum = pgEnum("debt_type", ["HomeLoan", "CarLoan", "EducationLoan", "CreditCard", "PersonalLoan"]);
export const memberRoleEnum = pgEnum("member_role", ["Self", "Spouse", "Child", "Parent", "Household"]);
export const billFrequencyEnum = pgEnum("bill_frequency", ["Monthly", "Quarterly", "Yearly", "One-time"]);
export const insuranceTypeEnum = pgEnum("insurance_type", ["Health", "Life", "Vehicle", "Property"]);
export const goalCategoryEnum = pgEnum("goal_category", [
  "Emergency", "Vacation", "House", "Car", "Education",
  "Wedding", "Retirement", "Custom",
]);
export const annualCategoryEnum = pgEnum("annual_category", ["Financial", "Savings", "Investment", "Tax", "Purchase"]);
export const annualStatusEnum = pgEnum("annual_status", ["Planned", "InProgress", "Done"]);
export const taxRegimeEnum = pgEnum("tax_regime", ["old", "new"]);
export const watchlistKindEnum = pgEnum("watchlist_kind", ["stock", "mf", "commodity", "crypto", "index", "reit", "bond"]);

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(), // hashed
  name: text("name").notNull(),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Family members for per-person budget tracking
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: memberRoleEnum("role").notNull().default("Household"),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("members_user_id_idx").on(table.userId),
]);

// Accounts / Assets (cash, bank, gold, property, etc.)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  category: accountCategoryEnum("category").notNull().default("liquid"),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("0"),
  memberId: integer("member_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("accounts_user_id_idx").on(table.userId),
  index("accounts_member_id_idx").on(table.memberId),
]);

// Income & Expense transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  txnDate: date("txn_date").notNull(),
  memberId: integer("member_id"),
  accountId: integer("account_id"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("transactions_user_id_idx").on(table.userId),
  index("transactions_txn_date_idx").on(table.txnDate),
  index("transactions_type_idx").on(table.type),
  index("transactions_account_id_idx").on(table.accountId),
  index("transactions_user_date_idx").on(table.userId, table.txnDate),
  index("transactions_user_type_date_idx").on(table.userId, table.type, table.txnDate),
]);

// Monthly budgets per category
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  monthlyLimit: numeric("monthly_limit", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("budgets_user_id_idx").on(table.userId),
]);

// Savings goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: goalCategoryEnum("category").notNull(),
  target: numeric("target", { precision: 14, scale: 2 }).notNull(),
  saved: numeric("saved", { precision: 14, scale: 2 }).notNull().default("0"),
  deadline: date("deadline"),
  icon: text("icon").notNull().default("🎯"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("goals_user_id_idx").on(table.userId),
]);

// Investments
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: investmentTypeEnum("type").notNull(),
  invested: numeric("invested", { precision: 14, scale: 2 }).notNull(),
  currentValue: numeric("current_value", { precision: 14, scale: 2 }).notNull(),
  annualReturn: numeric("annual_return", { precision: 6, scale: 2 }).default("0"),
  // Live-tracking fields
  symbol: text("symbol"),
  schemeCode: text("scheme_code"),
  units: numeric("units", { precision: 16, scale: 4 }),
  startDate: date("start_date"),
  memberId: integer("member_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("investments_user_id_idx").on(table.userId),
  index("investments_member_id_idx").on(table.memberId),
  // Prevent duplicate stock investments per user
  uniqueIndex("investments_user_symbol_idx").on(table.userId, table.symbol),
]);

// Watchlist for live market tracking (stocks + mutual funds)
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  kind: watchlistKindEnum("kind").notNull(),
  symbol: text("symbol"),
  schemeCode: text("scheme_code"),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("watchlist_user_id_idx").on(table.userId),
]);

// Loans / Debts
export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: debtTypeEnum("type").notNull(),
  principal: numeric("principal", { precision: 14, scale: 2 }).notNull(),
  outstanding: numeric("outstanding", { precision: 14, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 2 }).notNull(),
  emi: numeric("emi", { precision: 14, scale: 2 }).notNull(),
  tenureMonths: integer("tenure_months").notNull(),
  memberId: integer("member_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  frequency: billFrequencyEnum("frequency").notNull().default("Monthly"),
  paid: boolean("paid").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("bills_user_id_idx").on(table.userId),
  index("bills_due_date_idx").on(table.dueDate),
]);

// Insurance policies
export const insurance = pgTable("insurance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: insuranceTypeEnum("type").notNull(),
  provider: text("provider").notNull(),
  premium: numeric("premium", { precision: 14, scale: 2 }).notNull(),
  coverage: numeric("coverage", { precision: 14, scale: 2 }).notNull(),
  renewalDate: date("renewal_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("net_worth_snapshots_user_id_idx").on(table.userId),
  index("net_worth_snapshots_date_idx").on(table.snapshotDate),
  // One snapshot per user per day
  uniqueIndex("net_worth_snapshots_user_date_idx").on(table.userId, table.snapshotDate),
]);

// Annual plan items
export const annualPlans = pgTable("annual_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  title: text("title").notNull(),
  category: annualCategoryEnum("category").notNull(),
  targetAmount: numeric("target_amount", { precision: 14, scale: 2 }).default("0"),
  progress: integer("progress").notNull().default(0),
  status: annualStatusEnum("status").notNull().default("Planned"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("annual_plans_user_id_idx").on(table.userId),
]);

// Single-row tax profile — one per user
export const taxProfile = pgTable("tax_profile", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  regime: taxRegimeEnum("regime").notNull().default("new"),
  grossSalary: numeric("gross_salary", { precision: 14, scale: 2 }).notNull().default("0"),
  businessIncome: numeric("business_income", { precision: 14, scale: 2 }).notNull().default("0"),
  capitalGains: numeric("capital_gains", { precision: 14, scale: 2 }).notNull().default("0"),
  section80c: numeric("section_80c", { precision: 14, scale: 2 }).notNull().default("0"),
  section80d: numeric("section_80d", { precision: 14, scale: 2 }).notNull().default("0"),
  hraExemption: numeric("hra_exemption", { precision: 14, scale: 2 }).notNull().default("0"),
  homeLoanInterest: numeric("home_loan_interest", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("tax_profile_user_id_idx").on(table.userId),
]);

// Emergency contacts & documents checklist
export const emergencyItems = pgTable("emergency_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  detail: text("detail"),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("emergency_items_user_id_idx").on(table.userId),
]);

// AI query history — stores user questions and AI financial twin responses
export const aiQueries = pgTable("ai_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  category: text("category").notNull(),
  answer: text("answer").notNull(),
  confidence: text("confidence").notNull().default("medium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ai_queries_user_id_idx").on(table.userId),
  index("ai_queries_created_at_idx").on(table.createdAt),
]);

// ─── Audit Log ──────────────────────────────────────────────
// Immutable record of all financial data changes for traceability
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: auditActionEnum("action").notNull(),
  table: text("table_name").notNull(),     // e.g. "transactions", "investments"
  recordId: integer("record_id"),           // PK of the affected row
  changes: text("changes"),                 // JSON diff of what changed
  ip: text("ip"),                           // Client IP
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("audit_log_user_id_idx").on(table.userId),
  index("audit_log_action_idx").on(table.action),
  index("audit_log_table_record_idx").on(table.table, table.recordId),
  index("audit_log_created_at_idx").on(table.createdAt),
]);
