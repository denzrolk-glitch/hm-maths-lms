import type { PostgrestClient } from "@supabase/postgrest-js";
/** The query surface shared by the server, admin and browser clients. */
export type DbClient = { from: PostgrestClient["from"]; rpc: PostgrestClient["rpc"] };
