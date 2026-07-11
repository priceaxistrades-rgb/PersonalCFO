import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * ═══════════════════════════════════════════════════════════════
 * COMPREHENSIVE SCHEMA MIGRATION — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * This endpoint syncs the database schema to match the Drizzle
 * ORM definitions in src/db/schema.ts.
 *
 * It is IDEMPOTENT — safe to run multiple times.
 *
 * Call: GET /api/migrate
 * ═══════════════════════════════════════════════════════════════
 */

export const dynamic = "force-dynamic";

type MigrationResult = { step: string; status: "ok" | "skipped" | "error"; detail?: string };

async function exec(stmt: string): Promise<void> {
  await db.execute(sql.raw(stmt));
}

async function enumExists(name: string): Promise<boolean> {
  const res = await db.execute(
    sql`SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = ${name} AND n.nspname = current_schema()`
  );
  return (res.rows as any[])?.length > 0;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const res = await db.execute(
    sql`SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ${table} AND column_name = ${column}`
  );
  return (res.rows as any[])?.length > 0;
}

async function tableExists(table: string): Promise<boolean> {
  const res = await db.execute(
    sql`SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ${table}`
  );
  return (res.rows as any[])?.length > 0;
}

async function indexExists(name: string): Promise<boolean> {
  const res = await db.execute(
    sql`SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = ${name}`
  );
  return (res.rows as any[])?.length > 0;
}

async function getColumnType(table: string, column: string): Promise<string | null> {
  const res = await db.execute(
    sql`SELECT udt_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ${table} AND column_name = ${column}`
  );
  const rows = res.rows as any[];
  return rows?.[0]?.udt_name ?? null;
}

async function createEnum(name: string, values: string[], results: MigrationResult[]) {
  try {
    if (await enumExists(name)) {
      results.push({ step: `enum:${name}`, status: "skipped", detail: "already exists" });
      return;
    }
    const vals = values.map((v) => `'${v}'`).join(", ");
    await exec(`CREATE TYPE "${name}" AS ENUM (${vals});`);
    results.push({ step: `enum:${name}`, status: "ok" });
  } catch (e: any) {
    results.push({ step: `enum:${name}`, status: "error", detail: e.message });
  }
}

async function addColumn(
  table: string,
  column: string,
  type: string,
  results: MigrationResult[],
  opts?: { default?: string; notNull?: boolean }
) {
  try {
    if (!(await tableExists(table))) {
      results.push({ step: `col:${table}.${column}`, status: "skipped", detail: "table missing" });
      return;
    }
    if (await columnExists(table, column)) {
      results.push({ step: `col:${table}.${column}`, status: "skipped", detail: "already exists" });
      return;
    }
    let def = `ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`;
    if (opts?.default !== undefined) def += ` DEFAULT ${opts.default}`;
    if (opts?.notNull && opts?.default) def += " NOT NULL";
    await exec(def);
    results.push({ step: `col:${table}.${column}`, status: "ok" });
  } catch (e: any) {
    results.push({ step: `col:${table}.${column}`, status: "error", detail: e.message });
  }
}

async function createIndex(name: string, def: string, results: MigrationResult[]) {
  try {
    if (await indexExists(name)) {
      results.push({ step: `idx:${name}`, status: "skipped" });
      return;
    }
    await exec(`CREATE INDEX IF NOT EXISTS "${name}" ON ${def};`);
    results.push({ step: `idx:${name}`, status: "ok" });
  } catch (e: any) {
    results.push({ step: `idx:${name}`, status: "error", detail: e.message });
  }
}

