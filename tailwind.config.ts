import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        body: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink:     "rgb(var(--ink) / <alpha-value>)",
        stroke:  "rgb(var(--stroke) / <alpha-value>)",
        paper:   "rgb(var(--paper) / <alpha-value>)",
        paper2:  "rgb(var(--paper2) / <alpha-value>)",
        chalk:   "rgb(var(--chalk) / <alpha-value>)",
        tomato:  "rgb(var(--tomato) / <alpha-value>)",
        cobalt:  "rgb(var(--cobalt) / <alpha-value>)",
        mustard: "rgb(var(--mustard) / <alpha-value>)",
        moss:    "rgb(var(--moss) / <alpha-value>)",
        bubble:  "rgb(var(--bubble) / <alpha-value>)",
      },
      boxShadow: {
        hard:   "4px 4px 0 0 rgb(var(--stroke))",
        hardlg: "6px 6px 0 0 rgb(var(--stroke))",
        hardxl: "8px 8px 0 0 rgb(var(--stroke))",
        hardsm: "2px 2px 0 0 rgb(var(--stroke))",
        inset1: "inset 0 -3px 0 0 rgb(var(--stroke) / 0.15)",
      },
      borderWidth: {
        3: "3px",
      },
      keyframes: {
        stamp: {
          "0%": { transform: "rotate(-8deg) scale(0.7)", opacity: "0" },
          "60%": { transform: "rotate(2deg) scale(1.06)", opacity: "1" },
          "100%": { transform: "rotate(-2deg) scale(1)" },
        },
        bob: {
          "0%,100%": { transform: "translateY(0) rotate(-1deg)" },
          "50%": { transform: "translateY(-4px) rotate(1deg)" },
        },
        jitter: {
          "0%,100%": { transform: "translate(0,0)" },
          "25%": { transform: "translate(-0.5px,0.5px)" },
          "75%": { transform: "translate(0.5px,-0.5px)" },
        },
        slidein: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        podiumRise: {
          "0%": { transform: "translateY(120%)", opacity: "0" },
          "60%": { transform: "translateY(-10%)", opacity: "1" },
          "100%": { transform: "translateY(0)" },
        },
        confettiFall: {
          "0%":   { transform: "translateY(-15vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0.7" },
        },
        wiggle2: {
          "0%,100%": { transform: "rotate(-4deg)" },
          "50%":     { transform: "rotate(4deg)" },
        },
        hop1: {
          "0%,100%": { transform: "translateY(0) rotate(-3deg) scale(1)" },
          "20%":     { transform: "translateY(-18px) rotate(8deg) scale(1.08)" },
          "40%":     { transform: "translateY(0) rotate(-6deg) scale(1)" },
          "60%":     { transform: "translateY(-10px) rotate(4deg) scale(1.04)" },
          "80%":     { transform: "translateY(0) rotate(0deg) scale(1)" },
        },
        hop2: {
          "0%,100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%":     { transform: "translateY(-8px) rotate(2deg)" },
        },
        hop3: {
          "0%,100%": { transform: "translateY(0) rotate(0)" },
          "50%":     { transform: "translateY(-3px) rotate(1.5deg)" },
        },
        twinkle: {
          "0%,100%": { transform: "scale(0.4) rotate(0deg)", opacity: "0" },
          "50%":     { transform: "scale(1) rotate(45deg)",  opacity: "1" },
        },
        haloPulse: {
          "0%,100%": { transform: "scale(0.95)", opacity: "0.5" },
          "50%":     { transform: "scale(1.1)",  opacity: "0.85" },
        },
        dropIn: {
          "0%":   { transform: "translateY(-160%) rotate(-30deg)", opacity: "0" },
          "70%":  { transform: "translateY(8%) rotate(6deg)",      opacity: "1" },
          "100%": { transform: "translateY(0) rotate(0deg)" },
        },
      },
      animation: {
        stamp: "stamp 380ms cubic-bezier(.2,.9,.3,1.4)",
        bob: "bob 4s ease-in-out infinite",
        jitter: "jitter 220ms steps(2) infinite",
        slidein: "slidein 220ms ease-out both",
        podiumRise: "podiumRise 700ms cubic-bezier(.2,.9,.3,1.4) both",
        confettiFall: "confettiFall linear infinite",
        wiggle2: "wiggle2 1.5s ease-in-out infinite",
        hop1: "hop1 1.6s ease-in-out infinite",
        hop2: "hop2 2s ease-in-out infinite",
        hop3: "hop3 2.6s ease-in-out infinite",
        twinkle: "twinkle 1.8s ease-in-out infinite",
        haloPulse: "haloPulse 2s ease-in-out infinite",
        dropIn: "dropIn 900ms cubic-bezier(.2,.9,.3,1.4) both",
      },
    },
  },
  plugins: [],
};
export default config;
