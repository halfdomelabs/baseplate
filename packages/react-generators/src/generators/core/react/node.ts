import { NodeProvider } from '@halfdomelabs/core-generators';

export function setupViteNode(node: NodeProvider): void {
  const nodeVersion = node.getNodeVersion().split('.')[0];
  node.addPackages({
    react: '18.2.0',
    'react-dom': '18.2.0',
  });
  node.addDevPackages({
    '@types/node': `^${nodeVersion}.0.0`,
    '@types/react': '18.2.15',
    '@types/react-dom': '18.2.7',
    '@vitejs/plugin-react': '4.0.3',
    vite: '4.4.0',
    'vite-plugin-svgr': '3.2.0',
    'vite-tsconfig-paths': '4.2.0',
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