async function createUniqueIndex(name: string, def: string, results: MigrationResult[]) {
  try {
    if (await indexExists(name)) {
      results.push({ step: `uidx:${name}`, status: "skipped" });
      return;
    }
    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "${name}" ON ${def};`);
    results.push({ step: `uidx:${name}`, status: "ok" });
  } catch (e: any) {
    results.push({ step: `uidx:${name}`, status: "error", detail: e.message });
  }
}

async function createTable(stmt: string, name: string, results: MigrationResult[]) {
  try {
    if (await tableExists(name)) {
      results.push({ step: `table:${name}`, status: "skipped" });
      return;
    }
    await exec(stmt);
    results.push({ step: `table:${name}`, status: "ok" });
  } catch (e: any) {
    results.push({ step: `table:${name}`, status: "error", detail: e.message });
  }
}

export async function GET() {
  const results: MigrationResult[] = [];
  const start = Date.now();

  try {
    // ─── 1. Create all pgEnums ───────────────────────────────
    await createEnum("audit_action", ["create", "update", "delete", "login", "logout", "sell", "import", "sync"], results);
    await createEnum("account_type", ["Cash", "Bank", "Wallet", "Gold", "RealEstate", "Other"], results);
    await createEnum("account_category", ["asset", "liquid"], results);
    await createEnum("transaction_type", ["income", "expense"], results);
    await createEnum("investment_type", [
      "Stocks", "MutualFunds", "PPF", "EPF", "NPS", "FD", "RD",
      "Gold", "Silver", "Bonds", "Crypto", "RealEstate", "Other",
    ], results);
    await createEnum("debt_type", ["HomeLoan", "CarLoan", "EducationLoan", "CreditCard", "PersonalLoan"], results);
    await createEnum("member_role", ["Self", "Spouse", "Child", "Parent", "Household"], results);
    await createEnum("bill_frequency", ["Monthly", "Quarterly", "Yearly", "One-time"], results);
    await createEnum("insurance_type", ["Health", "Life", "Vehicle", "Property"], results);
    await createEnum("goal_category", [
      "Emergency", "Vacation", "House", "Car", "Education",
      "Wedding", "Retirement", "Custom",
    ], results);
    await createEnum("annual_category", ["Financial", "Savings", "Investment", "Tax", "Purchase"], results);
    await createEnum("annual_status", ["Planned", "InProgress", "Done"], results);
    await createEnum("tax_regime", ["old", "new"], results);
    await createEnum("watchlist_kind", ["stock", "mf"], results);

    // ─── 2. Create / ensure users table ─────────────────────
    await createTable(`CREATE TABLE IF NOT EXISTS "users" (
      "id" SERIAL PRIMARY KEY,
      "email" VARCHAR(255) NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "profile_image" TEXT,
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
    )`, "users", results);

    // ─── 3. Add missing columns to existing tables ───────────

    // Users
    await addColumn("users", "profile_image", "TEXT", results);
    await addColumn("users", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("users", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Members
    await addColumn("members", "user_id", "INTEGER", results);
    await addColumn("members", "role", "member_role", results, { default: "'Household'" });
    await addColumn("members", "color", "TEXT", results, { default: "'#6366f1'" });
    await addColumn("members", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("members", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Accounts — THE CRITICAL ONE causing the user's error
    await addColumn("accounts", "user_id", "INTEGER", results);
    await addColumn("accounts", "type", "account_type", results, { default: "'Cash'" });
    await addColumn("accounts", "category", "account_category", results, { default: "'liquid'" });
    await addColumn("accounts", "balance", "NUMERIC(14,2)", results, { default: "'0'" });
    await addColumn("accounts", "member_id", "INTEGER", results);
    await addColumn("accounts", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("accounts", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Transactions
    await addColumn("transactions", "user_id", "INTEGER", results);
    await addColumn("transactions", "type", "transaction_type", results);
    await addColumn("transactions", "category", "TEXT", results);
    await addColumn("transactions", "amount", "NUMERIC(14,2)", results);
    await addColumn("transactions", "txn_date", "DATE", results);
    await addColumn("transactions", "member_id", "INTEGER", results);
    await addColumn("transactions", "account_id", "INTEGER", results);
    await addColumn("transactions", "note", "TEXT", results);
    await addColumn("transactions", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("transactions", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Budgets
    await addColumn("budgets", "user_id", "INTEGER", results);
    await addColumn("budgets", "category", "TEXT", results);
    await addColumn("budgets", "monthly_limit", "NUMERIC(14,2)", results);
    await addColumn("budgets", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("budgets", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Goals
    await addColumn("goals", "user_id", "INTEGER", results);
    await addColumn("goals", "name", "TEXT", results);
    await addColumn("goals", "category", "goal_category", results, { default: "'Custom'" });
    await addColumn("goals", "target", "NUMERIC(14,2)", results);
    await addColumn("goals", "saved", "NUMERIC(14,2)", results, { default: "'0'" });
    await addColumn("goals", "deadline", "DATE", results);
    await addColumn("goals", "icon", "TEXT", results, { default: "'🎯'" });
    await addColumn("goals", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("goals", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Investments
    await addColumn("investments", "user_id", "INTEGER", results);
    await addColumn("investments", "name", "TEXT", results);
    await addColumn("investments", "type", "investment_type", results);
    await addColumn("investments", "invested", "NUMERIC(14,2)", results);
    await addColumn("investments", "current_value", "NUMERIC(14,2)", results);
    await addColumn("investments", "annual_return", "NUMERIC(6,2)", results, { default: "'0'" });
    await addColumn("investments", "symbol", "TEXT", results);
    await addColumn("investments", "scheme_code", "TEXT", results);
    await addColumn("investments", "units", "NUMERIC(16,4)", results);
    await addColumn("investments", "start_date", "DATE", results);
    await addColumn("investments", "member_id", "INTEGER", results);
    await addColumn("investments", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("investments", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Watchlist
    await addColumn("watchlist", "user_id", "INTEGER", results);
    await addColumn("watchlist", "kind", "watchlist_kind", results);
    await addColumn("watchlist", "symbol", "TEXT", results);
    await addColumn("watchlist", "scheme_code", "TEXT", results);
    await addColumn("watchlist", "label", "TEXT", results);
    await addColumn("watchlist", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("watchlist", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Debts
    await addColumn("debts", "user_id", "INTEGER", results);
    await addColumn("debts", "name", "TEXT", results);
    await addColumn("debts", "type", "debt_type", results);
    await addColumn("debts", "principal", "NUMERIC(14,2)", results);
    await addColumn("debts", "outstanding", "NUMERIC(14,2)", results);
    await addColumn("debts", "interest_rate", "NUMERIC(6,2)", results);
    await addColumn("debts", "emi", "NUMERIC(14,2)", results);
    await addColumn("debts", "tenure_months", "INTEGER", results);
    await addColumn("debts", "member_id", "INTEGER", results);
    await addColumn("debts", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("debts", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Bills
    await addColumn("bills", "user_id", "INTEGER", results);
    await addColumn("bills", "name", "TEXT", results);
    await addColumn("bills", "category", "TEXT", results);
    await addColumn("bills", "amount", "NUMERIC(14,2)", results);
    await addColumn("bills", "due_date", "DATE", results);
    await addColumn("bills", "frequency", "bill_frequency", results, { default: "'Monthly'" });
    await addColumn("bills", "paid", "BOOLEAN", results, { default: "false" });
    await addColumn("bills", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("bills", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Insurance
    await addColumn("insurance", "user_id", "INTEGER", results);
    await addColumn("insurance", "name", "TEXT", results);
    await addColumn("insurance", "type", "insurance_type", results);
    await addColumn("insurance", "provider", "TEXT", results);
    await addColumn("insurance", "premium", "NUMERIC(14,2)", results);
    await addColumn("insurance", "coverage", "NUMERIC(14,2)", results);
    await addColumn("insurance", "renewal_date", "DATE", results);
    await addColumn("insurance", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("insurance", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Net worth snapshots
    await addColumn("net_worth_snapshots", "user_id", "INTEGER", results);
    await addColumn("net_worth_snapshots", "snapshot_date", "DATE", results);
    await addColumn("net_worth_snapshots", "assets", "NUMERIC(14,2)", results);
    await addColumn("net_worth_snapshots", "liabilities", "NUMERIC(14,2)", results);
    await addColumn("net_worth_snapshots", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("net_worth_snapshots", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Annual plans
    await addColumn("annual_plans", "user_id", "INTEGER", results);
    await addColumn("annual_plans", "year", "INTEGER", results);
    await addColumn("annual_plans", "title", "TEXT", results);
    await addColumn("annual_plans", "category", "annual_category", results);
    await addColumn("annual_plans", "target_amount", "NUMERIC(14,2)", results, { default: "'0'" });
    await addColumn("annual_plans", "progress", "INTEGER", results, { default: "0" });
    await addColumn("annual_plans", "status", "annual_status", results, { default: "'Planned'" });
    await addColumn("annual_plans", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("annual_plans", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Tax profile
    await addColumn("tax_profile", "user_id", "INTEGER", results);
    await addColumn("tax_profile", "regime", "tax_regime", results, { default: "'new'" });
    await addColumn("tax_profile", "gross_salary", "NUMERIC(14,2)", results, { default: "'0'" });
    await addColumn("tax_profile", "business_income", "NUMERIC(14,2)", results, { default: "'0'" });
    await addColumn("tax_profile", "capital_gains", "NUMERIC(14,2)", results, { default: "'0'" });
    await addColumn("tax_profile", "section_80c", "NUMERIC(14,2)", results, { default: "'0'" });
    await addColumn("tax_profile", "section_80d", "NUMERIC(14,2)", results, { default: "'0'" });
    await addColumn("tax_profile", "hra_exemption", "NUMERIC(14,2)", results, { default: "'0'" });
    await addColumn("tax_profile", "home_loan_interest", "NUMERIC(14,2)", results, { default: "'0'" });
    await addColumn("tax_profile", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("tax_profile", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Emergency items
    await addColumn("emergency_items", "user_id", "INTEGER", results);
    await addColumn("emergency_items", "kind", "TEXT", results);
    await addColumn("emergency_items", "label", "TEXT", results);
    await addColumn("emergency_items", "detail", "TEXT", results);
    await addColumn("emergency_items", "done", "BOOLEAN", results, { default: "false" });
    await addColumn("emergency_items", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });
    await addColumn("emergency_items", "updated_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // Password reset tokens
    await addColumn("password_reset_tokens", "user_id", "INTEGER", results);
    await addColumn("password_reset_tokens", "token", "TEXT", results);
    await addColumn("password_reset_tokens", "expires_at", "TIMESTAMP", results);
    await addColumn("password_reset_tokens", "used_at", "TIMESTAMP", results);
    await addColumn("password_reset_tokens", "created_at", "TIMESTAMP", results, { default: "NOW()", notNull: true });

    // ─── 4. Create audit_log table ──────────────────────────
    await createTable(`CREATE TABLE IF NOT EXISTS "audit_log" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER,
      "action" audit_action NOT NULL,
      "table_name" TEXT NOT NULL,
      "record_id" INTEGER,
      "changes" TEXT,
      "ip" TEXT,
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
    )`, "audit_log", results);

    // ─── 4b. Create ai_queries table ────────────────────────
    await createTable(`CREATE TABLE IF NOT EXISTS "ai_queries" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER,
      "question" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "answer" TEXT NOT NULL,
      "confidence" TEXT NOT NULL DEFAULT 'medium',
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
    )`, "ai_queries", results);

    // ─── 4c. Create password_reset_tokens table ────────────
    await createTable(`CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "expires_at" TIMESTAMP NOT NULL,
      "used_at" TIMESTAMP,
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
    )`, "password_reset_tokens", results);

    // ─── 5. Create indexes ──────────────────────────────────
    await createIndex("members_user_id_idx", `"members" ("user_id")`, results);
    await createIndex("accounts_user_id_idx", `"accounts" ("user_id")`, results);
    await createIndex("accounts_member_id_idx", `"accounts" ("member_id")`, results);
    await createIndex("transactions_user_id_idx", `"transactions" ("user_id")`, results);
    await createIndex("transactions_txn_date_idx", `"transactions" ("txn_date")`, results);
    await createIndex("transactions_type_idx", `"transactions" ("type")`, results);
    await createIndex("transactions_account_id_idx", `"transactions" ("account_id")`, results);
    await createIndex("transactions_user_date_idx", `"transactions" ("user_id", "txn_date")`, results);
    await createIndex("transactions_user_type_date_idx", `"transactions" ("user_id", "type", "txn_date")`, results);
    await createIndex("budgets_user_id_idx", `"budgets" ("user_id")`, results);
    await createIndex("goals_user_id_idx", `"goals" ("user_id")`, results);
    await createIndex("investments_user_id_idx", `"investments" ("user_id")`, results);
    await createIndex("investments_member_id_idx", `"investments" ("member_id")`, results);
    await createUniqueIndex("investments_user_symbol_idx", `"investments" ("user_id", "symbol")`, results);
    await createIndex("watchlist_user_id_idx", `"watchlist" ("user_id")`, results);
    await createIndex("debts_user_id_idx", `"debts" ("user_id")`, results);
    await createIndex("bills_user_id_idx", `"bills" ("user_id")`, results);
    await createIndex("bills_due_date_idx", `"bills" ("due_date")`, results);
    await createIndex("insurance_user_id_idx", `"insurance" ("user_id")`, results);
    await createIndex("insurance_renewal_date_idx", `"insurance" ("renewal_date")`, results);
    await createIndex("net_worth_snapshots_user_id_idx", `"net_worth_snapshots" ("user_id")`, results);
    await createIndex("net_worth_snapshots_date_idx", `"net_worth_snapshots" ("snapshot_date")`, results);
    await createUniqueIndex("net_worth_snapshots_user_date_idx", `"net_worth_snapshots" ("user_id", "snapshot_date")`, results);
    await createIndex("annual_plans_user_id_idx", `"annual_plans" ("user_id")`, results);
    await createIndex("tax_profile_user_id_idx", `"tax_profile" ("user_id")`, results);
    await createIndex("emergency_items_user_id_idx", `"emergency_items" ("user_id")`, results);
    await createIndex("audit_log_user_id_idx", `"audit_log" ("user_id")`, results);
    await createIndex("audit_log_action_idx", `"audit_log" ("action")`, results);
    await createIndex("audit_log_table_record_idx", `"audit_log" ("table_name", "record_id")`, results);
    await createIndex("audit_log_created_at_idx", `"audit_log" ("created_at")`, results);
    await createIndex("ai_queries_user_id_idx", `"ai_queries" ("user_id")`, results);
    await createIndex("ai_queries_created_at_idx", `"ai_queries" ("created_at")`, results);
    await createIndex("password_reset_tokens_user_id_idx", `"password_reset_tokens" ("user_id")`, results);
    await createIndex("password_reset_tokens_token_idx", `"password_reset_tokens" ("token")`, results);

    // ─── 6. Fix enum-typed columns if they were created as TEXT ──
    // For accounts.type — if it's currently TEXT, alter to enum
    try {
      const typeName = await getColumnType("accounts", "type");
      if (typeName === "text" || typeName === "character varying") {
        await exec(`UPDATE "accounts" SET "type" = 'Cash' WHERE "type" IS NULL`);
        await exec(`ALTER TABLE "accounts" ALTER COLUMN "type" TYPE account_type USING "type"::account_type`);
        await exec(`ALTER TABLE "accounts" ALTER COLUMN "type" SET DEFAULT 'Cash'`);
        results.push({ step: "alter:accounts.type→enum", status: "ok" });
      } else if (typeName) {
        results.push({ step: "alter:accounts.type→enum", status: "skipped", detail: `already ${typeName}` });
      }
    } catch (e: any) {
      results.push({ step: "alter:accounts.type→enum", status: "error", detail: e.message });
    }

    // Fix accounts.category — if column exists as TEXT, alter to enum
    try {
      if (await columnExists("accounts", "category")) {
        const typeName = await getColumnType("accounts", "category");
        if (typeName === "text" || typeName === "character varying") {
          await exec(`UPDATE "accounts" SET "category" = 'liquid' WHERE "category" IS NULL`);
          await exec(`ALTER TABLE "accounts" ALTER COLUMN "category" TYPE account_category USING "category"::account_category`);
          await exec(`ALTER TABLE "accounts" ALTER COLUMN "category" SET DEFAULT 'liquid'`);
          results.push({ step: "alter:accounts.category→enum", status: "ok" });
        } else if (typeName) {
          results.push({ step: "alter:accounts.category→enum", status: "skipped", detail: `already ${typeName}` });
        }
      }
    } catch (e: any) {
      results.push({ step: "alter:accounts.category→enum", status: "error", detail: e.message });
    }

    // Fix transactions.type if it's TEXT
    try {
      if (await columnExists("transactions", "type")) {
        const typeName = await getColumnType("transactions", "type");
        if (typeName === "text" || typeName === "character varying") {
          await exec(`UPDATE "transactions" SET "type" = 'expense' WHERE "type" IS NULL OR "type" NOT IN ('income', 'expense')`);
          await exec(`ALTER TABLE "transactions" ALTER COLUMN "type" TYPE transaction_type USING "type"::transaction_type`);
          results.push({ step: "alter:transactions.type→enum", status: "ok" });
        } else if (typeName) {
          results.push({ step: "alter:transactions.type→enum", status: "skipped", detail: `already ${typeName}` });
        }
      }
    } catch (e: any) {
      results.push({ step: "alter:transactions.type→enum", status: "error", detail: e.message });
    }

    // ─── 7. Backfill defaults for new NOT NULL columns ──────
    for (const table of [
      "users", "members", "accounts", "transactions", "budgets",
      "goals", "investments", "watchlist", "debts", "bills",
      "insurance", "net_worth_snapshots", "annual_plans",
      "tax_profile", "emergency_items", "audit_log",
    ]) {
      if (await columnExists(table, "updated_at")) {
        try {
          await exec(`UPDATE "${table}" SET "updated_at" = COALESCE("created_at", NOW()) WHERE "updated_at" IS NULL`);
          results.push({ step: `backfill:${table}.updated_at`, status: "ok" });
        } catch (e: any) {
          results.push({ step: `backfill:${table}.updated_at`, status: "error", detail: e.message });
        }
      }
    }

    // Backfill category defaults for accounts
    if (await columnExists("accounts", "category")) {
      try {
        await exec(`UPDATE "accounts" SET "category" = 'liquid' WHERE "category" IS NULL`);
        results.push({ step: "backfill:accounts.category", status: "ok" });
      } catch (e: any) {
        results.push({ step: "backfill:accounts.category", status: "error", detail: e.message });
      }
    }

    // Backfill balance defaults for accounts
    if (await columnExists("accounts", "balance")) {
      try {
        await exec(`UPDATE "accounts" SET "balance" = '0' WHERE "balance" IS NULL`);
        results.push({ step: "backfill:accounts.balance", status: "ok" });
      } catch (e: any) {
        results.push({ step: "backfill:accounts.balance", status: "error", detail: e.message });
      }
    }

    // Backfill goals.category and goals.icon
    if (await columnExists("goals", "category")) {
      try {
        await exec(`UPDATE "goals" SET "category" = 'Custom' WHERE "category" IS NULL`);
        results.push({ step: "backfill:goals.category", status: "ok" });
      } catch (e: any) {
        results.push({ step: "backfill:goals.category", status: "error", detail: e.message });
      }
    }

    const duration = Date.now() - start;
    const errors = results.filter((r) => r.status === "error");
    const ok = results.filter((r) => r.status === "ok");
    const skipped = results.filter((r) => r.status === "skipped");

    logger.info("Schema migration completed", {
      duration,
      ok: ok.length,
      skipped: skipped.length,
      errors: errors.length,
    });

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? `Migration complete (${ok.length} applied, ${skipped.length} already existed)`
        : `Migration completed with ${errors.length} errors`,
      stats: { ok: ok.length, skipped: skipped.length, errors: errors.length, durationMs: duration },
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    logger.error("Schema migration failed", err);
    return NextResponse.json({
      success: false,
      message: `Migration failed: ${err.message}`,
      results,
    }, { status: 500 });
  }
}
