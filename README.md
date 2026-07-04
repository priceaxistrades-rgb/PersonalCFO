# 📊 Personal CFO — Indian Family Financial Planner

A comprehensive, production-ready financial dashboard for Indian households. Track income, expenses, investments, debts, taxes, goals, and net worth — all in one place.

## Features

- 🏠 **Dashboard** — Net worth, KPIs, health score, charts
- 💰 **Income & Expense Tracking** — Categorized with member filters
- 📊 **Budget Planner** — Planned vs actual with overspend alerts
- 👨‍👩‍👧‍👦 **Family Budget** — Per-member spending breakdown
- 🐖 **Savings Goals** — Track Emergency, Vacation, Education, Retirement
- 📈 **Investments** — Stocks, MFs, PPF, EPF, NPS, FD with CAGR
- 🛰️ **Live Markets** — Real-time NSE stock prices & MF NAVs
- 🏦 **Debt & Loans** — EMI tracking with payoff timeline
- 💎 **Net Worth** — Assets vs liabilities over time
- 🔔 **Bill Tracker** — Due dates and payment status
- 🗓️ **Annual Planner** — Yearly financial goals
- 🧮 **Tax Planner** — Old vs New regime comparison (India)
- 🛡️ **Insurance** — Policy tracking with renewal reminders
- 🚨 **Emergency Planning** — Contacts & document checklist
- 📑 **Reports** — Monthly, quarterly, yearly analysis
- ⬇️ **Excel Export** — Full workbook with 16 sheets and 200+ formulas
- 📁 **File Import** — Upload Excel/CSV to bulk import data
- 🔐 **Authentication** — Sign up / sign in with hashed passwords
- 🎨 **3 Themes** — Light, Dark, Professional Blue
- 📱 **Mobile Responsive** — Bottom nav, touch-optimized

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Drizzle ORM
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Charts**: Custom SVG (zero dependencies)
- **Auth**: bcryptjs + signed HTTP-only cookie sessions

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/personal-cfo.git
cd personal-cfo

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with DATABASE_URL and AUTH_SECRET

# 4. Push database schema
npm run db:push

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add `DATABASE_URL` and `AUTH_SECRET` environment variables
4. Deploy

For the database, use [Neon](https://neon.tech) (free tier) or [Railway](https://railway.app) ($5/mo).

## Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add PostgreSQL service
4. Set `DATABASE_URL` from the PostgreSQL service
5. Deploy

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── api/              # API routes (auth, manage, upload, export)
│   ├── annual/           # Annual planner page
│   ├── budget/           # Budget planner page
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── settings/         # Settings & data management
│   └── ...               # All other pages
├── components/           # React components
│   ├── ui/               # Reusable UI (Card, KPI, Charts, Table)
│   └── ...               # Feature components
├── db/                   # Database schema & connection
│   ├── schema.ts         # Drizzle ORM schema
│   └── index.ts          # DB connection
└── lib/                  # Utility libraries
    ├── auth.ts           # Authentication helpers
    ├── data.ts           # Data access layer
    ├── format.ts         # Number/date formatting (₹)
    ├── market.ts         # Live stock/MF API
    ├── tax.ts            # Indian tax calculator
    └── excel.ts          # Excel workbook generator
```

## License

MIT
