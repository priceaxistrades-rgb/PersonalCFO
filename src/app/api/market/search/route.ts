import { searchMutualFunds } from "@/lib/market";

export const dynamic = "force-dynamic";

// GET /api/market/search?q=parag
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (q.trim().length < 2) return Response.json({ ok: true, results: [] });
  const results = await searchMutualFunds(q);
  return Response.json({ ok: true, results });
}
