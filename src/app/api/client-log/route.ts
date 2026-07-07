import { catchErr } from "@/lib/catch";
import { logger } from "@/lib/logger";
import { z } from "zod";

const clientLogSchema = z.object({
  logs: z.array(z.object({
    level: z.enum(["error", "warn", "info"]),
    message: z.string(),
    stack: z.string().optional(),
    component: z.string().optional(),
    url: z.string().optional(),
    timestamp: z.string(),
    userAgent: z.string().optional(),
  })).min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const result = clientLogSchema.safeParse(raw);
    if (!result.success) return Response.json({ ok: false }, { status: 400 });

    for (const entry of result.data.logs) {
      const logFn = entry.level === "error" ? logger.error : entry.level === "warn" ? logger.warn : logger.info;
      logFn.call(logger, `[Client] ${entry.message}`, {
        component: entry.component,
        url: entry.url,
        stack: entry.stack?.slice(0, 500),
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("client-log", err);
  }
}
