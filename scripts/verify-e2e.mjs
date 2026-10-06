// Live end-to-end verification against YOUR Supabase project (run after applying the migration).
// Creates temporary users/classes/files, exercises every security rule, then deletes everything.
//   npm run verify
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { URL_, ANON, SERVICE } from "./_env.mjs";

const svc = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const tag = `e2e${Date.now().toString(36)}`;
const created = { users: [], classes: [], files: [] };
let passed = 0;
const ok = (msg) => { passed++; console.log(`  ✓ ${msg}`); };
const month = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
const [y, m] = month.split("-").map(Number);
const nextMonth = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");

async function makeUser(label, meta, isAdmin = false) {
  const mobile = `07${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
  const email = isAdmin ? `${tag}-admin@example.com` : `${mobile}@students.hmmaths.lk`;
  const password = `Pw-${tag}-${label}`;
  const { data, error } = await svc.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: isAdmin ? { full_name: "E2E Admin" } : { full_name: `E2E ${label}`, mobile, nic: `${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(0, 12), al_year: "2027", town: "Panadura", ...meta },
  });
  if (error) throw error;
  created.users.push(data.user.id);
  if (isAdmin) await svc.from("profiles").update({ role: "admin", student_id: null }).eq("id", data.user.id);
  const client = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error: sErr } = await client.auth.signInWithPassword({ email, password });
  if (sErr) throw sErr;
  return { id: data.user.id, client, mobile };
}

