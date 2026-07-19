=== EXECUTION SUMMARY ===
- Request Status: Fix Specified — validated locally; patch is present but not committed.
- Repository: https://github.com/priceaxistrades-rgb/PersonalCFO at f7e699a (19 July 2026, 17:38 IST).
- Assumed Stack: Verified: Next.js 16.2.10 App Router, React 19.2.7, TypeScript 5.9, PostgreSQL via Drizzle/pg, Vercel-oriented deployment.
- Failure Classification: Multi-domain — confirmed frontend-route authentication regression; additional security and operational hardening items.
- Local validation: `npm run lint` completed with 7 pre-existing image/font warnings; `npm test -- --runInBand` passed (9 suites, 91 tests); `npm run build` passed.

=== PHASE 1: ROOT CAUSE DIAGNOSIS ===
- Symptom: A user who has successfully logged in is redirected back to `/login` when visiting protected pages. Some real application pages do not receive the intended proxy gate.
- Evidence:
  1. Latest commit `f7e699a` added `proxy.ts`.
  2. `src/lib/server-auth.ts` issues the session cookie as `pcfo_session` in `sessionCookieHeader()`.
  3. The new `proxy.ts` looked only for `session` or `auth-token`; it never looked for `pcfo_session`.
  4. The proxy route table used non-existent `/debts`, while the application page is `/debt`, and omitted existing `/budget`, `/health`, and `/onboarding`.
- Root Cause: The authentication middleware/proxy was implemented against cookie and route names that do not match the rest of the application. Presence-only proxy checks are appropriate for Edge runtime, but they must use the exact cookie name; HMAC verification remains correctly implemented in server pages/API routes.
- Severity: Critical functional regression for authenticated navigation. The route-table omissions are High security-defense-in-depth defects.

=== PHASE 2: REPAIR SPECIFICATION ===
- File(s) Affected: `proxy.ts` (working-tree patch only).
- Change Description:
  1. Change the proxy cookie read to `request.cookies.get('pcfo_session')?.value`.
  2. Correct `/debts` to `/debt`.
  3. Add `/budget`, `/health`, and `/onboarding` to `protectedRoutes`.
  4. Remove the unused public-route list; API routes and non-protected public pages are already allowed by the proxy control flow.
- Code / Config Fix: The patch is already applied locally. Review it with:
  ```bash
  cd /home/user/PersonalCFO
  git diff -- proxy.ts
  git add proxy.ts
  git commit -m "fix(auth): align proxy session cookie and protected routes"
  git push origin <your-branch>
  ```
- Rollback Plan:
  ```bash
  git revert <commit-sha>
  # or, before committing the patch:
  git restore proxy.ts
  ```
  If production navigation remains broken after deployment, roll back the Vercel deployment to the immediately preceding healthy build, then use Vercel request logs to confirm the `Set-Cookie: pcfo_session=...` response from `/api/auth/login`.
- Validation Tests:
  1. Incognito: open `/income`; assert redirect to `/login?redirect=%2Fincome`.
  2. Sign in; inspect browser storage/network and confirm an HttpOnly `pcfo_session` cookie is returned.
  3. Visit `/`, `/income`, `/debt`, `/budget`, `/health`, and `/onboarding`; assert no login loop.
  4. Delete or alter the cookie; assert the protected paths redirect to login and protected APIs return 401.
  5. CI gate: `npm run lint && npm test -- --runInBand && npm run build`.
  6. Add a proxy regression test that constructs a Next request with/without `pcfo_session` and asserts both redirect and pass-through behavior. It must include `/debt`, `/budget`, `/health`, and `/onboarding`.

=== PHASE 3: SECURITY AUDIT ===
- Critical Findings:
  - High — Missing explicit CSRF/origin policy for authenticated mutation endpoints. The app uses a cookie session and has destructive actions (`/api/account/delete`, `/api/account/reset-data`, transaction/account mutations). `SameSite=Lax` is helpful but is not a complete application-level CSRF policy, especially where same-site sibling origins or future embedding/integration changes exist.
  - High — The default `proxy.ts` only performs cookie-presence checks. This is safe only because the API and server routes independently verify the signed cookie. Maintain that invariant: no API handler may treat proxy execution as authorization.
  - Medium — `/api/health` is public and returns memory usage, uptime, database availability, and whether security-critical environment variables are configured. This is useful reconnaissance.
  - Medium — Public market proxy routes (`/api/market/*`) make uncached/upstream requests without rate limits or tight input size/count bounds. They can be used to consume serverless and third-party API quota.
  - Medium — `POST /api/client-log` is public and permits up to 50 attacker-controlled messages. It can enable log flooding and becomes an XSS risk if logs are ever rendered in an operations console without output encoding.
  - Medium — `npm audit --omit=dev` reports two moderate findings: PostCSS “XSS via Unescaped </style> in CSS Stringify Output”, inherited through `next`. Do not blindly run `npm audit fix --force`; upgrade Next/PostCSS in a branch and re-run the full gate.
  - Low — The CSP/security header posture is incomplete. `X-XSS-Protection` is obsolete. The proxy’s headers do not cover API responses because it returns early for `/api/*`.
