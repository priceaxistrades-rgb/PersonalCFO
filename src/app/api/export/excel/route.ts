import { buildWorkbook } from "@/lib/excel";
import { isSession, requireApiSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const buffer = await buildWorkbook();
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(buffer as ArrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Personal-CFO-Planner-${stamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to generate workbook" },
      { status: 500 }
    );
  }
}
