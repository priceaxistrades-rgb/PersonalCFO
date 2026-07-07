/**
 * Unit tests for finance-math.ts — BigInt precision engine
 * These are the most critical functions in the app.
 */
import { toPaise, fromPaise, paiseToNumber, subtractMoney, sumMoneyToNumber } from "@/lib/finance-math";

describe("toPaise", () => {
  it("converts whole number to paise", () => {
    expect(toPaise("100")).toBe(10000n);
    expect(toPaise(100)).toBe(10000n);
  });

  it("converts decimal to paise", () => {
    expect(toPaise("10.50")).toBe(1050n);
    expect(toPaise("0.99")).toBe(99n);
  });

  it("handles zero", () => {
    expect(toPaise("0")).toBe(0n);
    expect(toPaise(0)).toBe(0n);
  });

  it("handles null/undefined as zero", () => {
    expect(toPaise(null)).toBe(0n);
    expect(toPaise(undefined)).toBe(0n);
  });

  it("handles negative values", () => {
    expect(toPaise("-50.25")).toBe(-5025n);
  });
});

describe("fromPaise", () => {
  it("converts paise back to rupee string", () => {
    expect(fromPaise(10000n)).toBe("100");
    expect(fromPaise(1050n)).toBe("10.5");
    expect(fromPaise(99n)).toBe("0.99");
  });

  it("handles zero", () => {
    expect(fromPaise(0n)).toBe("0");
  });

  it("handles negative paise", () => {
    expect(fromPaise(-5025n)).toBe("-50.25");
  });
});

describe("paiseToNumber", () => {
  it("converts BigInt paise to JS number in rupees", () => {
    expect(paiseToNumber(10000n)).toBe(100);
    expect(paiseToNumber(1050n)).toBe(10.5);
    expect(paiseToNumber(99n)).toBe(0.99);
  });

  it("handles zero", () => {
    expect(paiseToNumber(0n)).toBe(0);
  });
});

describe("subtractMoney", () => {
  it("subtracts two monetary strings without floating-point error", () => {
    // Classic JS bug: 10.5 - 3.3 = 7.199999999999999
    // BigInt subtraction gives exact 7.2
    const result = subtractMoney("10.5", "3.3");
    expect(Number(result)).toBeCloseTo(7.2, 2);
  });

  it("subtracts whole numbers", () => {
    expect(subtractMoney("100", "30")).toBe("70");
  });

  it("handles subtraction resulting in zero", () => {
    expect(subtractMoney("50", "50")).toBe("0");
  });

  it("handles negative result", () => {
    expect(subtractMoney("10", "50")).toBe("-40");
  });
});

describe("sumMoneyToNumber", () => {
  it("sums array of monetary strings without floating-point drift", () => {
    const amounts = ["0.1", "0.2", "0.3", "0.4"];
    // JS would give 0.1+0.2+0.3+0.4 = 1.0000000000000002
    expect(sumMoneyToNumber(amounts)).toBe(1);
  });

  it("sums empty array as 0", () => {
    expect(sumMoneyToNumber([])).toBe(0);
  });

  it("sums large values correctly", () => {
    expect(sumMoneyToNumber(["1000000", "2000000", "3000000"])).toBe(6000000);
  });

  it("sums with decimal precision", () => {
    expect(sumMoneyToNumber(["10.50", "20.25", "30.75"])).toBe(61.5);
  });
});
