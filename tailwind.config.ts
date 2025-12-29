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
        accent: 'rgb(var(--accent-rgb))',
      },
      fontFamily: {
        sans: ['MedievalSharp', 'cursive'],
        serif: ['Cinzel', 'serif'],
      },
       boxShadow: {
        'glow-primary': '0 0 15px 5px rgba(var(--primary-rgb), 0.4)',
        'glow-accent': '0 0 15px 5px rgba(var(--accent-rgb), 0.3)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
