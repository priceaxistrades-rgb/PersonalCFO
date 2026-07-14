# 🚀 PersonalCFO — Step-by-Step Setup Guide

Complete guide to get PersonalCFO running with password reset emails working.

---

## Step 1: Database (Neon PostgreSQL — Free)

1. Go to **https://neon.tech** → **Sign Up** (free, no credit card)
2. Click **"Create Project"**
3. Name it: `PersonalCFO`
4. Region: Pick closest to you
5. Click **"Create Project"**
6. You'll see a connection string like:
   ```
   postgresql://neondb_owner:AbCdEf12345@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=verify-full
   ```
7. **Copy this** — you'll need it as `DATABASE_URL`

---

## Step 2: Deploy to Vercel

### 2a. Push to GitHub

1. Go to **https://github.com/new**
2. Repository name: `PersonalCFO`
3. Set to **Private**
4. Click **"Create repository"**
5. In your terminal (where you extracted the zip):
   ```bash
   cd PersonalCFO
   git add .
   git commit -m "PersonalCFO full app"
   git remote add origin https://github.com/YOUR_USERNAME/PersonalCFO.git
   git branch -M main
   git push -u origin main
   ```

### 2b. Import to Vercel

1. Go to **https://vercel.com/login** → Sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Find `PersonalCFO` repo → Click **"Import"**
4. **Framework Preset**: Next.js (auto-detected)
5. Leave Build Settings as default
6. Click **"Environment Variables"** to expand it
7. Add these variables one by one:

| Name | Value | How to get it |
|------|-------|---------------|
| `DATABASE_URL` | `postgresql://neondb_owner:xxxxx@ep-xxx.neon.tech/neondb?sslmode=verify-full` | From Step 1 |
| `AUTH_SECRET` | (generate one — see below) | Run the command below |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | Your Vercel URL (shown at top) |

**Generate AUTH_SECRET** — run in terminal:
```bash
openssl rand -base64 32
```
Copy the output (e.g., `k8jH3nF9xQ2mP7wR...`) and paste as the value.

8. Click **"Deploy"**
9. Wait 1-2 minutes → Your app is live! 🎉

---

## Step 3: Run Database Migration

Database schema changes must run from a controlled deployment environment, not from a browser request.

From a trusted machine or CI job with `DATABASE_URL` configured:

```bash
npm ci
npm run db:push
```

Review the Drizzle migration output before confirming any production change. The deprecated `/api/migrate` browser endpoint is disabled.

---

## Step 4: Set Up Resend (Email for Password Reset)

### 4a. Create Resend Account

1. Go to **https://resend.com/signup**
2. Sign up with GitHub or Google
3. You're on the Resend dashboard

### 4b. Get API Key

1. Click **"API Keys"** in left sidebar
2. Click **"Create API Key"**
3. Name: `PersonalCFO`
4. Permission: **Full access**
5. Click **Create**
6. **Copy the key** (starts with `re_`) — shown only once!

### 4c. Choose Sender Option

**For quick testing** (sends only to YOUR signup email):
- Use `onboarding@resend.dev` as sender
- Skip to Step 4d

**For real users** (sends to anyone):
1. Click **"Domains"** → **"Add Domain"**
2. Enter your domain (e.g., `myapp.com`)
3. Resend shows you 3 DNS records
4. Go to your **DNS provider** (Cloudflare, GoDaddy, Namecheap, etc.)
5. Add all 3 records:
   - SPF (TXT record)
   - DKIM (TXT record)
   - DMARC (TXT record)
6. Wait 1-5 minutes (sometimes up to 1 hour)
7. Back in Resend → Click **"Verify DNS"**
8. Once verified ✅, continue

### 4d. Add Email Env Vars to Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these:

| Name | Value |
|------|-------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` (your key from 4b) |
| `EMAIL_FROM` | `PersonalCFO <onboarding@resend.dev>` (testing) OR `PersonalCFO <noreply@yourdomain.com>` (production) |

3. Click **Save**

### 4e. Redeploy

1. Go to **Deployments** tab
2. Click the **three dots ⋯** on the latest deployment
3. Click **"Redeploy"**
4. Wait for it to finish

---

## Step 5: Create Your Account

1. Visit your app URL
2. Click **"Create account"** on the login page
3. Fill in:
   - Email: your email
   - Password: min 8 chars, must have uppercase, number, special char
   - Name: your name
4. Click **Sign Up**
5. You're in! 🎉

---

## Step 6: Test Password Reset

1. Click **"Sign Out"** (in sidebar → Settings → or clear cookies)
2. Go to login page
3. Click **"Forgot Password?"**
4. Enter your email
5. Click **"Send Reset Link"**
6. Check your email inbox (spam folder too)
7. Click the **"Reset Password"** button in the email
8. Set a new password
9. Sign in with the new password ✅

---

## Quick Reference — All Env Vars

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | ✅ Yes | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=verify-full` |
| `AUTH_SECRET` | ✅ Yes | `k8jH3nF9xQ2mP7wR...` (run `openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | `https://personal-cfo.vercel.app` |
| `RESEND_API_KEY` | ✅ For emails | `re_xxxxxxxxxxxx` |
| `EMAIL_FROM` | ✅ For emails | `PersonalCFO <noreply@yourdomain.com>` |
| `LOG_LEVEL` | Optional | `info` |
| `NODE_ENV` | Optional | `production` |

---

## Troubleshooting

### "This page doesn't exist" or blank page
- Make sure migration ran (Step 3)

### Can't sign up / login fails
- Check `DATABASE_URL` is correct in Vercel env vars
- From a trusted deployment environment, run `npm run db:push` and review the output

### Password reset email not received
- Check spam/junk folder
- If using `onboarding@resend.dev`: only sends to your Resend signup email
- If using custom domain: verify DNS records in Resend dashboard
- Check Vercel Runtime Logs for errors

### "Authentication required" on all pages
- This is normal if not logged in — go to `/login`

### Build fails on Vercel
- Make sure all 3 required env vars are set (`DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`)
- Redeploy after adding env vars
