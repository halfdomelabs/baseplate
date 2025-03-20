export const REACT_PACKAGES = {
  // React
  react: '18.3.1',
  'react-dom': '18.3.1',
  'react-router-dom': '6.22.3',
  '@types/node': `^20.0.0`,
  '@types/react': '18.3.8',
  '@types/react-dom': '18.3.0',
  '@vitejs/plugin-react': '4.3.4',
  vite: '6.2.0',
  'vite-plugin-svgr': '4.3.0',
  'vite-tsconfig-paths': '5.1.4',

  loglevel: '1.9.1',

  // Tailwind
  autoprefixer: '10.4.20',
  tailwindcss: '3.4.11',
  'prettier-plugin-tailwindcss': '0.6.6',
  '@tailwindcss/forms': '0.5.9',

  // Components
  '@headlessui/react': '1.7.18',
  '@hookform/resolvers': '3.9.0',
  clsx: '2.1.1',
  'react-hook-form': '7.53.0',
  'react-hot-toast': '2.4.1',
  'react-icons': '5.0.1',
  'react-select': '5.8.0',
  zustand: '5.0.3',
  'react-error-boundary': '4.0.13',

  // GraphQL
  '@apollo/client': '3.10.8',
  graphql: '16.9.0',
  'graphql-ws': '5.16.0',
  '@graphql-codegen/cli': '5.0.2',
  '@graphql-codegen/typescript': '4.0.9',
  '@graphql-codegen/typescript-operations': '4.2.3',
  '@graphql-codegen/typescript-react-apollo': '4.3.0',
  '@parcel/watcher': '2.4.1',

  // Utils
  nanoid: '3.3.8',
  'use-subscription': '^1.5.1',
  '@types/use-subscription': '^1.0.0',

  // Auth
  '@auth0/auth0-react': '2.2.3',

  // Validation
  zod: '3.24.1',

  // Datadog
  '@datadog/browser-logs': '4.19.1',

  // Sentry
  '@sentry/react': '8.55.0',
} as const;
