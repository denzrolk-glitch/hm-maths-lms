import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = new Set(["tute-pdfs", "bank-slips", "answer-sheets", "papers"]);

/**
 * Short-lived signed download link for private files. Signing uses the *user's* session, so the
 * storage RLS policies decide access (approved month for tutes, owner/admin for slips & answers).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ bucket: string }> }) {
  const { bucket } = await params;
  const path = req.nextUrl.searchParams.get("path");
  if (!ALLOWED.has(bucket) || !path || path.includes("..")) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`, req.url));

  const download = req.nextUrl.searchParams.get("download") === "1";
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 120, download ? { download: true } : undefined);
  if (error || !data) return NextResponse.json({ error: "File not found or access denied" }, { status: 403 });
  return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "no-store" } });
}
