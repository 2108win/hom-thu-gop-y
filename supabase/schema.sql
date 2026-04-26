create table if not exists public.feedback_tickets (
  created_order bigserial primary key,
  ticket_code text not null unique,
  created_at text not null,
  status text not null default 'pending' check (status in ('pending', 'done')),
  message text not null,
  category_id text not null,
  category text not null,
  is_anonymous boolean not null default false,
  name text default '',
  unit text default '',
  admin_reply text default '',
  replied_by text default '',
  replied_at text default '',
  bot_reply text not null
);

create table if not exists public.managed_surveys (
  created_order bigserial primary key,
  id text not null unique,
  title text not null,
  description text default '',
  target_url text not null,
  start_date text not null,
  end_date text not null,
  is_enabled boolean not null default true,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.survey_responses (
  created_order bigserial primary key,
  response_code text not null unique,
  survey_id text not null,
  survey_title text not null,
  created_at text not null,
  answers jsonb not null default '[]'::jsonb
);

create table if not exists public.managed_listeners (
  created_order bigserial primary key,
  id text not null unique,
  fullname text not null,
  rank text not null,
  position text not null,
  phone text not null,
  "order" integer not null default 0,
  assigned_categories text[] not null default array[]::text[],
  is_enabled boolean not null default true,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.admin_accounts (
  created_order bigserial primary key,
  username text not null unique,
  password text not null,
  display_name text not null,
  is_enabled boolean not null default true,
  updated_at text not null
);

alter table public.feedback_tickets enable row level security;
alter table public.managed_surveys enable row level security;
alter table public.survey_responses enable row level security;
alter table public.managed_listeners enable row level security;
alter table public.admin_accounts enable row level security;

create index if not exists feedback_tickets_status_idx
  on public.feedback_tickets (status);
create index if not exists managed_surveys_enabled_idx
  on public.managed_surveys (is_enabled);
create index if not exists survey_responses_survey_id_idx
  on public.survey_responses (survey_id);
create index if not exists managed_listeners_enabled_order_idx
  on public.managed_listeners (is_enabled, "order");
