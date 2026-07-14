import { generatePasswordResetToken, hashPasswordResetToken } from "@/lib/password-reset";

describe("password reset token helpers", () => {
  it("generates a high-entropy token and a fixed-length digest", () => {
    const result = generatePasswordResetToken();
    expect(result.token).toHaveLength(43);
    expect(result.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.digest).not.toContain(result.token);
  });

  it("hashes the same token deterministically", () => {
    const token = "test-reset-token";
    expect(hashPasswordResetToken(token)).toBe(hashPasswordResetToken(token));
    expect(hashPasswordResetToken(token)).not.toBe(hashPasswordResetToken(`${token}-other`));
  });
});
