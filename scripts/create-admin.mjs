// Usage: npm run create-admin -- admin@example.com "StrongPassword123"
// Creates (or resets) an admin login. The e-mail must also be in public.admin_emails
// (the migration seeds admin@nativelaunch.xyz) or the profile is promoted directly here.
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { URL_, SERVICE } from "./_env.mjs";

const email = (process.argv[2] ?? "admin@nativelaunch.xyz").toLowerCase();
const password = process.argv[3] ?? randomBytes(9).toString("base64url");
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

let userId;
const { data: created, error } = await admin.auth.admin.createUser({
  email, password, email_confirm: true, user_metadata: { full_name: "Hasitha Madusanka" },
});
if (error) {
  if (!/already/i.test(error.message)) { console.error(error.message); process.exit(1); }
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const u = list.users.find((x) => x.email?.toLowerCase() === email);
  if (!u) { console.error("User exists but could not be found"); process.exit(1); }
  userId = u.id;
  await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  console.log("Existing user — password reset.");
} else {
  userId = created.user.id;
  console.log("Admin auth user created.");
}

const { error: pErr } = await admin.from("profiles").upsert(
  { id: userId, full_name: "Hasitha Madusanka", role: "admin", town: "Online" }, { onConflict: "id" },
);
if (pErr) console.log("Note: profiles table not found yet — the migration will create the admin profile automatically.");
else console.log("Admin profile ready.");
console.log(`\nLogin:    ${email}\nPassword: ${password}\n`);
process.exit(0);
