import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import tailwindForms from '@tailwindcss/forms';
import colors from 'tailwindcss/colors';
import headlessUi from '@headlessui/tailwindcss';

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
        error: colors.red,
        ring: '215 20.2% 65.1%',
      },
    },
  },
  plugins: [tailwindForms, headlessUi],
} satisfies Config;
