/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cute: {
          pink: {
            DEFAULT: '#F8DDE5',
            50: '#FDF7F9',
            100: '#F8DDE5',
            200: '#F2C1D0',
            300: '#ECA5BB',
            400: '#DF7B9A',
            500: '#CF597C',
            dark: '#B98FA3'
          },
          cream: {
            DEFAULT: '#FFF9F2',
            light: '#FFFCF7',
            dark: '#24232B'
          },
          lavender: {
            DEFAULT: '#EAE3F8',
            50: '#F6F3FC',
            100: '#EAE3F8',
            200: '#D5C8F2',
            dark: '#292536'
          },
          peach: {
            DEFAULT: '#F9E6D7',
            100: '#F9E6D7',
            200: '#F3CCA8',
            dark: '#42343E'
          },
          brown: {
            DEFAULT: '#6B514A',
            light: '#9E837C',
            muted: '#B09B95',
            dark: '#F7EEF1'
          },
          surface: {
            light: '#FFFFFF',
            dark: '#2D2B37'
          },
          border: {
            light: '#F0E2D8',
            dark: '#3D384A'
          }
        }
      },
      fontFamily: {
        sans: ['Quicksand', 'Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'cute': '0 8px 24px -4px rgba(107, 81, 74, 0.08), 0 4px 12px -2px rgba(248, 221, 229, 0.3)',
        'cute-lg': '0 12px 32px -4px rgba(107, 81, 74, 0.12), 0 6px 16px -2px rgba(248, 221, 229, 0.4)',
        'cute-dark': '0 8px 24px -4px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.03)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}

