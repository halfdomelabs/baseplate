import { NodeProvider } from '@baseplate/core-generators';

export function setupReactNode(node: NodeProvider): void {
  const nodeVersion = node.getNodeVersion().split('.')[0];
  node.addPackages({
    '@types/node': `^${nodeVersion}.0.0`,
    '@types/react': '18.0.27',
    '@types/react-dom': '18.0.10',
    '@testing-library/jest-dom': '5.16.5',
    '@testing-library/react': '13.4.0',
    '@testing-library/user-event': '14.4.3',
    react: '18.2.0',
    'react-dom': '18.2.0',
    'react-scripts': '5.0.1',
    'web-vitals': '^2.1.0',
  });
  node.addScripts({
    start: 'DISABLE_ESLINT_PLUGIN=true react-scripts start',
    build: 'DISABLE_ESLINT_PLUGIN=true react-scripts build',
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
