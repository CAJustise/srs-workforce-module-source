# Claude Code Prompt (Copy/Paste)

You are integrating a workforce module into our existing Customer Success dashboard.

## Goal

Add three tabs and full functionality:

1. Today
2. Team Members
3. Log Archive

## Source of Truth

Use the handoff pack files in this folder:

- `README-Integration.md`
- `ROUTES.md`
- `PERMISSIONS.md`
- `TEST-CASES.md`
- `sql/workforce_module_schema.sql`

## Constraints

- Do not redesign existing CS dashboard style.
- Reuse existing auth/session in the host app.
- Keep workforce data isolated to `workforce_*` + `team_members` tables.
- Preserve existing app behavior outside these routes.
- Assume users already authenticate with company email in the host app.
- Do not introduce a separate workforce login flow.
- Resolve workforce identity using `auth.uid()` first, then email fallback.
- Skip payroll/W-2 export functionality for this 1099 implementation.

## Functional Requirements

- Today dashboard must include:
  - My Time Clock
  - Today’s Schedule by Department
  - PTO Requests panel (request button + future requests + status badges)
  - Weekly Schedule
  - Company Holidays (positioned below Weekly Schedule)
  - Task Board
  - Daily Activity Log
- My Time Clock behavior:
  - Show clock-in time and worked duration in Clock Status
  - Worked duration must subtract unpaid break time
  - Break history must display start/end and total duration
  - Prevent ending a break before its configured minimum duration
  - Current Shift card should show latest punch clock in/out and total worked hours
- PTO request behavior:
  - Team member can submit own request from Today
  - Today PTO list must only show requests for the logged-in employee
  - Team member can edit/delete only their own request records
  - If an approved request is edited, request status must be reset to `pending`
  - List only current/future requests (hide past requests)
  - Show request status (`pending`, `approved`, `denied`)
  - Request amount is derived from selected start/end dates (no manual amount input)
  - Request type options are only `PTO` and `Sick`
  - Selecting start date should auto-set end date to the same date initially
  - Add PTO notifications feed for request status/activity events
- Schedule behavior:
  - Approved time-off requests must be reflected in schedule displays (cell highlights/labels)
  - If supervisor schedules over approved PTO, require explicit override reason
- Task Board behavior:
  - Group tasks by assignee
  - Overdue open tasks = red
  - Completed/unverified = green
  - Verified tasks hidden
  - Verify checkbox only enabled for supervisor profile (`team_members.can_manage_schedule=true`)
- Today dashboard alerts:
  - Include missed punch digest for same-day no-show/missing punch coverage
- Timezone UI:
  - Place above My Time Clock
  - Label `View by time zone`
  - US timezone dropdown + Local button
  - Must update Today schedule and Weekly schedule time display
- Team Members Time Off + PTO behavior:
  - Remove request-creation button/form
  - Add per-row status dropdown to set `pending`, `approved`, `denied`
  - Require denial note when setting `denied`
  - Persist optional status note on approval
  - Show PTO audit trail entries (who changed status, when, note)
- Team Members and Log Archive pages must be separate tabs/routes.

## Implementation Notes

- Use SQL file from handoff pack to create tables/indexes.
- Wire routes and left nav exactly per `ROUTES.md`.
- Enforce permissions per `PERMISSIONS.md`.
- Run and report all checklist items in `TEST-CASES.md`.

## Deliverable Format

Return:

1. files changed
2. migration steps run
3. test case pass/fail list
4. remaining blockers (if any)
