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
- PTO request behavior:
  - Team member can submit own request from Today
  - Today PTO list must only show requests for the logged-in employee
  - List only current/future requests (hide past requests)
  - Show request status (`pending`, `approved`, `denied`)
  - Request amount is derived from selected start/end dates (no manual amount input)
  - Request type options are only `PTO` and `Sick`
  - Selecting start date should auto-set end date to the same date initially
- Schedule behavior:
  - Approved time-off requests must be reflected in schedule displays (cell highlights/labels)
- Task Board behavior:
  - Group tasks by assignee
  - Overdue open tasks = red
  - Completed/unverified = green
  - Verified tasks hidden
  - Verify checkbox only enabled for supervisor profile (`team_members.can_manage_schedule=true`)
- Timezone UI:
  - Place above My Time Clock
  - Label `View by time zone`
  - US timezone dropdown + Local button
  - Must update Today schedule and Weekly schedule time display
- Team Members Time Off + PTO behavior:
  - Remove request-creation button/form
  - Add per-row status dropdown to set `pending`, `approved`, `denied`
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
