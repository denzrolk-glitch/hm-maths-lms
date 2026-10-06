// Offline test of supabase/migrations/0001_init.sql using PGlite (real Postgres in WASM).
// Stubs the minimum of Supabase's auth + storage schemas, then exercises RLS as real roles.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const db = new PGlite();
const sql = readFileSync(new URL("../supabase/migrations/0001_init.sql", import.meta.url), "utf8");

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;
  grant usage on schema auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant select, insert, update, delete on storage.objects to authenticated;
  grant select on storage.objects to anon;
`);
await db.exec(sql);
await db.exec(sql); // idempotency check: must be re-runnable
console.log("✓ migration applied twice (idempotent)");

const ADMIN = "00000000-0000-0000-0000-00000000000a";
const S1 = "00000000-0000-0000-0000-000000000001";
const S2 = "00000000-0000-0000-0000-000000000002";

async function as(uid, fn) {
  await db.exec(uid ? `set role authenticated; set request.jwt.claim.sub = '${uid}';`
                    : `set role anon; set request.jwt.claim.sub = '';`);
  try { return await fn(); } finally { await db.exec(`reset role; set request.jwt.claim.sub = '';`); }
}
const q = async (text, params) => (await db.query(text, params)).rows;
async function fails(promise, label) {
  try { await promise; } catch { console.log(`✓ blocked: ${label}`); return; }
  throw new Error(`expected failure: ${label}`);
}

// ---- signup trigger
await q(`insert into auth.users values ($1,'admin@nativelaunch.xyz','{"full_name":"Hasitha Madusanka"}')`, [ADMIN]);
await q(`insert into auth.users values ($1,'0771234567@students.hmmaths.lk',$2)`, [S1, JSON.stringify({ full_name: "Kasun Perera", mobile: "0771234567", nic: "200512345678", al_year: "2027", town: "Panadura", school: "Royal College", district: "Kalutara" })]);
await q(`insert into auth.users values ($1,'0711111111@students.hmmaths.lk',$2)`, [S2, JSON.stringify({ full_name: "Nimali Silva", mobile: "0711111111", nic: "200698765432v", al_year: "2026", town: "Horana" })]);
const profs = await q(`select id, role, student_id, nic from public.profiles order by id`);
assert.equal(profs.find(p => p.id === ADMIN).role, "admin");
assert.equal(profs.find(p => p.id === ADMIN).student_id, null);
assert.match(profs.find(p => p.id === S1).student_id, /^HM-MATHS-2027-\d{4}$/);
assert.equal(profs.find(p => p.id === S2).nic, "200698765432V");
console.log("✓ profiles + student IDs:", profs.map(p => p.student_id ?? "admin").join(", "));

// ---- duplicate mobile rejected
await fails(q(`insert into auth.users values (gen_random_uuid(),'x@y.z','{"full_name":"Dup","mobile":"0771234567"}')`), "duplicate mobile number");

// ---- privilege escalation blocked
await as(S1, () => q(`update public.profiles set role='admin', student_id='HACK', full_name='Kasun P.' where id=$1`, [S1]));
const [s1] = await q(`select role, student_id, full_name from public.profiles where id=$1`, [S1]);
assert.equal(s1.role, "student"); assert.notEqual(s1.student_id, "HACK"); assert.equal(s1.full_name, "Kasun P.");
console.log("✓ student cannot self-promote (name edit allowed)");
assert.equal((await as(S1, () => q(`select * from public.profiles`))).length, 1);
console.log("✓ student sees only own profile");

// ---- admin creates content
const [paid] = await as(ADMIN, () => q(`insert into public.classes (title, class_type, target_year, fee, town) values ('2027 A/L Theory - Panadura','Theory',2027,3000,'Panadura') returning id`));
const [free] = await as(ADMIN, () => q(`insert into public.classes (title, class_type, fee, is_free) values ('Free Seminar','Free Seminar',0,true) returning id`));
await as(ADMIN, () => q(`insert into public.lessons (class_id, month, week_number, title, youtube_url) values ($1,'2026-10',1,'Differentiation','https://youtu.be/abc'),($1,'2026-11',1,'Integration','https://youtu.be/def'),($2,'2026-10',1,'Orientation','https://youtu.be/free')`, [paid.id, free.id]));
await fails(as(S1, () => q(`insert into public.classes (title) values ('hack')`)), "student creating a class");
console.log("✓ admin CRUD on classes/lessons");

// ---- anon storefront
assert.equal((await as(null, () => q(`select * from public.classes`))).length, 2);
await fails(as(null, () => q(`select * from public.lessons`)), "anon reading lessons");
console.log("✓ anon can browse classes");

// ---- access before payment
let l = await as(S1, () => q(`select title from public.lessons`));
assert.deepEqual(l.map(x => x.title), ["Orientation"]);
console.log("✓ unpaid student sees only Free Zone lessons");

// ---- enrollment flow
await fails(as(S1, () => q(`insert into public.enrollments (student_id,class_id,month,slip_url) values ($1,$2,'2026-10','someoneelse/x.jpg')`, [S1, paid.id])), "slip path outside own folder");
await fails(as(S1, () => q(`insert into public.enrollments (student_id,class_id,month,slip_url) values ($1,$2,'2026-10',$3)`, [S2, paid.id, `${S1}/x.jpg`])), "enrolling another student");
const [en] = await as(S1, () => q(`insert into public.enrollments (student_id,class_id,month,slip_url,status) values ($1,$2,'2026-10',$3,'pending') returning id, status, amount`, [S1, paid.id, `${S1}/slip.jpg`]));
assert.equal(en.status, "pending"); assert.equal(Number(en.amount), 3000);
await as(S1, () => q(`update public.enrollments set status='approved' where id=$1`, [en.id]));
assert.equal((await q(`select status from public.enrollments where id=$1`, [en.id]))[0].status, "pending");
console.log("✓ student cannot self-approve");
assert.equal((await as(S2, () => q(`select * from public.enrollments`))).length, 0);
await as(ADMIN, () => q(`update public.enrollments set status='approved' where id=$1`, [en.id]));
const [rev] = await q(`select status, reviewed_by, reviewed_at from public.enrollments where id=$1`, [en.id]);
assert.equal(rev.status, "approved"); assert.equal(rev.reviewed_by, ADMIN); assert.ok(rev.reviewed_at);
l = await as(S1, () => q(`select title from public.lessons order by title`));
assert.deepEqual(l.map(x => x.title), ["Differentiation", "Orientation"]);
console.log("✓ approval unlocks exactly the paid month (Oct ✓, Nov locked)");
// resubmission after rejection
const [en2] = await as(S2, () => q(`insert into public.enrollments (student_id,class_id,month,slip_url) values ($1,$2,'2026-10',$3) returning id`, [S2, paid.id, `${S2}/a.jpg`]));
await as(ADMIN, () => q(`update public.enrollments set status='rejected', admin_note='blurry' where id=$1`, [en2.id]));
await as(S2, () => q(`update public.enrollments set slip_url=$2 where id=$1`, [en2.id, `${S2}/b.jpg`]));
const [rs] = await q(`select status, slip_url, admin_note from public.enrollments where id=$1`, [en2.id]);
assert.equal(rs.status, "pending"); assert.equal(rs.admin_note, null);
console.log("✓ rejected slip can be re-uploaded → back to pending");

// ---- storage policies
await as(S1, () => q(`insert into storage.objects (bucket_id,name) values ('bank-slips',$1)`, [`${S1}/slip.jpg`]));
await fails(as(S1, () => q(`insert into storage.objects (bucket_id,name) values ('bank-slips',$1)`, [`${S2}/evil.jpg`])), "upload into another user's slip folder");
await fails(as(S1, () => q(`insert into storage.objects (bucket_id,name) values ('tute-pdfs',$1)`, [`${paid.id}/2026-10/t.pdf`])), "student uploading tutes");
await as(ADMIN, () => q(`insert into storage.objects (bucket_id,name) values ('tute-pdfs',$1),('tute-pdfs',$2)`, [`${paid.id}/2026-10/t1.pdf`, `${paid.id}/2026-11/t2.pdf`]));
const tutes = await as(S1, () => q(`select name from storage.objects where bucket_id='tute-pdfs'`));
assert.deepEqual(tutes.map(t => t.name), [`${paid.id}/2026-10/t1.pdf`]);
assert.equal((await as(S2, () => q(`select name from storage.objects where bucket_id='bank-slips'`))).length, 0);
assert.equal((await as(ADMIN, () => q(`select name from storage.objects where bucket_id='bank-slips'`))).length, 1);
console.log("✓ storage: own slips only, tutes per approved month, admin sees all");

// ---- notices filtering
await as(ADMIN, () => q(`insert into public.notices (title,content,tag,class_id,target_year) values ('All','x','General',null,null),('2027 batch','x','Urgent',null,2027),('Paid class','x','Exam Notice',$1,null)`, [paid.id]));
assert.equal((await as(S1, () => q(`select * from public.notices`))).length, 3);
assert.equal((await as(S2, () => q(`select * from public.notices`))).length, 1);
console.log("✓ notices filtered by class + batch");

// ---- MCQ exam
const [exam] = await as(ADMIN, () => q(`insert into public.exams (class_id,title,duration_minutes,is_published) values ($1,'Unit test 1',30,true) returning id`, [paid.id]));
const qs = await as(ADMIN, () => q(`insert into public.exam_questions (exam_id,question_text,options_json,correct_answer,sort_order) values ($1,'1+1','["1","2","3","4"]',1,1),($1,'d/dx x^2','["x","2x","x^2","2"]',1,2),($1,'∫1 dx','["x+C","1","0","C"]',0,3) returning id`, [exam.id]));
assert.equal((await q(`select total_questions from public.exams where id=$1`, [exam.id]))[0].total_questions, 3);
await fails(as(S1, () => q(`select correct_answer from public.exam_questions`)).then(r => { if (r.length === 0) throw new Error("empty"); }), "student reading answer key");
await fails(as(S2, () => q(`select public.start_exam($1)`, [exam.id])), "unenrolled student starting exam");
const [{ start_exam: started }] = await as(S1, () => q(`select public.start_exam($1)`, [exam.id]));
assert.equal(started.questions.length, 3);
assert.ok(!("correct_answer" in started.questions[0]));
console.log("✓ start_exam returns questions without answers");
await fails(as(S1, () => q(`select public.get_exam_review($1)`, [exam.id])), "review before submitting");
const answers = { [qs[0].id]: 1, [qs[1].id]: 0, [qs[2].id]: 0 };
const [{ submit_mcq: res }] = await as(S1, () => q(`select public.submit_mcq($1,$2)`, [exam.id, JSON.stringify(answers)]));
assert.equal(Number(res.score), 2); assert.equal(Number(res.total), 3);
const [{ submit_mcq: again }] = await as(S1, () => q(`select public.submit_mcq($1,$2)`, [exam.id, JSON.stringify({ [qs[1].id]: 1 })]));
assert.equal(again.already_submitted, true);
console.log("✓ server-side scoring 2/3, resubmission blocked");
const [{ get_exam_review: review }] = await as(S1, () => q(`select public.get_exam_review($1)`, [exam.id]));
assert.equal(review.questions[1].your_answer, 0); assert.equal(review.questions[1].correct_answer, 1);
const lb = await as(S1, () => q(`select * from public.get_leaderboard($1)`, [exam.id]));
assert.equal(lb.length, 1); assert.equal(lb[0].is_me, true); assert.equal(Number(lb[0].rank), 1);
await as(S1, () => q(`update public.exam_submissions set score=100 where exam_id=$1`, [exam.id]));
assert.equal(Number((await q(`select score from public.exam_submissions where exam_id=$1`, [exam.id]))[0].score), 2);
console.log("✓ review mode, leaderboard, score tampering blocked");

// ---- structured exam
const [sx] = await as(ADMIN, () => q(`insert into public.exams (class_id,title,exam_type,is_published) values ($1,'Paper 1','structured',true) returning id`, [paid.id]));
await fails(as(S1, () => q(`select public.submit_structured($1,$2)`, [sx.id, [`${S2}/x.jpg`]])), "structured upload with foreign path");
await as(S1, () => q(`select public.submit_structured($1,$2)`, [sx.id, [`${S1}/p1.jpg`, `${S1}/p2.jpg`]]));
await as(ADMIN, () => q(`update public.exam_submissions set score=78, total_marks=100, status='graded' where exam_id=$1`, [sx.id]));
const lb2 = await as(S1, () => q(`select * from public.get_leaderboard($1)`, [sx.id]));
assert.equal(Number(lb2[0].score), 78);
console.log("✓ structured upload + admin grading");

// ---- orders
const [prod] = await as(ADMIN, () => q(`insert into public.products (title,price) values ('Integration tute book',1500) returning id`));
const [ord] = await as(S1, () => q(`insert into public.orders (student_id,product_id,quantity,delivery_address,slip_url,status) values ($1,$2,2,'Panadura',$3,'shipped') returning status, amount`, [S1, prod.id, `${S1}/o.jpg`]));
assert.equal(ord.status, "pending"); assert.equal(Number(ord.amount), 3000);
await as(S1, () => q(`update public.orders set status='approved'`));
assert.equal((await q(`select status from public.orders`))[0].status, "pending");
console.log("✓ tute book orders");

console.log("\nALL SQL TESTS PASSED");
process.exit(0);
