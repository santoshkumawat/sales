/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        navy: {
          50: '#EEF2F8',
          100: '#DCE4F0',
          200: '#B6C5DD',
          300: '#8AA3C6',
          400: '#5C7CA9',
          500: '#3A5C8C',
          600: '#28456C',
          700: '#1B3253',
          800: '#12253F',
          900: '#0C1A2E',
          950: '#071120',
        },
        reef: {
          50: '#E8F7F5',
          100: '#CDEEEA',
          200: '#9DDCD5',
          300: '#66C6BC',
          400: '#31AAA0',
          500: '#118E85',
          600: '#0B736C',
          700: '#0A5C57',
          800: '#0A4945',
          900: '#093C39',
        },
        paper: '#F5F7FA',
        line: '#E2E8F0',
        pos: '#0F7B54',
        neg: '#C0392B',
        warn: '#B45309',
      },
      boxShadow: {
        card: '0 1px 2px rgba(12, 26, 46, 0.06), 0 1px 3px rgba(12, 26, 46, 0.04)',
        pop: '0 12px 32px rgba(12, 26, 46, 0.16)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.32,0.72,0,1)',
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
}
