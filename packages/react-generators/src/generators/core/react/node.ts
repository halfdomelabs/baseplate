import type { NodeProvider } from '@halfdomelabs/core-generators';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';

export function setupViteNode(node: NodeProvider): void {
  node.addPackages({
    react: REACT_PACKAGES.react,
    'react-dom': REACT_PACKAGES['react-dom'],
  });
  node.addDevPackages({
    '@types/node': REACT_PACKAGES['@types/node'],
    '@types/react': REACT_PACKAGES['@types/react'],
    '@types/react-dom': REACT_PACKAGES['@types/react-dom'],
    '@vitejs/plugin-react': REACT_PACKAGES['@vitejs/plugin-react'],
    vite: REACT_PACKAGES.vite,
    'vite-plugin-svgr': REACT_PACKAGES['vite-plugin-svgr'],
    'vite-tsconfig-paths': REACT_PACKAGES['vite-tsconfig-paths'],
  });
  node.addScripts({
    dev: 'vite',
    build: 'tsc && vite build',
    preview: 'vite preview',
  });
  node.mergeExtraProperties({
    browserslist: {
      production: ['>0.2%', 'not dead', 'not op_mini all'],
      development: [
        'last 1 chrome version',
        'last 1 firefox version',
        'last 1 safari version',
      ],
    },
  });
}
