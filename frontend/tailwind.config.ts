import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        // Paleta própria do Prospecta IA — evita o "SaaS kit" genérico
        // (roxo/azul padrão). Base neutra levemente azulada + acento coral
        // (energia/urgência de venda) + escala semântica de oportunidade.
        ink: {
          50: "#F4F6F8",
          100: "#E7EBEF",
          200: "#CBD3DB",
          300: "#9FACB9",
          400: "#6B7A8A",
          500: "#4A5868",
          600: "#374250",
          700: "#28313C",
          800: "#1B222B",
          900: "#12171D",
          950: "#0A0D11",
        },
        accent: {
          50: "#FFF3EF",
          100: "#FFE2D8",
          200: "#FFC0AA",
          300: "#FF9A78",
          400: "#FF7850",
          500: "#F2582E", // acento primário — coral queimado
          600: "#D8431E",
          700: "#B23417",
          800: "#8C2A16",
          900: "#6E2415",
        },
        opportunity: {
          low: "#2AA876", // teal — site já bom, baixa oportunidade
          mid: "#E0A429", // âmbar — oportunidade média
          high: "#E24C3B", // coral/vermelho — alta oportunidade
        },
      },
      borderRadius: {
        xl: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
