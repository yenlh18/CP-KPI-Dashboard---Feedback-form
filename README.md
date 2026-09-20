# CP KPI Dashboard — Feedback App

A small Next.js app for collecting feedback and bug reports on the CP KPI
Dashboard, with responses stored in a Neon (serverless Postgres) database and
an admin view with CSV export and an optional AI summary.

- **Landing page** — two entry points: Share feedback / Report a bug, VI/EN toggle
- **Feedback form** — 2 steps (About & overall feel, Core tasks), 1–5 emoji scales
- **Bug report** — single page, only the issue description is required
- **`/admin`** — password-protected table view, CSV export, "Summarize with AI"

## 1. Requirements

- Node.js 18.18+ and npm
- A free [Vercel](https://vercel.com) account
- A free [Neon](https://neon.tech) Postgres database (can be created directly
  from the Vercel dashboard — see step 3)

## 2. Local setup

```bash
npm install
cp .env.example .env.local
# edit .env.local: set DATABASE_URL, ADMIN_PASSWORD, and (optionally) ANTHROPIC_API_KEY
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
| `ADMIN_PASSWORD` | Yes | Protects `/admin` via HTTP Basic Auth (any username works) |
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

Two tables (see `db/schema.sql`):

- `feedback_responses` — domain, overall score (1–5), optional open feedback,
  three optional 1–5 scores + note for "core tasks"
- `bug_reports` — issue description (required), screens affected, domain

Both are inserted via `POST /api/feedback` and `POST /api/bug`, validated
server-side with `zod` (`lib/types.ts`).

## 5. Admin view (`/admin`)

- Protected by HTTP Basic Auth (`middleware.ts`) using `ADMIN_PASSWORD`
- Shows the latest 100 rows of each table
- **Export CSV** — downloads all rows (not just the 100 shown) as CSV
- **Summarize with AI** — sends the latest 200 rows to Claude
  (`claude-sonnet-5`) and displays a short written summary. Requires
  `ANTHROPIC_API_KEY`; without it, the button will show an error but nothing
  else breaks.

## 6. Notes / things you may want to change

- **Screenshot upload** on the bug report page is decorative in this version
  (clicking it just shows a message) — wiring it up to real storage (e.g.
  Vercel Blob) is a natural next step if you want it.
- The **header image** lives at `public/header.jpg` (extracted from the
  original mockup) — swap it for an updated banner any time.
- Brand colors (`#F05A22` / `#ec9224` / `#ed5a26`) are defined as CSS
  variables in `app/globals.css`.
- All form copy (VI/EN) lives in one place: `lib/copy.ts`.
