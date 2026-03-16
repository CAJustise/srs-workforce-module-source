# Routes + Navigation Spec

Use these three tabs in your CS dashboard left nav:

1. `Today`
2. `Team Members`
3. `Log Archive`

## Recommended Paths

Choose path prefix to match your app. Example:

- `/cs/workforce/today`
- `/cs/workforce/team-members`
- `/cs/workforce/log-archive`

## Route Mapping

- `Today` page uses functionality from `Dashboard.tsx`.
- `Team Members` page uses functionality from `WorkforceManagement.tsx`.
- `Log Archive` page uses `WorkforceManagement` in archive-only mode.

## React Router Example

```tsx
<Route path="/cs/workforce/today" element={<Dashboard />} />
<Route path="/cs/workforce/team-members" element={<WorkforceManagement />} />
<Route path="/cs/workforce/log-archive" element={<WorkforceManagement archiveOnly />} />
```

## Left Nav Labels

- Section header: `Supervisor`
- Item labels:
  - `Today`
  - `Team Members`
  - `Log Archive`

## UI Placement Requirements

- On `Today`, timezone control must be **above** My Time Clock:
  - label: `View by time zone`
  - controls: US timezone dropdown + `Local` button

