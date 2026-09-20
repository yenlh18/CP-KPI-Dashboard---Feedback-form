-- CP KPI Dashboard — Feedback form schema
-- Run this once against your Neon database (Neon SQL Editor, or `npm run db:init`).

create extension if not exists "pgcrypto";

create table if not exists feedback_responses (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  lang               text not null,
  domain             text not null,
  overall            smallint not null check (overall between 1 and 5),
  overall_feedback   text,
  ease_submit        smallint check (ease_submit between 1 and 5),
  clarity_kpi        smallint check (clarity_kpi between 1 and 5),
  clarity_score      smallint check (clarity_score between 1 and 5),
  change_flow        smallint check (change_flow between 1 and 5),
  change_note        text,
  user_agent         text
);

create table if not exists bug_reports (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  lang               text not null,
  issue              text not null,
  where_tags         text[] not null default '{}',
  domain             text,
  user_agent         text
);

create index if not exists feedback_responses_created_at_idx on feedback_responses (created_at desc);
create index if not exists bug_reports_created_at_idx on bug_reports (created_at desc);