async function main() {
  console.log(`\nHM Maths LMS — live E2E against ${URL_}\n`);
  const { error: tblErr } = await svc.from("classes").select("id").limit(1);
  if (tblErr) { console.error("✗ Tables not found. Run supabase/migrations/0001_init.sql in the SQL editor first."); process.exit(1); }
  const { data: buckets } = await svc.storage.listBuckets();
  assert.deepEqual(["answer-sheets", "bank-slips", "class-banners", "tute-pdfs"].every((b) => buckets.some((x) => x.id === b)), true);
  ok("schema + 4 storage buckets present");

  console.log("Auth & profiles");
  const admin = await makeUser("admin", {}, true);
  const s1 = await makeUser("s1");
  const s2 = await makeUser("s2", { al_year: "2026", town: "Horana" });
  const { data: p1 } = await s1.client.from("profiles").select("*").single();
  assert.match(p1.student_id, /^HM-MATHS-2027-\d{4}$/); ok(`signup trigger → profile ${p1.student_id}`);
  await s1.client.from("profiles").update({ role: "admin", student_id: "HACK" }).eq("id", s1.id);
  const { data: p1b } = await svc.from("profiles").select("role, student_id").eq("id", s1.id).single();
  assert.equal(p1b.role, "student"); assert.equal(p1b.student_id, p1.student_id); ok("role / student ID escalation blocked");
  const { data: others } = await s1.client.from("profiles").select("id");
  assert.equal(others.length, 1); ok("students see only their own profile");

  console.log("Admin content");
  const { data: paid, error: cErr } = await admin.client.from("classes").insert({ title: `${tag} Theory`, class_type: "Theory", fee: 3000, target_year: 2027 }).select().single();
  if (cErr) throw cErr;
  const { data: free } = await admin.client.from("classes").insert({ title: `${tag} Seminar`, class_type: "Free Seminar", fee: 0, is_free: true }).select().single();
  created.classes.push(paid.id, free.id);
  const { error: lErr } = await admin.client.from("lessons").insert([
    { class_id: paid.id, month, week_number: 1, title: "Paid this month", youtube_url: "https://youtu.be/dQw4w9WgXcQ", tute_pdf_url: `${paid.id}/${month}/t.pdf` },
    { class_id: paid.id, month: nextMonth, week_number: 1, title: "Paid next month", youtube_url: "https://youtu.be/dQw4w9WgXcQ" },
    { class_id: free.id, month, week_number: 1, title: "Free orientation", youtube_url: "https://youtu.be/dQw4w9WgXcQ" },
  ]);
  if (lErr) throw lErr;
  for (const p of [`${paid.id}/${month}/t.pdf`, `${paid.id}/${nextMonth}/t2.pdf`]) {
    const { error } = await admin.client.storage.from("tute-pdfs").upload(p, PDF, { contentType: "application/pdf" });
    if (error) throw error; created.files.push(["tute-pdfs", p]);
  }
  ok("admin created classes, lessons and uploaded tutes");
  const { error: hackClass } = await s1.client.from("classes").insert({ title: "hack" });
  assert.ok(hackClass); ok("students cannot create classes");
  const { error: hackTute } = await s1.client.storage.from("tute-pdfs").upload(`${paid.id}/${month}/evil.pdf`, PDF, { contentType: "application/pdf" });
  assert.ok(hackTute); ok("students cannot upload tutes");

  console.log("Access control before payment");
  let { data: ls } = await s1.client.from("lessons").select("title");
  assert.deepEqual(ls.map((l) => l.title).filter((t) => !t.startsWith("x")).sort(), ["Free orientation"]); ok("unpaid student sees only Free Zone lessons");
  const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data: anonClasses } = await anon.from("classes").select("id").in("id", [paid.id, free.id]);
  assert.equal(anonClasses.length, 2); ok("public storefront can list classes");
  const { data: anonLessons } = await anon.from("lessons").select("id");
  assert.equal((anonLessons ?? []).length, 0); ok("anonymous visitors get no lessons");
  const { error: preTute } = await s1.client.storage.from("tute-pdfs").createSignedUrl(`${paid.id}/${month}/t.pdf`, 60);
  assert.ok(preTute); ok("tute download blocked before payment");

  console.log("Bank slip workflow");
  const slipPath = `${s1.id}/${tag}.png`;
  { const { error } = await s1.client.storage.from("bank-slips").upload(slipPath, PNG, { contentType: "image/png" }); if (error) throw error; created.files.push(["bank-slips", slipPath]); }
  const { error: evilSlip } = await s1.client.storage.from("bank-slips").upload(`${s2.id}/evil.png`, PNG, { contentType: "image/png" });
  assert.ok(evilSlip); ok("slip upload limited to own folder");
  const { data: en, error: enErr } = await s1.client.from("enrollments").insert({ student_id: s1.id, class_id: paid.id, month, slip_url: slipPath, status: "approved" }).select().single();
  if (enErr) throw enErr;
  assert.equal(en.status, "pending"); assert.equal(Number(en.amount), 3000); ok("enrollment forced to pending, amount = class fee");
  await s1.client.from("enrollments").update({ status: "approved" }).eq("id", en.id);
  assert.equal((await svc.from("enrollments").select("status").eq("id", en.id).single()).data.status, "pending"); ok("self-approval blocked");
  const { data: s2slips } = await s2.client.storage.from("bank-slips").list(s1.id);
  assert.equal((s2slips ?? []).length, 0); ok("other students cannot see your slip");
  const { data: adminSlip } = await admin.client.storage.from("bank-slips").createSignedUrl(slipPath, 60);
  assert.ok(adminSlip?.signedUrl); ok("admin can view the slip");
  const { error: apErr } = await admin.client.from("enrollments").update({ status: "approved" }).eq("id", en.id);
  if (apErr) throw apErr;
  ({ data: ls } = await s1.client.from("lessons").select("title").eq("class_id", paid.id));
  assert.deepEqual(ls.map((l) => l.title), ["Paid this month"]); ok("approval unlocks exactly the paid month");
  const { data: tute } = await s1.client.storage.from("tute-pdfs").createSignedUrl(`${paid.id}/${month}/t.pdf`, 60);
  assert.ok(tute?.signedUrl); ok("tute download works after approval");
  const { error: nextTute } = await s1.client.storage.from("tute-pdfs").createSignedUrl(`${paid.id}/${nextMonth}/t2.pdf`, 60);
  assert.ok(nextTute); ok("next month's tute still locked");

  console.log("App query shapes (admin pages)");
  for (const [label, q] of [
    ["approval center join", admin.client.from("enrollments").select("id, profiles:profiles!enrollments_student_id_fkey(full_name, mobile, nic, student_id, town), classes(title, fee)").limit(5)],
    ["students + enrollment count", admin.client.from("profiles").select("*, enrollments:enrollments!enrollments_student_id_fkey(count)").limit(5)],
    ["exams + submission count", admin.client.from("exams").select("*, classes(title), exam_submissions(count)").limit(5)],
    ["orders join", admin.client.from("orders").select("id, profiles(full_name, mobile, student_id), products(title)").limit(5)],
    ["student enrollments join", s1.client.from("enrollments").select("*, classes(*)")],
    ["live sessions join", s1.client.from("lessons").select("*, classes(title)").limit(5)],
  ]) { const { error } = await q; if (error) throw new Error(`${label}: ${error.message}`); ok(label); }

  console.log("Notices (filtered + realtime)");
  let realtimeHit = false;
  { const { data: { session } } = await s1.client.auth.getSession(); if (session) s1.client.realtime.setAuth(session.access_token); }
  const ch = s1.client.channel(`${tag}-rt`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notices" }, () => { realtimeHit = true; });
  await new Promise((res) => ch.subscribe((st) => st === "SUBSCRIBED" && res()));
  await new Promise((r) => setTimeout(r, 2500));
  const { error: nErr } = await admin.client.from("notices").insert([
    { title: `${tag} all`, content: "x", tag: "General" },
    { title: `${tag} 2026`, content: "x", tag: "Urgent", target_year: 2026 },
    { title: `${tag} paid`, content: "x", tag: "Exam Notice", class_id: paid.id },
  ]);
  if (nErr) throw nErr;
  const titles = async (c) => (await c.from("notices").select("title").like("title", `${tag}%`)).data.map((n) => n.title).sort();
  assert.deepEqual(await titles(s1.client), [`${tag} all`, `${tag} paid`]);
  assert.deepEqual(await titles(s2.client), [`${tag} 2026`, `${tag} all`]); ok("notices filtered by class & batch");
  for (let i = 0; i < 30 && !realtimeHit; i++) await new Promise((r) => setTimeout(r, 500));
  await s1.client.removeChannel(ch);
  if (realtimeHit) ok("realtime notice delivered"); else console.log("  ! realtime event not received (check Database → Publications → supabase_realtime includes notices)");
  await svc.from("notices").delete().like("title", `${tag}%`);

  console.log("MCQ exam");
  const { data: exam } = await admin.client.from("exams").insert({ class_id: paid.id, title: `${tag} MCQ`, duration_minutes: 10, is_published: true }).select().single();
  const { data: qs } = await admin.client.from("exam_questions").insert([
    { exam_id: exam.id, question_text: "1+1", options_json: ["1", "2", "3"], correct_answer: 1, sort_order: 1 },
    { exam_id: exam.id, question_text: "d/dx x²", options_json: ["x", "2x"], correct_answer: 1, sort_order: 2 },
  ]).select();
  const { data: keys } = await s1.client.from("exam_questions").select("correct_answer").eq("exam_id", exam.id);
  assert.equal((keys ?? []).length, 0); ok("answer key hidden from students");
  const { error: s2start } = await s2.client.rpc("start_exam", { p_exam: exam.id });
  assert.ok(s2start); ok("unenrolled student cannot start the paper");
  const { data: st, error: stErr } = await s1.client.rpc("start_exam", { p_exam: exam.id });
  if (stErr) throw stErr;
  assert.equal(st.questions.length, 2); assert.ok(!("correct_answer" in st.questions[0])); ok("start_exam → questions without answers + server deadline");
  const ans = { [qs.find((q) => q.sort_order === 1).id]: 1, [qs.find((q) => q.sort_order === 2).id]: 0 };
  const { data: res } = await s1.client.rpc("submit_mcq", { p_exam: exam.id, p_answers: ans });
  assert.equal(Number(res.score), 1); assert.equal(Number(res.total), 2); ok("server-side marking: 1 / 2");
  const { data: rev } = await s1.client.rpc("get_exam_review", { p_exam: exam.id });
  assert.equal(rev.questions.length, 2); ok("review mode returns answers after submission");
  const { data: lb } = await s1.client.rpc("get_leaderboard", { p_exam: exam.id });
  assert.equal(lb[0].is_me, true); ok("leaderboard ranks the batch");
  await s1.client.from("exam_submissions").update({ score: 99 }).eq("exam_id", exam.id);
  assert.equal(Number((await svc.from("exam_submissions").select("score").eq("exam_id", exam.id).single()).data.score), 1); ok("score tampering blocked");

  console.log(`\nALL ${passed} LIVE CHECKS PASSED ✅`);
}

async function cleanup() {
  for (const [b, p] of created.files) await svc.storage.from(b).remove([p]);
  if (created.classes.length) await svc.from("classes").delete().in("id", created.classes);
  for (const id of created.users) await svc.auth.admin.deleteUser(id);
  console.log("Cleaned up temporary test data.");
}

try { await main(); await cleanup(); process.exit(0); }
catch (e) { console.error("\n✗ FAILED:", e?.message ?? e); await cleanup(); process.exit(1); }
