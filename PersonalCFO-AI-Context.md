# PersonalCFO — Financial Intelligence & AI Context

**Document version:** 9.0
**Last verified:** 2026-07-18
**Purpose:** Permanent engineering context for maintaining or replacing PersonalCFO's financial-intelligence system.

## 1. Product and stack

PersonalCFO is a Next.js 16 / React 19 personal-finance application for Indian households.

- TypeScript
- Next.js App Router
- PostgreSQL on Neon
- Drizzle ORM
- Zod validation
- bcrypt password hashing
- Signed HTTP-only cookie sessions
- Upstash Redis REST rate limiting when configured
- Resend transactional email
- Tailwind CSS 4 plus application CSS tokens

## 2. Critical truth about “AI”

The current product does **not** call OpenAI, Anthropic, Google Gemini, Groq, or another external model.

The current “AI” is a deterministic financial-intelligence system:

1. Read the authenticated user's financial records.
2. Build calculated profiles and ratios.
3. Match supported user questions to known financial intents.
4. Run deterministic formulas and scenarios.
5. Return templated explanations, metrics, warnings, and actions.

This architecture is private, inexpensive, predictable, and testable. It is not a general conversational AI. User-facing claims must not imply that a generative model independently reasons about arbitrary topics.

## 3. Intelligence modules

| Module | Route | Engine |
|---|---|---|
| Financial Twin | `/ai` | `src/lib/financial-twin.ts` |
| Morning Brief | `/brief` | `src/lib/morning-brief.ts` |
| Health Index | `/health` | `src/lib/health-score-engine.ts` |
| Wealth Coach | `/coach` | `src/lib/wealth-coach.ts` |
| Opportunity Scanner | `/opportunities` | `src/lib/opportunity-scanner.ts` |
| Stress Meter | `/stress` | `src/lib/stress-meter.ts` |
| Dream Planner | `/dreams` | `src/lib/dream-planner.ts` |
| Wealth Timeline | `/wealth` | `src/lib/wealth-timeline.ts` |
| Life Simulator | `/simulator` | `simulateScenario()` in `financial-twin.ts` |
| Mission Control | `/control` | `src/lib/mission-control.ts` aggregation |

## 4. Financial Twin API

### `GET /api/ai/twin`

- Requires an authenticated session.
- Loads the current user's transactions, accounts, investments, debts, bills, goals, and insurance.
- Builds a `TwinProfile`.
- Returns recent query history from `ai_queries` when that table is available.

### `POST /api/ai/twin`

Accepts either:

```json
{ "question": "Can I afford a ₹50,000 purchase?", "amount": 50000 }
```

or:

```json
{
  "scenario": "housePurchase",
  "params": { "amount": 5000000 },
  "question": ""
}
```

Security and validation:

- Authenticated session required.
- 30 requests per user/IP per minute.
- Questions limited to 1,000 characters.
- Unsafe input is rejected.
- Amounts must be finite, positive, and at most ₹1 trillion.
- Scenario percentages are bounded.
- Scenario type is allowlisted.
- Missing scenario parameters return HTTP 400.

Natural-language amount extraction supports forms including:

- `₹50,000`
- `Rs. 75000`
- `25k`
- `10 lakh`
- `1.5Cr`

Regression tests: `src/__tests__/financial-twin-query.test.ts`.

## 5. Supported Financial Twin intents

`answerTwinQuery()` currently handles these pattern families:

- Affordability
- Purchase decisions
- Job loss
- House purchase
- Retirement and FIRE
- Savings
- Investments
- Debt freedom
- Emergency fund
- Insurance
- Tax planning
- Goal planning
- Net worth
- Cash flow and budgeting
- Financial health
- Financial stress

Unknown questions receive a general financial summary. They are not sent to an LLM.

## 6. Scenario engine

`simulateScenario()` supports:

- `salaryIncrease`
- `salaryDecrease`
- `housePurchase`
- `carPurchase`
- `jobLoss`
- `inflation`
- `childEducation`
- `medicalEmergency`

Every scenario returns:

- Name and description
- Net-worth change
- Monthly cash-flow change
- Emergency-runway change
- Savings-rate change
- Low/medium/high risk
- Deterministic recommendation

