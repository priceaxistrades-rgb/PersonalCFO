# PersonalCFO — Full End-to-End Audit Report
**Date**: 2026-07-07 | **Auditor**: Principal QA / Senior Test Eng / Product Owner / Security Eng / Release Manager

---

# PHASE 1 — Feature Discovery (Complete Inventory)

## Module 1: Authentication & Session
| Item | Details |
|------|---------|
| **Pages** | `/login`, `/signup` |
| **APIs** | `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/demo` |
| **DB Tables** | `users` |
| **Components** | `SessionProvider`, `Sidebar.AuthButton` |
| **Features** | Email/password signup with strength validation, bcrypt hashing, HMAC-SHA256 session tokens, sliding session refresh, forgot password UI, demo account auto-provisioning, rate limiting on signup (5/min) |

## Module 2: Dashboard
| Item | Details |
|------|---------|
| **Pages** | `/` (main dashboard) |
| **APIs** | None (server-rendered via `getServerSession` + data.ts) |
| **DB Tables** | `transactions`, `accounts`, `investments`, `debts`, `bills`, `goals`, `members` |
| **Components** | `FilteredDashboard`, `QuickActionCenter`, `PrivacyToggle`, `MemberSelectorClient`, `ExcelButton`, `FinancialInsights`, `EmptyState.EmptyDashboard` |
| **Features** | 8 KPI cards (Net Worth, Cash, Income, Expenses, Savings%, Investment Growth, Emergency, Health Score), Line chart (6-month flow), Donut chart (spending by category with Daily/Weekly/Monthly/Yearly tabs), Goal progress bars, Upcoming bills table, EMI summary bar chart, Health Score popup (once per session), Overspending alert, Live clock, Member filter, Privacy toggle, Excel export |

## Module 3: Income & Expenses
| Item | Details |
|------|---------|
| **Pages** | `/income`, `/expenses` |
| **APIs** | `GET/POST/PATCH/DELETE /api/transactions` |
| **DB Tables** | `transactions` |
| **Components** | `FilteredIncome`, `FilteredExpenses`, `TransactionForm` |
| **Features** | CRUD transactions, pagination (50/page), filtering by type/date, account balance auto-update on transaction create/edit/delete, Zod validation, XSS sanitization on notes/categories, audit logging, bulk delete (up to 500) |

## Module 4: Budget
| Item | Details |
|------|---------|
| **Pages** | `/budget` |
| **APIs** | `GET/POST/PATCH/DELETE /api/manage/budgets` |
| **DB Tables** | `budgets` |
| **Components** | `BudgetsManager` |
| **Features** | CRUD budgets per category, monthly limits |

## Module 5: Savings & Goals
| Item | Details |
|------|---------|
| **Pages** | `/savings` |
| **APIs** | `GET/POST/PATCH/DELETE /api/manage/goals`, `PATCH /api/goals` (contribute) |
| **DB Tables** | `goals` |
| **Components** | `GoalsManager`, `GoalContribute` |
| **Features** | CRUD goals with 8 categories (Emergency, Vacation, House, Car, Education, Wedding, Retirement, Custom), progress tracking, deadline tracking, contribution flow |

## Module 6: Investments
| Item | Details |
|------|---------|
| **Pages** | `/investments` |
| **APIs** | `GET/POST/PATCH/DELETE /api/manage/investments` |
| **DB Tables** | `investments` |
| **Components** | `InvestmentsClient`, `LiveInvestmentsDashboard`, `InvestmentsManager` (form + sell modal), `SellInvestmentModal` |
| **Features** | CRUD investments (13 types), live price sync via stock symbol / MF scheme code, duplicate symbol prevention, sell/redeem (by units or by amount), partial sell, live price pre-fill, account credit on sell |

## Module 7: Live Markets
| Item | Details |
|------|---------|
| **Pages** | `/markets` |
| **APIs** | `GET /api/market/quote`, `GET /api/market/search`, `GET /api/market/stock-search`, `GET /api/market/history`, `POST/DELETE /api/watchlist` |
| **DB Tables** | `watchlist` |
| **Components** | `MarketsClient`, `LiveMarkets`, `AddWatch` |
| **Features** | Stock search (Yahoo Finance proxy), MF search (MFAPI.in), watchlist CRUD, live price display, 5s polling, chart history, "+Add More" for held instruments, sell button on market items |

## Module 8: Debt
| Item | Details |
|------|---------|
| **Pages** | `/debt` |
| **APIs** | `GET/POST/PATCH/DELETE /api/manage/debts` |
| **DB Tables** | `debts` |
| **Components** | `DebtsManager` |
| **Features** | CRUD debts (5 types: Home, Car, Education, Credit Card, Personal Loan), EMI tracking, outstanding balance |