- Remediation Steps:
  1. In a shared API handler, enforce `Origin` against `NEXT_PUBLIC_APP_URL` (or a separate server-only `APP_ORIGIN`) on all state-changing methods. Return 403 on absent/mismatched origin in production. For integrations/webhooks, use dedicated routes with signature verification instead.
  2. Preserve `requireApiSession()` / `isSession()` in every authenticated API handler. Enforce the same server-side session requirement for every data page through `getCurrentUser()` or `requireServerSession()`.
  3. Restrict `/api/health`: require a health-check bearer secret, IP allow-list, or return only `{ok: boolean}` publicly while exposing diagnostics privately.
  4. Add per-IP rate limits and maximum query length/item count to all public market routes. Cache quote/history results with an explicit short TTL.
  5. Rate-limit client logging by IP, require an authenticated session where feasible, strip control characters, and never render raw log fields as HTML.
  6. Add `Content-Security-Policy` (start report-only), `Permissions-Policy`, `Strict-Transport-Security` (HTTPS production), and `Cross-Origin-Opener-Policy`. Keep `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`.
  7. Upgrade the Next/PostCSS dependency chain in a dedicated PR; examine advisory ranges with `npm audit` before choosing a version.
  8. Confirm production variables: `AUTH_SECRET` >=32 cryptographically random characters, `DATABASE_URL` uses certificate verification, and no keys are exposed through `NEXT_PUBLIC_*`.
- Validation Commands:
  ```bash
  npm audit --omit=dev
  npm run lint
  npm test -- --runInBand
  npm run build
  curl -i https://<host>/api/health
  curl -i -X POST https://<host>/api/account/reset-data \
    -H 'Origin: https://attacker.example' -H 'Content-Type: application/json'
  ```
  After CSRF protection, the final curl must be 403; repeat a legitimate application-origin request in an authenticated browser.

=== PHASE 4: MOBILE UI / UX ===
- Current Issues:
  - The codebase has a strong mobile foundation: viewport metadata, bottom navigation, 44px minimum interactive targets under 1024px, 16px mobile form inputs to prevent iOS zoom, focus-visible styling, reduced-motion rules, and mobile table transformations.
  - ESLint identifies unoptimized `<img>` usage in `MobileNav.tsx`, `ProfileManager.tsx`, and four locations in `Sidebar.tsx`; these may increase mobile LCP/bandwidth use.
  - `layout.tsx` loads Google fonts through a raw `<link>` in the root layout, triggering Next lint warning and adding a third-party render dependency.
  - The mobile “More” navigation exposes a very large module inventory. It is usable but should be governed by task frequency rather than feature count.
- Design Fixes:
  1. Replace local/profile `<img>` elements with `next/image`; define `sizes`, responsive dimensions, and use `priority` only for above-the-fold identity imagery.
  2. Replace the Google-font `<link>` with `next/font/google` (or self-host font files) in `src/app/layout.tsx`; apply the generated class/variable to `<body>`.
  3. Keep five bottom-nav slots: Dashboard, Cash Flow, centered Quick Add, Investments, More. Under More, rank “Today” actions first (Bills, Transactions, Budget) and group advanced planning below a searchable command palette.
  4. Establish explicit tokens: spacing 4/8/12/16/24/32px; control height 44px mobile/40px desktop; body text 16px mobile; line-height >=1.4; minimum text/background contrast 4.5:1.
  5. Test 320px, 375px, 390px, 414px, 768px, and 1024px widths with a hardware keyboard and screen reader.
- Accessibility Checks:
  - Run keyboard-only navigation and assert an obvious focus ring for every interactive element.
  - Validate visible labels/accessible names for icon-only buttons, modal focus trap and focus restoration, Escape close, semantic headings, table labels, image alt text, and error-message associations.
  - Run axe/Lighthouse against signed-out and signed-in dashboard, quick-entry modal, More sheet, and data tables.
- Performance Targets:
  - Lighthouse Mobile: Performance >=85, Accessibility >=95, Best Practices >=95, SEO >=95.
  - Target LCP <=2.5s, INP <=200ms, CLS <=0.1 on a mid-tier Android device / simulated 4G.

