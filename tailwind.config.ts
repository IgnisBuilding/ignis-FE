import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fefdf9',
          100: '#fdf8f0',
          200: '#faf0e0',
          300: '#f5e6c8',
          400: '#efd6a3',
          500: '#e6c078',
        },
        'dark-green': {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#a8d8a8',
          300: '#6bb76b',
          400: '#4a9c4a',
          500: '#2d6b2d',
          600: '#1e4a1e',
          700: '#153a15',
          800: '#0d2b0d',
          900: '#051c05',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
}

export default config