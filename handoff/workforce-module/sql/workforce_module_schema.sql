-- Workforce Module Schema Bundle
-- Run in Supabase SQL Editor (or PostgreSQL 14+).

begin;

create extension if not exists pgcrypto;

create table if not exists team_members (
  id text primary key default ('tm_' || gen_random_uuid()::text),
  user_id text not null unique,
  email text not null unique,
  name text not null default '',
  title text not null default '',
  portal text not null default 'staff',
  can_view_reservations boolean not null default false,
  can_view_events_parties boolean not null default false,
  can_view_classes boolean not null default false,
  can_access_menu_management boolean not null default false,
  can_access_operations boolean not null default true,
  can_access_workforce boolean not null default false,
  can_access_content_management boolean not null default false,
  can_access_career_management boolean not null default false,
  can_access_investment boolean not null default false,
  can_access_settings boolean not null default false,
  can_manage_schedule boolean not null default false,
  operations_classes_read_only boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_members_email_lower_idx
  on team_members ((lower(email)));

create table if not exists admin_user_roles (
  id text primary key default ('aur_' || gen_random_uuid()::text),
  user_id text not null,
  role_id text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists admin_user_roles_user_role_idx
  on admin_user_roles (user_id, role_id);

create table if not exists workforce_locations (
  id text primary key default ('wf_loc_' || gen_random_uuid()::text),
  name text not null,
  timezone text not null default 'America/New_York',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workforce_departments (
  id text primary key default ('wf_dept_' || gen_random_uuid()::text),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists workforce_stations (
  id text primary key default ('wf_station_' || gen_random_uuid()::text),
  name text not null,
  department_id text references workforce_departments(id) on delete set null,
  location_id text references workforce_locations(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists workforce_roles (
  id text primary key default ('wf_role_' || gen_random_uuid()::text),
  name text not null,
  department_id text references workforce_departments(id) on delete set null,
  default_station_id text references workforce_stations(id) on delete set null,
  labor_class text,
  role_section text default 'General',
  display_order integer default 1,
  hourly_rate numeric(10,2) default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workforce_employees (
  id text primary key default ('wf_emp_' || gen_random_uuid()::text),
  user_id text,
  name text not null,
  email text,
  phone text,
  title text,
  status text not null default 'active',
  default_location_id text references workforce_locations(id) on delete set null,
  hire_date date,
  pay_basis text default 'hourly',
  hourly_rate numeric(10,2) default 0,
  compensation_amount numeric(10,2),
  compensation_weekly_hours numeric(10,2),
  compensation_monthly_hours numeric(10,2),
  availability text,
  login_username text,
  login_password text,
  attendance_score numeric(6,2),
  pto_unit text not null default 'hours' check (pto_unit in ('hours', 'days')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workforce_employees_user_id_idx
  on workforce_employees (user_id);

create index if not exists workforce_employees_email_lower_idx
  on workforce_employees ((lower(email)));

create table if not exists workforce_employee_roles (
  id text primary key default ('wf_er_' || gen_random_uuid()::text),
  employee_id text not null references workforce_employees(id) on delete cascade,
  role_id text not null references workforce_roles(id) on delete cascade,
  hourly_rate numeric(10,2) default 0,
  primary_role boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists workforce_employee_roles_employee_idx
  on workforce_employee_roles (employee_id);

create table if not exists workforce_shift_templates (
  id text primary key default ('wf_tpl_' || gen_random_uuid()::text),
  name text not null,
  role_id text references workforce_roles(id) on delete set null,
  station_id text references workforce_stations(id) on delete set null,
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists workforce_shifts (
  id text primary key default ('wf_shift_' || gen_random_uuid()::text),
  employee_id text not null references workforce_employees(id) on delete cascade,
  role_id text not null references workforce_roles(id) on delete restrict,
  location_id text references workforce_locations(id) on delete set null,
  station_id text references workforce_stations(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  break_rules text,
  wage_rate numeric(10,2) default 0,
  override_reason text,
  hours_scheduled numeric(10,2),
  status text default 'published',
  published_by text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workforce_shifts_start_time_idx
  on workforce_shifts (start_time);

create index if not exists workforce_shifts_employee_start_idx
  on workforce_shifts (employee_id, start_time);

create table if not exists workforce_schedule_templates (
  id text primary key default ('wf_sched_tpl_' || gen_random_uuid()::text),
  name text not null,
  location_id text references workforce_locations(id) on delete set null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workforce_schedule_template_shifts (
  id text primary key default ('wf_sched_tpl_shift_' || gen_random_uuid()::text),
  template_id text not null references workforce_schedule_templates(id) on delete cascade,
  day_offset integer not null default 0,
  employee_id text references workforce_employees(id) on delete set null,
  role_id text references workforce_roles(id) on delete set null,
  station_id text references workforce_stations(id) on delete set null,
  start_time time not null,
  end_time time not null,
  wage_rate numeric(10,2),
  created_at timestamptz not null default now()
);

create index if not exists workforce_schedule_template_shifts_template_idx
  on workforce_schedule_template_shifts (template_id, day_offset);

create table if not exists workforce_punches (
  id text primary key default ('wf_punch_' || gen_random_uuid()::text),
  employee_id text not null references workforce_employees(id) on delete cascade,
  shift_id text not null references workforce_shifts(id) on delete cascade,
  clock_in timestamptz not null,
  clock_out timestamptz,
  status text default 'open',
  verified_location boolean default false,
  verified_photo boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists workforce_punches_employee_clock_in_idx
  on workforce_punches (employee_id, clock_in desc);

create table if not exists workforce_breaks (
  id text primary key default ('wf_break_' || gen_random_uuid()::text),
  punch_id text not null references workforce_punches(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  break_type text,
  paid_break boolean,
  expected_minutes integer,
  created_at timestamptz not null default now()
);

create index if not exists workforce_breaks_punch_start_idx
  on workforce_breaks (punch_id, start_time desc);

create table if not exists workforce_time_off_requests (
  id text primary key default ('wf_to_req_' || gen_random_uuid()::text),
  employee_id text not null references workforce_employees(id) on delete cascade,
  request_type text not null default 'pto',
  start_date date not null,
  end_date date not null,
  hours numeric(10,2),
  status text not null default 'pending',
  notes text,
  status_note text,
  status_updated_by text,
  status_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workforce_time_off_requests_employee_date_idx
  on workforce_time_off_requests (employee_id, start_date);

create table if not exists workforce_time_off_blocks (
  id text primary key default ('wf_to_block_' || gen_random_uuid()::text),
  start_date date not null,
  end_date date not null,
  reason text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists workforce_company_holidays (
  id text primary key default ('wf_holiday_' || gen_random_uuid()::text),
  holiday_date date not null,
  name text not null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists workforce_company_holidays_date_idx
  on workforce_company_holidays (holiday_date);

create table if not exists workforce_pto_balances (
  id text primary key default ('wf_pto_' || gen_random_uuid()::text),
  employee_id text not null references workforce_employees(id) on delete cascade,
  accrued_hours numeric(10,2) not null default 0,
  used_hours numeric(10,2) not null default 0,
  available_hours numeric(10,2) not null default 0,
  pto_unit text not null default 'hours' check (pto_unit in ('hours', 'days')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists workforce_pto_balances_employee_idx
  on workforce_pto_balances (employee_id);

create table if not exists workforce_employee_documents (
  id text primary key default ('wf_doc_' || gen_random_uuid()::text),
  employee_id text not null references workforce_employees(id) on delete cascade,
  doc_type text not null,
  file_name text not null,
  file_path text not null,
  public_url text not null,
  notes text,
  uploaded_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create index if not exists workforce_employee_documents_employee_idx
  on workforce_employee_documents (employee_id, uploaded_at desc);

create table if not exists workforce_tasks (
  id text primary key default ('wf_task_' || gen_random_uuid()::text),
  title text not null,
  assigned_employee_id text references workforce_employees(id) on delete set null,
  assigned_role_id text references workforce_roles(id) on delete set null,
  location_id text references workforce_locations(id) on delete set null,
  station_id text references workforce_stations(id) on delete set null,
  due_time timestamptz,
  completion_status text not null default 'open',
  critical boolean not null default false,
  completed_by text,
  completed_at timestamptz,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workforce_tasks_due_idx
  on workforce_tasks (due_time);

create index if not exists workforce_tasks_status_idx
  on workforce_tasks (completion_status);

create index if not exists workforce_tasks_assignee_idx
  on workforce_tasks (assigned_employee_id);

create table if not exists workforce_log_entries (
  id text primary key default ('wf_log_' || gen_random_uuid()::text),
  author_name text,
  timestamp timestamptz not null default now(),
  location_id text references workforce_locations(id) on delete set null,
  category text,
  severity text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists workforce_log_entries_timestamp_idx
  on workforce_log_entries (timestamp desc);

create table if not exists workforce_rules (
  id text primary key default ('wf_rule_' || gen_random_uuid()::text),
  rule_code text not null,
  jurisdiction text,
  trigger_event text,
  expression_json jsonb,
  block_or_warn text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists workforce_events (
  id text primary key default ('wf_evt_' || gen_random_uuid()::text),
  event_type text not null,
  actor_id text,
  subject_type text,
  subject_id text,
  location_id text references workforce_locations(id) on delete set null,
  timestamp timestamptz not null default now(),
  metadata_json jsonb,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists workforce_events_timestamp_idx
  on workforce_events (timestamp desc);

-- Backward-compatible column additions for existing installs.
alter table if exists workforce_shifts
  add column if not exists override_reason text;

alter table if exists workforce_time_off_requests
  add column if not exists status_note text;

alter table if exists workforce_time_off_requests
  add column if not exists status_updated_by text;

alter table if exists workforce_time_off_requests
  add column if not exists status_updated_at timestamptz;

alter table if exists workforce_time_off_requests
  alter column request_type set default 'pto';

create table if not exists workforce_dashboard_snapshots (
  id text primary key default ('wf_snap_' || gen_random_uuid()::text),
  snapshot_type text not null default 'log_archive_daily',
  snapshot_date date not null,
  payload_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workforce_dashboard_snapshots_date_idx
  on workforce_dashboard_snapshots (snapshot_date desc, snapshot_type);

-- ============================================================================
-- RLS + guardrails (Supabase auth.uid() based)
-- ============================================================================

create or replace function public.current_workforce_employee_id()
returns text
language sql
stable
as $$
  select e.id
  from workforce_employees e
  where (
    (auth.uid() is not null and e.user_id = auth.uid()::text)
    or (
      coalesce(auth.jwt() ->> 'email', '') <> ''
      and lower(coalesce(e.email, '')) = lower(auth.jwt() ->> 'email')
    )
  )
  order by
    case when auth.uid() is not null and e.user_id = auth.uid()::text then 0 else 1 end,
    e.created_at desc
  limit 1
$$;

create or replace function public.current_team_can_manage_schedule()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from team_members tm
    where (
      (auth.uid() is not null and tm.user_id = auth.uid()::text)
      or (
        coalesce(auth.jwt() ->> 'email', '') <> ''
        and lower(coalesce(tm.email, '')) = lower(auth.jwt() ->> 'email')
      )
    )
      and tm.active = true
      and tm.can_manage_schedule = true
  )
$$;

-- Time-off: employees can only touch their own rows; supervisors can manage all.
alter table workforce_time_off_requests enable row level security;
drop policy if exists workforce_time_off_requests_select on workforce_time_off_requests;
create policy workforce_time_off_requests_select on workforce_time_off_requests
for select
using (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

drop policy if exists workforce_time_off_requests_insert on workforce_time_off_requests;
create policy workforce_time_off_requests_insert on workforce_time_off_requests
for insert
with check (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

drop policy if exists workforce_time_off_requests_update on workforce_time_off_requests;
create policy workforce_time_off_requests_update on workforce_time_off_requests
for update
using (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
)
with check (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

drop policy if exists workforce_time_off_requests_delete on workforce_time_off_requests;
create policy workforce_time_off_requests_delete on workforce_time_off_requests
for delete
using (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

-- PTO balances: readable by owner/supervisor; writable by owner/supervisor for self-service flows.
alter table workforce_pto_balances enable row level security;
drop policy if exists workforce_pto_balances_select on workforce_pto_balances;
create policy workforce_pto_balances_select on workforce_pto_balances
for select
using (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

drop policy if exists workforce_pto_balances_insert on workforce_pto_balances;
create policy workforce_pto_balances_insert on workforce_pto_balances
for insert
with check (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

drop policy if exists workforce_pto_balances_update on workforce_pto_balances;
create policy workforce_pto_balances_update on workforce_pto_balances
for update
using (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
)
with check (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

drop policy if exists workforce_pto_balances_delete on workforce_pto_balances;
create policy workforce_pto_balances_delete on workforce_pto_balances
for delete
using (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

-- Schedule rows: employees read their own; supervisors create/manage all.
alter table workforce_shifts enable row level security;
drop policy if exists workforce_shifts_select on workforce_shifts;
create policy workforce_shifts_select on workforce_shifts
for select
using (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

drop policy if exists workforce_shifts_insert on workforce_shifts;
create policy workforce_shifts_insert on workforce_shifts
for insert
with check (public.current_team_can_manage_schedule());

drop policy if exists workforce_shifts_update on workforce_shifts;
create policy workforce_shifts_update on workforce_shifts
for update
using (public.current_team_can_manage_schedule())
with check (public.current_team_can_manage_schedule());

drop policy if exists workforce_shifts_delete on workforce_shifts;
create policy workforce_shifts_delete on workforce_shifts
for delete
using (public.current_team_can_manage_schedule());

-- Punches: employees can manage their own; supervisors can manage all.
alter table workforce_punches enable row level security;
drop policy if exists workforce_punches_select on workforce_punches;
create policy workforce_punches_select on workforce_punches
for select
using (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

drop policy if exists workforce_punches_insert on workforce_punches;
create policy workforce_punches_insert on workforce_punches
for insert
with check (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

drop policy if exists workforce_punches_update on workforce_punches;
create policy workforce_punches_update on workforce_punches
for update
using (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
)
with check (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

drop policy if exists workforce_punches_delete on workforce_punches;
create policy workforce_punches_delete on workforce_punches
for delete
using (
  employee_id = public.current_workforce_employee_id()
  or public.current_team_can_manage_schedule()
);

-- Breaks: scoped via linked punch ownership.
alter table workforce_breaks enable row level security;
drop policy if exists workforce_breaks_select on workforce_breaks;
create policy workforce_breaks_select on workforce_breaks
for select
using (
  public.current_team_can_manage_schedule()
  or exists (
    select 1
    from workforce_punches p
    where p.id = workforce_breaks.punch_id
      and p.employee_id = public.current_workforce_employee_id()
  )
);

drop policy if exists workforce_breaks_insert on workforce_breaks;
create policy workforce_breaks_insert on workforce_breaks
for insert
with check (
  public.current_team_can_manage_schedule()
  or exists (
    select 1
    from workforce_punches p
    where p.id = workforce_breaks.punch_id
      and p.employee_id = public.current_workforce_employee_id()
  )
);

drop policy if exists workforce_breaks_update on workforce_breaks;
create policy workforce_breaks_update on workforce_breaks
for update
using (
  public.current_team_can_manage_schedule()
  or exists (
    select 1
    from workforce_punches p
    where p.id = workforce_breaks.punch_id
      and p.employee_id = public.current_workforce_employee_id()
  )
)
with check (
  public.current_team_can_manage_schedule()
  or exists (
    select 1
    from workforce_punches p
    where p.id = workforce_breaks.punch_id
      and p.employee_id = public.current_workforce_employee_id()
  )
);

drop policy if exists workforce_breaks_delete on workforce_breaks;
create policy workforce_breaks_delete on workforce_breaks
for delete
using (
  public.current_team_can_manage_schedule()
  or exists (
    select 1
    from workforce_punches p
    where p.id = workforce_breaks.punch_id
      and p.employee_id = public.current_workforce_employee_id()
  )
);

-- Event ledger: supervisors can view all; employees can view own PTO events.
alter table workforce_events enable row level security;
drop policy if exists workforce_events_select on workforce_events;
create policy workforce_events_select on workforce_events
for select
using (
  public.current_team_can_manage_schedule()
  or actor_id = auth.uid()::text
  or (
    subject_type = 'time_off_request'
    and coalesce(metadata_json->>'employee_id', '') = coalesce(public.current_workforce_employee_id(), '')
  )
);

drop policy if exists workforce_events_insert on workforce_events;
create policy workforce_events_insert on workforce_events
for insert
with check (
  auth.uid() is not null
  and (
    actor_id is null
    or actor_id = auth.uid()::text
    or public.current_team_can_manage_schedule()
  )
);

-- Self-service guardrail: employee edits never auto-approve and approved edits reset to pending.
create or replace function public.enforce_time_off_request_guardrails()
returns trigger
language plpgsql
as $$
declare
  can_manage boolean := public.current_team_can_manage_schedule();
begin
  if tg_op = 'INSERT' then
    if not can_manage then
      new.status := 'pending';
      new.status_note := null;
      new.status_updated_by := null;
      new.status_updated_at := null;
    end if;
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not can_manage then
      if new.employee_id is distinct from old.employee_id then
        raise exception 'Employees may only edit their own request.';
      end if;

      if old.status = 'approved' and (
        new.start_date is distinct from old.start_date
        or new.end_date is distinct from old.end_date
        or coalesce(new.hours, 0) is distinct from coalesce(old.hours, 0)
        or coalesce(new.request_type, '') is distinct from coalesce(old.request_type, '')
        or coalesce(new.notes, '') is distinct from coalesce(old.notes, '')
      ) then
        new.status := 'pending';
      end if;

      if new.status is distinct from old.status then
        new.status := 'pending';
      end if;

      new.status_note := old.status_note;
      new.status_updated_by := old.status_updated_by;
      new.status_updated_at := old.status_updated_at;
    else
      if new.status is distinct from old.status then
        new.status_updated_by := coalesce(new.status_updated_by, auth.uid()::text);
        new.status_updated_at := coalesce(new.status_updated_at, now());
      end if;
    end if;

    new.updated_at := now();
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_time_off_request_guardrails on workforce_time_off_requests;
create trigger trg_enforce_time_off_request_guardrails
before insert or update on workforce_time_off_requests
for each row
execute function public.enforce_time_off_request_guardrails();

-- Minimal lookup seed (safe, no sample employee rows).
insert into workforce_locations (id, name, timezone, active)
values ('wf_loc_main', 'Main Location', 'America/New_York', true)
on conflict (id) do nothing;

insert into workforce_departments (id, name, active)
values
  ('wf_dept_management', 'Management', true),
  ('wf_dept_support', 'Support', true)
on conflict (id) do nothing;

insert into workforce_stations (id, name, department_id, location_id, active)
values
  ('wf_station_support', 'Support Desk', 'wf_dept_support', 'wf_loc_main', true),
  ('wf_station_ops', 'Operations', 'wf_dept_management', 'wf_loc_main', true)
on conflict (id) do nothing;

insert into workforce_roles (id, name, department_id, role_section, display_order, hourly_rate, active)
values
  ('wf_role_team_member', 'Team Member', 'wf_dept_support', 'Support', 1, 0, true),
  ('wf_role_supervisor', 'Supervisor', 'wf_dept_management', 'Supervisor', 2, 0, true)
on conflict (id) do nothing;

-- Optional Storage bucket for employee docs (Supabase only).
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'storage'
      and table_name = 'buckets'
  ) then
    insert into storage.buckets (id, name, public)
    values ('employee-documents', 'employee-documents', true)
    on conflict (id) do nothing;
  end if;
end $$;

commit;
