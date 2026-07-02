import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.kind || !b.label) return Response.json({ error: "Missing fields" }, { status: 400 });
    const [row] = await db
      .insert(watchlist)
      .values({
        kind: b.kind,
        symbol: b.symbol || null,
        schemeCode: b.schemeCode ? String(b.schemeCode) : null,
        label: b.label,
      })
      .returning();
    return Response.json({ ok: true, row });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.delete(watchlist).where(eq(watchlist.id, Number(id)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
