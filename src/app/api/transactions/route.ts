import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.type || !b.category || !b.amount || !b.txnDate) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }
    const [row] = await db
      .insert(transactions)
      .values({
        type: b.type,
        category: b.category,
        amount: String(b.amount),
        txnDate: b.txnDate,
        memberId: b.memberId ? Number(b.memberId) : null,
        note: b.note || null,
      })
      .returning();
    return Response.json({ ok: true, row });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id, ids } = await req.json();
    if (ids && Array.isArray(ids)) {
      await db.delete(transactions).where(inArray(transactions.id, ids));
    } else if (id) {
      await db.delete(transactions).where(eq(transactions.id, Number(id)));
    } else {
      return Response.json({ error: "No id or ids provided" }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
