import { NodeProvider } from '@halfdomelabs/core-generators';

export function setupViteNode(node: NodeProvider): void {
  const nodeVersion = node.getNodeVersion().split('.')[0];
  node.addPackages({
    react: '18.3.1',
    'react-dom': '18.3.1',
  });
  node.addDevPackages({
    '@types/node': `^${nodeVersion}.0.0`,
    '@types/react': '18.3.8',
    '@types/react-dom': '18.3.0',
    '@vitejs/plugin-react': '4.3.1',
    vite: '5.4.7',
    'vite-plugin-svgr': '4.2.0',
    'vite-tsconfig-paths': '4.3.2',
  });
  node.addScripts({
    dev: 'vite',
    build: 'tsc && vite build',
    preview: 'vite preview',
  });
  node.mergeExtraProperties({
    type: 'module',
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
