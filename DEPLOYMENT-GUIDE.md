# 🚀 Personal CFO — Production Deployment Guide

## Prerequisites
- Vercel account
- PostgreSQL database (Neon or Railway recommended)
- Domain (optional but recommended)

## Step-by-Step Deployment

### 1. Prepare Environment Variables

In Vercel → Project Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
AUTH_SECRET=your-very-long-random-string-here-min-32-chars
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

**Important**: Generate a strong `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 2. Deploy to Vercel

```bash
# Push your code
git add .
git commit -m "chore: production hardening release v5.5.0"
git push origin main

# Vercel will automatically deploy
```

Or import the repository directly at [vercel.com](https://vercel.com).

### 3. Run Database Migration

After first deployment, run in Vercel terminal or locally with production env:

```bash
npm run db:push
```

### 4. Verify Deployment

- Visit `https://yourdomain.com/api/health`
- Should return `{ "ok": true, "status": "healthy" }`
- Test login/signup
- Test account deletion and data export

### 5. Post-Deployment

- [ ] Update `robots.txt` with your actual domain
- [ ] Set up custom domain in Vercel
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Configure Resend (optional) for password reset emails

## Monitoring Recommendations

- Add Sentry for error tracking
- Set up UptimeRobot or similar for `/api/health`
- Monitor Vercel logs for rate limit warnings

## Rollback Plan

If issues occur:
1. Revert to previous commit in Git
2. Redeploy from Vercel dashboard
3. Database changes are additive — safe to roll back frontend only

---

**Estimated time to production**: 30–60 minutes after final testing.