# SRS Team Hub (Local Template)

Local-only team operations dashboard template focused on employee management, scheduling, time clock, and PTO.

## Scope

- `Today` dashboard (time clock, labor, compliance, read-only weekly schedule)
- `Team` management (employee file, roles, scheduler, PTO requests/tracker)
- Supervisor access model:
  - Team members: `Today` only
  - Supervisors: `Today` + `Team` + schedule write controls

## Local Run

```bash
npm ci
npm run dev
```

App entry: `/admin/login`

Default local admin login:

- Email: `admin@srs.local`
- Password: `srs-admin`

## Isolation Notes

- Defaults to local data storage (`VITE_USE_REMOTE_SUPABASE=false`).
- Uses a dedicated local storage namespace for this project (`srs_team_hub.*`).
- This template does not write to live Spoonbill properties unless remote Supabase mode is explicitly enabled.

## Optional Remote Supabase Mode

If you intentionally want remote Supabase, copy `.env.example` to `.env` and set:

- `VITE_USE_REMOTE_SUPABASE=true`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`

## Work Handoff Pack

Integration handoff docs for importing the 3-tab workforce module into another dashboard are here:

- `handoff/workforce-module/README-Integration.md`
- `handoff/workforce-module/CLAUDE_PROMPT.md`
- `handoff/workforce-module/sql/workforce_module_schema.sql`