## Module 9: Bills
| Item | Details |
|------|---------|
| **Pages** | `/bills` |
| **APIs** | `GET/POST/PATCH/DELETE /api/manage/bills`, `PATCH /api/bills` (toggle paid) |
| **DB Tables** | `bills` |
| **Components** | `BillsManager`, `BillToggle` |
| **Features** | CRUD bills, paid/unpaid toggle, due date tracking, overdue detection, 4 frequencies (Monthly, Quarterly, Yearly, One-time) |

## Module 10: Net Worth
| Item | Details |
|------|---------|
| **Pages** | `/networth` |
| **APIs** | None (server-rendered) |
| **DB Tables** | `net_worth_snapshots`, `accounts`, `investments`, `debts` |
| **Components** | `LiveNetWorthTracker` |
| **Features** | Auto snapshot, assets vs liabilities breakdown, historical chart |

## Module 11: Insurance
| Item | Details |
|------|---------|
| **Pages** | `/insurance` |
| **APIs** | `GET/POST/PATCH/DELETE /api/manage/insurance` |
| **DB Tables** | `insurance` |
| **Components** | `InsuranceManager` |
| **Features** | CRUD policies (4 types: Health, Life, Vehicle, Property), premium/coverage tracking, renewal date alerts |

## Module 12: Tax
| Item | Details |
|------|---------|
| **Pages** | `/tax` |
| **APIs** | `GET/POST/PATCH/DELETE /api/manage/tax` |
| **DB Tables** | `tax_profile` |
| **Components** | `TaxManager` |
| **Features** | Old vs New regime comparison, Section 80C/80D/HRA/Home Loan deductions, 87A rebate, LTCG tax, 4% cess, recommended regime selection, BigInt precision tax calculation |

## Module 13: Annual Planning
| Item | Details |
|------|---------|
| **Pages** | `/annual` |
| **APIs** | `GET/POST/PATCH/DELETE /api/manage/annual` |
| **DB Tables** | `annual_plans` |
| **Components** | `AnnualManager` |
| **Features** | CRUD annual plans (5 categories, 3 statuses), progress tracking |

## Module 14: Emergency
| Item | Details |
|------|---------|
| **Pages** | `/emergency` |
| **APIs** | `PATCH /api/emergency` (toggle done) |
| **DB Tables** | `emergency_items` |
| **Components** | `EmergencyCheck` |
| **Features** | Checklist with toggle, contacts/documents tracking |

## Module 15: Family Members
| Item | Details |
|------|---------|
| **Pages** | `/family` |
| **APIs** | `GET/POST/PATCH/DELETE /api/manage/members` |
| **DB Tables** | `members` |
| **Components** | `MembersManager`, `MemberSelector`, `MemberSelectorClient`, `MemberFilterProvider` |
| **Features** | CRUD family members (5 roles), color coding, per-member filtering across all pages |

## Module 16: Accounts
| Item | Details |
|------|---------|
| **Pages** | Settings page |
| **APIs** | `GET/POST/PATCH/DELETE /api/manage/accounts`, `POST /api/manage/sync` |
| **DB Tables** | `accounts` |
| **Components** | `AccountsManager`, `AccountDataManager` |
| **Features** | CRUD accounts (6 types: Cash, Bank, Wallet, Gold, RealEstate, Other), balance sync from transactions, auto-balance update |

## Module 17: Reports & Export
| Item | Details |
|------|---------|
| **Pages** | `/reports` |
| **APIs** | `GET /api/export/excel`, `GET /api/upload/template` |
| **DB Tables** | All |
| **Components** | `ExcelButton`, `PrintButton`, `FileUploader` |
| **Features** | Excel export (all data), template download, import from Excel, print-friendly layout |

## Module 18: Settings & Profile
| Item | Details |
|------|---------|
| **Pages** | `/settings` |
| **APIs** | `POST /api/upload/profile`, `DELETE /api/account/reset-data` |
| **Components** | `ProfileManager`, `ProfileUploadModal`, `AICFOFeature` |
| **Features** | Profile image upload, data reset (with confirmation), theme selection |

## Module 19: AI Financial Twin (Feature 1)
| Item | Details |
|------|---------|
| **Pages** | `/ai` |
| **APIs** | `GET/POST /api/ai/twin` |
| **DB Tables** | `ai_queries` |
| **Components** | `FinancialTwinClient` |
| **Features** | 18-metric TwinProfile, 15+ question categories, 8 life scenarios (salary +/-, house/car purchase, job loss, inflation, child education, medical emergency), query history, confidence scoring |

