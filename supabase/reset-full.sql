-- ════════════════════════════════════════════════════════════════════════════
-- HM Maths LMS · FULL RESET  (wipes EVERYTHING, rebuilds the database, seeds 2 logins)
--
-- !! This deletes ALL users, students, classes, payments, papers, marks and settings. !!
--
-- How to run: Supabase → SQL Editor → New query → paste this WHOLE file → Run.
-- It contains 0001 + 0002 + 0003 migrations, so nothing else needs to be run afterwards.
--
-- Logins created at the end:
--   Admin   : admin@nativelaunch.xyz   /  password shown in PART 3
--   Student : mobile 0771234567        /  password shown in PART 3
-- ════════════════════════════════════════════════════════════════════════════

-- ─── PART 1: WIPE ─────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  -- Uploaded files. Newer Supabase projects block deleting files with SQL; if so, this is
  -- skipped and you can empty the buckets from Storage in the dashboard (optional).
  begin
    delete from storage.objects
     where bucket_id in ('bank-slips','tute-pdfs','answer-sheets','class-banners','papers');
  exception when others then
    raise notice 'Storage files not deleted (%). Empty the buckets in Storage if you want.', sqlerrm;
  end;

  -- Every login (admins + students). Sessions and identities cascade.
  delete from auth.users;

  -- Every app table, view, function and type in the public schema (extension objects are kept).
  for r in select c.relname, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('v','m')
             and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e') loop
    if r.relkind = 'm' then execute format('drop materialized view if exists public.%I cascade', r.relname);
    else execute format('drop view if exists public.%I cascade', r.relname); end if;
  end loop;
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r','p')
             and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e') loop
    execute format('drop table if exists public.%I cascade', r.relname);
  end loop;
  for r in select p.oid::regprocedure::text as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind in ('f','p')
             and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') loop
    execute format('drop routine if exists %s cascade', r.sig);
  end loop;
  for r in select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
           where n.nspname = 'public' and t.typtype in ('e','d')
             and not exists (select 1 from pg_depend d where d.objid = t.oid and d.deptype = 'e') loop
    execute format('drop type if exists public.%I cascade', r.typname);
  end loop;
  drop trigger if exists on_auth_user_created on auth.users;
end $$;

-- ─── PART 2: REBUILD (0001 + 0002 + 0003) ─────────────────────────────────────
-- =============================================================================
--  Hasitha Madusanka · Combined Maths LMS — Supabase schema (v1)
--  Run once in Supabase Dashboard → SQL Editor → New query → Run.
--  Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- =============================================================================

-- gen_random_uuid() is built into PostgreSQL 13+ (no extension needed)

