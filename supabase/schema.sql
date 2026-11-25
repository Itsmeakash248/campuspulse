-- CampusPulse SSWD — Supabase / Postgres schema
-- Run this once in the Supabase SQL Editor before seeding:
--   npm run seed:supabase
--
-- The Express server connects with SUPABASE_SERVICE_ROLE_KEY.
-- RLS is enabled with no public policies, so the anon key cannot read or write
-- these tables directly. Keep the service role key on the server only.

create table if not exists public.users (
  id text primary key,
  name text not null,
  usn text unique,
  roll_no text,
  email text,
  role text not null default 'student' check (role in ('student', 'faculty', 'admin')),
  specialization text,
  avatar text,
  created_at timestamptz not null default now()
);

create table if not exists public.lab_assets (
  id text primary key,
  tag text not null unique,
  seat_no integer not null,
  row_no integer not null,
  column_no integer not null,
  status text not null default 'available' check (status in ('available', 'occupied', 'maintenance', 'offline')),
  assigned_to text,
  student_name text,
  current_program text not null default 'Idle (Ready for Session)',
  specs jsonb not null default '{}'::jsonb,
  ip_address text,
  mac_address text,
  last_heartbeat timestamptz not null default now(),
  issue_count integer not null default 0
);

create table if not exists public.asset_allocations (
  id text primary key,
  workstation_tag text not null,
  seat_no integer,
  usn text not null,
  student_name text,
  check_in_time timestamptz not null default now(),
  check_out_time timestamptz,
  session_purpose text,
  session_status text not null default 'active' check (session_status in ('active', 'completed'))
);

create table if not exists public.grievances (
  id text primary key,
  ticket_id text not null unique,
  workstation_tag text not null,
  seat_no integer not null default 0,
  student_usn text not null,
  student_name text,
  category text not null default 'Hardware' check (category in ('Hardware', 'Software', 'Network', 'Peripheral', 'Power')),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  title text not null,
  description text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'IN_REVIEW', 'RESOLVED', 'CLOSED')),
  assigned_to text default 'Admin 302',
  sla_minutes integer not null default 240,
  elapsed_minutes integer not null default 0,
  resolution_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_submissions (
  id text primary key,
  program_number integer not null,
  program_title text not null,
  student_usn text not null,
  student_name text,
  submitted_at timestamptz not null default now(),
  status text not null default 'SUBMITTED' check (status in ('DRAFT', 'SUBMITTED', 'VERIFIED', 'REVISION_REQUIRED')),
  plagiarism_score numeric(4, 1) not null default 0,
  syntax_validation_passed boolean not null default true,
  marks_awarded numeric(4, 1),
  max_marks numeric(4, 1) not null default 10,
  faculty_comments text not null default '',
  verified_by text
);

create table if not exists public.audit_logs (
  id text primary key,
  timestamp timestamptz not null default now(),
  action text not null,
  actor text,
  details text,
  ip text
);

create index if not exists lab_assets_status_idx on public.lab_assets (status);
create index if not exists lab_assets_row_idx on public.lab_assets (row_no);
create index if not exists asset_allocations_tag_idx on public.asset_allocations (workstation_tag);
create index if not exists grievances_status_idx on public.grievances (status);
create index if not exists grievances_workstation_idx on public.grievances (workstation_tag);
create index if not exists grievances_created_idx on public.grievances (created_at desc);
create index if not exists journal_submissions_usn_idx on public.journal_submissions (student_usn);
create index if not exists journal_submissions_status_idx on public.journal_submissions (status);
create index if not exists audit_logs_timestamp_idx on public.audit_logs (timestamp desc);

alter table public.users enable row level security;
alter table public.lab_assets enable row level security;
alter table public.asset_allocations enable row level security;
alter table public.grievances enable row level security;
alter table public.journal_submissions enable row level security;
alter table public.audit_logs enable row level security;

-- The Express server writes with the service role key. This role bypasses RLS,
-- but it still needs table privileges.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.users to service_role;
grant select, insert, update, delete on public.lab_assets to service_role;
grant select, insert, update, delete on public.asset_allocations to service_role;
grant select, insert, update, delete on public.grievances to service_role;
grant select, insert, update, delete on public.journal_submissions to service_role;
grant select, insert, update, delete on public.audit_logs to service_role;