## Module 20: Financial Health Score (Feature 2)
| Item | Details |
|------|---------|
| **Pages** | `/health` |
| **DB Tables** | Uses all financial tables (no new table) |
| **Components** | `HealthScoreClient` |
| **Features** | 8-dimension scoring (Cash Flow, Savings, Investment, Debt, Emergency, Insurance, Goal, Budget), weighted overall 0-100, A+ through F grade, sub-score cards, strengths/weaknesses, top actions |

## Module 21: Morning Brief (Feature 3)
| Item | Details |
|------|---------|
| **Pages** | `/brief` |
| **APIs** | `GET /api/ai/brief` |
| **Components** | `BriefClient` |
| **Features** | 7-item categorized brief (cash, bills, spending, investment, savings, risk, action), greeting, tone-based items (success/warning/danger) |

## Module 22: Wealth Timeline (Feature 4)
| Item | Details |
|------|---------|
| **Pages** | `/wealth` |
| **Components** | `WealthTimelineClient` |
| **Features** | Milestone tracker (₹1L → ₹10Cr + FIRE + Retirement), KPIs, progress bars, 1yr/5yr projections |

## Module 23: Life Simulator (Feature 5)
| Item | Details |
|------|---------|
| **Pages** | `/simulator` |
| **Components** | `SimulatorClient` |
| **Features** | 8 what-if scenarios, impact metrics, risk badge, recommendations |

## Module 24: Opportunity Scanner (Feature 6)
| Item | Details |
|------|---------|
| **Pages** | `/opportunities` |
| **Components** | `OpportunitiesClient` |
| **Features** | 6 scan categories (idle cash, overspending, subscriptions, tax savings, investment, debt optimization), monthly savings potential |

## Module 25: Stress Meter (Feature 7)
| Item | Details |
|------|---------|
| **Pages** | `/stress` |
| **Components** | `StressClient` |
| **Features** | 6-factor stress score (0-100), Low/Moderate/High/Critical level, SVG gauge, recommendations |

## Module 26: Wealth Coach (Feature 8)
| Item | Details |
|------|---------|
| **Pages** | `/coach` |
| **Components** | `CoachClient` |
| **Features** | Weekly report (Wins, Mistakes, Spending/Savings/Investment Analysis, Next Week Actions), tone badge, strategy recommendations |

## Module 27: Dream Planner (Feature 9)
| Item | Details |
|------|---------|
| **Pages** | `/dreams` |
| **Components** | `DreamsClient` |
| **Features** | 8 presets (Home, Car, Travel, Education, Retirement, Business, Gadget, Wedding), SIP calculator with inflation, milestones, affordability score, risk analysis, strategy, custom dreams, auto-import from goals |

## Module 28: Mission Control (Feature 10)
| Item | Details |
|------|---------|
| **Pages** | `/control` |
| **Components** | `ControlClient` |
| **Features** | Dual SVG gauges (Health + Stress), Morning Brief highlights, Wealth Timeline, Upcoming Bills, Goal Progress, Cash Flow bars, Investment summary, Opportunities, AI Recommendations, Quick Links to all AI features |

## Module 29: System Infrastructure
| Item | Details |
|------|---------|
| **Middleware** | `proxy.ts` — CSRF, auth, security headers |
| **DB** | `src/db/index.ts` — PG Pool with SSL, `src/db/schema.ts` — 14 enums, 16 tables |
| **Math** | `src/lib/finance-math.ts` — BigInt precision engine |
| **Validation** | `src/lib/validation.ts` — Zod schemas for all CRUD |
| **Sanitization** | `src/lib/sanitize.ts` — XSS prevention |
| **Auth** | `src/lib/server-auth.ts` — HMAC-SHA256 sessions, sliding refresh |
| **Rate Limit** | `src/lib/rate-limit.ts` — In-memory token bucket |
| **Audit** | `src/lib/audit.ts` — Fire-and-forget audit logging |
| **Error Boundary** | `ErrorBoundary.tsx` — Schema error detection + auto-migrate |
| **Logging** | `src/lib/logger.ts` — 5-level structured logging |
| **Migrations** | `GET /api/migrate` — 516-line idempotent migration |
| **4 Themes** | Obsidian, Aurora, Emerald, Royal |
| **Mobile** | Bottom nav (Home/Income/Spent/Markets/More), hamburger sidebar with theme, KPI horizontal scroll, 44px touch targets |

---

# PHASE 2 — Functional Testing Findings

