import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#42b883',
          light: '#5ed3a0',
          dark: '#33a06f',
        },
        surface: {
          DEFAULT: '#1e1e3a',
          dark: '#0f0f23',
          darker: '#1a1a2e',
          light: '#2a2a4a',
          border: 'rgba(255, 255, 255, 0.1)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
