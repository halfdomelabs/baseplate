import path from 'node:path';
import tailwindBase from '@halfdomelabs/ui-components/tailwind-base';
import type { Config } from 'tailwindcss';

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