## ✅ Working Correctly
1. **Auth**: Signup with Zod strength validation, bcrypt hashing, session token creation, login, logout
2. **Transactions CRUD**: Create with account balance auto-update, update with reverse+apply, bulk delete, pagination
3. **Investments**: CRUD with duplicate symbol check, sell by units and by amount, account credit on sell
4. **Zod Validation**: All 20+ schemas with `.strict()`, money string coercion, floating-point artifact prevention via `.toFixed()`
5. **BigInt Precision**: All monetary calculations use paise-based BigInt — zero drift
6. **Theme System**: 4 complete themes with CSS variables, smooth transitions, persistence
7. **Dashboard**: 8 KPIs, charts, health popup, spending views, member filtering
8. **Proxy/CSRF**: Origin validation on state-changing requests, protocol-aware
9. **ErrorBoundary**: Detects schema errors, offers auto-migrate
10. **Rate Limiting**: Signup endpoint limited to 5/min
11. **XSS Protection**: `isSafeInput()` on notes/categories, `sanitize()` for display
12. **Security Headers**: X-Content-Type-Options, X-Frame-Options, CSP, HSTS (HTTPS), Referrer-Policy
13. **Accessibility**: Skip-to-content link, ARIA labels, focus-visible, reduced motion, 44px touch targets

## 🐛 Issues Found

### CRITICAL

| # | Issue | Module | Details |
|---|-------|--------|---------|
| C1 | **`/api/migrate` is unauthenticated** | Security | GET /api/migrate is listed in PUBLIC_PATHS in proxy.ts. Anyone can call it to alter database schema. An attacker could add columns, modify enums, or exploit SQL injection in the raw SQL execution. |
| C2 | **`/api/health` is unauthenticated** | Security | GET /api/health is in PUBLIC_PATHS. It exposes DB connection status and could leak information about infrastructure. |
| C3 | **No CSRF token — only Origin check** | Security | CSRF protection relies solely on Origin header matching. If Origin is absent (some browsers/clients), the request passes. No double-submit cookie or Synchronizer Token. |
| C4 | **`fromPaise(0n)` returns `"0"` not `"0.00"`** | Finance Math | PostgreSQL NUMERIC(14,2) stores "0.00" but `fromPaise(0n)` returns "0". This could cause unexpected comparisons or display issues. DB writes of "0" may fail strict schema checks or round-trip incorrectly. |
| C5 | **Session secret has insecure default** | Security | If AUTH_SECRET is not set, the app uses `"dev-only-change-me-personal-cfo-secret"`. In production without the env var, all sessions are forgeable. Only a warning is logged, not a hard failure. |
| C6 | **SQL injection risk in `/api/migrate`** | Security | The migrate endpoint executes raw SQL via `sql.raw()` from 516 lines of string interpolation. While currently using hardcoded strings, the pattern is dangerous if ever modified. |

### HIGH

| # | Issue | Module | Details |
|---|-------|--------|---------|
| H1 | **`reset-data` does not delete `ai_queries`** | Data Integrity | The reset endpoint deletes 13 tables but misses `ai_queries`. User's AI query history survives a "reset all data" operation. |
| H2 | **No ownership check in some PATCH/DELETE routes** | Security | `PATCH /api/bills` (toggle paid), `PATCH /api/goals` (contribute), `PATCH /api/emergency` do not verify the record belongs to the session user. An authenticated user could modify another user's records if they guess the ID. |
| H3 | **Sell investment is not atomic** | Finance | The sell flow makes 2 separate API calls (PATCH investment + POST transaction). If the second fails, the investment is updated but no income transaction is created. Money effectively disappears. |
| H4 | **No rate limiting on AI twin/brief API** | Security | `/api/ai/twin` and `/api/ai/brief` fetch ALL user data on every request with no rate limit. A malicious user could DDoS the DB by rapid-calling these endpoints. |
| H5 | **QuickActionCenter sends raw `Number()` values** | Validation | The quick add form sends `Number(form.amount)` directly. For income/expense, this passes through Zod's `nonNegMoneyStr` which transforms back to string. But for goals, bills, debts, insurance, annual — the amount is sent as a JS number, which can have floating-point artifacts (e.g., `0.1 + 0.2 = 0.30000000000000004`). Should use `.toFixed(2)`. |
| H6 | **Dream Planner milestones use uneven sampling** | UI | The milestone display filters with `i % Math.max(1, Math.floor(dream.milestones.length / 5))` — this can skip the final milestone or show duplicates for short timelines. |
| H7 | **No error handling for failed profile image upload** | Settings | If the upload API fails, no error message is shown to the user in the ProfileUploadModal. |

### MEDIUM

