"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Quote, Volume2, VolumeX } from "lucide-react";
import { useT } from "@/i18n/client";
import { SectionTitle } from "./section-title";

type Item = { name: string; meta: string; text: string };

export function Testimonials({ videoId }: { videoId: string }) {
  const t = useT("landing.testimonials");
  const items = t.raw<Item[]>("items") ?? [];
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [items.length]);

  const cur = items[i];
  return (
    <section id="testimonials" className="relative scroll-mt-24 bg-[#050505] py-24">
      <SectionTitle label={t("label")} title={t("title")} />
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: "easeOut" }} className="container mt-12">
        <div className="relative mx-auto min-h-[420px] max-w-5xl sm:min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0a08] shadow-[0_0_120px_rgba(240,91,6,.12)] sm:aspect-video">
          {videoId && playing ? (
            <iframe className="absolute inset-0 h-full w-full" title={t("watch")} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`} />
          ) : (
            <>
              <div className="bg-hex absolute inset-0 opacity-60" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(240,91,6,.25),transparent_60%)]" />
              {videoId ? (
                <img src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
              ) : null}
              <div className="absolute inset-0 flex flex-col justify-center px-6 pb-16 pt-6 sm:px-16 sm:pb-6">
                <Quote className="h-10 w-10 text-brand-500 sm:h-14 sm:w-14" />
                <AnimatePresence mode="wait">
                  {cur ? (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                      <p className="mt-4 max-w-3xl font-display text-lg font-semibold leading-snug text-white/90 sm:text-3xl">“{cur.text}”</p>
                      <p className="mt-5 text-sm font-semibold text-brand-400 sm:text-base">{cur.name}</p>
                      <p className="text-xs text-white/45 sm:text-sm">{cur.meta}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </>
          )}

          {!playing && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 sm:bottom-6 sm:left-6 sm:right-6">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black sm:px-5 sm:text-sm">{t("watch")}</span>
              <div className="flex items-center gap-2">
                {items.length > 1 && (
                  <>
                    <button type="button" aria-label={t("previous")} onClick={() => setI((v) => (v - 1 + items.length) % items.length)}
                      className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur hover:border-brand-500"><ChevronLeft className="h-5 w-5" /></button>
                    <button type="button" aria-label={t("next")} onClick={() => setI((v) => (v + 1) % items.length)}
                      className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur hover:border-brand-500"><ChevronRight className="h-5 w-5" /></button>
                  </>
                )}
                {videoId ? (
                  <>
                    <button type="button" aria-label={muted ? t("unmute") : t("mute")} onClick={() => setMuted((m) => !m)}
                      className="grid h-12 w-12 place-items-center rounded-full bg-brand-500 text-white shadow-[0_0_30px_rgba(240,91,6,.5)] hover:bg-brand-400">
                      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <button type="button" aria-label={t("play")} onClick={() => setPlaying(true)}
                      className="grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white shadow-[0_0_40px_rgba(240,91,6,.6)] hover:bg-brand-400">
                      <Play className="h-6 w-6 fill-white" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
