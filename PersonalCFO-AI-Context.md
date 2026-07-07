# PersonalCFO — AI Context Document v8.0

## Project Overview
PersonalCFO is a Next.js 16 personal finance application for Indian households. Built with TypeScript, Drizzle ORM, PostgreSQL (Neon), and Tailwind CSS v4. 10 AI-powered features implemented.

## Architecture
- **Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **Database**: PostgreSQL via Drizzle ORM (0.45.2) with pg driver
- **Auth**: Custom session-based (bcryptjs, JWT-style tokens)
- **Validation**: Zod 4 with strict schemas
- **Precision**: BigInt-based monetary math (finance-math.ts)
- **Proxy**: `proxy.ts` at project root (NOT middleware.ts — Next.js 16 convention, exported function named `proxy`)
- **AI Engine**: Rule-based financial intelligence — no external AI API needed

## Key Conventions
1. **BigInt Precision**: All monetary values stored as paise (BigInt). Use `toPaise()`, `fromPaise()`, `sumByPaise()` — never JS `+` or `reduce` for money.
2. **Zod Strict**: All API schemas use `.strict()`. Client forms must strip extra fields via `buildPayload()`.
3. **Server/Client Boundary**: Never import `@/lib/data` from client components. Use `@/lib/data-utils` for pure utility functions.
4. **Session Auth**: `requireApiSession` on all API routes. `requireServerSession` for server components.
5. **Floating-Point**: Use `.toFixed()` when converting numbers to strings for API payloads (avoids `7.1999999` artifacts).
6. **Financial Twin**: Rule-based analysis engine in `src/lib/financial-twin.ts`. No external AI API required.

