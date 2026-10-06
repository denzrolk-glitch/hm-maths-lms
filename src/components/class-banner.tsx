import Image from "next/image";
import { cn } from "@/lib/utils";

const GRADIENTS: Record<string, string> = {
  Theory: "from-[#1963d4] via-[#1f7ae8] to-[#41c9f5]",
  Revision: "from-[#0e5d82] via-[#068dc4] to-[#7fdffb]",
  "Paper Class": "from-[#4338ca] via-[#6366f1] to-[#38bdf8]",
  "Extra Class": "from-[#be185d] via-[#ec4899] to-[#f9a8d4]",
  "Free Seminar": "from-[#0f766e] via-[#14b8a6] to-[#5eead4]",
};
const SYMBOLS: Record<string, string> = { Theory: "∫", Revision: "Σ", "Paper Class": "π", "Extra Class": "√", "Free Seminar": "∞" };

/** Class poster: uploaded banner, or a generated gradient poster with a maths symbol. Safe in server + client components. */
export function ClassBanner({ cls, className }: { cls: { banner_url: string | null; class_type: string; title: string }; className?: string }) {
  return (
    <div className={cn("relative aspect-[16/7] overflow-hidden bg-gradient-to-br", GRADIENTS[cls.class_type] ?? GRADIENTS.Theory, className)}>
      {cls.banner_url ? (
        <Image src={cls.banner_url} alt={cls.title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
      ) : (
        <>
          <div className="bg-hex absolute inset-0 opacity-70" />
          <span className="absolute -right-2 -top-6 select-none font-display text-[9rem] font-black leading-none text-white/15">
            {SYMBOLS[cls.class_type] ?? "∫"}
          </span>
          <span className="absolute bottom-3 left-4 right-24 line-clamp-2 font-display text-lg font-extrabold leading-tight text-white/90 drop-shadow">{cls.title}</span>
        </>
      )}
    </div>
  );
}
