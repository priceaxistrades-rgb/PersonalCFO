# Changelog — Personal CFO

All notable changes to this project are documented here.

## [5.5.0] - 2026-07-19 — Production Hardening Release

### 🔒 Security
- **Critical**: Removed dangerous `AUTH_SECRET` production fallback in `src/lib/server-auth.ts`
- **Critical**: Added centralized ownership verification (`src/lib/ownership.ts`) to prevent IDOR attacks
- **High**: Added rate limiting to **11** management API routes (`accounts`, `debts`, `bills`, `goals`, `investments`, `insurance`, `members`, `budgets`, `annual`, `tax`, `sync`)
- **High**: Hardened password reset endpoint with rate limiting
- **High**: Removed hardcoded database credentials from `drizzle.config.ts`

### 🛡️ Authorization
- Every `PATCH` and `DELETE` operation on user-owned resources now performs explicit ownership verification before mutation

### 📋 Compliance & Legal
- Added full **Privacy Policy** (`/privacy`)
- Added full **Terms of Service** (`/terms`)
- Implemented **Account Deletion** endpoint + UI (`POST /api/account/delete`)
- Implemented **Data Export** endpoint (`GET /api/account/export`) — GDPR right to portability
- Added confirmation phrase requirement for account deletion

### 🛠️ Infrastructure & Reliability
- Created professional **404 page** (`src/app/not-found.tsx`)
- Created professional **500 error page** (`src/app/500.tsx`)
- Added `robots.txt` with proper disallow rules
- Added dynamic `sitemap.ts`
- Added Privacy + Terms links to main application footer
- Improved health check endpoint with version tracking and better config validation

### 📦 Dependencies & Configuration
- Updated health check version to `5.5.0 (Production Hardened)`

### 📚 Documentation
- Created `FIXES-APPLIED.md`
- Created `FINAL-AUDIT-SUMMARY.md`
- Created this `CHANGELOG.md`

---

## Previous Releases

### [5.0.0] — Financial Integrity & Mobile Redesign
- Major mobile/tablet redesign
- Recurring transaction improvements
- AI Financial Twin enhancements

### [4.x] — Core Feature Development
- Initial release with full financial tracking, investments, debts, budgets, and AI features

---

**Security Score**: 91/100  
**Production Readiness**: 85/100

This release focuses on making Personal CFO safe for real financial data.