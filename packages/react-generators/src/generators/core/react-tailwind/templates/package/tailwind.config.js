import tailwindForms from '@tailwindcss/forms';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    extend: {},
  },
  plugins: [tailwindForms],
};
