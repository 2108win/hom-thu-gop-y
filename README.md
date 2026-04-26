# Hòm thư góp ý - LỮ ĐOÀN PPK234

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Database

The app stores all data in Supabase/Postgres through server-side API routes.
No spreadsheet backend is used.

### 1. Create Tables

Create a free Supabase project, open SQL Editor, and run:

```text
supabase/schema.sql
```

### 2. Environment Variables

Add these values to `.env.local`:

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is also accepted for legacy projects, but
`SUPABASE_SECRET_KEY` is preferred.

### 3. Where To Get Supabase Values

In the Supabase dashboard, open your project and use:

- `SUPABASE_URL`: Project Settings -> Data API -> Project URL.
- `SUPABASE_SECRET_KEY`: Project Settings -> API Keys -> create/copy a Secret key.
- Legacy option: Project Settings -> API Keys -> Legacy API Keys -> `service_role`.

If you paste the Data API REST URL that ends with `/rest/v1`, the app will
normalize it automatically. The recommended value is still the Project URL.

Do not expose `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in browser
code or any `NEXT_PUBLIC_` environment variable.

### 4. Admin Accounts

Admin login uses the `public.admin_accounts` table created by
`supabase/schema.sql`. If you do not see that table in Supabase Table Editor,
open SQL Editor and run `supabase/schema.sql` first.

Create and manage admin accounts directly in Supabase Table Editor, or insert
one account in SQL Editor:

```sql
insert into public.admin_accounts
  (username, password, display_name, is_enabled, updated_at)
values
  ('admin', 'change-this-password', 'Quản trị viên', true, to_char(now(), 'DD/MM/YYYY HH24:MI'));
```

Passwords are read from the `password` column for this internal admin screen, so
limit Supabase Dashboard access to trusted operators.

Restart the app after editing `.env.local`.

### 5. Managed Listeners

The "Người phụ trách lắng nghe" section is loaded only from
`public.managed_listeners`. There are no bundled default listener records.
Add, edit, disable, or delete listeners from the admin "Tiếp nhận" tab.
