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
  request_type text not null default 'day_off',
  start_date date not null,
  end_date date not null,
  hours numeric(10,2),
  status text not null default 'pending',
  notes text,
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

