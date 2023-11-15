module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')],
};
