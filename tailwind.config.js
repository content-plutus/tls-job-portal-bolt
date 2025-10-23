/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Playfair Display', 'Georgia', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        legal: {
          navy: {
            50: '#E5F0F9',
            100: '#CCE0F3',
            200: '#99C5E7',
            300: '#66ABDB',
            400: '#3391CF',
            500: '#0077C3',
            600: '#0062A9',
            700: '#004D8F',
            800: '#003875',
            900: '#00205B',
          },
          gold: {
            50: '#FCF7F1',
            100: '#F8EFE3',
            200: '#F1DEC6',
            300: '#E3CBAA',
            400: '#D4B88E',
            500: '#C5A572',
            600: '#C19C35',
            700: '#AF8B2A',
            800: '#9D7A1F',
            900: '#8B6914',
          },
          red: {
            50: '#FCECEE',
            100: '#F8D9DC',
            200: '#F0B3B9',
            300: '#E5808C',
            400: '#CD5666',
            500: '#B52C40',
            600: '#9D2235',
            700: '#912334',
            800: '#7F1E2D',
            900: '#6D1826',
          },
          slate: {
            50: '#EFF3F5',
            100: '#DFE6EA',
            200: '#C2CCD4',
            300: '#A5B3BE',
            400: '#8899A8',
            500: '#6B7F92',
            600: '#5F6D7C',
            700: '#4E5A68',
            800: '#3D4854',
            900: '#2C3540',
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
