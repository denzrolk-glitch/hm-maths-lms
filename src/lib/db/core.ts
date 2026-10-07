import "server-only";
import { PostgrestClient } from "@supabase/postgrest-js";
import { asService } from "./pg";
import { bucketApi } from "./storage";
import { signJwt, type Claims } from "./jwt";

/** Rows the app needs from auth.users, shaped like a Supabase `User`. */
export type AppUser = { id: string; email: string; user_metadata: Record<string, unknown>; created_at?: string };
type AuthErr = { message: string; code?: string; status?: number };

const REST_URL = () => process.env.POSTGREST_URL || "http://127.0.0.1:3001";
const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

export function restClient(token: string | null) {
  return new PostgrestClient(REST_URL(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    fetch: noStoreFetch,
  });
}

const toUser = (r: { id: string; email: string; raw_user_meta_data: Record<string, unknown>; created_at?: Date }): AppUser =>
  ({ id: r.id, email: r.email, user_metadata: r.raw_user_meta_data ?? {}, created_at: r.created_at?.toISOString() });

/** Checks email + password against auth.users (bcrypt via pgcrypto). */
export async function verifyPassword(email: string, password: string): Promise<AppUser | null> {
  const rows = await asService(async (c) => (await c.query(
    `update auth.users set last_sign_in_at = now()
       where lower(email) = lower($1) and encrypted_password = extensions.crypt($2, encrypted_password)
     returning id, email, raw_user_meta_data, created_at`, [email.trim(), password])).rows);
  return rows[0] ? toUser(rows[0]) : null;
}

/** Loads a user for a session token; rejects tokens issued before the last password change. */
export async function loadUser(claims: Claims | null): Promise<AppUser | null> {
  if (!claims?.sub || claims.role !== "authenticated") return null;
  const rows = await asService(async (c) => (await c.query(
    `select id, email, raw_user_meta_data, created_at, extract(epoch from password_changed_at)::bigint as pwd
       from auth.users where id = $1`, [claims.sub])).rows);
  const r = rows[0];
  if (!r) return null;
  if (claims.iat && Number(r.pwd) > claims.iat + 1) return null;
  return toUser(r);
}

export async function setPassword(userId: string, password: string): Promise<AuthErr | null> {
  if (password.length < 6) return { message: "Password should be at least 6 characters" };
  const n = await asService(async (c) => (await c.query(
    `update auth.users set encrypted_password = extensions.crypt($2, extensions.gen_salt('bf')),
       password_changed_at = now(), updated_at = now() where id = $1`, [userId, password])).rowCount);
  return n ? null : { message: "User not found" };
}

export async function createUser(email: string, password: string, meta: Record<string, unknown>): Promise<{ user: AppUser | null; error: AuthErr | null }> {
  try {
    const rows = await asService(async (c) => (await c.query(
      `insert into auth.users (email, encrypted_password, raw_user_meta_data)
       values (lower($1), extensions.crypt($2, extensions.gen_salt('bf')), $3)
       returning id, email, raw_user_meta_data, created_at`, [email.trim(), password, JSON.stringify(meta ?? {})])).rows);
    return { user: toUser(rows[0]), error: null };
  } catch (e) {
    const err = e as { code?: string; message: string };
    if (err.code === "23505") return { user: null, error: { message: "A user with this email address has already been registered", code: "email_exists" } };
    return { user: null, error: { message: err.message } };
  }
}

export const sessionToken = (u: AppUser) => signJwt({ sub: u.id, role: "authenticated", email: u.email });

/** Shared shape of the server clients (Supabase-compatible subset used by the app). */
export function dataApi(token: string | null, claims: Claims | null) {
  const rest = restClient(token);
  return {
    from: rest.from.bind(rest),
    rpc: rest.rpc.bind(rest),
    storage: { from: (bucket: string) => bucketApi(claims, bucket) },
  };
}
