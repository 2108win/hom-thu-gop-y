alter table public.admin_accounts
  drop constraint if exists admin_accounts_listener_role_check;

alter table public.admin_accounts
  add constraint admin_accounts_listener_role_check check (
    (role = 'admin' and coalesce(listener_id, '') = '')
    or (
      role = 'listener'
      and (coalesce(listener_id, '') <> '' or is_enabled = false)
    )
  );

create or replace function public.ensure_admin_account_listener_link()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'listener' and coalesce(new.listener_id, '') <> '' then
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
