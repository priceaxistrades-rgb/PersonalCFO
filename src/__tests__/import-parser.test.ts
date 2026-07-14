import ExcelJS from "exceljs";
import { normalizeImportRow, readSheets } from "@/app/api/upload/excel/route";

describe("import parser", () => {
  it("reads bounded xlsx rows and normalizes transaction data", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Transactions");
    sheet.addRow(["Date", "Type", "Category", "Amount", "Description"]);
    sheet.addRow(["2026-07-01", "expense", "Food", "₹1,250.50", "Lunch"]);

    const output = await workbook.xlsx.writeBuffer();
    const sheets = await readSheets("transactions.xlsx", Buffer.from(output as ArrayBuffer));
    expect(sheets).toHaveLength(1);
    expect(sheets[0].rows).toHaveLength(2);

    const result = normalizeImportRow("transactions", {
      date: sheets[0].rows[1][0],
      type: sheets[0].rows[1][1],
      category: sheets[0].rows[1][2],
      amount: sheets[0].rows[1][3],
      note: sheets[0].rows[1][4],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe("1250.50");
      expect(result.data.note).toBe("Lunch");
    }
  });

  it("parses quoted CSV fields without splitting commas inside notes", async () => {
    const sheets = await readSheets(
      "transactions.csv",
      Buffer.from("Date,Type,Category,Amount,Description\n2026-07-01,expense,Food,500,\"Cafe, lunch\"\n"),
    );
    expect(sheets[0].rows[1][4]).toBe("Cafe, lunch");
  });

  it("preserves investment identifiers and dates", () => {
    const result = normalizeImportRow("investments", {
      name: "Reliance",
      type: "Stocks",
      invested: "10000",
      currentValue: "12000",
      symbol: "RELIANCE.NS",
      schemeCode: "",
      units: "10",
      startDate: "2023-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.symbol).toBe("RELIANCE.NS");
      expect(result.data.units).toBe("10");
      expect(result.data.startDate).toBe("2023-01-01");
    }
  });

  it("does not turn missing debt tenure into NaN", () => {
    const result = normalizeImportRow("debts", {
      name: "Home Loan",
      type: "HomeLoan",
      principal: "5000000",
      outstanding: "4000000",
      rate: "8.5",
      emi: "40000",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tenureMonths).toBe(0);
  });
});
