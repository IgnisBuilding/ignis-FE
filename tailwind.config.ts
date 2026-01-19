import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
      colors: {
        "primary": "#1a3d35",
        "accent": "#FDFBF7",
        "background-light": "#FDFBF7",
        "background-dark": "#151d1b",
        "forest": "#1a3d35",
        "cream": "#FDFBF7",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "sans": ["Inter", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px",
        "2xl": "1rem", // Kept from original, might be useful
        "3xl": "1.5rem", // Kept from original
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
}

export default config