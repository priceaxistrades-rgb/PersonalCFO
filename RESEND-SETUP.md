# 🔐 Resend Email Setup for PersonalCFO

This guide walks you through setting up **Resend** (free 100 emails/day) so your users can receive password reset emails.

---

## Step 1: Create a Resend Account (2 minutes)

1. Go to **https://resend.com/signup**
2. Sign up with your GitHub or Google account
3. You'll land on the Resend dashboard

---

## Step 2: Get Your API Key

1. On the Resend dashboard, click **"API Keys"** in the left sidebar
2. Click **"Create API Key"**
3. Name it: `PersonalCFO`
4. Permission: **Full access** (or "Sending access" if available)
5. Click **Create**
6. **Copy the API key** (starts with `re_`) — you won't see it again!

---

## Step 3: Choose Your Sending Domain

You have 2 options:

### Option A: Quick Test — Use Resend's Onboarding Domain (0 minutes)

Resend provides a shared test domain you can use immediately:

- The default sender is: `onboarding@resend.dev`
- **Limitation**: You can ONLY send to the email address you signed up with
- Good for testing, not for real users

### Option B: Production — Add Your Own Domain (5-10 minutes)

1. In Resend dashboard, click **"Domains"** → **"Add Domain"**
2. Enter your domain (e.g., `yourdomain.com`)
3. Resend will show you DNS records to add (3 records typically)
4. Go to your **domain registrar / DNS provider** (Cloudflare, GoDaddy, etc.)
5. Add the DNS records Resend showed you:
   - 1× SPF TXT record
   - 1× DKIM TXT record  
   - 1× DMARC TXT record
6. Wait for DNS to propagate (usually 1-5 minutes, sometimes up to 24 hours)
7. Click **"Verify DNS"** in Resend dashboard
8. Once verified ✅, you can send to ANY email address

---

## Step 4: Add Environment Variables

### For Vercel (Production):

1. Go to your project on **https://vercel.com**
2. Click **Settings** → **Environment Variables**
3. Add these 3 variables:

| Name | Value | Environment |
|------|-------|-------------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` | Production, Preview |
| `EMAIL_FROM` | `PersonalCFO <noreply@yourdomain.com>` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production, Preview |

4. Click **Save**
5. **Redeploy** your app (Deployments → most recent → Redeploy)

### For Local Development (.env.local):

Create or update `.env.local` in your project root:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="PersonalCFO <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5: Test It

1. Go to your app's **Login page**
2. Click **"Forgot Password?"**
3. Enter your email
4. **Check your inbox** — you should receive a beautiful dark-themed email with a "Reset Password" button
5. Click the button → set a new password → sign in ✅

---

## Troubleshooting

### "Email not received"
- **Check spam/junk folder** — Resend emails sometimes land there initially
- **If using onboarding@resend.dev**: You can only send to YOUR signup email
- **If using custom domain**: Make sure all 3 DNS records are verified in Resend

### "RESEND_API_KEY is not set"
- Make sure the env var is set in Vercel (or .env.local locally)
- Redeploy after adding env vars in Vercel

### "Domain not verified"
- DNS propagation can take up to 24 hours (usually 5 minutes)
- Double-check the DNS values match exactly what Resend shows
- Use `dig` or https://dnschecker.org to verify

### Console mode (no real emails)
- If `RESEND_API_KEY` is missing, the app falls back to **console mode**
- Reset URLs are logged to the server console (Vercel → your project → Runtime Logs)
- In development, the reset URL appears on-screen as a clickable link

---

## Quick Reference: env vars

```env
# Required for real email delivery
RESEND_API_KEY=re_xxxxxxxxxxxx

# Your verified sender address
# Use "PersonalCFO <onboarding@resend.dev>" for testing
# Use "PersonalCFO <noreply@yourdomain.com>" for production
EMAIL_FROM="PersonalCFO <noreply@yourdomain.com>"

# Your app's public URL (for generating reset links)
# Vercel auto-sets VERCEL_URL, but explicit is better
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## How It Works (Architecture)

```
User clicks "Forgot Password"
        ↓
POST /api/auth/forgot-password
        ↓
Generate crypto token → Store in DB (1hr expiry)
        ↓
Resend sends branded HTML email with reset link
        ↓
User clicks "Reset Password" in email
        ↓
GET /reset-password?token=xxx → Validate token
        ↓
User sets new password → POST /api/auth/reset-password
        ↓
Token marked used → Password updated → Old tokens cleaned up
        ↓
User redirected to login ✅
```

**Security features:**
- 🔒 32-byte crypto-random tokens
- ⏰ 1-hour token expiry
- 🚫 Rate limited (3 requests/hour per user)
- ✅ Tokens invalidated after use (replay protection)
- 🕵️ No email enumeration (same response whether user exists or not)
