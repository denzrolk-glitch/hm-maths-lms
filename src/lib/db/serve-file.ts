import "server-only";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";

const TYPES: Record<string, string> = {
  ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
};

export async function serveFile(full: string, opts: { download?: boolean; cache: string; type?: string }) {
  let size = 0;
  try { const s = await stat(full); if (!s.isFile()) throw new Error(); size = s.size; } catch {
    return new Response("Not found", { status: 404 });
  }
  const name = path.basename(full);
  const type = opts.type || TYPES[path.extname(full).toLowerCase()] || "application/octet-stream";
  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "content-type": type,
      "content-length": String(size),
      "cache-control": opts.cache,
      "x-content-type-options": "nosniff",
      "content-disposition": `${opts.download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
}
