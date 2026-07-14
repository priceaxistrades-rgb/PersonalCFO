import ExcelJS from "exceljs";
import { z } from "zod";
import { db } from "@/db";
import { transactions, accounts, investments, debts, bills, goals, members } from "@/db/schema";
import { isSession, requireApiSession } from "@/lib/server-auth";
import {
  accountCreateSchema,
  billCreateSchema,
  debtCreateSchema,
  goalCreateSchema,
  investmentCreateSchema,
  memberCreateSchema,
  transactionCreateSchema,
} from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_SHEETS = 20;
const MAX_COLUMNS = 30;
const MAX_ROWS_PER_SHEET = 5_000;
const MAX_TOTAL_ROWS = 10_000;
const IMPORT_TYPES = ["auto", "transactions", "accounts", "investments", "debts", "bills", "goals", "members"] as const;

// Historical debt templates from earlier releases did not include tenure.
// Keep that import contract compatible while preventing NaN from reaching Zod
// or PostgreSQL. New debt forms remain strict and require at least one month.
const debtImportSchema = debtCreateSchema.extend({
  tenureMonths: z.number().int().min(0).max(600),
});

type ImportType = Exclude<(typeof IMPORT_TYPES)[number], "auto">;
type ImportRow = Record<string, unknown>;

type ImportSheet = {
  name: string;
  rows: unknown[][];
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseExcelDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + value * 86_400_000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function parseAmount(value: unknown): string | null {
  const raw = text(value).replace(/[₹,\s]/g, "");
  if (!raw || !/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;
  return raw;
}

function parseBoolean(value: unknown): boolean {
  return ["true", "yes", "1", "paid"].includes(text(value).toLowerCase());
}

function cellValue(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const candidate = value as Record<string, unknown>;
  if ("formula" in candidate) throw new Error("Formula cells are not allowed in imports");
  if ("richText" in candidate && Array.isArray(candidate.richText)) {
    return candidate.richText
      .map((part) => (part && typeof part === "object" ? text((part as Record<string, unknown>).text) : text(part)))
      .join("");
  }
  if ("text" in candidate) return candidate.text;
  if ("result" in candidate) return candidate.result;
  return text(value);
}

function parseCsv(input: string): unknown[][] {
  const rows: unknown[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const character = input[i];
    const next = input[i + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      i += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((cell) => text(cell))) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  row.push(field);
  if (row.some((cell) => text(cell))) rows.push(row);
  return rows;
}

async function readSheets(fileName: string, bytes: Buffer): Promise<ImportSheet[]> {
  if (fileName.endsWith(".csv")) {
    return [{ name: fileName, rows: parseCsv(bytes.toString("utf8")) }];
  }

  if (!fileName.endsWith(".xlsx")) {
    throw new Error("Only .xlsx and .csv files are supported. Please save legacy .xls files as .xlsx first.");
  }

  const workbook = new ExcelJS.Workbook();
  // ExcelJS currently ships a Buffer type that is narrower than Node 22's
  // generic Buffer type. The runtime value is still a standard Buffer.
  await workbook.xlsx.load(bytes as never);
  if (workbook.worksheets.length > MAX_SHEETS) throw new Error(`Workbook exceeds the ${MAX_SHEETS}-sheet limit`);

  return workbook.worksheets.map((worksheet) => {
    if (worksheet.rowCount > MAX_ROWS_PER_SHEET) {
      throw new Error(`Sheet '${worksheet.name}' exceeds the ${MAX_ROWS_PER_SHEET}-row limit`);
    }
    if (worksheet.columnCount > MAX_COLUMNS) {
      throw new Error(`Sheet '${worksheet.name}' exceeds the ${MAX_COLUMNS}-column limit`);
    }

    const rows: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values: unknown[] = [];
      for (let column = 1; column <= Math.min(worksheet.columnCount, MAX_COLUMNS); column += 1) {
        values.push(cellValue(row.getCell(column).value));
      }
      if (values.some((value) => text(value))) rows.push(values);
    });
    return { name: worksheet.name, rows };
  });
}

function detectSheetType(headers: string[], sheetName: string): ImportType {
  const name = sheetName.toLowerCase();
  if (name.includes("transaction") || name.includes("income") || name.includes("expense")) return "transactions";
  if (name.includes("account") || name.includes("bank")) return "accounts";
  if (name.includes("investment") || name.includes("stock") || name.includes("mf")) return "investments";
  if (name.includes("debt") || name.includes("loan") || name.includes("emi")) return "debts";
  if (name.includes("bill")) return "bills";
  if (name.includes("goal") || name.includes("saving")) return "goals";
  if (name.includes("member") || name.includes("family")) return "members";

  const headerText = headers.join(" ");
  if (headerText.includes("amount") && headerText.includes("date")) return "transactions";
  if (headerText.includes("balance") && headerText.includes("account")) return "accounts";
  if (headerText.includes("invested") || headerText.includes("current value")) return "investments";
  if (headerText.includes("emi") || headerText.includes("outstanding")) return "debts";
  if (headerText.includes("due date") || headerText.includes("bill")) return "bills";
  if (headerText.includes("target") && headerText.includes("saved")) return "goals";
  return "transactions";
}

function parseRow(row: unknown[], headers: string[]): ImportRow {
  const data: ImportRow = {};
  for (let index = 0; index < headers.length; index += 1) {
    const header = headers[index];
    const value = row[index];
    if (!header) continue;

    if (header === "description" || header === "details" || header === "memo") data.note = value;
    else if (header.includes("name")) data.name = value;
    else if (header.includes("type")) data.type = value;
    else if (header.includes("category")) data.category = value;
    else if (header.includes("amount") || header.includes("sum")) data.amount = value;
    else if (header.includes("due")) data.dueDate = parseExcelDate(value);
    else if (header.includes("deadline")) data.deadline = parseExcelDate(value);
    else if (header.includes("start")) data.startDate = parseExcelDate(value);
    else if (header === "date" || (header.includes("date") && !header.includes("due"))) data.date = parseExcelDate(value);
    else if (header.includes("balance")) data.balance = value;
    else if (header.includes("outstanding")) data.outstanding = value;
    else if (header.includes("invested")) data.invested = value;
    else if (header.includes("current")) data.currentValue = value;
    else if (header.includes("emi")) data.emi = value;
    else if (header.includes("principal")) data.principal = value;
    else if (header.includes("rate") || header.includes("interest")) data.rate = value;
    else if (header.includes("tenure") || header.includes("months")) data.tenure = value;
    else if (header.includes("target")) data.target = value;
    else if (header.includes("saved")) data.saved = value;
    else if (header.includes("note")) data.note = value;
    else if (header.includes("paid")) data.paid = value;
    else if (header.includes("frequency")) data.frequency = value;
    else if (header.includes("scheme") && header.includes("code")) data.schemeCode = value;
    else if (header.includes("symbol")) data.symbol = value;
    else if (header.includes("unit")) data.units = value;
    else if (header.includes("return")) data.return = value;
    else if (header.includes("role")) data.role = value;
    else if (header.includes("color")) data.color = value;
    else if (header.includes("icon")) data.icon = value;
  }
  return data;
}

type NormalizedImportResult =
  | { success: true; data: ImportRow }
  | { success: false; error: { issues: Array<{ message: string }> } };

function toNormalizedImportResult(result: unknown): NormalizedImportResult {
  if (typeof result === "object" && result !== null && "success" in result && result.success === true && "data" in result) {
    return { success: true, data: result.data as ImportRow };
  }
  if (typeof result === "object" && result !== null && "error" in result) {
    const error = result.error as { issues?: Array<{ message?: string }> };
    return {
      success: false,
      error: { issues: (error.issues || []).map((issue) => ({ message: issue.message || "Invalid row" })) },
    };
  }
  return { success: false, error: { issues: [{ message: "Invalid row" }] } };
}

function normalizeImportRow(type: ImportType, row: ImportRow) {
  switch (type) {
    case "members":
      return toNormalizedImportResult(memberCreateSchema.safeParse({ name: text(row.name), role: text(row.role) || "Household", color: text(row.color) || "#6366f1" }));
    case "accounts":
      return toNormalizedImportResult(accountCreateSchema.safeParse({
        name: text(row.name),
        type: text(row.type) || "Bank",
        category: text(row.category) || "liquid",
        balance: parseAmount(row.balance) || "0",
      }));
    case "transactions":
      return toNormalizedImportResult(transactionCreateSchema.safeParse({
        type: text(row.type) || "expense",
        category: text(row.category) || "Miscellaneous",
        amount: parseAmount(row.amount),
        txnDate: row.date,
        note: row.note ? text(row.note) : null,
      }));
    case "investments":
      return toNormalizedImportResult(investmentCreateSchema.safeParse({
        name: text(row.name),
        type: text(row.type) || "Other",
        invested: parseAmount(row.invested) || "0",
        currentValue: parseAmount(row.currentValue) || "0",
        annualReturn: text(row.return) || "0",
        symbol: row.symbol ? text(row.symbol) : null,
        schemeCode: row.schemeCode ? text(row.schemeCode) : null,
        units: row.units === undefined || row.units === null || row.units === "" ? null : text(row.units),
        startDate: row.startDate,
      }));
    case "debts": {
      const rawTenure = Number(row.tenure ?? row.months);
      const tenureMonths = Number.isFinite(rawTenure) && rawTenure >= 0 ? Math.floor(rawTenure) : 0;
      return toNormalizedImportResult(debtImportSchema.safeParse({
        name: text(row.name),
        type: text(row.type) || "PersonalLoan",
        principal: parseAmount(row.principal) || "0",
        outstanding: parseAmount(row.outstanding) || parseAmount(row.balance) || "0",
        interestRate: text(row.rate) || "0",
        emi: parseAmount(row.emi) || "0",
        tenureMonths,
      }));
    }
    case "bills":
      return toNormalizedImportResult(billCreateSchema.safeParse({
        name: text(row.name),
        category: text(row.category) || "Miscellaneous",
        amount: parseAmount(row.amount) || "0",
        dueDate: row.dueDate,
        frequency: text(row.frequency) || "Monthly",
        paid: parseBoolean(row.paid),
      }));
    case "goals":
      return toNormalizedImportResult(goalCreateSchema.safeParse({
        name: text(row.name),
        category: text(row.category) || "Custom",
        target: parseAmount(row.target) || "0",
        saved: parseAmount(row.saved) || "0",
        deadline: row.deadline ?? null,
        icon: text(row.icon) || "🎯",
      }));
  }
}

export { readSheets, normalizeImportRow };

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const requestedType = text(formData.get("type")) || "auto";

    if (!(file instanceof File)) return Response.json({ ok: false, error: "No file provided" }, { status: 400 });
    if (!IMPORT_TYPES.includes(requestedType as (typeof IMPORT_TYPES)[number])) {
      return Response.json({ ok: false, error: "Invalid import type" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return Response.json({ ok: false, error: "File must be between 1 byte and 5 MB" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!(fileName.endsWith(".xlsx") || fileName.endsWith(".csv"))) {
      return Response.json({ ok: false, error: "Only .xlsx and .csv files are supported" }, { status: 400 });
    }

    const sheets = await readSheets(fileName, Buffer.from(await file.arrayBuffer()));
    const results: Record<ImportType, ImportRow[]> = {
      transactions: [], accounts: [], investments: [], debts: [], bills: [], goals: [], members: [],
    };
    const errors: string[] = [];
    let totalRows = 0;

    for (const sheet of sheets) {
      if (sheet.rows.length < 2) continue;
      const headers = sheet.rows[0].map((header) => text(header).toLowerCase());
      const sheetType = detectSheetType(headers, sheet.name);
      if (requestedType !== "auto" && requestedType !== sheetType) continue;

      for (let index = 1; index < sheet.rows.length; index += 1) {
        totalRows += 1;
        if (totalRows > MAX_TOTAL_ROWS) throw new Error(`Workbook exceeds the ${MAX_TOTAL_ROWS}-row limit`);
        const rawRow = parseRow(sheet.rows[index], headers);
        if (!Object.values(rawRow).some((value) => text(value))) continue;

        const parsed = normalizeImportRow(sheetType, rawRow);
        if (!parsed || !parsed.success) {
          const message = parsed && !parsed.success ? parsed.error.issues[0]?.message : "Invalid row";
          errors.push(`${sheet.name} row ${index + 1}: ${message || "Invalid row"}`);
          continue;
        }
        if ((sheetType === "transactions" || sheetType === "bills") && Number(parsed.data.amount) <= 0) {
          errors.push(`${sheet.name} row ${index + 1}: Amount must be greater than zero`);
          continue;
        }
        results[sheetType].push(parsed.data as ImportRow);
      }
    }

    if (errors.length > 0) {
      return Response.json({ ok: false, error: "Import validation failed", details: errors.slice(0, 50), rejectedRows: errors.length }, { status: 400 });
    }

    const inserted: Record<string, number> = {};
    await db.transaction(async (tx) => {
      if (requestedType === "auto" || requestedType === "members") {
        for (const item of results.members) await tx.insert(members).values({ userId: session.userId, name: String(item.name), role: item.role as "Self" | "Spouse" | "Child" | "Parent" | "Household", color: String(item.color) });
        if (results.members.length) inserted.members = results.members.length;
      }
      if (requestedType === "auto" || requestedType === "accounts") {
        for (const item of results.accounts) await tx.insert(accounts).values({ userId: session.userId, name: String(item.name), type: item.type === "CreditCard" || item.type === "FixedDeposit" || item.type === "PPF" ? "Other" : item.type as "Cash" | "Bank" | "Wallet" | "Gold" | "RealEstate" | "Other", category: item.category as "asset" | "liquid", balance: String(item.balance) });
        if (results.accounts.length) inserted.accounts = results.accounts.length;
      }
      if (requestedType === "auto" || requestedType === "transactions") {
        for (const item of results.transactions) await tx.insert(transactions).values({ userId: session.userId, type: item.type as "income" | "expense", category: String(item.category), amount: String(item.amount), txnDate: String(item.txnDate), note: item.note ? String(item.note) : null });
        if (results.transactions.length) inserted.transactions = results.transactions.length;
      }
      if (requestedType === "auto" || requestedType === "investments") {
        let investmentCount = 0;
        for (const item of results.investments) {
          const [created] = await tx
            .insert(investments)
            .values({
              userId: session.userId,
              name: String(item.name),
              type: item.type as "Stocks" | "MutualFunds" | "PPF" | "EPF" | "NPS" | "FD" | "RD" | "Gold" | "Silver" | "Bonds" | "Crypto" | "RealEstate" | "Other",
              invested: String(item.invested),
              currentValue: String(item.currentValue),
              annualReturn: String(item.annualReturn),
              symbol: item.symbol ? String(item.symbol) : null,
              schemeCode: item.schemeCode ? String(item.schemeCode) : null,
              units: item.units ? String(item.units) : null,
              startDate: item.startDate ? String(item.startDate) : null,
            })
            .onConflictDoNothing({ target: [investments.userId, investments.symbol] })
            .returning({ id: investments.id });
          if (created) investmentCount += 1;
        }
        if (investmentCount) inserted.investments = investmentCount;
      }
      if (requestedType === "auto" || requestedType === "debts") {
        for (const item of results.debts) await tx.insert(debts).values({ userId: session.userId, name: String(item.name), type: item.type as "HomeLoan" | "CarLoan" | "EducationLoan" | "CreditCard" | "PersonalLoan", principal: String(item.principal), outstanding: String(item.outstanding), interestRate: String(item.interestRate), emi: String(item.emi), tenureMonths: Number(item.tenureMonths) });
        if (results.debts.length) inserted.debts = results.debts.length;
      }
      if (requestedType === "auto" || requestedType === "bills") {
        for (const item of results.bills) await tx.insert(bills).values({ userId: session.userId, name: String(item.name), category: String(item.category), amount: String(item.amount), dueDate: String(item.dueDate), frequency: item.frequency as "Monthly" | "Quarterly" | "Yearly" | "One-time", paid: Boolean(item.paid) });
        if (results.bills.length) inserted.bills = results.bills.length;
      }
      if (requestedType === "auto" || requestedType === "goals") {
        for (const item of results.goals) await tx.insert(goals).values({ userId: session.userId, name: String(item.name), category: item.category as "Emergency" | "Vacation" | "House" | "Car" | "Education" | "Wedding" | "Retirement" | "Custom", target: String(item.target), saved: String(item.saved), deadline: item.deadline ? String(item.deadline) : null, icon: String(item.icon) });
        if (results.goals.length) inserted.goals = results.goals.length;
      }
    });

    writeAuditLog({
      userId: session.userId,
      action: "import",
      table: "bulk_import",
      changes: { filename: file.name.slice(0, 120), inserted },
    });

    return Response.json({ ok: true, message: "Successfully imported data", inserted, detected: Object.keys(inserted) });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unknown import error";
    const normalizedMessage = rawMessage.toLowerCase();
    const schemaMismatch = normalizedMessage.includes("does not exist") || normalizedMessage.includes("missing column");
    const duplicate = normalizedMessage.includes("duplicate key") || normalizedMessage.includes("unique constraint");

    logger.error("Spreadsheet import failed", error, { userId: session.userId });

    return Response.json(
      {
        ok: false,
        error: schemaMismatch
          ? "The database schema is out of date. Run npm run db:push from the deployment environment, then retry."
          : duplicate
            ? "A record in this file already exists. Duplicate investments are skipped automatically; check the file for duplicate rows."
            : "Import could not be completed. No changes were saved. Check the server logs for the request details.",
      },
      { status: schemaMismatch ? 503 : 500 },
    );
  }
}
