import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Zero-cost, stateless maths captcha. The answer is never sent to the browser: the token is an
 * HMAC of (answer, expiry, nonce) signed with a server secret. Expires after 10 minutes.
 */
const TTL_MS = 10 * 60 * 1000;
const secret = () => process.env.CAPTCHA_SECRET || process.env.JWT_SECRET || "hm-maths-dev-secret";
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");
const rnd = (min: number, max: number) => min + (randomBytes(1)[0]! % (max - min + 1));

function svgFor(text: string) {
  const chars = [...text];
  const w = 150, h = 48;
  const lines = Array.from({ length: 6 }, () =>
    `<line x1="${rnd(0, w)}" y1="${rnd(0, h)}" x2="${rnd(0, w)}" y2="${rnd(0, h)}" stroke="hsl(${rnd(0, 360)},40%,55%)" stroke-width="1" opacity=".55"/>`).join("");
  const dots = Array.from({ length: 30 }, () => `<circle cx="${rnd(0, w)}" cy="${rnd(0, h)}" r="1" fill="#94a3b8"/>`).join("");
  const step = (w - 20) / chars.length;
  const glyphs = chars.map((c, i) =>
    `<text x="${12 + i * step}" y="${32 + rnd(0, 6) - 3}" transform="rotate(${rnd(0, 24) - 12} ${12 + i * step} 28)" font-family="Verdana,Arial,sans-serif" font-size="${rnd(20, 25)}" font-weight="700" fill="hsl(${rnd(180, 230)},45%,${rnd(20, 35)}%)">${c === "*" ? "×" : c}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" rx="8" fill="#eef2f7"/>${dots}${lines}${glyphs}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export type Captcha = { image: string; token: string };

export function createCaptcha(): Captcha {
  const op = rnd(0, 2);
  let a = rnd(2, 19), b = rnd(2, 9);
  if (op === 1 && b > a) [a, b] = [b, a];
  const answer = op === 0 ? a + b : op === 1 ? a - b : a * b;
  if (op === 2) a = rnd(2, 9);
  const real = op === 2 ? a * b : answer;
  const text = `${a}${op === 0 ? "+" : op === 1 ? "-" : "*"}${b}=?`;
  const exp = Date.now() + TTL_MS;
  const nonce = randomBytes(8).toString("base64url");
  const token = `${exp}.${nonce}.${sign(`${real}|${exp}|${nonce}`)}`;
  return { image: svgFor(text), token };
}

export function verifyCaptcha(token: string, answer: string): boolean {
  const [expStr, nonce, sig] = String(token).split(".");
  const exp = Number(expStr);
  if (!exp || !nonce || !sig || Date.now() > exp) return false;
  const n = Number(String(answer).trim());
  if (!Number.isInteger(n)) return false;
  const expected = Buffer.from(sign(`${n}|${exp}|${nonce}`));
  const got = Buffer.from(sig);
  return expected.length === got.length && timingSafeEqual(expected, got);
}
