# COMJNMH MedReform — Setup Guide

This doc walks you through deploying the platform on Vercel and connecting Instagram automation.

---

## Step 1 — Supabase (Database)

1. Go to **https://supabase.com** → New project → name it `comjnmh`
2. Once created, open **SQL Editor** → **New Query**
3. Paste and run `supabase/schema.sql` (creates tables + optional seed data)
4. Paste and run `supabase/functions.sql` (creates vote helper functions)
5. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_KEY`

---

## Step 2 — Deploy to Vercel

1. Push this repo to GitHub (if not already done)
2. Go to **https://vercel.com** → New Project → import the repo
3. Add these **Environment Variables** in the Vercel dashboard:

   | Variable | Value |
   |---|---|
   | `SUPABASE_URL` | from Step 1 |
   | `SUPABASE_SERVICE_KEY` | from Step 1 |
   | `NEXT_PUBLIC_BASE_URL` | `https://your-app.vercel.app` |
   | `CRON_SECRET` | any random string (e.g. `openssl rand -hex 32`) |
   | `MIN_VOTES_TO_POST` | `1` (raise to `3` for quality control) |
   | `MAX_POSTS_PER_RUN` | `3` |

4. Click **Deploy** — the app will be live in ~2 minutes.

---

## Step 3 — Instagram Automation

### 3a. Requirements
- An **Instagram Business or Creator** account (personal accounts don't work with the API)
- A **Facebook Page** linked to that Instagram account

### 3b. Get your Instagram User ID
1. Open: `https://graph.facebook.com/me/accounts?access_token=<your_token>`
   (use a temporary token from Meta for Developers → Graph API Explorer)
2. Find your Page ID
3. Call: `https://graph.facebook.com/<PAGE_ID>?fields=instagram_business_account&access_token=<token>`
4. The `instagram_business_account.id` is your `IG_USER_ID`

### 3c. Get a Long-Lived Access Token (never expires)
1. Go to **https://developers.facebook.com** → My Apps → Create App → Business
2. Add **Instagram Graph API** product
3. In **Graph API Explorer**:
   - Select your app
   - Select your Page
   - Generate a token with permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
4. Exchange the short-lived token for a long-lived one:
   ```
   GET https://graph.facebook.com/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id=<APP_ID>
     &client_secret=<APP_SECRET>
     &fb_exchange_token=<SHORT_LIVED_TOKEN>
   ```
5. The returned token is your `IG_ACCESS_TOKEN` — save it, it lasts ~60 days
6. For a **never-expiring token**, use a System User token via Business Manager

### 3d. Add to Vercel
Add these to your Vercel environment variables:

| Variable | Value |
|---|---|
| `IG_USER_ID` | your numeric Instagram user ID |
| `IG_ACCESS_TOKEN` | long-lived access token |

Redeploy after adding them.

---

## How the automation works

1. Someone submits an idea on your web page
2. The idea is saved to Supabase
3. Vercel Cron runs **daily at 9 AM UTC** (~2:30 PM IST)
4. The cron picks ideas with `votes >= MIN_VOTES_TO_POST` that haven't been posted
5. For each idea:
   - Generates a **1080×1080 card image** (auto, no design work)
   - Posts it to Instagram with a formatted caption
   - Marks the idea as posted in the database

### Card preview URL
You can preview any idea's Instagram card at:
```
https://your-app.vercel.app/api/og?id=<idea-uuid>
```

---

## Monitoring

- **View all ideas** (including unposted): Supabase Dashboard → Table Editor → `ideas`
- **See posting errors**: look for non-null `instagram_error` in the `ideas` table
- **Trigger cron manually**:
  ```bash
  curl -H "Authorization: Bearer <CRON_SECRET>" https://your-app.vercel.app/api/cron
  ```

---

## Cron schedule (Vercel Hobby = once per day)

Edit `vercel.json` to change the schedule:
- `"0 9 * * *"` → daily at 9 AM UTC (default)
- `"0 */6 * * *"` → every 6 hours (Pro plan only)
- `"0 * * * *"` → every hour (Pro plan only)
