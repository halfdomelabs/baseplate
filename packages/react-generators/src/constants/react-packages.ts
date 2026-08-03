export const REACT_PACKAGES = {
  // React
  react: '19.2.8',
  'react-dom': '19.2.8',
  '@tanstack/react-router': '1.168.23',
  '@tanstack/router-plugin': '1.168.23',
  '@types/node': `^22.0.0`,
  '@types/react': '19.2.18',
  '@types/react-dom': '19.2.4',
  '@vitejs/plugin-react': '6.0.5',
  vite: '8.2.0',
  'vite-plugin-svgr': '5.2.0',

  loglevel: '1.9.2',

  // Tailwind
  '@tailwindcss/vite': '4.3.3',
  tailwindcss: '4.3.3',
  'prettier-plugin-tailwindcss': '0.7.2',
  'tw-animate-css': '1.4.0',
  'tailwind-merge': '3.6.0',

  // Components
  '@hookform/resolvers': '5.2.2',
  clsx: '2.1.1',
  'react-hook-form': '7.71.1',
  'react-icons': '5.7.0',
  zustand: '5.0.14',
  'react-error-boundary': '6.1.2',
  '@base-ui/react': '1.6.0',
  'class-variance-authority': '0.7.1',
  sonner: '2.0.7',

  // Date Picker
  'react-day-picker': '10.0.1',
  'date-fns': '4.4.0',

  // GraphQL
  '@apollo/client': '4.2.0',
  graphql: '16.14.0',
  'graphql-sse': '2.6.0',
  rxjs: '7.8.2',
  '@graphql-codegen/cli': '7.1.0',
  '@graphql-codegen/client-preset': '6.0.1',
  '@graphql-typed-document-node/core': '3.2.0',
  '@graphql-eslint/eslint-plugin': '4.4.0',
  '@parcel/watcher': '2.5.6',

  // Utils
  nanoid: '5.1.6',
  'use-subscription': '^1.5.1',
  '@types/use-subscription': '^1.0.0',

  // Validation
  zod: '4.3.6',

  // Sentry
  '@sentry/react': '10.63.0',

  // Testing
  '@testing-library/jest-dom': '7.0.0',
  '@testing-library/react': '16.3.2',
  '@testing-library/user-event': '14.6.1',
  jsdom: '30.0.1',
} as const;
