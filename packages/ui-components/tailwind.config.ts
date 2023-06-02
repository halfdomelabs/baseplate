import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import tailwindForms from '@tailwindcss/forms';
import colors from 'tailwindcss/colors';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['class'],
  theme: {
    fontFamily: {
      body: ['Open Sans', ...defaultTheme.fontFamily.sans],
    },
    extend: {
      colors: {
        primary: colors.blue,
        secondary: colors.gray,
        foreground: colors.slate,
        background: colors.slate,
      },
    },
  },
  plugins: [tailwindForms],
} satisfies Config;