## 4 Themes
- **Obsidian** (dark default): Indigo/violet primary
- **Aurora** (light): Indigo primary
- **Emerald** (nature dark): Teal/cyan primary (#14b8a6, #2dd4bf)
- **Royal** (luxury dark): Gold primary (#fbbf24)

## File Structure
```
src/
├── app/
│   ├── ai/                  # Feature 1: AI Financial Twin
│   │   ├── page.tsx
│   │   └── FinancialTwinClient.tsx
│   ├── health/              # Feature 2: Financial Health Score
│   │   ├── page.tsx
│   │   └── HealthScoreClient.tsx
│   ├── brief/               # Feature 3: AI Morning CFO Brief
│   │   ├── page.tsx
│   │   └── BriefClient.tsx
│   ├── wealth/              # Feature 4: Wealth Timeline
│   │   ├── page.tsx
│   │   └── WealthTimelineClient.tsx
│   ├── simulator/           # Feature 5: Life Simulator
│   │   ├── page.tsx
│   │   └── SimulatorClient.tsx
│   ├── opportunities/       # Feature 6: Opportunity Scanner
│   │   ├── page.tsx
│   │   └── OpportunitiesClient.tsx
│   ├── stress/              # Feature 7: Financial Stress Meter
│   │   ├── page.tsx
│   │   └── StressClient.tsx
│   ├── coach/               # Feature 8: AI Wealth Coach
│   │   ├── page.tsx
│   │   └── CoachClient.tsx
│   ├── dreams/              # Feature 9: Dream Planner
│   │   ├── page.tsx
│   │   └── DreamsClient.tsx
│   ├── control/             # Feature 10: Mission Control
│   │   ├── page.tsx
│   │   └── ControlClient.tsx
│   ├── api/
│   │   ├── ai/twin/route.ts # AI Twin API (GET profile, POST query/simulate)
│   │   ├── ai/brief/route.ts # Morning Brief API
│   │   ├── migrate/route.ts # Auto-migration
│   │   └── ...              # 33+ other API routes
│   └── ...                  # All other pages
├── components/
│   ├── FilteredDashboard.tsx # Main dashboard (client)
│   ├── QuickActionCenter.tsx # Universal Quick Add
│   ├── Sidebar.tsx           # Desktop 220px sticky, 4 themes, all 10 features in nav
│   ├── MobileNav.tsx         # Bottom tab bar + More sheet
│   └── ...                   # Other shared components
├── db/
│   ├── schema.ts             # 14 pgEnum types, 16 tables (incl. ai_queries)
│   └── index.ts              # PG Pool with SSL config
├── lib/
│   ├── financial-twin.ts     # Feature 1: AI Twin engine
│   ├── health-score-engine.ts # Feature 2: 8-dimension scoring
│   ├── morning-brief.ts      # Feature 3: Daily brief generator
│   ├── wealth-timeline.ts    # Feature 4: Wealth milestone tracker
│   ├── opportunity-scanner.ts # Feature 6: Money-saving scanner
│   ├── stress-meter.ts       # Feature 7: Financial stress calculator
│   ├── wealth-coach.ts       # Feature 8: Weekly coach report
│   ├── dream-planner.ts      # Feature 9: Dream planning engine
│   ├── mission-control.ts    # Feature 10: Aggregated command center
│   ├── data.ts               # Server-side DB queries
│   ├── data-utils.ts         # Client-safe utilities
│   ├── types.ts              # Central type definitions
│   ├── finance-math.ts       # BigInt precision engine
│   ├── validation.ts         # Zod schemas
│   ├── format.ts             # Safe display formatting
│   └── ...                   # Other utilities
proxy.ts                       # Next.js 16 proxy (CSRF + auth + security headers)
```

## 10 AI-Powered Features

### Feature 1: AI Financial Twin ✅
- Engine: `src/lib/financial-twin.ts` — buildTwinProfile(), answerTwinQuery(), simulateScenario()
- 8 scenarios: salary increase/decrease, house/car purchase, job loss, inflation, child education, medical emergency
- API: `src/app/api/ai/twin/route.ts` — GET profile, POST query/simulate
- Page: `/ai` — Chat UI with quick questions, Life Simulator tab

### Feature 2: Financial Health Score ✅
- Engine: `src/lib/health-score-engine.ts` — 8 dimensions (Cash Flow, Savings, Investment, Debt, Emergency, Insurance, Goal, Budget)
- Weighted overall score 0-100, grade A+ through F
- Page: `/health` — SVG gauge, expandable progress bars, sub-score cards

### Feature 3: AI Morning CFO Brief ✅
- Engine: `src/lib/morning-brief.ts` — 7 categories (cash, bills, spending, investment, savings, risk, action)
- API: `src/app/api/ai/brief/route.ts` — GET endpoint
- Page: `/brief` — Greeting card, critical alerts, warnings, good news, opportunities

### Feature 4: Wealth Timeline ✅
- Engine: `src/lib/wealth-timeline.ts` — Milestones from ₹1L to ₹10Cr + FIRE + Retirement
- Page: `/wealth` — KPI row, timeline with progress bars, milestone cards

### Feature 5: Life Simulator ✅
- Uses financial-twin.ts simulateScenario()
- 8 scenarios with impact metrics
- Page: `/simulator` — Scenario selector, impact metrics, risk badge, recommendations

### Feature 6: Opportunity Scanner ✅
- Engine: `src/lib/opportunity-scanner.ts` — Scans for idle cash, overspending, subscriptions, tax savings, investment opps, debt optimization
- Page: `/opportunities` — Potential savings summary, categorized opportunity cards

### Feature 7: Financial Stress Meter ✅
- Engine: `src/lib/stress-meter.ts` — 6 factors (Burn Rate, Debt Pressure, Emergency Readiness, Salary Dependency, Cash Runway, Monthly Risk)
- 0-100 score with Low/Moderate/High/Critical level
- Page: `/stress` — SVG gauge, factor progress bars, recommendations

### Feature 8: AI Wealth Coach ✅
- Engine: `src/lib/wealth-coach.ts` — 6 sections (Wins, Mistakes, Spending/Savings/Investment Analysis, Next Week Actions)
- Page: `/coach` — Overall tone badge, color-coded sections, weekly goal

### Feature 9: Dream Planner ✅
- Engine: `src/lib/dream-planner.ts` — SIP calculator with inflation adjustment
- 8 presets: Home, Car, Travel, Education, Retirement, Business, Gadget, Wedding
- Calculates monthly SIP, timeline, risk, affordability, milestones, strategy
- Auto-imports existing goals as dreams
- Page: `/dreams` — Preset picker, dream cards with progress, milestones, strategy

### Feature 10: Mission Control Dashboard ✅
- Engine: `src/lib/mission-control.ts` — Aggregates all 9 features into one view
- Shows: Health Score gauge, Stress Meter gauge, Morning Brief highlights, Wealth Timeline, Upcoming Bills, Goal Progress, Cash Flow, Investments, Opportunities, AI Recommendations, Quick Links
- Page: `/control` — Premium command center with dual gauges, categorized alerts, flow bars

## Navigation
### Sidebar (Desktop - 220px compact sticky)
- **Overview**: Dashboard, Mission Control, Morning Brief, Health Score
- **Money Flow**: Income, Expenses, Budget, Family, Bills
- **Wealth**: Savings, Wealth Timeline, Investments, Markets, Debt, Net Worth
- **Planning**: AI Twin, Life Simulator, Opportunities, Stress Meter, Wealth Coach, Dream Planner, Annual, Tax, Insurance, Emergency, Reports
- **System**: Onboarding, Settings, Privacy, Terms
- **Bottom**: Profile indicator, Auth, Theme selector

### Mobile Nav
- Bottom tabs: Home | Income | Spent | Markets | More
- More sheet: All features including Coach, Dreams, Control
- Theme: In hamburger sidebar above Net Worth section

## v8.0 Changes (Features 3-10 + Bug Fixes)
1. **Morning Brief** (Feature 3): Daily financial overview with categorized alerts
2. **Wealth Timeline** (Feature 4): Milestone-based wealth progression tracker
3. **Life Simulator** (Feature 5): 8 what-if scenarios with impact analysis
4. **Opportunity Scanner** (Feature 6): Automatic money-saving opportunity detection
5. **Financial Stress Meter** (Feature 7): 6-factor stress scoring with recommendations
6. **AI Wealth Coach** (Feature 8): Weekly financial report with wins/mistakes/analysis
7. **Dream Planner** (Feature 9): Financial dream planning with SIP calculator + presets
8. **Mission Control** (Feature 10): Premium command center aggregating all features
9. **Bug Fix**: Coach page missing insurance data — added getInsurance()
10. **Bug Fix**: SimulatorClient typed as DashboardData but received different props — created proper SimulatorData type
11. **Navigation**: All 10 features added to Sidebar + MobileNav

## All 15 User Bugs — Status
1. ✅ Forgot Password — Full UI + API route
2. ✅ Mobile KPIs — kpi-scroll on 10+ pages
3. ✅ Theme switcher visible on mobile — In hamburger sidebar above Net Worth
4. ✅ Cash in Hand KPI — Shows on dashboard
5. ✅ Dashboard eye button — PrivacyToggle with tooltip
6. ✅ Date/time on dashboard — Shows in subtitle
7. ✅ Health Score popup — SVG gauge + score rows
8. ✅ Income categories — Shared from categories.ts
9. ✅ Overspending warning — Red alert bar
10. ✅ Spending view tabs — Daily/Weekly/Monthly/Yearly
11. ✅ Investments sync with live data — 5s polling
12. ✅ Portfolio auto-sync — router.refresh() after save
13. ✅ Live market update indicator — "Last updated X seconds ago"
14. ✅ Goals predefined categories — 12 categories + Custom
15. ✅ AI CFO feature — Full Financial Twin + 9 more AI features

## Build Status
- TypeScript: 0 errors
- Build: Passes
- Tests: 64 passing (finance-math 16, data-utils 18, validation 10, sanitize 20)

## Known Limitations (external services needed)
- Forgot Password: No actual email sending (needs SendGrid/Resend integration)
- Rate limiter: In-memory only (needs Redis for multi-instance)
- No client-side data caching (SWR/React Query)
- WebSocket market data not implemented (5-second polling)
