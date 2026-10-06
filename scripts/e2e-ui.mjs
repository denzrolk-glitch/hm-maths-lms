#!/usr/bin/env node
// Full browser E2E against a running app (default http://localhost:3100) + live Supabase.
// Usage: BASE=http://localhost:3100 ADMIN_EMAIL=... ADMIN_PW=... SHOTS=/tmp/shots node scripts/e2e-ui.mjs
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { URL_, SERVICE } from "./_env.mjs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const SHOTS = process.env.SHOTS ?? "/tmp/hm-shots";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@nativelaunch.xyz";
const ADMIN_PW = process.env.ADMIN_PW;
if (!ADMIN_PW) { console.error("Set ADMIN_PW"); process.exit(1); }
mkdirSync(SHOTS, { recursive: true });
const svc = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const tag = `UI${Date.now().toString(36)}`;
const month = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
const mobile = "07" + String(Date.now()).slice(-8);
const nic = String(Date.now()).slice(-12).padStart(12, "2");
const SLIP = process.env.SLIP ?? "/tmp/slip.png";
if (!process.env.SLIP) writeFileSync(SLIP, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));

let pass = 0; const problems = [];
const ok = (m) => { pass++; console.log("  ✓", m); };
const bad = (m) => { problems.push(m); console.log("  ✗", m); };
const check = (cond, m) => (cond ? ok(m) : bad(m));

