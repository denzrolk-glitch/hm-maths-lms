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
        // Accent: bright sky / cyan
        brand: {
          50: "#ecfbff", 100: "#d5f4fe", 200: "#b4ecfd", 300: "#7fdffb", 400: "#41c9f5",
          500: "#14b0e6", 600: "#068dc4", 700: "#08709e", 800: "#0e5d82", 900: "#114e6c", 950: "#0a3148",
        },
        sand: { 100: "#efe4d9", 300: "#cdbfb3", 500: "#b5a69c" },
        // Primary scale (azure blue). Kept under the old "teal" name so every existing screen follows the new palette.
        teal: {
          50: "#eff7ff", 100: "#dbeefe", 200: "#bfe2fe", 300: "#93cffd", 400: "#5fb4fa",
          500: "#3897f5", 600: "#1f7ae8", 700: "#1963d4", 800: "#1b51ab", 900: "#1c4687", 950: "#152c55",
        },
        ink: { DEFAULT: "#0b1530", 900: "#0e1a3a", 800: "#13224a", 700: "#1a2c5c", 600: "#22386f" },
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
        soft: "0 1px 2px rgba(16,42,90,.04), 0 8px 24px -12px rgba(16,42,90,.12)",
        lift: "0 2px 4px rgba(16,42,90,.04), 0 18px 40px -18px rgba(23,92,211,.35)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