-- -----------------------------------------------------------------------------
-- 0. Admin allow-list (users signing up with these emails become admins)
-- -----------------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key
);
insert into public.admin_emails (email) values ('admin@nativelaunch.xyz')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  mobile      text unique,
  nic         text unique,
  al_year     int check (al_year between 2020 and 2040),
  town        text not null default 'Online'
              check (town in ('Panadura','Horana','Mathugama','Kalutara','Online')),
  school      text,
  district    text,
  student_id  text unique,
  role        text not null default 'student' check (role in ('student','admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  class_type  text not null default 'Theory'
              check (class_type in ('Theory','Revision','Paper Class','Extra Class','Free Seminar')),
  target_year int  check (target_year between 2020 and 2040),
  town        text check (town in ('Panadura','Horana','Mathugama','Kalutara','Online')),
  fee         numeric(10,2) not null default 0 check (fee >= 0),
  schedule    text,
  banner_url  text,
  is_active   boolean not null default true,
  is_free     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint free_has_no_fee check (not is_free or fee = 0)
);

create table if not exists public.lessons (
  id              uuid primary key default gen_random_uuid(),
  class_id        uuid not null references public.classes (id) on delete cascade,
  month           text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  week_number     int  not null default 1 check (week_number between 1 and 6),
  title           text not null,
  description     text,
  youtube_url     text,
  tute_pdf_url    text,          -- storage path inside the "tute-pdfs" bucket
  live_start_time timestamptz,
  live_url        text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists lessons_class_month_idx on public.lessons (class_id, month, week_number);

create table if not exists public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  class_id    uuid not null references public.classes (id) on delete cascade,
  month       text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  slip_url    text,              -- storage path inside the "bank-slips" bucket
  amount      numeric(10,2),
  bank_ref    text,
  admin_note  text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (student_id, class_id, month)
);
create index if not exists enrollments_status_idx on public.enrollments (status, created_at desc);

create table if not exists public.notices (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  tag         text not null default 'General' check (tag in ('General','Urgent','Exam Notice')),
  is_pinned   boolean not null default false,
  class_id    uuid references public.classes (id) on delete cascade,   -- null = everyone
  target_year int,                                                      -- null = all batches
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.exams (
  id               uuid primary key default gen_random_uuid(),
  class_id         uuid not null references public.classes (id) on delete cascade,
  title            text not null,
  description      text,
  exam_type        text not null default 'mcq' check (exam_type in ('mcq','structured')),
  duration_minutes int  not null default 60 check (duration_minutes between 1 and 600),
  total_questions  int  not null default 0,
  paper_pdf_url    text,         -- storage path inside "tute-pdfs" (structured papers)
  opens_at         timestamptz,
  closes_at        timestamptz,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id             uuid primary key default gen_random_uuid(),
  exam_id        uuid not null references public.exams (id) on delete cascade,
  question_text  text not null,
  options_json   jsonb not null check (jsonb_typeof(options_json) = 'array' and jsonb_array_length(options_json) between 2 and 6),
  correct_answer int  not null check (correct_answer >= 0),
  marks          numeric(6,2) not null default 1,
  explanation    text,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists public.exam_submissions (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.profiles (id) on delete cascade,
  exam_id           uuid not null references public.exams (id) on delete cascade,
  score             numeric(8,2),
  total_marks       numeric(8,2),
  answers_json      jsonb not null default '{}'::jsonb,
  answer_sheet_urls text[] not null default '{}',
  status            text not null default 'in_progress' check (status in ('in_progress','submitted','graded')),
  is_late           boolean not null default false,
  feedback          text,
  started_at        timestamptz not null default now(),
  submitted_at      timestamptz,
  graded_at         timestamptz,
  unique (student_id, exam_id)
);

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  product_type text not null default 'tute_book' check (product_type in ('tute_book','other')),
  price        numeric(10,2) not null default 0 check (price >= 0),
  image_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.profiles (id) on delete cascade,
  product_id       uuid not null references public.products (id) on delete restrict,
  quantity         int not null default 1 check (quantity between 1 and 20),
  amount           numeric(10,2),
  delivery_address text not null,
  status           text not null default 'pending' check (status in ('pending','approved','rejected','shipped')),
  slip_url         text,
  admin_note       text,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. Helper functions (SECURITY DEFINER → no RLS recursion)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_al_year()
returns int language sql stable security definer set search_path = public as $$
  select al_year from public.profiles where id = auth.uid();
$$;

-- Does the current user have access to a class (optionally a specific month)?
create or replace function public.has_class_access(p_class uuid, p_month text default null)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.is_admin()
    or exists (select 1 from public.classes c where c.id = p_class and c.is_free and c.is_active)
    or exists (
      select 1 from public.enrollments e
      where e.student_id = auth.uid() and e.class_id = p_class and e.status = 'approved'
        and (p_month is null or e.month = p_month)
    )
  );
$$;

-- Storage path rule for tute-pdfs: "<class_id>/<YYYY-MM>/<file>" or "<class_id>/<anything>/<file>"
create or replace function public.can_read_class_file(p_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  parts   text[] := string_to_array(p_name, '/');
  v_class uuid;
begin
  if public.is_admin() then return true; end if;
  begin
    v_class := parts[1]::uuid;
  exception when others then
    return false;
  end;
  if coalesce(array_length(parts, 1), 0) >= 3 and parts[2] ~ '^\d{4}-(0[1-9]|1[0-2])$' then
    return public.has_class_access(v_class, parts[2]);
  end if;
  return public.has_class_access(v_class, null);
end;
$$;

-- Student ID generator: HM-MATHS-<YEAR>-<4 digits>
create or replace function public.generate_student_id(p_year int)
returns text language plpgsql volatile set search_path = public as $$
declare
  candidate text;
  attempts  int := 0;
begin
  loop
    candidate := 'HM-MATHS-' || coalesce(p_year, extract(year from now())::int)::text || '-'
                 || lpad((1000 + floor(float8mul(random(), 9000)))::int::text, 4, '0');
    exit when not exists (select 1 from public.profiles where student_id = candidate);
    attempts := attempts + 1;
    if attempts > 500 then raise exception 'Could not allocate a unique student id'; end if;
  end loop;
  return candidate;
end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Triggers
-- -----------------------------------------------------------------------------
-- 3a. Create a profile automatically for every new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta     jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_admin  boolean := exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email));
  v_year   int := nullif(meta->>'al_year', '')::int;
begin
  insert into public.profiles (id, full_name, mobile, nic, al_year, town, school, district, role, student_id)
  values (
    new.id,
    coalesce(nullif(meta->>'full_name', ''), split_part(new.email, '@', 1)),
    nullif(meta->>'mobile', ''),
    nullif(upper(meta->>'nic'), ''),
    v_year,
    coalesce(nullif(meta->>'town', ''), 'Online'),
    nullif(meta->>'school', ''),
    nullif(meta->>'district', ''),
    case when v_admin then 'admin' else 'student' end,
    case when v_admin then null else public.generate_student_id(v_year) end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3b. Students may not change protected profile fields
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role       := old.role;
    new.student_id := old.student_id;
    new.mobile     := old.mobile;
    new.nic        := old.nic;
    new.al_year    := old.al_year;
    new.id         := old.id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

drop trigger if exists classes_updated_at on public.classes;
create trigger classes_updated_at before update on public.classes
  for each row execute function public.set_updated_at();

-- 3c. Enrollment guard: students can only (re)submit; admins review
create or replace function public.guard_enrollment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not public.is_admin() then
      new.status := 'pending'; new.reviewed_by := null; new.reviewed_at := null; new.admin_note := null;
      select fee into new.amount from public.classes where id = new.class_id;
    end if;
    return new;
  end if;
  -- UPDATE
  if auth.uid() is not null and not public.is_admin() then
    new.student_id := old.student_id; new.class_id := old.class_id; new.month := old.month;
    new.amount := old.amount; new.status := 'pending';
    new.reviewed_by := null; new.reviewed_at := null; new.admin_note := null;
    new.created_at := now();
  elsif new.status is distinct from old.status then
    new.reviewed_at := now();
    new.reviewed_by := coalesce(auth.uid(), old.reviewed_by);
  end if;
  return new;
end;
$$;
drop trigger if exists enrollments_guard on public.enrollments;
create trigger enrollments_guard before insert or update on public.enrollments
  for each row execute function public.guard_enrollment();

create or replace function public.guard_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'UPDATE' then
      raise exception 'Orders can only be changed by an admin';
    end if;
    new.status := 'pending'; new.admin_note := null; new.reviewed_at := null;
    select numeric_mul(price, new.quantity::numeric) into new.amount from public.products where id = new.product_id;
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before insert or update on public.orders
  for each row execute function public.guard_order();

-- 3d. Keep exams.total_questions in sync
create or replace function public.sync_exam_question_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_exam uuid := coalesce(new.exam_id, old.exam_id);
begin
  update public.exams set total_questions = (select count(1) from public.exam_questions where exam_id = v_exam)
  where id = v_exam;
  return null;
end;
$$;
drop trigger if exists exam_questions_count on public.exam_questions;
create trigger exam_questions_count after insert or delete on public.exam_questions
  for each row execute function public.sync_exam_question_count();

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.admin_emails     enable row level security;
alter table public.profiles         enable row level security;
alter table public.classes          enable row level security;
alter table public.lessons          enable row level security;
alter table public.enrollments      enable row level security;
alter table public.notices          enable row level security;
alter table public.exams            enable row level security;
alter table public.exam_questions   enable row level security;
alter table public.exam_submissions enable row level security;
alter table public.products         enable row level security;
alter table public.orders           enable row level security;

-- admin_emails: admins only
drop policy if exists "admin_emails admin" on public.admin_emails;
create policy "admin_emails admin" on public.admin_emails for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profiles
drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
drop policy if exists "profiles admin delete" on public.profiles;
create policy "profiles admin delete" on public.profiles for delete to authenticated
  using (public.is_admin());

-- classes: active classes are public (storefront); admins see/modify everything
drop policy if exists "classes public read" on public.classes;
create policy "classes public read" on public.classes for select to anon, authenticated
  using (is_active or public.is_admin());
drop policy if exists "classes admin write" on public.classes;
create policy "classes admin write" on public.classes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- lessons: only free classes or approved month (admins: all)
drop policy if exists "lessons read with access" on public.lessons;
create policy "lessons read with access" on public.lessons for select to authenticated
  using (public.has_class_access(class_id, month));
drop policy if exists "lessons admin write" on public.lessons;
create policy "lessons admin write" on public.lessons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- enrollments
drop policy if exists "enrollments read own or admin" on public.enrollments;
create policy "enrollments read own or admin" on public.enrollments for select to authenticated
  using (student_id = auth.uid() or public.is_admin());
drop policy if exists "enrollments student insert" on public.enrollments;
create policy "enrollments student insert" on public.enrollments for insert to authenticated
  with check (
    public.is_admin() or (
      student_id = auth.uid()
      and status = 'pending'
      and slip_url like auth.uid()::text || '/%'
      and exists (select 1 from public.classes c where c.id = class_id and c.is_active and not c.is_free)
    )
  );
drop policy if exists "enrollments student resubmit" on public.enrollments;
create policy "enrollments student resubmit" on public.enrollments for update to authenticated
  using (public.is_admin() or (student_id = auth.uid() and status in ('pending','rejected')))
  with check (public.is_admin() or (student_id = auth.uid() and slip_url like auth.uid()::text || '/%'));
drop policy if exists "enrollments admin delete" on public.enrollments;
create policy "enrollments admin delete" on public.enrollments for delete to authenticated
  using (public.is_admin());

-- notices: filtered by class access and batch
drop policy if exists "notices read" on public.notices;
create policy "notices read" on public.notices for select to authenticated
  using (
    public.is_admin() or (
      (class_id is null or public.has_class_access(class_id, null))
      and (target_year is null or target_year = public.my_al_year())
    )
  );
drop policy if exists "notices admin write" on public.notices;
create policy "notices admin write" on public.notices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- exams
drop policy if exists "exams read" on public.exams;
create policy "exams read" on public.exams for select to authenticated
  using (public.is_admin() or (is_published and public.has_class_access(class_id, null)));
drop policy if exists "exams admin write" on public.exams;
create policy "exams admin write" on public.exams for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- exam_questions: admins only (students receive questions WITHOUT answers via RPC)
drop policy if exists "exam_questions admin" on public.exam_questions;
create policy "exam_questions admin" on public.exam_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- exam_submissions: read own; writes go through RPCs; admins grade
drop policy if exists "submissions read own or admin" on public.exam_submissions;
create policy "submissions read own or admin" on public.exam_submissions for select to authenticated
  using (student_id = auth.uid() or public.is_admin());
drop policy if exists "submissions admin write" on public.exam_submissions;
create policy "submissions admin write" on public.exam_submissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- products & orders
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select to anon, authenticated
  using (is_active or public.is_admin());
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders read own or admin" on public.orders;
create policy "orders read own or admin" on public.orders for select to authenticated
  using (student_id = auth.uid() or public.is_admin());
drop policy if exists "orders student insert" on public.orders;
create policy "orders student insert" on public.orders for insert to authenticated
  with check (public.is_admin() or (student_id = auth.uid() and slip_url like auth.uid()::text || '/%'));
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders admin delete" on public.orders;
create policy "orders admin delete" on public.orders for delete to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. Exam RPCs (server-side timing + scoring; answers never leave the DB early)
-- -----------------------------------------------------------------------------
create or replace function public.start_exam(p_exam uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_exam public.exams%rowtype;
  v_sub  public.exam_submissions%rowtype;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  v_exam := (select e from public.exams e where e.id = p_exam);
  if v_exam.id is null or not (v_exam.is_published or public.is_admin()) then raise exception 'Exam not found'; end if;
  if not public.has_class_access(v_exam.class_id, null) then raise exception 'You do not have access to this exam'; end if;

  v_sub := (select s from public.exam_submissions s where s.exam_id = p_exam and s.student_id = auth.uid());
  if v_sub.id is null then
    if v_exam.opens_at is not null and now() < v_exam.opens_at then raise exception 'This exam has not opened yet'; end if;
    if v_exam.closes_at is not null and now() > v_exam.closes_at then raise exception 'This exam is closed'; end if;
    insert into public.exam_submissions (student_id, exam_id, status, started_at)
    values (auth.uid(), p_exam, 'in_progress', now())
    returning id into v_sub.id;
    v_sub := (select s from public.exam_submissions s where s.id = v_sub.id);
  end if;

  return jsonb_build_object(
    'submission_id', v_sub.id,
    'status',        v_sub.status,
    'started_at',    v_sub.started_at,
    'deadline',      v_sub.started_at + make_interval(mins => v_exam.duration_minutes),
    'server_now',    now(),
    'answers',       v_sub.answers_json,
    'questions', case when v_exam.exam_type = 'mcq' and v_sub.status = 'in_progress' then coalesce((
      select jsonb_agg(jsonb_build_object('id', q.id, 'question_text', q.question_text,
                                          'options', q.options_json, 'marks', q.marks)
                       order by q.sort_order, q.created_at)
      from public.exam_questions q where q.exam_id = p_exam), '[]'::jsonb) else '[]'::jsonb end
  );
end;
$$;

-- p_answers: {"<question_id>": <option_index>, ...}
create or replace function public.submit_mcq(p_exam uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_exam  public.exams%rowtype;
  v_sub   public.exam_submissions%rowtype;
  v_score numeric := 0;
  v_total numeric := 0;
  v_late  boolean;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  v_exam := (select e from public.exams e where e.id = p_exam and e.exam_type = 'mcq');
  if v_exam.id is null then raise exception 'Exam not found'; end if;
  v_sub := (select s from public.exam_submissions s
    where s.exam_id = p_exam and s.student_id = auth.uid() for update);
  if v_sub.id is null then raise exception 'Start the exam first'; end if;
  if v_sub.status <> 'in_progress' then
    return jsonb_build_object('score', v_sub.score, 'total', v_sub.total_marks, 'already_submitted', true);
  end if;

  select coalesce(sum(q.marks) filter (where (p_answers ->> q.id::text) ~ '^\d+$'
                                         and (p_answers ->> q.id::text)::int = q.correct_answer), 0),
         coalesce(sum(q.marks), 0)
    into v_score, v_total
  from public.exam_questions q where q.exam_id = p_exam;

  -- 2-minute grace window for network latency after the timer hits zero
  v_late := now() > v_sub.started_at + make_interval(mins => v_exam.duration_minutes) + interval '2 minutes';

  update public.exam_submissions
     set answers_json = coalesce(p_answers, '{}'::jsonb), score = v_score, total_marks = v_total,
         status = 'submitted', submitted_at = now(), is_late = v_late
   where id = v_sub.id;

  return jsonb_build_object('score', v_score, 'total', v_total, 'is_late', v_late);
end;
$$;

create or replace function public.submit_structured(p_exam uuid, p_paths text[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_exam public.exams%rowtype;
  p text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  v_exam := (select e from public.exams e where e.id = p_exam and e.exam_type = 'structured');
  if v_exam.id is null or not v_exam.is_published then raise exception 'Exam not found'; end if;
  if not public.has_class_access(v_exam.class_id, null) then raise exception 'You do not have access to this exam'; end if;
  if v_exam.closes_at is not null and now() > v_exam.closes_at then raise exception 'Submissions are closed'; end if;
  if coalesce(array_length(p_paths, 1), 0) = 0 then raise exception 'Upload at least one answer sheet'; end if;
  foreach p in array p_paths loop
    if p not like auth.uid()::text || '/%' then raise exception 'Invalid file path'; end if;
  end loop;

  insert into public.exam_submissions (student_id, exam_id, answer_sheet_urls, status, submitted_at)
  values (auth.uid(), p_exam, p_paths, 'submitted', now())
  on conflict (student_id, exam_id) do update
     set answer_sheet_urls = excluded.answer_sheet_urls, submitted_at = now(), status = 'submitted'
   where public.exam_submissions.status <> 'graded';
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.get_exam_review(p_exam uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_sub public.exam_submissions%rowtype;
begin
  v_sub := (select s from public.exam_submissions s where s.exam_id = p_exam and s.student_id = auth.uid());
  if v_sub.id is null or v_sub.status = 'in_progress' then raise exception 'Submit the exam to see the review'; end if;
  return jsonb_build_object(
    'score', v_sub.score, 'total', v_sub.total_marks, 'submitted_at', v_sub.submitted_at,
    'is_late', v_sub.is_late, 'feedback', v_sub.feedback, 'status', v_sub.status,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id, 'question_text', q.question_text, 'options', q.options_json, 'marks', q.marks,
        'correct_answer', q.correct_answer, 'explanation', q.explanation,
        'your_answer', case when (v_sub.answers_json ->> q.id::text) ~ '^\d+$'
                            then (v_sub.answers_json ->> q.id::text)::int end)
        order by q.sort_order, q.created_at)
      from public.exam_questions q where q.exam_id = p_exam), '[]'::jsonb)
  );
end;
$$;

create or replace function public.get_leaderboard(p_exam uuid)
returns table (rank bigint, full_name text, student_id text, town text, score numeric, total_marks numeric, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
declare v_class uuid;
begin
  select class_id into v_class from public.exams where id = p_exam;
  if v_class is null or not public.has_class_access(v_class, null) then raise exception 'No access'; end if;
  return query
    select dense_rank() over (order by s.score desc) as rank,
           p.full_name, p.student_id, p.town, s.score, s.total_marks, (s.student_id = auth.uid())
    from public.exam_submissions s
    join public.profiles p on p.id = s.student_id
    where s.exam_id = p_exam and s.status in ('submitted','graded') and s.score is not null
    order by s.score desc, s.submitted_at asc
    limit 200;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Grants (RLS still applies)
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.classes, public.products to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on function public.generate_student_id(int) from public, anon, authenticated;
grant execute on function public.is_admin(), public.my_al_year(), public.has_class_access(uuid, text),
  public.can_read_class_file(text) to anon, authenticated;
grant execute on function public.start_exam(uuid), public.submit_mcq(uuid, jsonb),
  public.submit_structured(uuid, text[]), public.get_exam_review(uuid), public.get_leaderboard(uuid)
  to authenticated;

-- -----------------------------------------------------------------------------
-- 7. Storage buckets + policies
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('bank-slips',    'bank-slips',    false, 5242880,  array['image/jpeg','image/png','image/webp','application/pdf']),
  ('tute-pdfs',     'tute-pdfs',     false, 52428800, array['application/pdf']),
  ('answer-sheets', 'answer-sheets', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('class-banners', 'class-banners', true,  3145728,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- bank-slips & answer-sheets: "<user_id>/<file>" — owner + admin
drop policy if exists "own uploads insert" on storage.objects;
create policy "own uploads insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('bank-slips','answer-sheets') and split_part(name, '/', 1) = auth.uid()::text);
drop policy if exists "own uploads read" on storage.objects;
create policy "own uploads read" on storage.objects for select to authenticated
  using (bucket_id in ('bank-slips','answer-sheets') and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin()));
drop policy if exists "own uploads admin delete" on storage.objects;
create policy "own uploads admin delete" on storage.objects for delete to authenticated
  using (bucket_id in ('bank-slips','answer-sheets') and public.is_admin());

-- tute-pdfs: "<class_id>/<YYYY-MM>/<file>" — readable with class access, admin writes
drop policy if exists "tutes read with access" on storage.objects;
create policy "tutes read with access" on storage.objects for select to authenticated
  using (bucket_id = 'tute-pdfs' and public.can_read_class_file(name));

-- admin write for tute-pdfs and class-banners
drop policy if exists "admin content insert" on storage.objects;
create policy "admin content insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('tute-pdfs','class-banners') and public.is_admin());
drop policy if exists "admin content update" on storage.objects;
create policy "admin content update" on storage.objects for update to authenticated
  using (bucket_id in ('tute-pdfs','class-banners') and public.is_admin());
drop policy if exists "admin content delete" on storage.objects;
create policy "admin content delete" on storage.objects for delete to authenticated
  using (bucket_id in ('tute-pdfs','class-banners') and public.is_admin());
drop policy if exists "banners public read" on storage.objects;
create policy "banners public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'class-banners');

-- -----------------------------------------------------------------------------
-- 8. Realtime for notices
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notices') then
    execute 'alter publication supabase_realtime add table public.notices';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 9. Backfill: profiles for users created before this script ran
-- -----------------------------------------------------------------------------
insert into public.profiles (id, full_name, role, student_id, mobile, nic, al_year, town)
select u.id,
       coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
       case when exists (select 1 from public.admin_emails a where lower(a.email) = lower(u.email)) then 'admin' else 'student' end,
       case when exists (select 1 from public.admin_emails a where lower(a.email) = lower(u.email)) then null
            else public.generate_student_id(nullif(u.raw_user_meta_data->>'al_year', '')::int) end,
       nullif(u.raw_user_meta_data->>'mobile', ''),
       nullif(upper(u.raw_user_meta_data->>'nic'), ''),
       nullif(u.raw_user_meta_data->>'al_year', '')::int,
       coalesce(nullif(u.raw_user_meta_data->>'town', ''), 'Online')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

update public.profiles p set role = 'admin', student_id = null
from auth.users u
where u.id = p.id and lower(u.email) in (select lower(email) from public.admin_emails);


-- ════════════════════════════════════════════════════════════════════════════
-- HM Maths LMS · 0002 — Class schedules, extra classes & private live links
--
-- Run AFTER 0001_init.sql (Supabase → SQL Editor → New query → paste → Run).
-- Safe to re-run.
--
-- What it does
--   1. classes  + weekly timetable: schedule_days (0=Sun … 6=Sat), start_time, duration_minutes
--   2. lessons  + session_type ('regular' | 'extra'), duration_minutes, is_cancelled
--   3. NEW class_live_defaults  – the class's usual live link (YouTube Live / Zoom / Meet), admin-only
--   4. NEW lesson_live_links    – each session's live link. Students can read it ONLY while the
--                                 join window is open (20 min before start → end + 30 min) and
--                                 only if they have access to that class month. Existing
--                                 lessons.live_url values are moved here and the column is dropped,
--                                 so the link can no longer be read early through the API.
--   5. generate_class_sessions(class, month, title) – creates every weekly session of a month
--                                 from the timetable (skips days that already have a session).
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Weekly timetable on classes ─────────────────────────────────────────
alter table public.classes add column if not exists schedule_days    smallint[] not null default '{}';
alter table public.classes add column if not exists start_time       time;
alter table public.classes add column if not exists duration_minutes int not null default 120;

alter table public.classes drop constraint if exists classes_schedule_days_check;
alter table public.classes add  constraint classes_schedule_days_check
  check (schedule_days <@ array[0,1,2,3,4,5,6]::smallint[]);
alter table public.classes drop constraint if exists classes_duration_check;
alter table public.classes add  constraint classes_duration_check
  check (duration_minutes between 15 and 600);

-- ─── 2. Session details on lessons ──────────────────────────────────────────
alter table public.lessons add column if not exists session_type     text not null default 'regular';
alter table public.lessons add column if not exists duration_minutes int;
alter table public.lessons add column if not exists is_cancelled     boolean not null default false;

alter table public.lessons drop constraint if exists lessons_session_type_check;
alter table public.lessons add  constraint lessons_session_type_check
  check (session_type in ('regular', 'extra'));
alter table public.lessons drop constraint if exists lessons_duration_check;
alter table public.lessons add  constraint lessons_duration_check
  check (duration_minutes is null or duration_minutes between 15 and 600);

create index if not exists lessons_class_live_idx on public.lessons (class_id, live_start_time);

-- ─── 3. Default live link per class (admin only) ────────────────────────────
create table if not exists public.class_live_defaults (
  class_id   uuid primary key references public.classes (id) on delete cascade,
  live_url   text not null check (live_url ~ '^https://'),
  updated_at timestamptz not null default now()
);
alter table public.class_live_defaults enable row level security;
drop policy if exists "class_live_defaults admin" on public.class_live_defaults;
create policy "class_live_defaults admin" on public.class_live_defaults for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── 4. Private live link per session ───────────────────────────────────────
create table if not exists public.lesson_live_links (
  lesson_id  uuid primary key references public.lessons (id) on delete cascade,
  live_url   text not null check (live_url ~ '^https://'),
  updated_at timestamptz not null default now()
);
alter table public.lesson_live_links enable row level security;

-- Is the join window of this session open for the current user right now?
create or replace function public.live_window_open(p_lesson uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.lessons l
    join public.classes c on c.id = l.class_id
    where l.id = p_lesson
      and not l.is_cancelled
      and l.live_start_time is not null
      and now() >= l.live_start_time - interval '20 minutes'
      and now() <  l.live_start_time
                   + make_interval(mins => coalesce(l.duration_minutes, c.duration_minutes, 120) + 30)
      and public.has_class_access(l.class_id, l.month)
  );
$$;

drop policy if exists "lesson_live_links admin" on public.lesson_live_links;
create policy "lesson_live_links admin" on public.lesson_live_links for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "lesson_live_links read when open" on public.lesson_live_links;
create policy "lesson_live_links read when open" on public.lesson_live_links for select to authenticated
  using (public.live_window_open(lesson_id));

-- Move existing links out of lessons, then drop the readable column.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'lessons' and column_name = 'live_url') then
    insert into public.lesson_live_links (lesson_id, live_url)
    select id, live_url from public.lessons where live_url ~ '^https://'
    on conflict (lesson_id) do nothing;
    alter table public.lessons drop column live_url;
  end if;
end $$;

-- ─── 5. Generate a month of weekly sessions from the timetable ──────────────
create or replace function public.generate_class_sessions(p_class uuid, p_month text, p_title text default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  c       public.classes%rowtype;
  v_link  text;
  v_first date;
  d       date;
  v_start timestamptz;
  v_id    uuid;
  v_count int := 0;
begin
  if not public.is_admin() then raise exception 'Only admins can generate sessions'; end if;
  if p_month !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Invalid month'; end if;
  c := (select cl from public.classes cl where cl.id = p_class);
  if c.id is null then raise exception 'Class not found'; end if;
  if coalesce(array_length(c.schedule_days, 1), 0) = 0 or c.start_time is null then
    raise exception 'Set the class days and start time first';
  end if;
  select live_url into v_link from public.class_live_defaults where class_id = p_class;

  v_first := to_date(p_month || '-01', 'YYYY-MM-DD');
  for d in select gs::date from generate_series(v_first, (v_first + interval '1 month - 1 day')::date, interval '1 day') gs loop
    continue when not (extract(dow from d)::smallint = any (c.schedule_days));
    -- Sri Lanka is UTC+05:30 all year (no DST)
    v_start := ((d + c.start_time) - interval '5 hours 30 minutes') at time zone 'UTC';
    continue when exists (
      select 1 from public.lessons l
      where l.class_id = p_class and l.live_start_time is not null
        and ((l.live_start_time at time zone 'UTC') + interval '5 hours 30 minutes')::date = d
    );
    insert into public.lessons (class_id, month, week_number, title, live_start_time, session_type, sort_order)
    values (p_class, p_month, least(6, ceil(extract(day from d) / 7.0)::int),
            coalesce(nullif(trim(p_title), ''), 'Live class') || ' · ' || to_char(d, 'Dy DD Mon'),
            v_start, 'regular', extract(day from d)::int)
    returning id into v_id;
    if v_link is not null then
      insert into public.lesson_live_links (lesson_id, live_url) values (v_id, v_link);
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ─── Grants ─────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.class_live_defaults, public.lesson_live_links to authenticated;
revoke all on function public.generate_class_sessions(uuid, text, text) from public, anon;
grant execute on function public.generate_class_sessions(uuid, text, text) to authenticated;
grant execute on function public.live_window_open(uuid) to authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- HM Maths LMS · 0003 — Delivery address, paper marks, leaderboards & streaks
--
-- Run AFTER 0001_init.sql and 0002_class_schedule.sql
-- (Supabase → SQL Editor → New query → paste → Run). Safe to re-run.
--
-- What it does
--   1. profiles + address, city, postal_code (tute delivery). Filled at registration.
--   2. NEW papers         – weekly / monthly / model papers (name, date, total marks, optional
--                           question paper + marking scheme files, batch / class, visibility).
--   3. NEW paper_marks    – one mark per student per paper (admin enters; students read their own).
--   4. NEW student_activity – one row per day a student opens the portal (daily study streak).
--   5. RPCs  get_paper_leaderboard · get_overall_leaderboard · get_my_paper_stats · log_activity
--            (rank by paper, by center e.g. Panadura, and all-island; weekly-paper streaks).
--   6. Private storage bucket "papers" (admin uploads; students download published papers).
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Delivery address on profiles ────────────────────────────────────────
alter table public.profiles add column if not exists address     text;
alter table public.profiles add column if not exists city        text;
alter table public.profiles add column if not exists postal_code text;
alter table public.profiles drop constraint if exists profiles_address_len;
alter table public.profiles add  constraint profiles_address_len
  check (char_length(coalesce(address, '')) <= 300 and char_length(coalesce(city, '')) <= 80
         and char_length(coalesce(postal_code, '')) <= 12);

-- New sign-ups copy the address from the registration form.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta     jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_admin  boolean := exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email));
  v_year   int := nullif(meta->>'al_year', '')::int;
begin
  insert into public.profiles (id, full_name, mobile, nic, al_year, town, school, district, address, city, postal_code, role, student_id)
  values (
    new.id,
    coalesce(nullif(meta->>'full_name', ''), split_part(new.email, '@', 1)),
    nullif(meta->>'mobile', ''),
    nullif(upper(meta->>'nic'), ''),
    v_year,
    coalesce(nullif(meta->>'town', ''), 'Online'),
    nullif(meta->>'school', ''),
    nullif(meta->>'district', ''),
    nullif(left(meta->>'address', 300), ''),
    nullif(left(meta->>'city', 80), ''),
    nullif(left(meta->>'postal_code', 12), ''),
    case when v_admin then 'admin' else 'student' end,
    case when v_admin then null else public.generate_student_id(v_year) end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ─── 2. Papers ──────────────────────────────────────────────────────────────
create table if not exists public.papers (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 2 and 160),
  description   text check (char_length(coalesce(description, '')) <= 2000),
  paper_type    text not null default 'weekly' check (paper_type in ('weekly', 'monthly', 'model', 'term')),
  class_id      uuid references public.classes (id) on delete set null,
  al_year       int  check (al_year between 2020 and 2040),
  paper_date    date not null default ((now() at time zone 'Asia/Colombo')::date),
  total_marks   numeric(6,2) not null default 100 check (total_marks > 0 and total_marks <= 1000),
  paper_path    text,   -- object path in the "papers" bucket (question paper)
  answers_path  text,   -- object path in the "papers" bucket (marking scheme / answers)
  is_published  boolean not null default true,  -- visible to students (paper, marks, rankings)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists papers_date_idx on public.papers (paper_date desc);

drop trigger if exists papers_updated_at on public.papers;
create trigger papers_updated_at before update on public.papers
  for each row execute function public.set_updated_at();

create table if not exists public.paper_marks (
  paper_id    uuid not null references public.papers (id) on delete cascade,
  student_id  uuid not null references public.profiles (id) on delete cascade,
  marks       numeric(6,2) not null check (marks >= 0),
  remark      text check (char_length(coalesce(remark, '')) <= 200),
  entered_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (paper_id, student_id)
);
create index if not exists paper_marks_student_idx on public.paper_marks (student_id);

-- Marks can never exceed the paper's total.
create or replace function public.check_paper_marks()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_total numeric;
begin
  select total_marks into v_total from public.papers where id = new.paper_id;
  if v_total is null then raise exception 'Paper not found'; end if;
  if new.marks > v_total then raise exception 'Marks (%) are more than the paper total (%)', new.marks, v_total; end if;
  if tg_op = 'UPDATE' then new.updated_at := now(); end if;
  return new;
end;
$$;
drop trigger if exists paper_marks_check on public.paper_marks;
create trigger paper_marks_check before insert or update on public.paper_marks
  for each row execute function public.check_paper_marks();

-- ─── 3. Daily activity (study streak) ───────────────────────────────────────
create table if not exists public.student_activity (
  student_id uuid not null references public.profiles (id) on delete cascade,
  day        date not null,
  primary key (student_id, day)
);

-- ─── 4. RLS ─────────────────────────────────────────────────────────────────
alter table public.papers           enable row level security;
alter table public.paper_marks      enable row level security;
alter table public.student_activity enable row level security;

drop policy if exists "papers read published" on public.papers;
create policy "papers read published" on public.papers for select to authenticated
  using (is_published or public.is_admin());
drop policy if exists "papers admin write" on public.papers;
create policy "papers admin write" on public.papers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "paper_marks read own" on public.paper_marks;
create policy "paper_marks read own" on public.paper_marks for select to authenticated
  using (public.is_admin() or (student_id = auth.uid()
         and exists (select 1 from public.papers p where p.id = paper_id and p.is_published)));
drop policy if exists "paper_marks admin write" on public.paper_marks;
create policy "paper_marks admin write" on public.paper_marks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "activity read own" on public.student_activity;
create policy "activity read own" on public.student_activity for select to authenticated
  using (student_id = auth.uid() or public.is_admin());
-- (rows are written only through log_activity())

-- ─── 5. Functions ───────────────────────────────────────────────────────────
-- Leaderboard for one paper. p_town = null → all-island, else that center (e.g. 'Panadura').
-- Returns the top p_limit rows plus the caller's own row (is_me) if they are further down.
create or replace function public.get_paper_leaderboard(p_paper uuid, p_town text default null, p_limit int default 100)
returns table (rank bigint, student_code text, full_name text, town text, school text,
               marks numeric, total_marks numeric, pct numeric, is_me boolean, entrants bigint)
language sql stable security definer set search_path = public as $$
  with p as (
    select id, total_marks from public.papers
    where id = p_paper and (is_published or public.is_admin()) and auth.uid() is not null
  ), r as (
    select m.student_id as uid, pr.student_id as code, pr.full_name, pr.town, pr.school, m.marks, p.total_marks,
           round(m.marks / (p.total_marks / 100.0), 1) as pct,
           rank() over (order by m.marks desc) as rk,
           count(1) over () as n
    from public.paper_marks m
    join p on p.id = m.paper_id
    join public.profiles pr on pr.id = m.student_id
    where p_town is null or pr.town = p_town
  )
  select rk, code, full_name, town, school, marks, total_marks, pct, uid = auth.uid(), n
  from r
  where rk <= greatest(1, least(coalesce(p_limit, 100), 500)) or uid = auth.uid()
  order by rk, full_name;
$$;

-- Season leaderboard: points = sum of the % scored in every published paper in the range.
-- Filters: center (p_town), A/L batch (p_year), paper type (p_type, e.g. 'weekly'), date range.
create or replace function public.get_overall_leaderboard(
  p_town text default null, p_year int default null, p_type text default null,
  p_from date default null, p_to date default null, p_limit int default 100)
returns table (rank bigint, student_code text, full_name text, town text, school text,
               points numeric, papers bigint, avg_pct numeric, best_pct numeric, is_me boolean, entrants bigint)
language sql stable security definer set search_path = public as $$
  with s as (
    select m.student_id as uid,
           sum(m.marks / (p.total_marks / 100.0)) as pts,
           count(1) as n_papers,
           avg(m.marks / (p.total_marks / 100.0)) as avgp,
           max(m.marks / (p.total_marks / 100.0)) as bestp
    from public.paper_marks m
    join public.papers p on p.id = m.paper_id
    join public.profiles pr on pr.id = m.student_id
    where auth.uid() is not null
      and (p.is_published or public.is_admin())
      and (p_town is null or pr.town = p_town)
      and (p_year is null or pr.al_year = p_year)
      and (p_type is null or p.paper_type = p_type)
      and (p_from is null or p.paper_date >= p_from)
      and (p_to   is null or p.paper_date <= p_to)
    group by m.student_id
  ), r as (
    select s.uid, s.pts, s.n_papers, s.avgp, s.bestp, rank() over (order by s.pts desc, s.avgp desc) as rk, count(1) over () as n from s
  )
  select r.rk, pr.student_id, pr.full_name, pr.town, pr.school,
         round(r.pts, 1), r.n_papers, round(r.avgp, 1), round(r.bestp, 1), r.uid = auth.uid(), r.n
  from r join public.profiles pr on pr.id = r.uid
  where r.rk <= greatest(1, least(coalesce(p_limit, 100), 500)) or r.uid = auth.uid()
  order by r.rk, pr.full_name;
$$;

-- Weekly-paper streak + summary for one student (defaults to the caller; admins may pass anyone).
create or replace function public.get_my_paper_stats(p_student uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_uid   uuid := coalesce(p_student, auth.uid());
  v_year  int;
  v_town  text;
  v_first date;
  v_cur   int := 0;
  v_best  int := 0;
  v_run   int := 0;
  rec     record;
  v_last  jsonb;
  v_summary jsonb;
begin
  if v_uid is null or (v_uid <> auth.uid() and not public.is_admin()) then raise exception 'No access'; end if;
  select al_year, town into v_year, v_town from public.profiles where id = v_uid;

  select jsonb_build_object(
           'papers', count(1),
           'avg_pct', round(coalesce(avg(m.marks / (p.total_marks / 100.0)), 0), 1),
           'best_pct', round(coalesce(max(m.marks / (p.total_marks / 100.0)), 0), 1),
           'points', round(coalesce(sum(m.marks / (p.total_marks / 100.0)), 0), 1),
           'full_marks', count(1) filter (where m.marks = p.total_marks)),
         min(p.paper_date)
    into v_summary, v_first
  from public.paper_marks m join public.papers p on p.id = m.paper_id
  where m.student_id = v_uid and p.is_published;

  -- Streak over the weekly papers of the student's batch that already have marks entered,
  -- starting from the first paper the student sat.
  if v_first is not null then
    for rec in
      select p.id, exists (select 1 from public.paper_marks x where x.paper_id = p.id and x.student_id = v_uid) as sat
      from public.papers p
      where p.is_published and p.paper_type = 'weekly' and p.paper_date >= v_first
        and (p.al_year is null or v_year is null or p.al_year = v_year
             or exists (select 1 from public.paper_marks z where z.paper_id = p.id and z.student_id = v_uid))
        and exists (select 1 from public.paper_marks y where y.paper_id = p.id)
      order by p.paper_date, p.created_at
    loop
      if rec.sat then v_run := v_run + 1; else v_run := 0; end if;
      v_best := greatest(v_best, v_run);
    end loop;
    v_cur := v_run;
  end if;

  -- Most recent paper the student sat, with island + center rank.
  select jsonb_build_object(
           'paper_id', p.id, 'title', p.title, 'paper_date', p.paper_date, 'paper_type', p.paper_type,
           'marks', m.marks, 'total_marks', p.total_marks,
           'pct', round(m.marks / (p.total_marks / 100.0), 1),
           'rank_island', (select count(1) + 1 from public.paper_marks o where o.paper_id = p.id and o.marks > m.marks),
           'entrants_island', (select count(1) from public.paper_marks o where o.paper_id = p.id),
           'rank_town', (select count(1) + 1 from public.paper_marks o join public.profiles op on op.id = o.student_id
                         where o.paper_id = p.id and op.town = v_town and o.marks > m.marks),
           'entrants_town', (select count(1) from public.paper_marks o join public.profiles op on op.id = o.student_id
                             where o.paper_id = p.id and op.town = v_town))
    into v_last
  from public.paper_marks m join public.papers p on p.id = m.paper_id
  where m.student_id = v_uid and p.is_published
  order by p.paper_date desc, p.created_at desc
  limit 1;

  return coalesce(v_summary, '{}'::jsonb)
         || jsonb_build_object('streak', v_cur, 'best_streak', v_best, 'town', v_town, 'al_year', v_year, 'last', v_last);
end;
$$;

-- Records today's visit (Sri Lanka date) and returns the daily study streak.
create or replace function public.log_activity()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Colombo')::date;
  v_cur   int := 0;
  v_best  int := 0;
  v_week  jsonb;
begin
  if v_uid is null then return jsonb_build_object('current', 0, 'best', 0, 'week', '[]'::jsonb); end if;
  if exists (select 1 from public.profiles where id = v_uid) then
    insert into public.student_activity (student_id, day) values (v_uid, v_today) on conflict do nothing;
  end if;

  with d as (
    select day, day - (row_number() over (order by day))::int as grp
    from public.student_activity where student_id = v_uid
  ), g as (
    select max(day) as last_day, count(1) as n from d group by grp
  )
  select coalesce(max(n) filter (where last_day >= v_today - 1), 0), coalesce(max(n), 0)
    into v_cur, v_best from g;

  select coalesce(jsonb_agg(exists (select 1 from public.student_activity a where a.student_id = v_uid and a.day = d.day) order by d.day), '[]'::jsonb)
    into v_week
  from generate_series(v_today - 6, v_today, interval '1 day') as d(day);

  return jsonb_build_object('current', v_cur, 'best', v_best, 'week', v_week);
end;
$$;

-- Storage rule for the "papers" bucket: "<paper_id>/<file>".
create or replace function public.can_read_paper_file(p_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_paper uuid; v_class uuid; v_pub boolean;
begin
  if public.is_admin() then return true; end if;
  if auth.uid() is null then return false; end if;
  begin
    v_paper := split_part(p_name, '/', 1)::uuid;
  exception when others then
    return false;
  end;
  select class_id, is_published into v_class, v_pub from public.papers where id = v_paper;
  if not coalesce(v_pub, false) then return false; end if;
  return v_class is null
      or public.has_class_access(v_class, null)
      or exists (select 1 from public.paper_marks m where m.paper_id = v_paper and m.student_id = auth.uid());
end;
$$;

-- ─── 6. Storage bucket "papers" ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('papers', 'papers', false, 26214400, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "papers files read" on storage.objects;
create policy "papers files read" on storage.objects for select to authenticated
  using (bucket_id = 'papers' and public.can_read_paper_file(name));
drop policy if exists "papers files admin insert" on storage.objects;
create policy "papers files admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'papers' and public.is_admin());
drop policy if exists "papers files admin update" on storage.objects;
create policy "papers files admin update" on storage.objects for update to authenticated
  using (bucket_id = 'papers' and public.is_admin());
drop policy if exists "papers files admin delete" on storage.objects;
create policy "papers files admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'papers' and public.is_admin());

-- ─── 7. Grants ──────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.papers, public.paper_marks to authenticated;
grant select on public.student_activity to authenticated;
revoke insert, update, delete on public.student_activity from authenticated;
revoke all on function public.get_paper_leaderboard(uuid, text, int) from public, anon;
revoke all on function public.get_overall_leaderboard(text, int, text, date, date, int) from public, anon;
revoke all on function public.get_my_paper_stats(uuid) from public, anon;
revoke all on function public.log_activity() from public, anon;
grant execute on function public.get_paper_leaderboard(uuid, text, int),
  public.get_overall_leaderboard(text, int, text, date, date, int),
  public.get_my_paper_stats(uuid), public.log_activity(), public.can_read_paper_file(text)
  to authenticated;


-- ─── PART 3: SEED LOGINS ──────────────────────────────────────────────────────
-- Change the two passwords below before running if you like (keep the quotes).
do $$
declare
  v_admin_email text := 'admin@nativelaunch.xyz';
  v_admin_pw    text := 'CHANGE-ME-admin-password';
  v_mobile      text := '0771234567';
  v_student_pw  text := 'CHANGE-ME-student-password';
  v_admin   uuid := gen_random_uuid();
  v_student uuid := gen_random_uuid();
  v_semail  text;
begin
  v_semail := v_mobile || '@students.hmmaths.lk';
  insert into public.admin_emails (email) values (v_admin_email) on conflict do nothing;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values
    ('00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated', v_admin_email,
     extensions.crypt(v_admin_pw, extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     jsonb_build_object('full_name', 'Hasitha Madusanka'),
     now(), now(), '', '', '', '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_student, 'authenticated', 'authenticated', v_semail,
     extensions.crypt(v_student_pw, extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     jsonb_build_object('full_name', 'Test Student', 'mobile', v_mobile, 'nic', '200512345678',
       'al_year', '2026', 'town', 'Panadura', 'school', 'Test College', 'district', 'Kalutara',
       'address', '12 Galle Road', 'city', 'Panadura', 'postal_code', '12500'),
     now(), now(), '', '', '', '', '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), v_admin, v_admin::text,
     jsonb_build_object('sub', v_admin::text, 'email', v_admin_email, 'email_verified', true), 'email', now(), now(), now()),
    (gen_random_uuid(), v_student, v_student::text,
     jsonb_build_object('sub', v_student::text, 'email', v_semail, 'email_verified', true), 'email', now(), now(), now());

  -- Profiles are created by the signup trigger; make sure roles are right.
  update public.profiles set role = 'admin', student_id = null, town = 'Online' where id = v_admin;
  update public.profiles set role = 'student' where id = v_student;
end $$;

-- Check: should list 1 admin + 1 student
select p.full_name, p.role, p.student_id, p.mobile, u.email
from public.profiles p join auth.users u on u.id = p.id order by p.role;
