import type { NodeProvider } from '@halfdomelabs/core-generators';

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
    '@vitejs/plugin-react': '4.3.4',
    vite: '6.0.11',
    'vite-plugin-svgr': '4.3.0',
    'vite-tsconfig-paths': '5.1.4',
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
