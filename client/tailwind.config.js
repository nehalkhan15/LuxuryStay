/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        cinzel: ['"Cinzel"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        luxury: {
          white: '#F7FBFD',
          'light-frost': '#D6E6EF',
          'muted-blue': '#7FA6B8',
          'deep-slate': '#2A3E4B',
        },
        gold: {
          50: '#fbf8ef',
          100: '#f5eed7',
          200: '#ebdcab',
          300: '#dfc476',
          400: '#d4af37',
          500: '#c59b27',
          600: '#ab7d1f',
          700: '#895d1c',
          800: '#724b1d',
          900: '#613f1d',
          950: '#38210d',
        },
        obsidian: {
          800: '#161c28',
          850: '#111722',
          900: '#0c101a',
          950: '#070a11',
        }
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.25)',
        'gold-glow-lg': '0 0 40px -5px rgba(212, 175, 55, 0.35)',
        'luxury': '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