| # | Issue | Module | Details |
|---|-------|--------|---------|
| M1 | **Morning Brief page fetches data client-side** | Performance | `/brief` page.tsx is a server component that passes data to `BriefClient`. But the Brief page doesn't use the `/api/ai/brief` API route at all — the API route exists but no client component calls it. Dead code. |
| M2 | **No loading states on AI feature pages** | UX | Dream Planner, Opportunity Scanner, Stress Meter, Wealth Coach, Wealth Timeline — all compute synchronously with no skeleton/shimmer states during data loading. The server page loads, then content appears. |
| M3 | **Health Score `subScores` inconsistency** | Data | The dashboard uses `healthScore()` from data-utils (4-factor, 100-point), while the /health page uses `computeHealthScore()` from health-score-engine.ts (8-dimension). They produce different scores. |
| M4 | **`investments_user_symbol_idx` unique constraint** | Data | The unique index on `(userId, symbol)` prevents duplicate symbols, but `symbol` can be null. PostgreSQL treats nulls as distinct in unique indexes, so multiple investments with null symbol are allowed (which is correct behavior, but worth documenting). |
| M5 | **No empty state on most AI feature pages** | UX | If a user has zero transactions, the AI features (Morning Brief, Health Score, Stress Meter, etc.) will show generic/default content rather than a helpful "Add some data first" empty state. |
| M6 | **Bill categories not validated against enum** | Validation | Bill `category` is a free-text field in both DB and Zod schema. No predefined list. Could lead to inconsistent category names. |
| M7 | **`proxy.ts` doesn't protect `/api/upload/profile` or `/api/client-log`** | Security | These API routes require `requireApiSession` internally, so they're protected. But the proxy's auth check only verifies cookie existence, not validity. A malformed cookie passes the proxy but fails at the API handler. |
| M8 | **Aurora theme success color `#0891b2` is teal, not green** | UI | The Aurora (light) theme uses `--success: #0891b2` which is cyan/teal, not the green users expect for "success". This is inconsistent with the spec requirement of `#2dd4bf` for success. |
| M9 | **No client-side caching** | Performance | Every page navigation triggers full server data fetches. No SWR or React Query. Could be slow with large datasets. |
| M10 | **Dream Planner doesn't persist custom dreams** | Data | Custom dreams added via the UI are stored in React state only. They disappear on page refresh. Only existing goals from DB are persisted. |

### LOW

| # | Issue | Module | Details |
|---|-------|--------|---------|
| L1 | **Quick Add border not visible in all themes** | UI | The spec requires a visible border on Universal Quick Add. The `.quick-add-btn` style uses CSS that may not have sufficient border in all themes (especially Aurora light theme). |
| L2 | **No keyboard navigation for Dream Planner presets** | UX | The 8 dream preset buttons have no `role="tab"` or keyboard arrow navigation. |
| L3 | **Mission Control gauges don't animate on mount** | UX | The SVG circle `strokeDashoffset` is set directly, not animated from 0 to value. The `transition-all` CSS class on the SVG won't animate `stroke-dashoffset` without explicit CSS. |
| L4 | **Demo account not rate-limited on login** | Security | `POST /api/auth/demo` has rate limiting, but `POST /api/auth/login` does not (only signup is rate-limited). Brute force possible on login. |
| L5 | **No confirmation on bulk transaction delete** | UX | Deleting up to 500 transactions at once has no confirmation dialog. |
| L6 | **`num()` function used in AI engines for arithmetic** | Finance | `src/lib/wealth-coach.ts`, `src/lib/morning-brief.ts`, etc. use `num()` for calculations like `num(g.saved)`, `num(g.target)`. While these are display-oriented engines (not storing to DB), the comment on `num()` says "Never use for financial arithmetic." Should use `sumMoneyToNumber` or `paiseToNumber(toPaise())` for consistency. |
| L7 | **`inr()` with `compact: true` doesn't handle negative values well** | Format | Compact format for negative numbers like `-500000` would show `₹-5.00 L` instead of `-₹5.00 L`. |
| L8 | **CSP allows `unsafe-eval`** | Security | The Content Security Policy includes `'unsafe-eval'` in script-src. This is needed for some chart libraries but reduces XSS protection. |

---

# PHASE 3 — Financial Validation

## ✅ Verified Correct
1. **toPaise/fromPaise round-trip**: 16 tests pass covering decimals, negatives, zero, null
2. **sumByPaise**: Uses BigInt accumulation — zero drift verified with `0.1 + 0.2 + 0.3 + 0.4 = 1.0`
3. **subtractMoney**: `10.5 - 3.3 = 7.2` (not 7.1999999)
4. **Account balance atomic update**: Uses PostgreSQL NUMERIC arithmetic `balance + deltaStr` within transactions
5. **Transaction edit**: Correctly reverses old impact then applies new impact atomically
6. **Tax calculator**: Old/New regime slabs verified, 87A rebate, 4% cess, LTCG at 12.5%, Section caps (80C: 1.5L, 80D: 1L, Home Loan: 2L)
7. **Health Score (8-dim)**: Weighted average with correct weights, proper clamping to 0-100
8. **Net Worth**: `liquidAssets + investmentValue - totalDebt`

## ⚠️ Financial Calculation Issues

