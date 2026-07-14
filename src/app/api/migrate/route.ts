/**
 * The application used to expose schema migration as a browser endpoint.
 *
 * Database migrations are deployment operations, not user actions. Keeping DDL
 * behind an application route creates an unnecessary privileged write surface
 * and makes concurrent deploys unsafe. Use `npm run db:push` from a controlled
 * deployment job instead.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      ok: false,
      error: "Browser migrations are disabled.",
      message: "Run npm run db:push from a controlled deployment environment.",
    },
    { status: 410 },
  );
}
