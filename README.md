# CP KPI Dashboard — Feedback App

A small Next.js app for collecting feedback and bug reports on the CP KPI
Dashboard, with responses stored in a Neon (serverless Postgres) database and
an admin view with CSV export and an optional AI summary.

- The whole app is protected by Microsoft Entra ID (Office 365) SSO — no
  anonymous access. Every submission is tagged with the signed-in user's email
  automatically (no self-reported "which department" field).
- **Landing page** — three entry points: Training feedback / Share feedback /
  Report a bug, VI/EN toggle
- **Feedback form** — 2 tabs (Overall feel, Details), 1–5 emoji scales
- **Bug report** — single page, only the issue description is required
- **Training feedback** — single page covering per-feature ease ratings and an
  optional 1:1 support request
- **`/admin`** — same SSO, plus an email allow-list — table view, CSV export,
  "Summarize with AI"

## 1. Requirements

- Node.js 18.18+ and npm
- A free [Vercel](https://vercel.com) account
- A free [Neon](https://neon.tech) Postgres database (can be created directly
  from the Vercel dashboard — see step 3)

## 2. Local setup

```bash
npm install
cp .env.example .env.local
# edit .env.local: set DATABASE_URL, AUTH_SECRET, AUTH_MICROSOFT_ENTRA_ID_*, and (optionally) ANTHROPIC_API_KEY
npm run db:init     # creates the feedback_responses / bug_reports tables
npm run dev          # http://localhost:3000
```

`npm run db:init` runs `db/schema.sql` against `DATABASE_URL`. You can also
just paste the contents of `db/schema.sql` into the Neon console's SQL editor
— either way works.

## 3. Deploy to Vercel

### a) Push this folder to a Git repo (GitHub/GitLab/Bitbucket)

```bash
git init
git add .
git commit -m "CP KPI Dashboard feedback app"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### b) Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
2. Framework preset: **Next.js** (auto-detected). No build settings need to change.
3. Before the first deploy, add the environment variables below (Project
   Settings → Environment Variables), or add them right in the import screen.

### c) Add a Neon database (free tier)

In your Vercel project: **Storage** tab → **Create Database** → **Neon** →
follow the prompts. Vercel provisions the database and automatically sets
`DATABASE_URL` (and a few related vars) as project environment variables —
you don't need to copy/paste a connection string.

If you'd rather create the Neon database yourself at
[neon.tech](https://neon.tech) and just paste the connection string in, that
works too — set `DATABASE_URL` manually in Project Settings.

### d) Set the remaining environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Auto-set if you used the Vercel↔Neon integration above |
| `AUTH_SECRET` | Yes | Random string used to sign session cookies (see `.env.example`) |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Yes | Client ID from your Entra ID App Registration — protects `/admin` via Microsoft/Office 365 SSO |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Yes | Client secret value from the same App Registration |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | Yes | `https://login.microsoftonline.com/<tenant ID>/v2.0` (no trailing slash) |
| `ADMIN_ALLOWED_EMAILS` | Yes | Comma-separated emails allowed to view `/admin` (any tenant account can sign in, but only these see the dashboard) |
| `ANTHROPIC_API_KEY` | No | Only needed for the "Summarize with AI" button on `/admin` |

### e) Initialize the database schema

Easiest: open the Neon console for your new database → **SQL Editor** →
paste the contents of `db/schema.sql` → run it.

Alternatively, from your machine with the Vercel-provided `DATABASE_URL`:

```bash
DATABASE_URL="<paste from Vercel>" npm run db:init
```

### f) Deploy

Trigger a deploy (push to `main`, or click **Deploy** in the Vercel
dashboard). Your form will be live at `https://<your-project>.vercel.app`,
and the admin view at `https://<your-project>.vercel.app/admin`.

## 4. How data is stored

Three tables (see `db/schema.sql`):

- `feedback_responses` — overall score (1–5), optional open feedback, plus
  the tab-B detail scores/notes
- `bug_reports` — issue description (required), screens affected
- `training_feedback` — per-feature ease ratings, 1:1 support request

Every row also carries `submitted_by_email`, taken server-side from the
authenticated Entra ID session — never trusted from the client payload.

Inserted via `POST /api/feedback`, `POST /api/bug`, `POST
/api/training-feedback`, validated server-side with `zod` (`lib/types.ts`).

## 5. Authentication (whole app + `/admin`)

- The entire app — landing page, all three forms, and their POST APIs — is
  protected by Microsoft Entra ID (Office 365) SSO via
  [Auth.js](https://authjs.dev) (`auth.ts`, `middleware.ts`). Anyone in the
  configured tenant can sign in and submit feedback.
- `/admin` has an extra layer: only emails listed in `ADMIN_ALLOWED_EMAILS`
  are authorized to view the dashboard (everyone else gets a 403 after
  signing in).
- Requesting a new App Registration? The redirect URI to give the identity
  team is `https://<your-domain>/api/auth/callback/microsoft-entra-id`. This
  is a pure sign-in flow (OIDC `openid profile email offline_access` scopes
  only) — no Microsoft Graph API permission is requested.
- Your tenant may require an admin to click **"Grant admin consent"** on the
  App Registration once before non-admin users can sign in without an
  approval prompt.
- `/admin` shows the latest 100 rows of each table
- **Export CSV** — downloads all rows (not just the 100 shown) as CSV
- **Summarize with AI** — sends the latest 200 rows to Claude
  (`claude-sonnet-5`) and displays a short written summary. Requires
  `ANTHROPIC_API_KEY`; without it, the button will show an error but nothing
  else breaks.

## 6. Notes / things you may want to change

- **Screenshot upload** on the bug report page uploads directly to Vercel
  Blob (up to 5 images, ≤10MB each) — requires the `BLOB_READ_WRITE_TOKEN`
  env var, which Vercel sets automatically once a Blob store is attached to
  the project (Storage tab → Create → Blob).
- The **header image** lives at `public/header.jpg` (extracted from the
  original mockup) — swap it for an updated banner any time.
- Brand colors (`#F05A22` / `#ec9224` / `#ed5a26`) are defined as CSS
  variables in `app/globals.css`.
- All form copy (VI/EN) lives in one place: `lib/copy.ts`.
