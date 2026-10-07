import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-sinhala)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sinhala)", "var(--font-sans)", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "var(--font-sinhala)", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        // Brand accent: HM orange
        brand: {
          50: "#fff4ec", 100: "#ffe5d2", 200: "#ffc6a1", 300: "#ff9f66", 400: "#fb7a2e",
          500: "#f05b06", 600: "#d14b03", 700: "#ad3b06", 800: "#8a300c", 900: "#71290e", 950: "#3d1203",
        },
        sand: { 100: "#efe4d9", 300: "#cdbfb3", 500: "#b5a69c" },
        // Primary scale (HM orange), driven by CSS variables in globals.css. Kept under the old "teal" name.
        teal: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((k) => [k, `rgb(var(--teal-${k}) / <alpha-value>)`])),
        // Neutral greys (no blue cast)
        slate: {
          50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c",
          600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1a1715", 950: "#0c0a09",
        },
        ink: { DEFAULT: "#0b0b0b", 900: "#0b0b0b", 800: "#121110", 700: "#1a1410", 600: "#241c16" },
        portal: { head: "hsl(var(--portal-head))", bg: "hsl(var(--background))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "marquee-y": { from: { transform: "translateY(0)" }, to: { transform: "translateY(-50%)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        glow: { "0%,100%": { opacity: "0.55" }, "50%": { opacity: "1" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        flicker: { "0%,100%": { transform: "scale(1) rotate(-2deg)" }, "50%": { transform: "scale(1.08) rotate(3deg)" } },
        blob: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "33%": { transform: "translate(30px,-40px) scale(1.08)" }, "66%": { transform: "translate(-20px,20px) scale(0.95)" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "marquee-y": "marquee-y 18s linear infinite",
        "spin-slow": "spin-slow 30s linear infinite",
        glow: "glow 3s ease-in-out infinite",
        "fade-up": "fade-up .5s cubic-bezier(.22,1,.36,1) both",
        shimmer: "shimmer 2.2s linear infinite",
        flicker: "flicker 1.6s ease-in-out infinite",
        blob: "blob 18s ease-in-out infinite",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,14,10,.05), 0 8px 24px -12px rgba(20,14,10,.16)",
        lift: "0 2px 4px rgba(20,14,10,.05), 0 18px 40px -18px rgba(20,14,10,.45)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
