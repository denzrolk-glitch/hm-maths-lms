-- HM Maths LMS: ONE-SHOT UPGRADE = 0002_class_schedule + 0003_papers_leaderboards
-- Paste this whole file into the Supabase SQL Editor and click Run. Safe to re-run.

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
