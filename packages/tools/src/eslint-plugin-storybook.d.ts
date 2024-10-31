// Manually supplying definition pending https://github.com/storybookjs/eslint-plugin-storybook/issues/172

declare module 'eslint-plugin-storybook' {
  import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
  import type { ESLint } from 'eslint';
  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    configs: {
      // eslintrc configs
      csf: ESLint.ConfigData;
      'csf-strict': ESLint.ConfigData;
      'addon-interactions': ESLint.ConfigData;
      recommended: ESLint.ConfigData;
      // flat configs
      'flat/csf': FlatConfig.Config;
      'flat/csf-strict': FlatConfig.Config;
      'flat/addon-interactions': FlatConfig.Config;
      'flat/recommended': FlatConfig.Config;
    };
    rules: {
      'await-interactions': ESLint.RuleModule;
      'context-in-play-function': ESLint.RuleModule;
      'csf-component': ESLint.RuleModule;
      'default-exports': ESLint.RuleModule;
      'hierarchy-separator': ESLint.RuleModule;
      'no-redundant-story-name': ESLint.RuleModule;
      'no-stories-of': ESLint.RuleModule;
      'no-title-property-in-meta': ESLint.RuleModule;
      'no-uninstalled-addons': ESLint.RuleModule;
      'prefer-pascal-case': ESLint.RuleModule;
      'story-exports': ESLint.RuleModule;
      'use-storybook-expect': ESLint.RuleModule;
      'use-storybook-testing-library': ESLint.RuleModule;
    };
  };
  export default plugin;
}
