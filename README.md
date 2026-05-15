# Profile Analyser

Mobile first professional profile analysis app built with Next.js, Apify, Supabase, and expert trained agentic recommendations.

## Features

- LinkedIn profile URL import
- Progressive career context questionnaire
- Profile scoring and strengths plus weaknesses report
- Invite based unlock flow for personalized fixes
- Supabase backed analyses and invites

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
CLAUDE_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-6

NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

APIFY_TOKEN=
APIFY_ACTOR_ID=

GMAIL_USER=
GMAIL_APP_PASSWORD=
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_GA_MEASUREMENT_ID=G-RJ8W3KVJSV
GA4_PROPERTY_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=
```

Run the development server:

```bash
npm run dev
```

## Supabase

Run the schema in:

```text
supabase/schema.sql
```

Use the Project URL as `NEXT_PUBLIC_SUPABASE_URL`.

Use a server-side secret key as `SUPABASE_SERVICE_ROLE_KEY`.

## Google Analytics Dashboard Unique Page Views

The dashboard "Unique Page Views Today" card uses the Google Analytics Data API and reads unique active users who triggered a `page_view` event in GA4.

1. In Google Cloud, create a service account and download its JSON key.
2. In GA4 Admin, open the property access settings and add the service account email with Viewer access.
3. Set `GA4_PROPERTY_ID` to the numeric GA4 property ID, not the `G-...` measurement ID.
4. Set `GOOGLE_SERVICE_ACCOUNT_JSON` to the full service account JSON. If your host has trouble with multiline JSON, base64 encode the file and set `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` instead.
5. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to the public web data stream measurement ID so pageviews keep flowing into GA4.

When those env vars are present, `/api/dashboard` returns `uniquePageViewsToday` for today's date and the dashboard card stops showing "Connect GA4".

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
```

## Deployment

Deploy on Vercel and set the same environment variables in the project dashboard.
