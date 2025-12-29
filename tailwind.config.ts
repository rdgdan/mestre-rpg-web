import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          start: 'rgb(var(--background-start-rgb))',
          end: 'rgb(var(--background-end-rgb))',
        },
        surface: 'rgb(var(--surface-rgb))',
        text: 'rgb(var(--text-rgb))',
        primary: 'rgb(var(--primary-rgb))',
        secondary: 'rgb(var(--secondary-rgb))',
        accent: 'rgb(var(--accent-rgb))',

        // Semantic D&D Theme Colors
        'rpg-dark': '#121212',
        'rpg-slate': '#1a1a2e',
        'rpg-panel': 'rgba(30, 30, 46, 0.95)',
        'rpg-gold': '#DAA520',
        'rpg-gold-light': '#FFD700',
        'rpg-red': '#8B0000',
        'rpg-parchment': '#F5F5F5',
        'rpg-grey': '#C0C0C0',
      },
      fontFamily: {
        sans: ['var(--font-lato)', 'sans-serif'],
        serif: ['var(--font-cinzel)', 'serif'],
        medieval: ['var(--font-medieval)', 'cursive'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'dnd-gradient': 'linear-gradient(to bottom, #1a1a2e, #121212)',
      },
      boxShadow: {
        'glow-gold': '0 0 15px 2px rgba(218, 165, 32, 0.3)',
        'glow-red': '0 0 15px 2px rgba(139, 0, 0, 0.4)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
