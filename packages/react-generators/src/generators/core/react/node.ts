import { NodeProvider } from '@baseplate/core-generators';

export function setupReactNode(node: NodeProvider): void {
  const nodeVersion = node.getNodeVersion().split('.')[0];
  node.addPackages({
    '@types/node': `^${nodeVersion}.0.0`,
    '@types/react': '17.0.20',
    '@types/react-dom': '17.0.9',
    '@testing-library/jest-dom': '^5.16.4',
    '@testing-library/react': '^13.3.0',
    react: '17.0.2',
    'react-dom': '17.0.2',
    'react-scripts': '5.0.0',
    'web-vitals': '^2.1.0',
  });
  node.addScripts({
    start: 'react-scripts start',
    build: 'react-scripts build',
    test: 'react-scripts test',
    eject: 'react-scripts eject',
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
