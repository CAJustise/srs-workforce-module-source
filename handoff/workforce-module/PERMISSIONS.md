# Permissions + Access Rules

This module uses `team_members` + role/capability logic.

## Permission Source

Primary table:

- `team_members`

Critical fields:

- `user_id`
- `can_access_operations`
- `can_access_workforce`
- `can_manage_schedule`
- `active`

## Page Access Rules

- `Today` requires operations access.
- `Team Members` requires workforce + schedule write access.
- `Log Archive` requires workforce + schedule write access.

## Task Board Rules

- Any assigned team member can check `Completed` on their own tasks.
- Supervisors can also complete tasks.
- `Verified By Supervisor` checkbox:
  - must only be enabled when current user profile has `team_members.can_manage_schedule = true`
  - non-supervisors cannot verify
- Status behavior:
  - Open + past due = red card
  - Completed/unverified = green card
  - Verified = hidden from active board

## Supervisor Definition

Use this as source of truth:

- `team_members.can_manage_schedule = true`

Do not infer supervisor status from title text alone.

## Employee Visibility Rules

- Team members should only see what their profile allows.
- PTO visibility should be scoped to current employee where required.
- Team management tools should remain supervisor-only.