| # | Issue | Severity |
|---|-------|----------|
| F1 | **`fromPaise(0n)` returns "0"** — DB stores "0" not "0.00" which is fine for PG NUMERIC but inconsistent with other values | Medium |
| F2 | **Dream Planner SIP assumes constant returns** — The 8-12% expected return rates don't account for market volatility. The "low risk" label for 10+ year timelines is misleading. | Low (disclaimer needed) |
| F3 | **Quick Add debt: `tenureMonths: 12` hardcoded** — When adding a debt via Quick Add, the tenure is always 12 months regardless of what the user might expect | Medium |
| F4 | **Sell investment: `investedPerUnit = invested / currentUnits`** — This uses floating-point division. For large unit counts, rounding errors could make the remaining invested amount slightly off | Low |
| F5 | **Wealth Coach savingsRate**: Uses `monthlySavings / monthlyIncome * 100` — if income is 0, rate is 0 (correctly handled). But if income is very small (e.g., ₹1), rate could be misleadingly high | Low |

---

# PHASE 4 — User Journey Testing

## Journey 1: New User → Full Setup
| Step | Status | Notes |
|------|--------|-------|
| Visit `/signup` | ✅ | Creates account, sets session cookie |
| Auto-redirect to `/` | ✅ | Dashboard shows empty state |
| Add family member via Settings | ✅ | CRUD works |
| Add income via Quick Add | ⚠️ | Works, but `Number(form.amount)` could have float issues (H5) |
| Add expense via Quick Add | ✅ | Account balance auto-updates |
| Create budget | ✅ | Via Quick Add or Budget page |
| Add investment with symbol | ✅ | Duplicates blocked, live sync works |
| Set a goal | ✅ | Progress tracking works |
| Generate report | ✅ | Excel export works |
| Logout → Login | ✅ | Session persists, redirect works |

## Journey 2: AI Features
| Step | Status | Notes |
|------|--------|-------|
| Visit AI Twin | ✅ | Profile generated, questions answered |
| Run Life Simulator | ✅ | 8 scenarios available |
| Check Morning Brief | ✅ | Items displayed correctly |
| View Health Score | ✅ | 8-dimension breakdown |
| Wealth Timeline | ✅ | Milestones shown |
| Opportunity Scanner | ✅ | 6 categories scanned |
| Stress Meter | ✅ | Gauge + recommendations |
| Wealth Coach | ✅ | Weekly report sections |
| Dream Planner | ⚠️ | Custom dreams not persisted (M10) |
| Mission Control | ✅ | All sections render |

## Journey 3: Data Management
| Step | Status | Notes |
|------|--------|-------|
| Edit a transaction | ✅ | Account balance updated atomically |
| Delete a transaction | ✅ | Account balance reversed |
| Sell partial investment | ✅ | Units reduced, income recorded |
| Sell full investment | ✅ | Value set to 0, income recorded |
| Reset all data | ⚠️ | Misses `ai_queries` (H1) |
| Import from Excel | ✅ | Template download + upload works |

---

# PHASE 5 — Edge Cases

| Case | Result | Issue |
|------|--------|-------|
| Zero income | ✅ | Savings rate = 0, no division by zero |
| Negative balance | ✅ | `moneyStr` allows negative, `fromPaise` handles it |
| Large numbers (₹10Cr+) | ✅ | BigInt handles arbitrarily large values; compact format shows "₹X.XX Cr" |
| Future dates | ✅ | `daysUntil()` returns positive number |
| Past dates | ✅ | Overdue bills detected correctly |
| Duplicate investment symbol | ✅ | 409 Conflict returned |
| Deleting linked data | ⚠️ | Deleting a member doesn't nullify `memberId` on transactions — orphans remain |
| Rapid clicking submit | ⚠️ | No debounce on forms. Double-submit possible on slow connections |
| Session expiration | ⚠️ | API returns 401, but client-side handling is inconsistent — some pages show blank, some redirect |
| Browser refresh | ✅ | Server components re-fetch data |
| Multiple tabs | ⚠️ | In-memory rate limiter is per-process, not per-tab. But session cookie is shared correctly |
| Null units on investment | ✅ | Sell modal handles null/0 units by switching to "amount" mode |
| Empty category in Quick Add | ⚠️ | If user selects "custom" category but doesn't type, empty string sent. Zod `nonEmptyStr` would reject, but Quick Add doesn't validate before sending |

---

# PHASE 6 — Security

## ✅ Secure
- Password hashing with bcrypt (12 rounds)
- HMAC-SHA256 session tokens with timing-safe comparison
- Zod `.strict()` on all schemas — prevents mass assignment
- XSS prevention via `isSafeInput()` + `sanitize()`
- CSRF Origin validation on state-changing requests
- Security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- SQL injection prevention via Drizzle ORM parameterized queries
- Audit logging on all financial data changes
- Rate limiting on signup endpoint
- Account ownership verification on investment PATCH/DELETE
- HttpOnly, SameSite=Lax session cookies

