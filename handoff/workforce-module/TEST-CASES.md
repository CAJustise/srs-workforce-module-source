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
6. Current Shift card shows latest punch:
   - clock-in time
   - clock-out time
   - total worked hours
7. Completed breaks show:
   - start/end time
   - total break duration
8. User cannot end a break before minimum break length is reached.
9. PTO Requests panel appears where the right-side card is shown next to Today’s Schedule.
10. Team member can submit a PTO/sick request from Today.
11. Today PTO list shows only current/future requests (no past requests).
12. Each request shows status (`pending`, `approved`, `denied`).
13. Company Holidays section is below Weekly Schedule.
14. PTO request form only includes `PTO` and `Sick` request types.
15. Requested amount auto-calculates from selected date range.
16. Selecting start date auto-sets end date to the same date unless edited.
17. Today PTO list only shows requests for the logged-in employee.
18. Approved time-off requests are reflected in Today schedule displays (highlighted cells/labels).
19. Logged-in employee can edit/delete only their own requests.
20. Editing an approved request resets status to `pending`.
21. Missed Punch Digest card shows same-day missed/no-show summaries.
22. PTO Notifications list shows submitted/edited/deleted/approved/denied events for the logged-in employee.

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
7. Supervisor request list is ordered by status: `pending` first, then `approved`, then `denied`.
8. Approved time-off requests are reflected in Team schedule displays (highlighted cells/labels).
9. Denying a PTO request requires a note.
10. Scheduling a shift that overlaps approved PTO requires an override reason.
11. PTO Audit Trail shows actor, timestamp, status change, and note details.

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
4. Auth/session mapping recognizes users by `auth.uid()` and also by company email fallback.
