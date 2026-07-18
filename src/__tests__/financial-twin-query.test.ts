import { extractAmountFromQuestion } from "@/lib/financial-twin";

describe("financial twin natural-language amounts", () => {
  test.each([
    ["Can I afford a ₹50,000 purchase?", 50_000],
    ["Should I buy a car for 10 lakh?", 1_000_000],
    ["Can I buy a ₹1.5Cr home?", 15_000_000],
    ["Can I spend 25k?", 25_000],
    ["Is Rs. 75000 affordable?", 75_000],
  ])("extracts an Indian amount from %s", (question, expected) => {
    expect(extractAmountFromQuestion(question)).toBe(expected);
  });

  test("does not invent an amount when none is present", () => {
    expect(extractAmountFromQuestion("Can I afford this purchase?")).toBeUndefined();
  });
});
