/**
 * Unit tests for data-utils.ts — Client-safe utility functions
 */
import { monthKey, lastNMonths, currentMonthKey, sumByPaise, sumBy, monthlyFlow, expenseByCategory, healthScore } from "@/lib/data-utils";

describe("monthKey", () => {
  it("formats ISO date string to YYYY-MM", () => {
    expect(monthKey("2024-01-15")).toBe("2024-01");
    expect(monthKey("2024-12-31")).toBe("2024-12");
  });

  it("formats Date object to YYYY-MM", () => {
    expect(monthKey(new Date("2024-06-15"))).toBe("2024-06");
  });

  it("pads single-digit months", () => {
    expect(monthKey("2024-03-01")).toBe("2024-03");
  });
});

describe("lastNMonths", () => {
  it("returns correct number of months", () => {
    expect(lastNMonths(6)).toHaveLength(6);
    expect(lastNMonths(3)).toHaveLength(3);
  });

  it("each entry has key, label, and date", () => {
    const months = lastNMonths(3);
    months.forEach((m) => {
      expect(m).toHaveProperty("key");
      expect(m).toHaveProperty("label");
      expect(m).toHaveProperty("date");
      expect(m.key).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  it("months are in chronological order", () => {
    const months = lastNMonths(6);
    for (let i = 1; i < months.length; i++) {
      expect(months[i].date >= months[i - 1].date).toBe(true);
    }
  });
});

describe("sumByPaise", () => {
  it("sums string amounts with BigInt precision", () => {
    const data = [{ amount: "10.50" }, { amount: "20.25" }, { amount: "30.75" }];
    expect(sumByPaise(data, (x) => x.amount)).toBe(61.5);
  });

  it("handles null/undefined amounts as zero", () => {
    const data = [{ amount: "10" }, { amount: null }, { amount: undefined }];
    expect(sumByPaise(data, (x) => x.amount)).toBe(10);
  });

  it("sums empty array as 0", () => {
    expect(sumByPaise([], () => "0")).toBe(0);
  });

  it("avoids floating-point drift", () => {
    // 0.1 + 0.2 should be exactly 0.3
    const data = [{ amount: "0.1" }, { amount: "0.2" }];
    expect(sumByPaise(data, (x) => x.amount)).toBe(0.3);
  });
});

describe("sumBy", () => {
  it("sums numeric extractors", () => {
    const data = [{ val: 10 }, { val: 20 }, { val: 30 }];
    expect(sumBy(data, (x) => x.val)).toBe(60);
  });
});

describe("monthlyFlow", () => {
  const txns = [
    { type: "income", category: "Salary", amount: "50000", txnDate: "2024-01-15", memberId: null },
    { type: "expense", category: "Rent", amount: "15000", txnDate: "2024-01-01", memberId: null },
    { type: "income", category: "Salary", amount: "50000", txnDate: "2024-02-15", memberId: null },
    { type: "expense", category: "Food", amount: "5000", txnDate: "2024-02-10", memberId: null },
  ];
  const months = [
    { key: "2024-01", label: "Jan 24" },
    { key: "2024-02", label: "Feb 24" },
  ];

  it("calculates income, expense, savings per month", () => {
    const flow = monthlyFlow(txns, months);
    expect(flow[0].income).toBe(50000);
    expect(flow[0].expense).toBe(15000);
    expect(flow[0].savings).toBe(35000);
    expect(flow[1].income).toBe(50000);
    expect(flow[1].expense).toBe(5000);
    expect(flow[1].savings).toBe(45000);
  });
});

describe("expenseByCategory", () => {
  const txns = [
    { type: "expense", category: "Food", amount: "500", txnDate: "2024-01-10", memberId: null },
    { type: "expense", category: "Rent", amount: "15000", txnDate: "2024-01-01", memberId: null },
    { type: "expense", category: "Food", amount: "300", txnDate: "2024-01-20", memberId: null },
    { type: "income", category: "Salary", amount: "50000", txnDate: "2024-01-15", memberId: null },
  ];

  it("groups expenses by category", () => {
    const result = expenseByCategory(txns);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Rent"); // Highest first
    expect(result[0].value).toBe(15000);
    expect(result[1].label).toBe("Food");
    expect(result[1].value).toBe(800);
  });

  it("filters by month keys", () => {
    const result = expenseByCategory(txns, ["2024-01"]);
    expect(result).toHaveLength(2);
  });

  it("excludes income transactions", () => {
    const result = expenseByCategory(txns);
    const salary = result.find((r) => r.label === "Salary");
    expect(salary).toBeUndefined();
  });
});

describe("healthScore", () => {
  it("returns 100 for perfect financial health", () => {
    expect(healthScore({ savingsRate: 30, emergencyMonths: 6, debtToIncome: 0, investmentRate: 50 })).toBe(100);
  });

  it("returns low score for poor financial health", () => {
    const score = healthScore({ savingsRate: 0, emergencyMonths: 0, debtToIncome: 80, investmentRate: 0 });
    expect(score).toBeLessThan(30);
  });

  it("caps at 100", () => {
    const score = healthScore({ savingsRate: 100, emergencyMonths: 24, debtToIncome: 0, investmentRate: 100 });
    expect(score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const score = healthScore({ savingsRate: -10, emergencyMonths: 0, debtToIncome: 200, investmentRate: -5 });
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
