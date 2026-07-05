import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "profileImage" text`);
    return NextResponse.json({ success: true, message: "Column added successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
