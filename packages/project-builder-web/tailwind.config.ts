import path from 'node:path';
import type { Config } from 'tailwindcss';
import tailwindBase from '@halfdomelabs/ui-components/tailwind-base';

export default {
  presets: [tailwindBase],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    path.join(
      path.dirname(require.resolve('@halfdomelabs/ui-components')),
      '**/*.{js,jsx,ts,tsx}'
    ),
  ],
} satisfies Config;