## 🚨 Security Issues

| # | Severity | Issue |
|---|----------|-------|
| C1 | **CRITICAL** | `/api/migrate` is publicly accessible — no auth required to alter DB schema |
| C2 | **CRITICAL** | `/api/health` is publicly accessible — leaks infrastructure info |
| C5 | **CRITICAL** | Insecure default AUTH_SECRET in production |
| C6 | **HIGH** | Raw SQL execution in migrate endpoint — SQL injection risk |
| C3 | **HIGH** | CSRF protection relies only on Origin header — no token-based protection |
| H2 | **HIGH** | Missing ownership checks on bills toggle, goals contribute, emergency toggle |
| H4 | **HIGH** | No rate limiting on AI/data-heavy endpoints |
| L4 | **LOW** | Login endpoint has no rate limiting (brute force possible) |
| L8 | **LOW** | CSP allows `unsafe-eval` |

---

# PHASE 7 — Performance

| Metric | Assessment |
|--------|-----------|
| Dashboard load | Fetches 8 DB queries in parallel — good. But `getAllTransactions()` loads ALL transactions with no limit. At 10K+ transactions, this will be slow. |
| AI feature pages | Each fetches 5-8 data queries. No caching. Redundant data fetches across pages. |
| Bundle size | Minimal — only essential deps (pg, drizzle, zod, bcryptjs, xlsx, exceljs). No heavy chart libraries (custom SVG). |
| DB queries | All indexed properly (verified schema). But `syncAccountBalances()` loads ALL transactions into memory. |
| Memory | `rate-limit.ts` has cleanup timer. No obvious memory leaks. |
| Large datasets | `getAllTransactions()` has no LIMIT — will OOM with millions of rows. `getTransactions()` has pagination but isn't used by all pages. |

---

# PHASE 8 — Mobile

| Viewport | Status | Issues |
|----------|--------|--------|
| 320px | ⚠️ | KPI cards very cramped. Quick Add modal may overflow. |
| 375px | ✅ | KPI horizontal scroll works. Bottom nav visible. |
| 390px | ✅ | All features accessible. |
| 414px | ✅ | Good layout. |
| 768px | ✅ | Grid layouts adapt. Sidebar hidden. |
| 1024px | ✅ | Desktop sidebar visible. |

**Mobile-specific issues:**
- Touch targets: 44px enforced via CSS — ✅
- Bottom nav: Home/Income/Spent/Markets/More — ✅
- Theme selector: In hamburger sidebar above Net Worth — ✅
- Safe area insets: Supported — ✅
- Input zoom: `font-size: 16px !important` on mobile inputs — ✅

---

# PHASE 9 — Production Readiness Report

## 🔴 Critical Issues (Must Fix Before Launch)

1. **C1**: Authenticate `/api/migrate` — move out of PUBLIC_PATHS, require admin session
2. **C2**: Remove `/api/health` from PUBLIC_PATHS or limit response to "ok" without DB details
3. **C5**: Force AUTH_SECRET requirement in production — throw error, not just warn
4. **H1**: Add `ai_queries` to the reset-data DELETE transaction
5. **H2**: Add ownership verification to `PATCH /api/bills`, `PATCH /api/goals`, `PATCH /api/emergency`

## 🟠 High Priority (Should Fix Before Launch)

6. **H3**: Make sell investment atomic — use a single API endpoint that handles both investment update + transaction creation in one DB transaction
7. **H4**: Add rate limiting to `/api/ai/twin` and `/api/ai/brief` (e.g., 20/min)
8. **H5**: Use `.toFixed(2)` for all money values sent from QuickActionCenter
9. **L4**: Add rate limiting to `/api/auth/login` (e.g., 10/min per IP)

## 🟡 Medium Priority (Fix in First Patch)

10. **M3**: Unify health score calculations — dashboard should use the same 8-dimension engine
11. **M8**: Fix Aurora theme `--success` to `#2dd4bf` per spec
12. **M10**: Persist custom dreams (add `dreams` table or store in goals with `category: "Dream"`)
13. **F3**: Add tenure months input to Quick Add debt form
14. **M1**: Remove dead `/api/ai/brief` API route or connect BriefClient to use it

## 🟢 Low Priority (Backlog)

15. **L1**: Verify Quick Add border visibility across all 4 themes
16. **L3**: Add SVG gauge animation on mount
17. **L5**: Add confirmation dialog for bulk transaction delete
18. **L6**: Replace `num()` with proper BigInt-based calculations in AI engines
19. **L7**: Fix `inr()` compact negative value formatting
20. **M2**: Add skeleton loading states to AI feature pages
21. **M5**: Add empty state prompts on AI features when user has no data
22. **M9**: Add SWR or React Query for client-side caching
23. **M6**: Add bill categories enum/validation

