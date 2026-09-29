/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: '#FF7F6A',
        // Variante escurecida: texto branco sobre ela tem contraste 4,9:1 (WCAG AA exige 4,5:1)
        'coral-dark': '#C7432D',
        teal: '#006B76',
      },
    },
  },
  plugins: [],
};