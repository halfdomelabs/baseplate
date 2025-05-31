import eslintReactConfig from '@baseplate-dev/tools/eslint-react';

export default [...eslintReactConfig, { ignores: ['**/templates/**'] }];