const cleanup = { classes: [], users: [] };
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? undefined, args: ["--no-sandbox"] });
const consoleErrors = [];
const newPage = async (vp = { width: 1366, height: 860 }, locale) => {
  const ctx = await browser.newContext({ viewport: vp });
  if (locale) await ctx.addCookies([{ name: "hm_locale", value: locale, url: BASE }]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => consoleErrors.push(`${page.url()}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource.*(404|images)/i.test(m.text())) consoleErrors.push(`${page.url()}: ${m.text().slice(0, 200)}`); });
  page.on("dialog", (d) => d.accept());
  return page;
};
const shot = (page, name, full = true) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });
const go = async (page, path) => { const r = await page.goto(BASE + path, { waitUntil: "networkidle" }); return r?.status() ?? 0; };
const missingKeys = async (page) => (await page.content()).match(/\b(?:portal|admin|common|landing|auth|errors)\.[a-z]+\.[a-zA-Z.]+\b/g) ?? [];

async function solveCaptcha(page) {
  const src = await page.locator('img[src^="data:image/svg+xml"]').first().getAttribute("src");
  const svg = Buffer.from(src.split(",")[1], "base64").toString();
  const expr = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join("").replace("=?", "").replace("×", "*");
  const [, a, op, b] = expr.match(/^(\d+)([+\-*])(\d+)$/);
  return String(op === "+" ? +a + +b : op === "-" ? a - b : a * b);
}

try {
  // ── Seed content as admin (service role) ──
  console.log("Seed");
  const { data: cls } = await svc.from("classes").insert({ title: `${tag} 2027 A/L Theory`, description: "Pure Maths — Functions\nApplied — Vectors\nWeekly tute", class_type: "Theory", target_year: 2027, town: "Panadura", fee: 3500, schedule_days: [6], start_time: "08:00", duration_minutes: 240, is_active: true }).select().single();
  const { data: free } = await svc.from("classes").insert({ title: `${tag} Free Seminar`, class_type: "Free Seminar", target_year: 2027, fee: 0, is_free: true, is_active: true }).select().single();
  cleanup.classes.push(cls.id, free.id);
  const soon = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { data: seeded } = await svc.from("lessons").insert([
    { class_id: cls.id, month, week_number: 1, title: `${tag} Functions — intro`, youtube_url: "https://youtu.be/dQw4w9WgXcQ" },
    { class_id: cls.id, month, week_number: 2, title: `${tag} Live: Vectors`, live_start_time: soon, session_type: "extra" },
    { class_id: free.id, month, week_number: 1, title: `${tag} Orientation`, youtube_url: "https://youtu.be/dQw4w9WgXcQ" },
  ]).select("id, live_start_time");
  await svc.from("lesson_live_links").insert({ lesson_id: seeded.find((l) => l.live_start_time).id, live_url: "https://zoom.us/j/123456789" });
  const { data: exam } = await svc.from("exams").insert({ class_id: cls.id, title: `${tag} Unit Test`, duration_minutes: 15, is_published: true }).select().single();
  await svc.from("exam_questions").insert([
    { exam_id: exam.id, question_text: "2 + 2 = ?", options_json: ["3", "4", "5"], correct_answer: 1, sort_order: 1 },
    { exam_id: exam.id, question_text: "d/dx (x²) = ?", options_json: ["x", "2x", "x²"], correct_answer: 1, sort_order: 2 },
  ]);
  await svc.from("notices").insert({ title: `${tag} Welcome notice`, content: "Classes start this Saturday.", tag: "General" });
  ok("seeded class, free class, lessons, MCQ, notice");

  // ── Public pages ──
  console.log("Public pages");
  for (const [vpName, vp] of [["desk", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    for (const loc of ["en", "si"]) {
      const p = await newPage(vp, loc);
      for (const [name, path] of [["home", "/"], ["store", "/store"], ["login", "/login"], ["register", "/register"], ["404", "/nope-" + tag]]) {
        const st = await go(p, path);
        if (name === "home") { for (let y = 0; y < 9000; y += 700) { await p.mouse.wheel(0, 700); await p.waitForTimeout(120); } await p.waitForTimeout(500); }
        check(name === "404" ? st === 404 : st === 200, `${vpName}/${loc} ${path} → ${st}`);
        const mk = await missingKeys(p); if (mk.length) bad(`${loc} ${path} untranslated keys: ${[...new Set(mk)].join(", ")}`);
        if (loc === "en" || name !== "404") await shot(p, `${vpName}-${loc}-${name}`);
      }
      if (vpName === "desk" && loc === "en") check((await p.locator("body").innerText()).length > 0, "pages render");
      await p.context().close();
    }
  }
  { const p = await newPage(); await go(p, "/"); check(await p.locator(`text=${tag} 2027 A/L Theory`).count() > 0, "home carousel lists DB class"); await go(p, "/store"); check(await p.locator(`text=${tag} 2027 A/L Theory`).count() > 0, "public store lists class"); await p.context().close(); }

  // ── Student registration via UI ──
  console.log("Student register");
  const sp = await newPage();
  await go(sp, "/register");
  await sp.click("button[type=submit]"); await sp.waitForTimeout(300);
  check(sp.url().includes("/register"), "empty register blocked");
  await sp.fill("[name=first_name]", "Ui"); await sp.fill("[name=last_name]", `Tester ${tag}`);
  await sp.fill("[name=mobile]", mobile); await sp.fill("[name=nic]", nic);
  await sp.selectOption("[name=al_year]", "2027"); await sp.selectOption("[name=town]", "Panadura");
  await sp.fill("[name=school]", "Royal College"); await sp.selectOption("[name=district]", "Kalutara");
  await sp.fill("[name=password]", "Str0ng!Pass"); await sp.fill("[name=confirm]", "Str0ng!Pass");
  await sp.fill("[name=captcha]", "999"); await sp.click("button[type=submit]"); await sp.waitForTimeout(2500);
  check(sp.url().includes("/register") && (await sp.locator("[role=alert], .text-destructive").count()) > 0, "wrong captcha rejected");
  check((await sp.inputValue("[name=first_name]")) === "Ui", "form keeps values after error");
  await sp.fill("[name=password]", "Str0ng!Pass"); await sp.fill("[name=confirm]", "Str0ng!Pass");
  await sp.fill("[name=captcha]", await solveCaptcha(sp));
  await Promise.all([sp.waitForURL(/\/dashboard/, { timeout: 20000 }), sp.click("button[type=submit]")]);
  ok("registered → " + new URL(sp.url()).pathname);
  const { data: prof } = await svc.from("profiles").select("id, student_id, full_name, school, district").eq("mobile", mobile).single();
  cleanup.users.push(prof.id);
  check(/^HM-MATHS-2027-\d+/.test(prof.student_id) && prof.full_name === `Ui Tester ${tag}` && prof.school === "Royal College", `profile ${prof.student_id} saved with school/district`);
  await sp.waitForLoadState("networkidle"); await shot(sp, "student-dashboard-new");

  // Logout + login with mobile
  await sp.context().clearCookies();
  await go(sp, "/login"); await sp.fill("#identifier", mobile); await sp.fill("#password", "wrong-pass"); await sp.click("button[type=submit]"); await sp.waitForTimeout(2000);
  check(sp.url().includes("/login"), "wrong password rejected");
  await sp.fill("#identifier", mobile); await sp.fill("#password", "Str0ng!Pass");
  await Promise.all([sp.waitForURL(/\/dashboard/, { timeout: 15000 }), sp.click("button[type=submit]")]); ok("student login with mobile");
  check((await go(sp, "/admin")) && !sp.url().includes("/admin"), "student cannot open /admin");

  // ── Student portal pages before payment ──
  console.log("Portal (unpaid)");
  for (const [name, path] of [["dashboard", "/dashboard"], ["classes", "/dashboard/classes"], ["free", "/dashboard/free-zone"], ["exams", "/dashboard/exams"], ["notices", "/dashboard/notices"], ["profile", "/dashboard/profile"], ["payments", "/dashboard/payments"], ["store", "/dashboard/store"], ["store-class", `/dashboard/store/class/${cls.id}`]]) {
    const st = await go(sp, path); check(st === 200, `${path} → ${st}`);
    const mk = await missingKeys(sp); if (mk.length) bad(`${path} untranslated: ${[...new Set(mk)].join(", ")}`);
    await shot(sp, `student-${name}`);
  }
  await go(sp, "/dashboard/free-zone"); check(await sp.locator(`text=${tag} Orientation`).count() > 0, "free zone shows free lesson");
  await go(sp, "/dashboard/notices"); check(await sp.locator(`text=${tag} Welcome notice`).count() > 0, "notice visible");
  await go(sp, `/dashboard/classes/${cls.id}`); check(await sp.locator(`text=${tag} Functions — intro`).count() === 0 || sp.url().includes("store"), "paid lesson hidden before payment");

  // ── Enroll with slip ──
  console.log("Enroll");
  await go(sp, `/dashboard/store/class/${cls.id}`);
  await sp.selectOption("#month", month);
  await sp.setInputFiles('input[type=file]', SLIP);
  await sp.waitForSelector('input[type=hidden][name=slip_url]', { state: "attached", timeout: 15000 });
  await sp.fill("#bank_ref", "REF123");
  await sp.click("button[type=submit]"); await sp.waitForTimeout(3000);
  const { data: enr } = await svc.from("enrollments").select("id, status, amount, slip_url").eq("student_id", prof.id).eq("class_id", cls.id).single();
  check(enr?.status === "pending" && Number(enr.amount) === 3500 && enr.slip_url?.startsWith(prof.id), "slip uploaded, enrollment pending with fee");
  await shot(sp, "student-enroll-submitted");

  // ── Admin approves via UI ──
  console.log("Admin");
  const ap = await newPage();
  await go(ap, "/login"); await ap.fill("#identifier", ADMIN_EMAIL); await ap.fill("#password", ADMIN_PW);
  await Promise.all([ap.waitForURL(/\/admin/, { timeout: 15000 }), ap.click("button[type=submit]")]); ok("admin login → /admin");
  for (const [name, path] of [["overview", "/admin"], ["payments", "/admin/payments"], ["classes", "/admin/classes"], ["class", `/admin/classes/${cls.id}`], ["new-class", "/admin/classes/new"], ["exams", "/admin/exams"], ["exam", `/admin/exams/${exam.id}`], ["new-exam", "/admin/exams/new"], ["notices", "/admin/notices"], ["students", "/admin/students"], ["store", "/admin/store"]]) {
    const st = await go(ap, path); check(st === 200, `${path} → ${st}`);
    const mk = await missingKeys(ap); if (mk.length) bad(`${path} untranslated: ${[...new Set(mk)].join(", ")}`);
    await shot(ap, `admin-${name}`);
  }
  await go(ap, "/admin/students?q=" + encodeURIComponent(mobile)); check(await ap.locator(`text=${prof.student_id}`).count() > 0, "admin finds student by mobile");
  await go(ap, "/admin/payments");
  const card = ap.locator(`text=Ui Tester ${tag}`).first();
  check(await card.count() > 0, "pending slip visible in approval center");
  const row = ap.locator("form", { has: ap.locator('button[value=approved]') }).filter({ has: ap.locator(`input[value="${enr.id}"]`) });
  await row.locator('button[value=approved]').click(); await ap.waitForTimeout(3000);
  const { data: enr2 } = await svc.from("enrollments").select("status").eq("id", enr.id).single();
  check(enr2.status === "approved", "admin approved slip via UI");

  // Admin creates a class + lesson through the forms
  await go(ap, "/admin/classes/new");
  await ap.fill("[name=title]", `${tag} UI-made Revision`); await ap.selectOption("[name=class_type]", "Revision");
  await ap.fill("[name=fee]", "2500");
  await Promise.all([ap.waitForURL(/\/admin\/classes\/[0-9a-f-]{36}/, { timeout: 15000 }), ap.locator("form button[type=submit]").last().click()]);
  const newId = ap.url().split("/").pop(); cleanup.classes.push(newId); ok("admin created class via form");
  await ap.fill("[name=title] >> nth=-1", `${tag} Lesson via UI`).catch(() => {});
  const lessonForm = ap.locator("form", { has: ap.locator('[name=week_number]') }).last();
  await lessonForm.locator("[name=title]").fill(`${tag} Lesson via UI`);
  await lessonForm.locator("[name=youtube_url]").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await lessonForm.locator("button[type=submit]").click(); await ap.waitForTimeout(3000);
  const { data: ul } = await svc.from("lessons").select("id").eq("class_id", newId);
  check((ul ?? []).length === 1, "admin added lesson via form");
  await shot(ap, "admin-class-created");

  // Admin publishes a notice via UI
  await go(ap, "/admin/notices");
  await ap.fill("[name=title]", `${tag} UI notice`); await ap.fill("[name=content]", "Paper class moved to Sunday.");
  await ap.locator("form", { has: ap.locator("[name=content]") }).locator("button[type=submit]").click(); await ap.waitForTimeout(2500);
  check((await svc.from("notices").select("id").eq("title", `${tag} UI notice`)).data?.length === 1, "admin published notice via form");

  // ── Student after approval ──
  console.log("Portal (paid)");
  await go(sp, "/dashboard/classes"); check(await sp.locator(`text=${tag} 2027 A/L Theory`).count() > 0, "class unlocked in My Classes");
  await shot(sp, "student-classes-paid");
  await go(sp, `/dashboard/classes/${cls.id}`); await shot(sp, "student-classroom");
  check(await sp.locator(`text=${tag} Functions — intro`).count() > 0, "recording listed in classroom");
  check(await sp.locator("text=/Join opens|Class starts in|Starting in|Join Live|Join on/").count() > 0, "live session countdown shown");
  const { data: les } = await svc.from("lessons").select("id").eq("class_id", cls.id).eq("week_number", 1).single();
  await go(sp, `/dashboard/classes/${cls.id}/lessons/${les.id}`); await sp.waitForTimeout(1000); await shot(sp, "student-lesson");
  check(await sp.locator("iframe[src*='youtube']").count() > 0 || await sp.locator("[data-video]").count() > 0 || await sp.locator("text=watermarked").count() > 0, "lesson player rendered");
  await go(sp, "/dashboard/notices"); check(await sp.locator(`text=${tag} UI notice`).count() > 0, "admin UI notice reaches student");

  // MCQ
  console.log("MCQ");
  await go(sp, `/dashboard/exams/${exam.id}`); await shot(sp, "student-exam-intro");
  await sp.getByRole("button", { name: /Start paper/ }).click();
  await sp.waitForSelector("text=2 + 2 = ?", { timeout: 15000 });
  await sp.getByRole("button", { name: /^\s*B?\s*4\s*$/ }).first().click().catch(async () => { await sp.locator("button", { hasText: "4" }).first().click(); });
  await shot(sp, "student-exam-running", false);
  await sp.getByRole("button", { name: /^Next$/ }).click();
  await sp.locator("button", { hasText: "2x" }).first().click();
  await sp.getByRole("button", { name: /Submit paper/ }).first().click();
  await sp.waitForTimeout(3500); await shot(sp, "student-exam-done");
  const { data: sub } = await svc.from("exam_submissions").select("score, total_marks").eq("exam_id", exam.id).eq("student_id", prof.id).single();
  check(Number(sub?.score) === 2 && Number(sub?.total_marks) === 2, `MCQ scored server-side ${sub?.score}/${sub?.total_marks}`);
  check((await go(sp, `/dashboard/exams/${exam.id}/review`)) === 200 && (await sp.locator("text=2x").count()) > 0, "review page"); await shot(sp, "student-review");
  check((await go(sp, `/dashboard/exams/${exam.id}/leaderboard`)) === 200 && (await sp.locator(`text=${prof.student_id}`).count() + await sp.locator("text=(you)").count()) > 0, "leaderboard shows me"); await shot(sp, "student-leaderboard");
  await go(sp, "/dashboard"); await shot(sp, "student-dashboard-paid");
  await go(sp, "/dashboard/payments"); check(await sp.locator("text=REF123").count() > 0, "payment history lists slip"); await shot(sp, "student-payments");

  // Profile update + password change
  await go(sp, "/dashboard/profile");
  await sp.fill("[name=school]", "Ananda College");
  await sp.locator("form", { has: sp.locator("[name=school]") }).locator("button[type=submit]").click(); await sp.waitForTimeout(2500);
  check((await svc.from("profiles").select("school").eq("id", prof.id).single()).data.school === "Ananda College", "profile updated");

  // Sinhala portal + mobile
  console.log("Sinhala + mobile");
  await sp.context().addCookies([{ name: "hm_locale", value: "si", url: BASE }]);
  for (const [name, path] of [["dashboard", "/dashboard"], ["classes", "/dashboard/classes"], ["payments", "/dashboard/payments"], ["exams", "/dashboard/exams"], ["profile", "/dashboard/profile"]]) {
    await go(sp, path); const mk = await missingKeys(sp); if (mk.length) bad(`si ${path} untranslated: ${[...new Set(mk)].join(", ")}`); await shot(sp, `si-student-${name}`);
  }
  check(await sp.locator("text=පුවරුව").count() > 0, "Sinhala UI active");
  await go(ap, "/admin"); await ap.context().addCookies([{ name: "hm_locale", value: "si", url: BASE }]); await go(ap, "/admin/payments"); await shot(ap, "si-admin-payments");
  const mp = await newPage({ width: 390, height: 844 });
  await mp.context().addCookies(await sp.context().cookies());
  await mp.context().addCookies([{ name: "hm_locale", value: "en", url: BASE }]);
  for (const [name, path] of [["dashboard", "/dashboard"], ["classes", "/dashboard/classes"], ["classroom", `/dashboard/classes/${cls.id}`], ["payments", "/dashboard/payments"], ["exams", "/dashboard/exams"]]) { await go(mp, path); await shot(mp, `mobile-student-${name}`); }
  const ma = await newPage({ width: 390, height: 844 }); await ma.context().addCookies(await ap.context().cookies()); await ma.context().addCookies([{ name: "hm_locale", value: "en", url: BASE }]);
  await go(ma, "/admin"); await shot(ma, "mobile-admin-overview"); await go(ma, "/admin/payments"); await shot(ma, "mobile-admin-payments");

  // Logout
  await go(sp, "/dashboard"); await sp.context().clearCookies(); check((await go(sp, "/dashboard")) && sp.url().includes("/login"), "signed-out user redirected to login");
} catch (e) {
  bad("CRASH: " + (e?.stack ?? e));
} finally {
  for (const id of cleanup.classes) await svc.from("classes").delete().eq("id", id);
  await svc.from("notices").delete().like("title", `${tag}%`);
  for (const id of cleanup.users) {
    const { data: files } = await svc.storage.from("bank-slips").list(id); if (files?.length) await svc.storage.from("bank-slips").remove(files.map((f) => `${id}/${f.name}`));
    await svc.auth.admin.deleteUser(id);
  }
  await browser.close();
}
const uniqErr = [...new Set(consoleErrors)];
if (uniqErr.length) { console.log("\nBrowser console errors:"); uniqErr.slice(0, 30).forEach((e) => console.log("  -", e)); }
console.log(`\n${pass} passed, ${problems.length} failed. Screenshots: ${SHOTS}`);
process.exit(problems.length ? 1 : 0);
