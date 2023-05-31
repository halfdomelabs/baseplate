import path from 'path';
import type { Config } from 'tailwindcss';

module.exports = {
  presets: [require('@halfdomelabs/ui-components/tailwind-base')],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    path.join(
      path.dirname(require.resolve('@halfdomelabs/ui-components')),
      '**/*.{js,jsx,ts,tsx}'
    ),
  ],
} satisfies Config;
