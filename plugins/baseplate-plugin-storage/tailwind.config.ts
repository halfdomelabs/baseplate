import type { Config } from 'tailwindcss';

import tailwindBase from '@halfdomelabs/ui-components/tailwind-base';

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
