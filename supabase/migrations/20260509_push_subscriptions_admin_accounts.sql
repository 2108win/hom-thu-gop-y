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

create index if not exists push_subscriptions_account_username_idx
  on public.push_subscriptions (account_username);
