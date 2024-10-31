declare module 'eslint-plugin-react-hooks' {
  import type { ESLint } from 'eslint';
  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    // eslint-plugin-react-hooks does not use FlatConfig yet
    // https://github.com/facebook/react/pull/30774
    configs: {
      recommended: ESLint.ConfigData;
    };
  };
  export default plugin;
}
