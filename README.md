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

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
```

## Deployment

Deploy on Vercel and set the same environment variables in the project dashboard.