All assumptions must be displayed or documented. Results are educational estimates, not regulated financial advice.

## 7. Data and precision rules

- Database monetary columns are PostgreSQL `numeric` values represented as strings at data boundaries.
- Use helpers from `src/lib/finance-math.ts` for exact money mutations.
- Do not use floating-point arithmetic for persisted account or transaction balance changes.
- Analytical percentages and projections may use JavaScript numbers after safe conversion.
- Divide-by-zero, missing-income, and missing-expense states must be handled explicitly.
- Recommendations must report low confidence when source data is incomplete.

## 8. Authentication and user isolation

Every intelligence API must call `requireApiSession()` and verify `isSession()`.

Every database query must be scoped to the authenticated `userId`. Never accept a user ID from the browser as authorization. AI query history must remain user-isolated.

Do not send financial data to an external provider unless the user has explicitly opted in and the privacy policy has been updated.

## 9. Required tests before changing an engine

At minimum run:

```bash
npm run typecheck
npm test -- --runInBand
npm run build
```

Add tests for:

- Zero income and zero expenses
- Negative cash flow
- No accounts or investments
- Very large but valid amounts
- Invalid and negative scenario input
- Indian amount formats
- Cross-user query-history isolation
- Stable output for deterministic fixtures
- Calculation assumptions and boundaries

## 10. Rules for adding external generative AI later

Do not directly replace the deterministic engine. Use a layered architecture:

1. **Deterministic calculation layer** remains the source of numerical truth.
2. **Redaction/minimization layer** removes names, account identifiers, notes, and unnecessary records.
3. **Provider adapter** implements a typed interface and timeout.
4. **LLM explanation layer** may explain deterministic outputs but must not invent numbers.
5. **Schema validation** validates every model response before rendering.
6. **Fallback** returns deterministic output whenever the provider fails.
7. **Consent** is explicit and revocable.
8. **Auditability** records provider, model, prompt version, latency, and outcome without logging raw sensitive data.
9. **Cost controls** enforce per-user limits and global budgets.
10. **Safety copy** identifies estimates and recommends qualified professional advice where appropriate.

Suggested provider-neutral interface:

```ts
interface FinancialExplanationProvider {
  explain(input: RedactedFinancialContext): Promise<ValidatedExplanation>;
}
```

Never put provider API keys in `NEXT_PUBLIC_*` variables. Server-only secrets belong in Vercel sensitive environment variables.

## 11. AI-related environment variables

Current deterministic system requires no model API key.

Existing supporting infrastructure may use:

```env
DATABASE_URL=
AUTH_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
EMAIL_FROM=
FEEDBACK_TO_EMAIL=
NEXT_PUBLIC_APP_URL=
```

Future provider variables should be server-only, for example:

```env
AI_PROVIDER=disabled
AI_MODEL=
AI_PROVIDER_API_KEY=
AI_DAILY_BUDGET=
```

The default must remain `AI_PROVIDER=disabled` until consent, privacy, security, fallback, and cost controls are implemented.

## 12. Product simplification direction

The current intelligence modules overlap. The recommended long-term product structure is:

- **Dashboard:** current financial position
- **Insights:** health, risks, opportunities, and recommended actions
- **Planner:** goals, scenarios, dreams, and long-term timeline

Engines may remain separate internally. User-facing duplication should be reduced only after replacement screens pass regression testing.

## 13. Known limitations

- Intelligence quality depends on complete and current user records.
- Current chat supports known intents rather than arbitrary conversation.
- Projection assumptions are simplified and are not guarantees.
- Market data can be delayed.
- A verified email domain is required for public password-recovery delivery.
- Full database-backed browser E2E coverage is still required.

## 14. Change log requirement

Whenever any intelligence formula, scenario, supported intent, external provider, prompt, model, privacy behavior, or AI environment variable changes:

1. Update this document.
2. Add or update automated tests.
3. Record assumptions and migration impact.
4. Run typecheck, tests, and production build.
5. Test on the Neon staging branch and Vercel Preview.
6. Do not merge to `main` until results are reviewed.
