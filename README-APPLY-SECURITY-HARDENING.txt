PersonalCFO security hardening + login repair + safe bank import

Extract this archive's CONTENTS directly into your existing PersonalCFO repository root. Allow matching files to be replaced.

In Vercel > Settings > Environment Variables, add to Production:
ALLOWED_ORIGINS=https://personal-cfo-snjo.vercel.app
APP_ORIGIN=https://personal-cfo-snjo.vercel.app
HEALTHCHECK_SECRET=<output of: openssl rand -base64 32>
Never commit the real HEALTHCHECK_SECRET.

Then review the changed files in GitHub Desktop, commit, push, and wait for the production deployment.

Changes:
- proxy.ts: correct pcfo_session authentication check, first-party-origin enforcement for all non-GET API calls, and CSP-report-only/HSTS/Permissions/Cross-Origin headers.
- src/app/api/health/route.ts: public checks reveal only healthy/degraded; a Bearer HEALTHCHECK_SECRET is required for detailed diagnostics.
- safe statement importer: identifier columns are ignored and never stored; bank debit/credit/narration formats categorise transactions.

Post-deploy smoke test:
- In a private window, login and navigate to Income, Expenses, Settings and Budget.
- Ensure normal app saves work. If a valid in-app save gets 403, verify ALLOWED_ORIGINS has the exact deployed HTTPS origin with no trailing path.
- Public: curl -i https://personal-cfo-snjo.vercel.app/api/health
- Detailed: curl -i -H "Authorization: Bearer <HEALTHCHECK_SECRET>" https://personal-cfo-snjo.vercel.app/api/health

Validated locally: lint completed with 7 existing warnings, all 91 tests passed, production build passed.
