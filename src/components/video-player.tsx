"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Maximize, Minimize } from "lucide-react";
import { useT } from "@/i18n/client";

export type Watermark = { mobile: string | null; nic: string | null; studentId: string | null };

/**
 * YouTube (unlisted) player wrapped in our own container so the anti-piracy watermark stays on top —
 * including in fullscreen (we fullscreen the wrapper, and YouTube's own fullscreen is disabled).
 */
export function VideoPlayer({ videoId, watermark, title, live = false }: { videoId: string; watermark: Watermark; title: string; live?: boolean }) {
  const t = useT("common.video");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  const [pos, setPos] = useState({ top: 12, left: 10 });

  useEffect(() => {
    const move = () => setPos({ top: 6 + Math.random() * 78, left: 4 + Math.random() * 62 });
    move();
    const t = setInterval(move, 4500);
    const onFs = () => setIsFs(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => { clearInterval(t); document.removeEventListener("fullscreenchange", onFs); };
  }, []);

  const label = [watermark.mobile, watermark.nic].filter(Boolean).join(" · ") || watermark.studentId || "HM Maths";
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", fs: "0", playsinline: "1", iv_load_policy: "3", ...(live ? { autoplay: "1" } : {}) });

  return (
    <div
      ref={wrapRef}
      className="no-select group relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-xl ring-1 ring-border"
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params}`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {/* Tiled faint watermark */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 place-items-center opacity-[0.07]">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="-rotate-12 whitespace-nowrap font-mono text-xs font-bold text-white sm:text-sm">{label}</span>
        ))}
      </div>
      {/* Floating watermark that jumps around */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-10 rounded-md bg-black/25 px-2 py-1 font-mono text-[11px] font-semibold text-white/70 sm:text-sm"
        animate={{ top: `${pos.top}%`, left: `${pos.left}%` }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      >
        {label}
        {watermark.studentId ? <span className="block text-[9px] font-medium opacity-80 sm:text-[10px]">{watermark.studentId}</span> : null}
      </motion.div>
      <button
        type="button"
        onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrapRef.current?.requestFullscreen())}
        className="absolute bottom-14 right-3 z-20 rounded-md bg-black/60 p-2 text-white opacity-80 transition hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={isFs ? t("exitFullscreen") : t("fullscreen")}
      >
        {isFs ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
    </div>
  );
}
