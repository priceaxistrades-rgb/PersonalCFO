import { catchErr } from "@/lib/catch";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  const wb = new ExcelJS.Workbook();
  
  // 1. Transactions Sheet
  const txSheet = wb.addWorksheet("Transactions");
  txSheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Type", key: "type", width: 15 }, // income | expense
    { header: "Category", key: "category", width: 20 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Member", key: "member", width: 20 },
    { header: "Account", key: "account", width: 20 },
    { header: "Note", key: "note", width: 30 },
  ];
  txSheet.addRow({ date: "2024-01-01", type: "expense", category: "Food", amount: 500, member: "Self", account: "HDFC Bank", note: "Grocery" });
  txSheet.addRow({ date: "2024-01-02", type: "income", category: "Salary", amount: 50000, member: "Self", account: "HDFC Bank", note: "January Salary" });
  
  // Add a guide for transactions
  txSheet.getCell("A10").value = "💡 Guide: Use YYYY-MM-DD for dates. Type must be 'income' or 'expense'.";
  txSheet.getCell("A10").font = { italic: true, color: { argb: "FF64748B" } };

  // 2. Accounts Sheet
  const accSheet = wb.addWorksheet("Accounts");
  accSheet.columns = [
    { header: "Account Name", key: "name", width: 25 },
    { header: "Type", key: "type", width: 15 }, // Cash, Bank, Wallet, Gold, RealEstate, Other
    { header: "Balance", key: "balance", width: 15 },
    { header: "Member", key: "member", width: 20 },
  ];
  accSheet.addRow({ name: "HDFC Bank", type: "Bank", balance: 100000, member: "Self" });
  accSheet.getCell("A10").value = "💡 Guide: Account Types: Cash, Bank, Wallet, Gold, RealEstate, Other.";
  accSheet.getCell("A10").font = { italic: true, color: { argb: "FF64748B" } };

  // 3. Investments Sheet
  const invSheet = wb.addWorksheet("Investments");
  invSheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Type", key: "type", width: 15 }, // Stocks, MutualFunds, PPF, etc.
    { header: "Invested", key: "invested", width: 15 },
    { header: "Current Value", key: "currentValue", width: 15 },
    { header: "Symbol/Code", key: "symbol", width: 15 },
    { header: "Units", key: "units", width: 12 },
    { header: "StartDate", key: "startDate", width: 15 },
    { header: "Member", key: "member", width: 20 },
  ];
  invSheet.addRow({ name: "Reliance", type: "Stocks", invested: 10000, currentValue: 12000, symbol: "RELIANCE.NS", units: 10, startDate: "2023-01-01", member: "Self" });
  invSheet.getCell("A10").value = "💡 Guide: Use stock symbols (e.g. RELIANCE.NS) or MF codes for live tracking.";
  invSheet.getCell("A10").font = { italic: true, color: { argb: "FF64748B" } };

  // 4. Debt Sheet
  const debtSheet = wb.addWorksheet("Debt");
  debtSheet.columns = [
    { header: "Loan Name", key: "name", width: 25 },
    { header: "Type", key: "type", width: 15 },
    { header: "Principal", key: "principal", width: 15 },
    { header: "Outstanding", key: "outstanding", width: 15 },
    { header: "Interest Rate %", key: "rate", width: 15 },
    { header: "EMI", key: "emi", width: 15 },
    { header: "Member", key: "member", width: 20 },
  ];
  debtSheet.addRow({ name: "Home Loan", type: "HomeLoan", principal: 5000000, outstanding: 4000000, rate: 8.5, emi: 40000, member: "Self" });
  debtSheet.getCell("A10").value = "💡 Guide: Enter interest rate as a number (e.g. 8.5 for 8.5%).";
  debtSheet.getCell("A10").font = { italic: true, color: { argb: "FF64748B" } };

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="PersonalCFO_Import_Template_v2.xlsx"',
    },
  });
}
