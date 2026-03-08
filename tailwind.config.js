/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red:      '#E31A2D',
          'red-dark': '#C41525',
          navy:     '#001C3F',
          header:   '#102E5A',
          hero:     '#00295F',
          price:    '#122E58',
        },
        // dark-* tokens now map to the new light/navy theme
        dark: {
          bg:     '#F6F8FA',   // page background — light gray-white
          card:   '#FFFFFF',   // card/panel background — pure white
          border: '#D9E1EB',   // card borders — light gray-blue
          muted:  '#EEF2F7',   // muted backgrounds, inputs
          nav:    '#102E5A',   // navbar background
          footer: '#001C3F',   // footer background
        },
        text: {
          primary:   '#001C3F',  // main text — dark navy
          secondary: '#122E58',  // secondary text — slightly lighter navy
          muted:     '#647A96',  // muted/label text — gray-blue
          onDark:    '#F6F8FA',  // text on dark (navy) backgrounds
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        pill: '100px',
      },
      boxShadow: {
        card:   '0 2px 16px rgba(0, 28, 63, 0.08)',
        'card-hover': '0 8px 32px rgba(0, 28, 63, 0.14)',
        nav:    '0 2px 20px rgba(0, 28, 63, 0.18)',
        red:    '0 4px 16px rgba(227, 26, 45, 0.30)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in':  'fadeIn 0.2s ease-out',
        'bounce-dot': 'bounceDot 1.4s infinite ease-in-out',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%':           { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
