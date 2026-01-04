import {
  tsCodeFragment,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';

export const GRAPHQL_ESLINT_RULES = tsCodeFragment(
  `
  // GraphQL Configs
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    processor: graphqlPlugin.processor,
  },
  {
    files: ['**/*.graphql'],
    languageOptions: { parser: graphqlPlugin.parser },
    plugins: { '@graphql-eslint': graphqlPlugin },
    rules: {
      ...graphqlPlugin.configs['flat/operations-recommended'].rules,
      '@graphql-eslint/naming-convention': [
        'error',
        {
          VariableDefinition: 'camelCase',
          OperationDefinition: {
            style: 'PascalCase',
            forbiddenPrefixes: ['Query', 'Mutation', 'Subscription', 'Get'],
            forbiddenSuffixes: ['Query', 'Mutation', 'Subscription'],
          },
          FragmentDefinition: {
            // Use a regex that allows "Pascal" OR "Pascal_camel"
            // It checks:
            //   - Starts with Uppercase (Pascal part)
            //   - Optionally follows with _lowercase (camel part)
            requiredPattern: /^[A-Z][a-zA-Z0-9]*(_[a-z][a-zA-Z0-9]*)?$/,
            forbiddenPrefixes: ['Fragment'],
            forbiddenSuffixes: ['Fragment'],
          },
        },
      ],
    },
  },
`,
  [
    tsImportBuilder()
      .default('graphqlPlugin')
      .from('@graphql-eslint/eslint-plugin'),
  ],
);
