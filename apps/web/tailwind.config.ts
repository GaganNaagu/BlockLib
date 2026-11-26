import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A5F',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#334155',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#B45309',
          foreground: '#FFFFFF',
        },
        background: '#F8FAFC',
        foreground: '#0F172A',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
        muted: {
          DEFAULT: '#E9EEF5',
          foreground: '#475569',
        },
        border: '#CBD5E1',
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        heading: ['"Crimson Pro"', 'Georgia', 'serif'],
        sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
