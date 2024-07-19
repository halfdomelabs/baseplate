import tailwindBase from '@halfdomelabs/ui-components/tailwind-base';
import type { Config } from 'tailwindcss';

export default {
  presets: [
    {
      ...tailwindBase,
      plugins: [],
    },
  ],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
} satisfies Config;
