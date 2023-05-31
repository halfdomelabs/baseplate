import path from 'path';

module.exports = {
  preset: require('@halfdomelabs/ui-components/tailwind-base'),
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    path.join(
      path.dirname(require.resolve('@halfdomelabs/ui-components')),
      '**/*.{js,jsx,ts,tsx}'
    ),
  ],
};
