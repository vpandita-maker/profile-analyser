# Profile Analyser

Mobile-first professional profile analysis app built with Next.js, LinkedIn OpenID Connect, Supabase, and expert-trained agentic recommendations.

## Features

- LinkedIn OpenID Connect sign-in
- Progressive career context questionnaire
- Profile scoring and strengths/weaknesses report
- Invite-based unlock flow for personalized fixes
- Filtered leaderboard by goal, geography, and seniority
- Supabase-backed analyses, invites, and leaderboard data

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

CLAUDE_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-6

NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## LinkedIn OAuth

Enable **Sign In with LinkedIn using OpenID Connect** in the LinkedIn Developer Portal.

Local redirect URL:

```text
http://localhost:3000/api/auth/callback/linkedin
```

Production redirect URL:

```text
https://YOUR_DOMAIN/api/auth/callback/linkedin
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
