import type { Config } from "tailwindcss";

/**
 * ⚠️ RANGLAR CSS O'ZGARUVCHILARIDAN (`globals.css` dagi `:root`).
 * Hex qiymatlar to'g'ridan-to'g'ri yozilmaydi: aks holda tungi
 * rejim uchun har rangni IKKINCHI marta e'lon qilish kerak bo'lardi
 * va ular albatta ajralib ketardi.
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /**
       * ⚠️ `--font-sans` NI `layout.tsx` DAGI `next/font` BERADI.
       * Bu yerda shrift NOMI yozilsa (masalan "Plus Jakarta Sans"),
       * brauzer uni tizimdan qidirib topa olmay, standart shriftga
       * qaytardi — ya'ni `next/font` yuklagan fayl ishlatilmasdi.
       */
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Jiddiylik va holat ranglari — bir joyda.
        severity: {
          low: "hsl(var(--severity-low))",
          normal: "hsl(var(--severity-normal))",
          high: "hsl(var(--severity-high))",
        },
      },
      /**
       * ⚠️ RADIUS SHKALASI `--radius` DAN HOSILA. Karta yirik
       * (`2xl`), uning ichidagi element kichikroq bo'lishi kerak:
       * bir xil radius ichma-ich joylashganda "qavariq" ko'rinardi.
       */
      borderRadius: {
        "2xl": "var(--radius)",
        xl: "calc(var(--radius) - 0.375rem)",
        lg: "calc(var(--radius) - 0.5rem)",
        md: "calc(var(--radius) - 0.625rem)",
        sm: "calc(var(--radius) - 0.75rem)",
      },
      /**
       * ⚠️ SOYA TOKENDAN: kartaning "balandligi" bitta joydan
       * boshqariladi. Komponentda `shadow-[0_4px...]` yozilsa,
       * tungi rejimda uni ikkinchi marta e'lon qilish kerak bo'lardi.
       */
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        /** Karta paydo bo'lishi — ro'yxat "sakramasligi" uchun. */
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.25s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
