import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          panel: 'rgb(var(--color-panel) / <alpha-value>)',
          muted: 'rgb(var(--color-muted) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          text: 'rgb(var(--color-text) / <alpha-value>)',
          subtle: 'rgb(var(--color-text-subtle) / <alpha-value>)',
          accent: 'rgb(var(--color-accent) / <alpha-value>)',
          accentSoft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
          success: 'rgb(var(--color-success) / <alpha-value>)',
          warning: 'rgb(var(--color-warning) / <alpha-value>)',
          danger: 'rgb(var(--color-danger) / <alpha-value>)',
        },
      },
      boxShadow: {
        panel: '0 10px 35px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