## Missing Tests

| Area | Status |
|------|--------|
| `finance-math.ts` | ✅ 16 tests |
| `data-utils.ts` | ✅ 18 tests |
| `validation.ts` | ✅ 10 tests |
| `sanitize.ts` | ✅ 20 tests |
| `tax.ts` | ❌ No tests |
| `financial-twin.ts` | ❌ No tests |
| `health-score-engine.ts` | ❌ No tests |
| `dream-planner.ts` | ❌ No tests |
| `stress-meter.ts` | ❌ No tests |
| `opportunity-scanner.ts` | ❌ No tests |
| `wealth-coach.ts` | ❌ No tests |
| `wealth-timeline.ts` | ❌ No tests |
| `morning-brief.ts` | ❌ No tests |
| `mission-control.ts` | ❌ No tests |
| API route integration tests | ❌ None |
| E2E user journey tests | ❌ None |

## Potential Risks

1. **Data loss on sell**: Non-atomic sell flow could leave investment updated but no transaction created
2. **Unauthorized data access**: Missing ownership checks on 3 PATCH routes
3. **Schema migration attack**: Public migrate endpoint could be exploited
4. **Session forgery**: Default AUTH_SECRET in production
5. **Memory exhaustion**: `getAllTransactions()` with no LIMIT on large datasets
6. **Rate limit bypass**: In-memory only — doesn't work across multiple instances

## Technical Debt

1. `any` types in `getPaginated()` and `syncAccountBalances()`
2. No TypeScript strict mode (`strict: true` not in tsconfig)
3. No ESLint rules enforced in CI
4. No CI/CD pipeline configuration
5. No Docker/containerization
6. No database migration versioning (custom SQL in migrate endpoint vs. drizzle-kit)
7. Mix of `catchErr()` and `apiHandler()` patterns across API routes
8. Dead API route (`/api/ai/brief` GET exists but is never called by client)

---

# PHASE 10 — Final Release Checklist

## Pre-Launch (MUST complete before any production deployment)

- [ ] **SEC-1**: Remove `/api/migrate` and `/api/health` from PUBLIC_PATHS in proxy.ts
- [ ] **SEC-2**: Add `if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === "dev-only-change-me-personal-cfo-secret") throw new Error("AUTH_SECRET required")` in production
- [ ] **SEC-3**: Add ownership verification to `PATCH /api/bills`, `PATCH /api/goals`, `PATCH /api/emergency`
- [ ] **SEC-4**: Add rate limiting to `/api/auth/login` (10/min), `/api/ai/twin` (20/min), `/api/ai/brief` (20/min)
- [ ] **DATA-1**: Add `ai_queries` to reset-data endpoint
- [ ] **DATA-2**: Make sell investment atomic (single API endpoint)
- [ ] **FIX-1**: Use `.toFixed(2)` for all monetary values in QuickActionCenter submit
- [ ] **FIX-2**: Set Aurora theme `--success: #2dd4bf`
- [ ] **FIX-3**: Unify dashboard health score to use 8-dimension engine
- [ ] **ENV-1**: Set AUTH_SECRET to cryptographically random value
- [ ] **ENV-2**: Set DATABASE_URL to production PostgreSQL
- [ ] **ENV-3**: Set NODE_ENV=production
- [ ] **DB-1**: Run `/api/migrate` after DB provisioned
- [ ] **DB-2**: Verify all 16 tables created with correct indexes

## Post-Launch (First Week)

- [ ] Add unit tests for tax calculator (minimum)
- [ ] Add unit tests for AI engines (financial-twin, health-score, dream-planner)
- [ ] Add confirmation dialog for bulk delete
- [ ] Persist custom dreams in DB
- [ ] Add tenure months input to Quick Add debt form
- [ ] Add skeleton loading states to AI feature pages
- [ ] Fix `fromPaise(0n)` to return "0.00"
- [ ] Add empty state prompts on AI features

## Ongoing (First Month)

- [ ] Add API integration tests
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Implement Redis-backed rate limiting for multi-instance
- [ ] Add SWR/React Query for client-side caching
- [ ] Add pagination to `getAllTransactions()` or replace with cursor-based approach
- [ ] Add bill categories validation
- [ ] Remove dead `/api/ai/brief` route or connect client
- [ ] Replace `num()` with BigInt-safe calculations in AI engines
- [ ] Add CSP nonce instead of `unsafe-eval`
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring/alerting integration

---

**AUDIT COMPLETE** — 6 Critical, 4 High, 10 Medium, 8 Low issues identified. 64 existing tests pass. Build is clean (0 TS errors). Recommend fixing all Critical and High items before production deployment.
