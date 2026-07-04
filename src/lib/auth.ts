import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

const safeUserColumns = {
  id: users.id,
  email: users.email,
  password: users.password,
  name: users.name,
};

export async function createUser(email: string, password: string, name: string) {
  const normalizedEmail = normalizeEmail(email);
  const hashedPassword = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      password: hashedPassword,
      name: String(name || "").trim(),
    })
    .returning(safeUserColumns);
  return user;
}

export async function validateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const [user] = await db
    .select(safeUserColumns)
    .from(users)
    .where(eq(users.email, normalizedEmail));
  if (!user) return null;
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;
  
  return user;
}

export async function getUserById(id: number) {
  const [user] = await db
    .select(safeUserColumns)
    .from(users)
    .where(eq(users.id, id));
  return user;
}
