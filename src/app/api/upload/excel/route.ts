import { db } from "@/db";
import { transactions, accounts, investments, debts, bills, goals, members } from "@/db/schema";
import { isSession, requireApiSession } from "@/lib/server-auth";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper to parse Excel date
function parseExcelDate(value: any): string | null {
  if (!value) return null;
  if (typeof value === "number") {
    // Excel serial date
    const epoch = new Date(1899, 11, 30);
    const date = new Date(epoch.getTime() + value * 86400000);
    return date.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }
  return null;
}

// Helper to parse amount
function parseAmount(value: any): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Remove currency symbols and commas
    const clean = value.replace(/[₹,\s]/g, "");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    const allowed = [".xlsx", ".xls", ".csv"];
    const name = file.name.toLowerCase();
    if (!allowed.some((ext) => name.endsWith(ext))) {
      return Response.json({ error: "Only .xlsx, .xls, and .csv files are allowed" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "File is too large. Maximum upload size is 5 MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });

    const results: Record<string, any[]> = {
      transactions: [],
      accounts: [],
      investments: [],
      debts: [],
      bills: [],
      goals: [],
      members: [],
    };

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (data.length < 2) continue; // Need at least header + 1 row

      const headers = data[0].map((h: string) => h?.toString().toLowerCase().trim());
      const rows = data.slice(1);

      // Detect sheet type from headers
      const sheetType = detectSheetType(headers, sheetName);

      for (const row of rows) {
        if (!row.some((cell: any) => cell !== undefined && cell !== null && cell !== "")) continue;

        const parsed = parseRow(row, headers, sheetType);
        if (parsed) {
          results[sheetType].push(parsed);
        }
      }
    }

    // If specific type requested, only process that
    const targetType = type && type !== "auto" ? type : null;

    // Insert into database
    const inserted: Record<string, number> = {};

    if ((!targetType || targetType === "members") && results.members.length > 0) {
      for (const item of results.members) {
        await db.insert(members).values({
          userId: session.userId,
          name: item.name,
          role: item.role || "Household",
          color: item.color || "#6366f1",
        });
      }
      inserted.members = results.members.length;
    }

    if ((!targetType || targetType === "accounts") && results.accounts.length > 0) {
      for (const item of results.accounts) {
        await db.insert(accounts).values({
          userId: session.userId,
          name: item.name,
          type: item.type || "Bank",
          category: item.category || "liquid",
          balance: String(parseAmount(item.balance)),
        });
      }
      inserted.accounts = results.accounts.length;
    }

    if ((!targetType || targetType === "transactions") && results.transactions.length > 0) {
      for (const item of results.transactions) {
        await db.insert(transactions).values({
          userId: session.userId,
          type: item.type || "expense",
          category: item.category || "Miscellaneous",
          amount: String(parseAmount(item.amount)),
          txnDate: item.date || new Date().toISOString().split("T")[0],
          note: item.note || null,
        });
      }
      inserted.transactions = results.transactions.length;
    }

    if ((!targetType || targetType === "investments") && results.investments.length > 0) {
      for (const item of results.investments) {
        await db.insert(investments).values({
          userId: session.userId,
          name: item.name,
          type: item.type || "Other",
          invested: String(parseAmount(item.invested)),
          currentValue: String(parseAmount(item.currentValue || item.current || item.value)),
          annualReturn: String(item.return || item.annualReturn || 0),
          symbol: item.symbol || null,
          units: item.units ? String(parseAmount(item.units)) : null,
          startDate: item.startDate ? parseExcelDate(item.startDate) : null,
        });
      }
      inserted.investments = results.investments.length;
    }

    if ((!targetType || targetType === "debts") && results.debts.length > 0) {
      for (const item of results.debts) {
        await db.insert(debts).values({
          userId: session.userId,
          name: item.name,
          type: item.type || "PersonalLoan",
          principal: String(parseAmount(item.principal)),
          outstanding: String(parseAmount(item.outstanding || item.balance)),
          interestRate: String(item.rate || item.interestRate || 0),
          emi: String(parseAmount(item.emi)),
          tenureMonths: parseInt(item.tenure || item.months) || 0,
        });
      }
      inserted.debts = results.debts.length;
    }

    if ((!targetType || targetType === "bills") && results.bills.length > 0) {
      for (const item of results.bills) {
        await db.insert(bills).values({
          userId: session.userId,
          name: item.name,
          category: item.category || "Miscellaneous",
          amount: String(parseAmount(item.amount)),
          dueDate: item.dueDate || new Date().toISOString().split("T")[0],
          frequency: item.frequency || "Monthly",
          paid: item.paid === true || item.paid === "yes" || item.paid === "true",
        });
      }
      inserted.bills = results.bills.length;
    }

    if ((!targetType || targetType === "goals") && results.goals.length > 0) {
      for (const item of results.goals) {
        await db.insert(goals).values({
          userId: session.userId,
          name: item.name,
          category: item.category || "Custom",
          target: String(parseAmount(item.target)),
          saved: String(parseAmount(item.saved || 0)),
          deadline: item.deadline,
          icon: item.icon || "🎯",
        });
      }
      inserted.goals = results.goals.length;
    }

    return Response.json({
      ok: true,
      message: `Successfully imported data`,
      inserted,
      detected: Object.keys(results).filter((k) => results[k].length > 0),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to process file" },
      { status: 500 }
    );
  }
}

function detectSheetType(headers: string[], sheetName: string): string {
  const name = sheetName.toLowerCase();
  
  // Check sheet name first
  if (name.includes("transaction") || name.includes("income") || name.includes("expense")) return "transactions";
  if (name.includes("account") || name.includes("bank")) return "accounts";
  if (name.includes("investment") || name.includes("stock") || name.includes("mf")) return "investments";
  if (name.includes("debt") || name.includes("loan") || name.includes("emi")) return "debts";
  if (name.includes("bill")) return "bills";
  if (name.includes("goal") || name.includes("saving")) return "goals";
  if (name.includes("member") || name.includes("family")) return "members";

  // Check headers
  const h = headers.join(" ");
  if (h.includes("amount") && (h.includes("income") || h.includes("expense") || h.includes("date"))) return "transactions";
  if (h.includes("balance") && h.includes("account")) return "accounts";
  if (h.includes("invested") || h.includes("current value")) return "investments";
  if (h.includes("emi") || h.includes("outstanding")) return "debts";
  if (h.includes("due date") || h.includes("bill")) return "bills";
  if (h.includes("target") && h.includes("saved")) return "goals";

  return "transactions"; // Default
}

function parseRow(row: any[], headers: string[], type: string): any | null {
  const data: any = {};
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const value = row[i];
    
    if (!header) continue;

    // Map common header variations
    if (header.includes("name") || header.includes("description")) data.name = value;
    else if (header.includes("type")) data.type = value;
    else if (header.includes("category")) data.category = value;
    else if (header.includes("amount") || header.includes("sum")) data.amount = value;
    else if (header.includes("date") && !header.includes("due")) data.date = parseExcelDate(value);
    else if (header.includes("due")) data.dueDate = parseExcelDate(value);
    else if (header.includes("balance") || header.includes("outstanding")) data.balance = value;
    else if (header.includes("invested")) data.invested = value;
    else if (header.includes("current")) data.currentValue = value;
    else if (header.includes("emi")) data.emi = value;
    else if (header.includes("principal")) data.principal = value;
    else if (header.includes("rate") || header.includes("interest")) data.rate = value;
    else if (header.includes("tenure") || header.includes("months")) data.tenure = value;
    else if (header.includes("target")) data.target = value;
    else if (header.includes("saved")) data.saved = value;
    else if (header.includes("note") || header.includes("description")) data.note = value;
    else if (header.includes("paid")) data.paid = value;
    else if (header.includes("frequency")) data.frequency = value;
    else if (header.includes("symbol")) data.symbol = value;
    else if (header.includes("return")) data.return = value;
    else if (header.includes("role")) data.role = value;
    else if (header.includes("color")) data.color = value;
    else if (header.includes("icon")) data.icon = value;
    else if (header.includes("deadline")) data.deadline = parseExcelDate(value);
    else data[header] = value;
  }

  // Validate required fields
  if (type === "transactions" && !data.amount) return null;
  if (type === "accounts" && !data.name) return null;
  if (type === "investments" && !data.name) return null;
  if (type === "debts" && !data.name) return null;
  if (type === "bills" && !data.name) return null;
  if (type === "goals" && !data.name) return null;
  if (type === "members" && !data.name) return null;

  return data;
}
