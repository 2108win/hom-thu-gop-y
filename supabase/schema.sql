create table if not exists public.feedback_tickets (
  created_order bigserial primary key,
  ticket_code text not null unique,
  created_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'done')),
  message text not null,
  category_id text not null,
  category text not null,
  is_anonymous boolean not null default false,
  name text default '',
  unit text default '',
  admin_reply text default '',
  replied_by text default '',
  replied_at timestamptz,
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
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.survey_responses (
  created_order bigserial primary key,
  response_code text not null unique,
  survey_id text not null,
  survey_title text not null,
  created_at timestamptz not null,
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
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.admin_accounts (
  created_order bigserial primary key,
  username text not null unique,
  password text not null,
  display_name text not null,
  role text not null default 'admin' check (role in ('admin', 'listener')),
  listener_id text default '',
  email text default '',
  phone text default '',
  rank text default '',
  position text default '',
  unit text default '',
  is_enabled boolean not null default true,
  updated_at timestamptz not null
);

alter table public.admin_accounts
  add column if not exists role text not null default 'admin',
  add column if not exists listener_id text default '',
  add column if not exists email text default '',
  add column if not exists phone text default '',
  add column if not exists rank text default '',
  add column if not exists position text default '',
  add column if not exists unit text default '';

alter table public.admin_accounts
  drop constraint if exists admin_accounts_role_check;
alter table public.admin_accounts
  add constraint admin_accounts_role_check check (role in ('admin', 'listener'));

update public.admin_accounts
set listener_id = ''
where role = 'admin' and coalesce(listener_id, '') <> '';

update public.admin_accounts
set role = 'admin', listener_id = ''
where role = 'listener' and coalesce(listener_id, '') = '';

update public.managed_listeners
set assigned_categories = array(
  select distinct category_id
  from unnest(assigned_categories) as category_id
  where category_id = any(array[
    '691edfd3b65c2',
    '696edfd3b65ce',
    '696edf354fe11',
    '696ee045dbd3b'
  ]::text[])
)
where not assigned_categories <@ array[
  '691edfd3b65c2',
  '696edfd3b65ce',
  '696edf354fe11',
  '696ee045dbd3b'
]::text[];

alter table public.admin_accounts
  drop constraint if exists admin_accounts_listener_role_check;
alter table public.admin_accounts
  add constraint admin_accounts_listener_role_check check (
    (role = 'admin' and coalesce(listener_id, '') = '')
    or (role = 'listener' and coalesce(listener_id, '') <> '')
  );

alter table public.managed_listeners
  drop constraint if exists managed_listeners_assigned_categories_check;
alter table public.managed_listeners
  add constraint managed_listeners_assigned_categories_check check (
    assigned_categories <@ array[
      '691edfd3b65c2',
      '696edfd3b65ce',
      '696edf354fe11',
      '696ee045dbd3b'
    ]::text[]
  );

create or replace function public.ensure_admin_account_listener_link()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'listener' then
    if not exists (
      select 1
      from public.managed_listeners
      where id = new.listener_id
    ) then
      raise exception 'listener_id % does not exist in managed_listeners', new.listener_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists admin_accounts_listener_link_check on public.admin_accounts;
create trigger admin_accounts_listener_link_check
before insert or update of role, listener_id on public.admin_accounts
for each row execute function public.ensure_admin_account_listener_link();

create or replace function public.prevent_deleting_linked_listener()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.admin_accounts
    where listener_id = old.id
  ) then
    raise exception 'cannot delete listener % while an admin account is linked', old.id;
  end if;

  return old;
end;
$$;

drop trigger if exists managed_listeners_prevent_linked_delete on public.managed_listeners;
create trigger managed_listeners_prevent_linked_delete
before delete on public.managed_listeners
for each row execute function public.prevent_deleting_linked_listener();

create table if not exists public.push_subscriptions (
  created_order bigserial primary key,
  endpoint text not null unique,
  listener_id text references public.managed_listeners(id) on delete cascade,
  account_username text,
  p256dh text not null,
  auth text not null,
  user_agent text default '',
  created_at timestamptz not null,
  updated_at timestamptz not null
);

alter table public.push_subscriptions
  add column if not exists account_username text;
alter table public.push_subscriptions
  alter column listener_id drop not null;
update public.push_subscriptions
set account_username = listener_id
where account_username is null and listener_id is not null;
update public.push_subscriptions as subscription
set account_username = account.username
from public.admin_accounts as account
where subscription.account_username = subscription.listener_id
  and account.listener_id = subscription.listener_id;
alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_account_username_fkey;
alter table public.push_subscriptions
  add constraint push_subscriptions_account_username_fkey
  foreign key (account_username) references public.admin_accounts(username) on delete cascade;

update public.feedback_tickets set replied_at = null where replied_at::text = '';

alter table public.feedback_tickets
  alter column replied_at drop default;

create or replace function public.parse_legacy_hom_thu_timestamp(value text)
returns timestamptz
language sql
immutable
as $$
  select case
    when nullif(value, '') is null then null
    when value ~ '^\d{1,2}:\d{2} \d{1,2}/\d{1,2}/\d{2}$'
      then to_timestamp(value, 'HH24:MI DD/MM/YY') at time zone 'Asia/Ho_Chi_Minh'
    else value::timestamptz
  end
$$;

alter table public.feedback_tickets
  alter column created_at type timestamptz using public.parse_legacy_hom_thu_timestamp(created_at::text),
  alter column replied_at type timestamptz using public.parse_legacy_hom_thu_timestamp(replied_at::text);
alter table public.managed_surveys
  alter column created_at type timestamptz using public.parse_legacy_hom_thu_timestamp(created_at::text),
  alter column updated_at type timestamptz using public.parse_legacy_hom_thu_timestamp(updated_at::text);
alter table public.survey_responses
  alter column created_at type timestamptz using public.parse_legacy_hom_thu_timestamp(created_at::text);
alter table public.managed_listeners
  alter column created_at type timestamptz using public.parse_legacy_hom_thu_timestamp(created_at::text),
  alter column updated_at type timestamptz using public.parse_legacy_hom_thu_timestamp(updated_at::text);
alter table public.admin_accounts
  alter column updated_at type timestamptz using public.parse_legacy_hom_thu_timestamp(updated_at::text);
alter table public.push_subscriptions
  alter column created_at type timestamptz using public.parse_legacy_hom_thu_timestamp(created_at::text),
  alter column updated_at type timestamptz using public.parse_legacy_hom_thu_timestamp(updated_at::text);

drop function if exists public.parse_legacy_hom_thu_timestamp(text);

alter table public.feedback_tickets enable row level security;
alter table public.managed_surveys enable row level security;
alter table public.survey_responses enable row level security;
alter table public.managed_listeners enable row level security;
alter table public.admin_accounts enable row level security;
alter table public.push_subscriptions enable row level security;

create index if not exists feedback_tickets_status_idx
  on public.feedback_tickets (status);
create index if not exists managed_surveys_enabled_idx
  on public.managed_surveys (is_enabled);
create index if not exists survey_responses_survey_id_idx
  on public.survey_responses (survey_id);
create index if not exists managed_listeners_enabled_order_idx
  on public.managed_listeners (is_enabled, "order");
create index if not exists admin_accounts_listener_id_idx
  on public.admin_accounts (listener_id);
create unique index if not exists admin_accounts_listener_id_unique_idx
  on public.admin_accounts (listener_id)
  where listener_id <> '';
create index if not exists push_subscriptions_listener_id_idx
  on public.push_subscriptions (listener_id);
create index if not exists push_subscriptions_account_username_idx
  on public.push_subscriptions (account_username);
