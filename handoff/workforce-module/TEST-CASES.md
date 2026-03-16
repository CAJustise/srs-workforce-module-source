# Acceptance Test Cases

Use this checklist as definition of done for implementation.

## A. Navigation + Routing

1. Left nav shows `Today`, `Team Members`, `Log Archive`.
2. Clicking each tab loads the correct route/page.
3. `Log Archive` is a separate tab, not embedded section under Team Members.

## B. Today Dashboard

1. Timezone bar appears above My Time Clock with title `View by time zone`.
2. Timezone controls include:
   - US timezone dropdown
   - `Local` button
3. Changing timezone updates:
   - Today’s Schedule by Department times
   - Weekly Schedule times
4. Local mode shows viewer local zone label.
5. Clock Status shows:
   - Clock-in time
   - Worked duration since clock-in (net of unpaid break time)
6. Completed breaks show:
   - start/end time
   - total break duration
7. User cannot end a break before minimum break length is reached.
8. PTO Requests panel appears where the right-side card is shown next to Today’s Schedule.
9. Team member can submit a PTO/day-off/sick request from Today.
10. Today PTO list shows only current/future requests (no past requests).
11. Each request shows status (`pending`, `approved`, `denied`).
12. Company Holidays section is below Weekly Schedule.

## C. Task Board

1. Tasks are grouped by person (assignee headers).
2. Verified tasks are hidden.
3. Overdue open tasks are shaded red.
4. Completed-but-unverified tasks are shaded green.
5. `Completed` can be checked by assigned team member.
6. `Verified By Supervisor` can only be checked by supervisor profile (`can_manage_schedule=true`).
7. Non-supervisor cannot verify task.
8. Open past-due tasks are rolled forward to current day when dashboard refreshes.

## D. Team Members

1. Scheduler works in day/week mode.
2. Clock log edits are available for the past 30 days (supervisor only).
3. Role order affects schedule order.
4. Company holidays can be managed.
5. Time Off + PTO uses a status dropdown (`pending`, `approved`, `denied`) for each request.
6. Time Off + PTO no longer shows a request-creation button/form.

## E. Log Archive

1. Archive tab shows snapshot content for selected date.
2. Expected snapshot sections visible:
   - Tasks
   - Clock logs
   - Alerts
   - Daily schedule
   - Daily activity log

## F. Security + Access

1. Inactive team member cannot access module pages.
2. Non-workforce users cannot access Team Members / Log Archive.
3. Supervisor-only controls are locked for non-supervisors.
