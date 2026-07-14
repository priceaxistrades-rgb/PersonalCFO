import { validate, billToggleSchema, goalContributeSchema, resetPasswordSchema } from "@/lib/validation";

describe("mutation validation", () => {
  it("requires a real boolean for bill toggles", () => {
    expect(validate(billToggleSchema, { id: 1, paid: false }).ok).toBe(true);
    expect(validate(billToggleSchema, { id: 1, paid: "false" }).ok).toBe(false);
  });

  it("rejects zero and negative goal contributions", () => {
    expect(validate(goalContributeSchema, { id: 1, amount: "0" }).ok).toBe(false);
    expect(validate(goalContributeSchema, { id: 1, amount: "-10" }).ok).toBe(false);
    expect(validate(goalContributeSchema, { id: 1, amount: "2500.50" }).ok).toBe(true);
  });

  it("applies the same strong password policy to reset flows", () => {
    const base = { token: "a".repeat(43), confirmPassword: "Weakpassword1" };
    expect(validate(resetPasswordSchema, { ...base, password: "Weakpassword1" }).ok).toBe(false);
    expect(validate(resetPasswordSchema, { ...base, password: "Str0ng!Password", confirmPassword: "Str0ng!Password" }).ok).toBe(true);
  });
});
