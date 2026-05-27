import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "rgb(var(--color-bg-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-bg-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--color-bg-tertiary) / <alpha-value>)",
          card: "rgb(var(--color-bg-card) / <alpha-value>)",
          light: "rgb(var(--color-bg-light) / <alpha-value>)",
        },
        border: {
          light: "rgb(var(--color-border-light) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-border-default) / <alpha-value>)",
          accent: "rgb(var(--color-border-accent) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--color-gold) / <alpha-value>)",
          light: "rgb(var(--color-gold-light) / <alpha-value>)",
          dark: "rgb(var(--color-gold-dark) / <alpha-value>)",
          muted: "rgb(var(--color-gold-muted) / <alpha-value>)",
        },
      },
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["16px", "24px"],
        lg: ["18px", "28px"],
        xl: ["20px", "30px"],
        "2xl": ["28px", "36px"],
        "3xl": ["32px", "40px"],
        "4xl": ["48px", "56px"],
        "5xl": ["60px", "72px"],
      },
      boxShadow: {
        elevated: "0 8px 32px rgb(var(--shadow-elevation))",
        hover: "0 12px 40px rgb(var(--shadow-hover))",
        card: "0 2px 16px rgb(var(--shadow-card))",
        subtle: "0 1px 8px rgb(var(--shadow-subtle))",
      },
    },
  },
  plugins: [],
};
export default config;
