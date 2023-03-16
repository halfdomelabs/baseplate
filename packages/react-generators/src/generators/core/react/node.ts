import { NodeProvider } from '@baseplate/core-generators';

export function setupViteNode(node: NodeProvider): void {
  const nodeVersion = node.getNodeVersion().split('.')[0];
  node.addPackages({
    react: '18.2.0',
    'react-dom': '18.2.0',
  });
  node.addDevPackages({
    '@types/node': `^${nodeVersion}.0.0`,
    '@types/react': '18.0.27',
    '@types/react-dom': '18.0.10',
    '@vitejs/plugin-react': '3.1.0',
    vite: '4.1.4',
    'vite-plugin-svgr': '2.4.0',
    'vite-tsconfig-paths': '4.0.7',
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
