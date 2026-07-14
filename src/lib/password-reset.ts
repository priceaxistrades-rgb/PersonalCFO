import crypto from "crypto";

/** Generate the user-facing value; only its digest is persisted. */
export function generatePasswordResetToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, digest: hashPasswordResetToken(token) };
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}
