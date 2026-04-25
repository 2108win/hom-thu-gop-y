# Hòm thư góp ý - LỮ ĐOÀN PPK234

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Google Sheets

The app stores feedback tickets and survey responses in Google Sheets through
server-side API routes. Do not call Google Sheets directly from the browser.

Required environment variables:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

ADMIN_BOOTSTRAP_USER=
ADMIN_BOOTSTRAP_PASSWORD=
ADMIN_BOOTSTRAP_DISPLAY_NAME=
ADMIN_SESSION_SECRET=

GOOGLE_SHEETS_FEEDBACK_SHEET=GopY
GOOGLE_SHEETS_SURVEY_SHEET=KhaoSat
GOOGLE_SHEETS_SURVEY_LIST_SHEET=DanhSachKhaoSat
GOOGLE_SHEETS_LISTENER_SHEET=BoPhanTiepNhan
GOOGLE_SHEETS_ADMIN_SHEET=TaiKhoanAdmin
```

You can also use `GOOGLE_SERVICE_ACCOUNT_JSON` instead of
`GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`.

Setup:

1. Create a Google Cloud service account and key.
2. Enable Google Sheets API for the Google Cloud project.
3. Create a Google Sheet.
4. Share the Sheet with the service account email as Editor.
5. Put the environment variables in `.env.local`.
6. Restart `npm run dev`.

The app will create or initialize these tabs automatically:

- `GopY`: feedback tickets
- `KhaoSat`: legacy/internal survey responses
- `DanhSachKhaoSat`: admin-managed survey links, dates, and QR routes
- `BoPhanTiepNhan`: admin-managed receiving departments/listeners
- `TaiKhoanAdmin`: admin login accounts

Admin account rows use these columns, one account per row:

```text
username | password | display_name | is_enabled | updated_at
```

Set `is_enabled` to `TRUE` for accounts allowed to log in. Passwords are read
directly from the sheet, so limit access to the Google Sheet to trusted editors.
When the `/quan-tri` page is opened, the app ensures this tab exists. If the tab
is empty and `ADMIN_BOOTSTRAP_USER`/`ADMIN_BOOTSTRAP_PASSWORD` are set, one
initial enabled account is added automatically. Existing legacy
`ADMIN_USER`/`ADMIN_PASSWORD` variables are also accepted for this one-time
bootstrap seed.
