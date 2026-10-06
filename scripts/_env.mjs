// Tiny .env.local loader (no dependency).
import { readFileSync, existsSync } from "node:fs";
const file = new URL("../.env.local", import.meta.url);
if (existsSync(file)) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
export const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVICE) { console.error("Missing Supabase env vars in .env.local"); process.exit(1); }
