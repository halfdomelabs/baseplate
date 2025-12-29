import {
  createNodeTask,
  extractPackageVersions,
} from '@baseplate-dev/core-generators';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

export const viteNodeTask = createNodeTask((node) => {
  node.packages.addPackages({
    prod: extractPackageVersions(REACT_PACKAGES, ['react', 'react-dom']),
    dev: extractPackageVersions(REACT_PACKAGES, [
      '@types/node',
      '@types/react',
      '@types/react-dom',
      '@vitejs/plugin-react',
      'vite',
      'vite-plugin-svgr',
      'vite-tsconfig-paths',
    ]),
  });
  node.scripts.mergeObj(
    {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    'vite',
  );
  node.extraProperties.merge(
    {
      browserslist: {
        production: ['>0.2%', 'not dead', 'not op_mini all'],
        development: [
          'last 1 chrome version',
          'last 1 firefox version',
          'last 1 safari version',
        ],
      },
    },
    'vite',
  );
  node.files.push('build/**/*');
});
