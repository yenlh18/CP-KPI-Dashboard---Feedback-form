-- CP KPI Dashboard — Feedback form schema
-- Run this once against your Neon database (Neon SQL Editor, or `npm run db:init`).

create extension if not exists "pgcrypto";

create table if not exists feedback_responses (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  lang               text not null,
  submitted_by_email text,
  overall            smallint not null check (overall between 1 and 5),
  overall_feedback   text,
  start_clarity      smallint check (start_clarity between 1 and 5),
  clarity_kpi        smallint check (clarity_kpi between 1 and 5),
  clarity_score      smallint check (clarity_score between 1 and 5),
  change_flow        smallint check (change_flow between 1 and 5),
  support_clarity    smallint check (support_clarity between 1 and 5),
  time_saved         smallint check (time_saved between 1 and 5),
  change_note        text,
  user_agent         text
);

-- feedback form restructure: add the new tab-B questions, drop the retired
-- "Submit Results" ease question (ease_submit)
alter table feedback_responses add column if not exists start_clarity smallint check (start_clarity between 1 and 5);
alter table feedback_responses add column if not exists support_clarity smallint check (support_clarity between 1 and 5);
alter table feedback_responses add column if not exists time_saved smallint check (time_saved between 1 and 5);
alter table feedback_responses drop column if exists ease_submit;

create table if not exists bug_reports (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  lang               text not null,
  issue              text not null,
  where_tags         text[] not null default '{}',
  submitted_by_email text,
  screenshot_urls    text[] not null default '{}',
  user_agent         text
);

-- migrate from the earlier single screenshot_url column to screenshot_urls;
-- reads via to_jsonb so this is a no-op (not an error) once the column is gone
alter table bug_reports add column if not exists screenshot_urls text[] not null default '{}';
update bug_reports set screenshot_urls = array[to_jsonb(bug_reports) ->> 'screenshot_url'] where (to_jsonb(bug_reports) ->> 'screenshot_url') is not null and coalesce(array_length(screenshot_urls, 1), 0) = 0;
alter table bug_reports drop column if exists screenshot_url;

create table if not exists training_feedback (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  lang                   text not null,
  submitted_by_email     text,
  ease_submit_results    smallint not null check (ease_submit_results between 0 and 5),
  ease_edit_kpis         smallint not null check (ease_edit_kpis between 0 and 5),
  ease_dept_scorecard    smallint not null check (ease_dept_scorecard between 0 and 5),
  ease_kira              smallint not null check (ease_kira between 0 and 5),
  wants_support          boolean not null,
  support_areas          text[] not null default '{}',
  support_other_detail   text,
  pain_point             text,
  user_agent             text
);

-- SSO rollout: the whole app now requires Entra ID sign-in, so every
-- submission is tagged with the authenticated submitter's email instead of a
-- self-reported department ("domain"). Existing pre-SSO rows simply keep
-- submitted_by_email = null.
alter table feedback_responses add column if not exists submitted_by_email text;
alter table feedback_responses drop column if exists domain;
alter table bug_reports add column if not exists submitted_by_email text;
alter table bug_reports drop column if exists domain;
alter table training_feedback add column if not exists submitted_by_email text;
alter table training_feedback drop column if exists domain;

create index if not exists feedback_responses_created_at_idx on feedback_responses (created_at desc);
create index if not exists bug_reports_created_at_idx on bug_reports (created_at desc);
create index if not exists training_feedback_created_at_idx on training_feedback (created_at desc);
