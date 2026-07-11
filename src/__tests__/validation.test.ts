/**
 * Unit tests for validation.ts — Zod schemas
 */
import { validate, loginSchema, signupSchema, transactionCreateSchema, sellSchema } from "@/lib/validation";

describe("loginSchema", () => {
  it("validates correct input", () => {
    const result = validate(loginSchema, { email: "test@example.com", password: "password123" });
    expect(result.ok).toBe(true);
  });

  it("rejects empty email", () => {
    const result = validate(loginSchema, { email: "", password: "password123" });
    expect(result.ok).toBe(false);
  });

  it("rejects empty password", () => {
    const result = validate(loginSchema, { email: "test@example.com", password: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects extra fields (strict mode)", () => {
    const result = validate(loginSchema, { email: "test@example.com", password: "password123", extra: "field" });
    expect(result.ok).toBe(false);
  });
});

describe("signupSchema", () => {
  it("validates correct signup with strong password", () => {
    const result = validate(signupSchema, {
      name: "Test User",
      email: "test@example.com",
      password: "Str0ng!Pass",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = validate(signupSchema, {
      name: "Test User",
      email: "notanemail",
      password: "Str0ng!Pass",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects weak password (no uppercase)", () => {
    const result = validate(signupSchema, {
      name: "Test User",
      email: "test@example.com",
      password: "weakpassword1!",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects weak password (no number)", () => {
    const result = validate(signupSchema, {
      name: "Test User",
      email: "test@example.com",
      password: "WeakPassword!",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects weak password (no special char)", () => {
    const result = validate(signupSchema, {
      name: "Test User",
      email: "test@example.com",
      password: "WeakPassw0rd",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects short password", () => {
    const result = validate(signupSchema, {
      name: "Test User",
      email: "test@example.com",
      password: "Sh0rt!",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects empty name", () => {
    const result = validate(signupSchema, {
      name: "",
      email: "test@example.com",
      password: "Str0ng!Pass",
    });
    expect(result.ok).toBe(false);
  });
});

describe("transactionCreateSchema", () => {
  it("validates income transaction with all fields", () => {
    const result = validate(transactionCreateSchema, {
      type: "income",
      category: "Salary",
      amount: "50000",
      txnDate: "2024-01-15",
      memberId: null,
      accountId: null,
    });
    expect(result.ok).toBe(true);
  });

  it("validates expense transaction with string amount", () => {
    const result = validate(transactionCreateSchema, {
      type: "expense",
      category: "Food",
      amount: "500",
      txnDate: "2024-01-10",
      memberId: null,
      accountId: null,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = validate(transactionCreateSchema, {
      type: "transfer",
      category: "Food",
      amount: "500",
      txnDate: "2024-01-10",
      memberId: null,
      accountId: null,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects extra fields (strict mode)", () => {
    const result = validate(transactionCreateSchema, {
      type: "income",
      category: "Salary",
      amount: "50000",
      txnDate: "2024-01-15",
      memberId: null,
      accountId: null,
      extraField: "nope",
    });
    expect(result.ok).toBe(false);
  });
});

describe("sellSchema", () => {
  it("validates unit-based sell", () => {
    const result = validate(sellSchema, {
      investmentId: 1,
      sellUnits: 10,
      sellPrice: 150.5,
      accountId: null,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.investmentId).toBe(1);
      expect(result.data.sellUnits).toBe(10);
      expect(result.data.sellPrice).toBe(150.5);
    }
  });

  it("validates amount-based sell", () => {
    const result = validate(sellSchema, {
      investmentId: 5,
      sellAmount: 50000,
      accountId: 3,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sellAmount).toBe(50000);
      expect(result.data.accountId).toBe(3);
    }
  });

  it("rejects when neither sellUnits nor sellAmount provided", () => {
    const result = validate(sellSchema, {
      investmentId: 1,
      accountId: null,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects negative sellAmount", () => {
    const result = validate(sellSchema, {
      investmentId: 1,
      sellAmount: -100,
      accountId: null,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects missing investmentId", () => {
    const result = validate(sellSchema, {
      sellAmount: 100,
      accountId: null,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects extra fields (strict mode)", () => {
    const result = validate(sellSchema, {
      investmentId: 1,
      sellAmount: 100,
      accountId: null,
      hackField: "nope",
    });
    expect(result.ok).toBe(false);
  });
});