=== PHASE 5: MONETIZATION ARCHITECTURE ===
- Value Proposition: PersonalCFO is an India-focused household finance operating system: income/expense tracking, family accounts, investments, tax-regime planning, goals, debt, insurance, market data, reporting, and financial guidance.
- Readiness Assessment: Do not charge until the login-loop repair is in production and core activation/retention is measured. The feature breadth supports paid value, but the product needs proof that users return monthly to reconcile, plan, and act. Financial guidance must include clear educational-not-advisory disclaimers.
- Recommended Model: Tiered subscription with a free activation tier and paid household/insight tiers. Avoid ads and selling financial data; they conflict with the trust requirement of a personal-finance product.
  - Free: manual tracking, one household member, limited accounts, core dashboard and monthly summary.
  - Plus: ₹149–249/month or ₹1,499–1,999/year; unlimited accounts/categories, recurring rules, CSV/Excel import/export, goals, debt/bill alerts, tax comparison, reports.
  - Family/Pro: ₹349–499/month or ₹3,499–4,999/year; multiple household members, advanced analytics, shared planning, financial twin/coach quota, portfolio analytics, priority support.
  Test price and packaging through an annual-plan anchor; do not expose an “unlimited AI” promise without a controlled usage-cost model.
- Feature Gates:
  - Do not gate data export, account deletion, basic privacy controls, or access to a user’s own historical data.
  - Gate collaboration, advanced forecasting/AI credits, automated alerts, premium reports, and advanced portfolio/tax planning—features whose value grows with ongoing use.
- Conversion Funnel:
  1. Landing page: India-specific household outcome and privacy promise.
  2. Signup: immediately offer a demo or spreadsheet import.
  3. Activation: reach “first financial picture” (income + one account + three expenses) in under five minutes.
  4. First value: surface a concrete budget/goal/bill insight within the first session.
  5. Retention: monthly money review, bill reminders, progress report, and shared household check-in.
  6. Upgrade: show a contextual, transparent plan prompt only after the free value boundary is actually reached.
- Payment Architecture:
  - For India-first billing, evaluate Razorpay Subscriptions or Cashfree; use Stripe only where supported by the legal entity and target geography. Consider Paddle only if merchant-of-record/tax scope fits the business model.
  - Create `plans`, `subscriptions`, `entitlements`, and append-only `billing_events` tables. Determine access solely from server-side entitlements.
  - Verify webhook signatures against the raw request body; enforce idempotency using provider event IDs; process asynchronously; never use client redirect status as proof of payment.
  - Maintain a 3–7 day payment-failure grace period and a read-only/exportable state after cancellation.
- Risk Factors:
  - Trust and privacy are existential: financial data, family data, and AI responses require a privacy policy, data-processing rationale, deletion/export commitments, and conservative retention.
  - Tax calculations and AI output need jurisdiction/date/version labels and “not tax/investment advice” wording. Seek qualified Indian legal/tax review before paid tax guidance.
  - Churn risk is high if data entry feels manual; prioritize import, recurring automation, and periodic actionable insights before adding broad feature surface.

=== PHASE 6: PRIORITY MATRIX ===
1. IMMEDIATE (0–24h):
   - Commit/deploy the tested `proxy.ts` patch.
   - Execute authenticated/unauthenticated smoke tests for all protected paths.
   - Confirm production `AUTH_SECRET`, database connectivity, and Vercel runtime logs.
   - Restrict diagnostic details from public `/api/health`.
2. SHORT-TERM (1–7 days):
   - Add proxy, auth-flow, and authorization E2E tests.
   - Add CSRF/origin validation to mutations, rate limiting to public market/client-log routes, and a CSP report-only policy.
   - Upgrade/audit Next/PostCSS dependency chain.
   - Convert lint-flagged images and font loading to Next-native mechanisms; run mobile Lighthouse/axe.
3. STRATEGIC (2–8 weeks):
   - Implement activation/retention analytics with privacy-respecting event design.
   - Validate tier willingness-to-pay via interviews and feature-gated beta; do not launch billing solely from assumptions.
   - Build payment entitlement/webhook architecture; complete privacy, terms, and India-specific financial disclaimer review.
   - Instrument monthly active households, import-to-first-insight activation, D30 retention, upgrade conversion, AI cost per active user, and churn.

=== FAILURE SCENARIOS ===
- If fix fails: Roll back the deployment; use browser Network to compare the login response `Set-Cookie` name and incoming protected-page Cookie header. Check Vercel function/proxy logs. Do not weaken or remove server-side HMAC validation to resolve a redirect loop.
- If monetization is premature: retain a free/private beta, interview active users, measure activation and D30 retention, and monetize only the repeated high-value workflow.
- If mobile redesign requires full component rewrite: retain the current token variables and semantic component contracts; replace one workflow at a time behind visual-regression, keyboard, and 375px/414px acceptance tests.

=== NEXT USER INPUT REQUIRED ===
- Production URL and deployment provider/project logs for a live smoke test.
- Exact observed symptoms (screenshots, browser console errors, Vercel build/runtime logs), if anything remains broken after this patch.
- Confirmation whether `/guide` is intentionally public; it currently remains in the protected route list from the latest implementation.
- Business inputs: target customer (individual, couple, family, advisor), current users/retention, legal entity/payment geography, and whether market/tax/AI guidance will be advisory or educational only.
