# 🚀 Personal CFO — Pre-Launch Checklist

**Project**: Personal CFO v5.5.0 (Production Hardened)  
**Date**: July 19, 2026  
**Status**: Ready for final validation

---

## ✅ Must Complete Before Production Deployment

### 1. Environment Variables (Vercel / Production)
- [ ] `DATABASE_URL` is set and points to production PostgreSQL (Neon/Railway)
- [ ] `AUTH_SECRET` is set with **at least 32 random characters**
- [ ] `RESEND_API_KEY` (optional but recommended)
- [ ] `NEXT_PUBLIC_APP_URL` is set to your production domain
- [ ] `NODE_ENV=production`

### 2. Database
- [ ] Run `npm run db:push` in production environment
- [ ] Verify all tables exist and indexes are created
- [ ] Test a few sample inserts/deletes

### 3. Security Verification
- [ ] Confirm `AUTH_SECRET` has **no fallback** in production
- [ ] Test that unauthenticated users cannot access `/api/manage/*`
- [ ] Verify rate limiting triggers on repeated failed logins
- [ ] Test ownership checks (try editing another user's data)

### 4. Compliance & Legal
- [ ] Privacy Policy page loads correctly at `/privacy`
- [ ] Terms of Service page loads correctly at `/terms`
- [ ] Account deletion works end-to-end (with confirmation phrase)
- [ ] Data export (`/api/account/export`) returns complete JSON

### 5. Functional Testing
- [ ] Login / Signup flow works
- [ ] Password reset flow works (email or console)
- [ ] Create/Edit/Delete transactions, investments, debts, etc.
- [ ] Excel import works
- [ ] Excel export works
- [ ] Mobile navigation works properly

### 6. Error Handling
- [ ] Visit a non-existent page → 404 page appears
- [ ] Trigger a server error → 500 page appears
- [ ] Health check returns healthy status: `/api/health`

### 7. Performance & SEO
- [ ] `robots.txt` is accessible
- [ ] Sitemap is generated
- [ ] Core pages have proper meta titles/descriptions

### 8. Monitoring (Recommended)
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring for `/api/health`

---

## 🧪 Quick Validation Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test

# Build the app
npm run build
```

---

## 📋 Final Sign-off

| Item                        | Status     | Verified By     | Date       |
|----------------------------|------------|------------------|------------|
| All Critical Security Fixes| ✅ Done    |                  |            |
| Legal Pages                | ✅ Done    |                  |            |
| Account Deletion + Export  | ✅ Done    |                  |            |
| Error Pages & Footer       | ✅ Done    |                  |            |
| Environment Variables      | ⬜ Pending |                  |            |
| End-to-End Testing         | ⬜ Pending |                  |            |
| Production Deployment      | ⬜ Pending |                  |            |

---

**Once all checkboxes are complete, the application is ready for production.**