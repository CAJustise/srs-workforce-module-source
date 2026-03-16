# Workforce Module Integration Pack

This folder is the handoff package to add three workforce tabs into your Customer Success dashboard:

1. `Today`
2. `Team Members`
3. `Log Archive`

This pack is designed so implementation can be done quickly by another team using VS Code + Claude Code.

## Fastest Handoff Workflow

1. Create a **private** GitHub repo (or private branch in your internal mono-repo).
2. Copy this entire `handoff/workforce-module` folder into that repo.
3. Run the SQL in [`sql/workforce_module_schema.sql`](./sql/workforce_module_schema.sql).
4. Give your team this folder and tell them to follow:
   - [`ROUTES.md`](./ROUTES.md)
   - [`PERMISSIONS.md`](./PERMISSIONS.md)
   - [`TEST-CASES.md`](./TEST-CASES.md)
   - [`CLAUDE_PROMPT.md`](./CLAUDE_PROMPT.md)

## Source Files To Port (From This Repo)

These files contain the implemented behavior:

- `src/components/Admin/Dashboard.tsx`
- `src/components/Admin/WorkforceManagement.tsx`
- `src/components/Admin/AdminLayout.tsx`
- `src/lib/bohRoles.ts`
- `src/lib/scheduleTimezone.ts`
- `src/lib/supabase.ts`

Route wiring example is in:

- `src/App.tsx`

## Required Env Vars

From `.env.example`:

```bash
VITE_USE_REMOTE_SUPABASE=false
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_SERVICE_ROLE_KEY=
```

For production/shared environments, set:

- `VITE_USE_REMOTE_SUPABASE=true`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY` (needed for auth admin actions in Team Members flows)

## What This Module Includes

- Today dashboard:
  - My Time Clock
  - Break controls with minimum break duration enforcement (cannot end early)
  - Break history showing start/end and total break duration
  - Clock Status showing clock-in time plus worked duration (net of unpaid breaks)
  - Today’s Schedule by Department
  - PTO Requests card (request button + future request list with approval status)
  - PTO request amount auto-calculated from selected date range (no manual amount entry)
  - PTO request types limited to `PTO` and `Sick`
  - Weekly Schedule (this week + 3 weeks forward)
  - Company Holidays (shown below Weekly Schedule)
  - Task Board (grouped by assignee)
  - Daily Activity Log
  - Timezone view control (`View by time zone`): US timezone dropdown + Local
- Team Members:
  - Scheduler (week/day views)
  - Clock In Logs (30-day adjustments)
  - Time Off + PTO with request status review dropdown (`pending`, `approved`, `denied`)
  - Supervisor request list ordered by status: `pending` first, then `approved`, then `denied`
  - Team member profiles + documents
  - Role library and role ordering
- Log Archive:
  - Snapshot history (up to 365 days target retention)

## Current Guardrails Implemented

- Supervisor-only task verification:
  - `Verified By Supervisor` is enabled only when `team_members.can_manage_schedule = true`.
- Task lifecycle:
  - Open overdue tasks are red.
  - Completed but unverified tasks are green.
  - Verified tasks disappear from active board.
  - Open tasks with past due date auto-roll forward by day.

## Suggested Delivery Artifacts

When handing to your work team, send:

1. Repo link (private)
2. SQL file path
3. CLAUDE prompt file path
4. “Done = all TEST-CASES pass” message

## Suggested Branch Name

`feature/cs-workforce-module`
