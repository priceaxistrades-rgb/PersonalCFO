import pg from "pg";
import fs from "fs";

function loadEnv() {
  if (!fs.existsSync(".env")) return;
  const env = fs.readFileSync(".env", "utf8");
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] ||= value;
  }
}

loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required. Add it to .env or environment variables.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
const q = (text, params) => pool.query(text, params);

async function columnExists(table, column) {
  const res = await q(
    `select 1 from information_schema.columns where table_schema = current_schema() and table_name = $1 and column_name = $2`,
    [table, column]
  );
  return res.rowCount > 0;
}

async function tableExists(table) {
  const res = await q(
    `select 1 from information_schema.tables where table_schema = current_schema() and table_name = $1`,
    [table]
  );
  return res.rowCount > 0;
}

async function addColumn(table, column, type) {
  if (await tableExists(table)) {
    await q(`alter table "${table}" add column if not exists "${column}" ${type};`);
  }
}

async function backfill(table) {
  if ((await tableExists(table)) && (await columnExists(table, "user_id"))) {
    await q(`update "${table}" set "user_id" = 1 where "user_id" is null;`);
  }
}

async function index(name, sql) {
  await q(`create index if not exists "${name}" on ${sql};`);
}

async function main() {
  console.log("Running user isolation migration...");

  await q(`create table if not exists "users" (
    "id" serial primary key,
    "email" varchar(255) not null unique,
    "password" text not null,
    "name" text not null,
    "created_at" timestamp not null default now()
  );`);

  await addColumn("users", "created_at", "timestamp default now()");
  await addColumn("users", "image", "text");

  const userTables = [
    "members",
    "accounts",
    "transactions",
    "budgets",
    "goals",
    "investments",
    "watchlist",
    "debts",
    "bills",
    "insurance",
    "net_worth_snapshots",
    "annual_plans",
    "tax_profile",
    "emergency_items",
  ];

  for (const table of userTables) {
    await addColumn(table, "user_id", "integer");
  }

  for (const table of ["accounts", "transactions", "investments", "debts"]) {
    await addColumn(table, "member_id", "integer");
  }

  await addColumn("transactions", "account_id", "integer");

  await q(`insert into "users" ("id", "email", "password", "name")
    values (1, 'legacy@personalcfo.local', 'legacy-migrated-user', 'Legacy Data')
    on conflict ("id") do nothing;`);

  for (const table of userTables) await backfill(table);

  await index("idx_transactions_user_date", `"transactions" ("user_id", "txn_date" desc)`);
  await index("idx_transactions_user_type", `"transactions" ("user_id", "type")`);
  await index("idx_accounts_user", `"accounts" ("user_id")`);
  await index("investments_user", `"investments" ("user_id")`);
  await index("idx_debts_user", `"debts" ("user_id")`);
  await index("idx_bills_user_due", `"bills" ("user_id", "due_date")`);
  await index("idx_goals_user", `"goals" ("user_id")`);
  await index("idx_members_user", `"members" ("user_id")`);
  await index("idx_watchlist_user", `"watchlist" ("user_id")`);

  await q(`select setval(pg_get_serial_sequence('"users"','id'), greatest((select coalesce(max(id), 1) from "users"), 1), true);`);

  console.log("✅ User isolation migration complete.");
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
