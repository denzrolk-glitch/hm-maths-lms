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
        brand: {
          50: "#fff4ec", 100: "#ffe5d2", 200: "#ffc6a1", 300: "#ff9f66", 400: "#fb7a2e",
          500: "#f05b06", 600: "#d14b03", 700: "#ad3b06", 800: "#8a300c", 900: "#71290e", 950: "#3d1203",
        },
        ink: { DEFAULT: "#050505", 900: "#0b0b0b", 800: "#121110", 700: "#1a1410", 600: "#241c16" },
        sand: { 100: "#efe4d9", 300: "#cdbfb3", 500: "#b5a69c" },
        teal: { 50: "#ecf8f7", 100: "#d0eeec", 500: "#26968f", 600: "#1f807b", 700: "#196763", 800: "#14524f" },
        portal: { head: "hsl(var(--portal-head))", bg: "#f4f6fa" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "marquee-y": { from: { transform: "translateY(0)" }, to: { transform: "translateY(-50%)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        glow: { "0%,100%": { opacity: "0.55" }, "50%": { opacity: "1" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "marquee-y": "marquee-y 18s linear infinite",
        "spin-slow": "spin-slow 30s linear infinite",
        glow: "glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
