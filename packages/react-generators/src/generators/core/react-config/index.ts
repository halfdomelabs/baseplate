import type {
  ImportMapper,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';
import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import * as R from 'ramda';
import { z } from 'zod';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

interface ConfigEntry {
  comment: string;
  validator: TypescriptCodeExpression;
  devValue: string;
}

export interface ReactConfigProvider extends ImportMapper {
  getConfigMap(): NonOverwriteableMap<Record<string, ConfigEntry>>;
  addEnvVar(name: string, value: string): void;
}

export const reactConfigProvider =
  createProviderType<ReactConfigProvider>('react-config');

const ReactConfigGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
  },
  exports: {
    reactConfig: reactConfigProvider.export(projectScope),
  },
  createGenerator(descriptor, { node, typescript }) {
    const configEntryMap = createNonOverwriteableMap<
      Record<string, ConfigEntry>
    >(
      {
        VITE_ENVIRONMENT: {
          comment: 'Environment the app is running in',
          validator: TypescriptCodeUtils.createExpression(
            `z.enum(['development', 'test', 'staging', 'production'])`,
            "import { z } from 'zod'",
          ),
          devValue: 'development',
        },
      },
      { name: 'react-config-entries' },
    );
    const customEnvVars: { name: string; value: string }[] = [];

    node.addPackages({
      zod: '3.24.1',
    });
    return {
      getProviders: () => ({
        reactConfig: {
          addEnvVar(name, value) {
            customEnvVars.push({ name, value });
          },
          getConfigMap: () => configEntryMap,
          getImportMap: () => ({
            '%react-config': {
              path: '@/src/services/config',
              allowedImports: ['config'],
            },
          }),
        },
      }),
      build: async (builder) => {
        const configFile = typescript.createTemplate({
          CONFIG_SCHEMA: { type: 'code-expression' },
        });

        const configEntries = configEntryMap.value();
        const sortedConfigEntries = R.sortBy(
          (entry) => entry[0],
          Object.entries(configEntries),
        );
        const configEntryKeys = Object.keys(configEntries).sort();
        const mergedExpression = TypescriptCodeUtils.mergeExpressions(
          configEntryKeys.map((key) => {
            const { comment, validator } = configEntries[key];
            return TypescriptCodeUtils.formatExpression(
              `${
                comment
                  ? `${TypescriptCodeUtils.formatAsComment(comment)}\n`
                  : ''
              }${key}: VALIDATOR,`,
              {
                VALIDATOR: validator,
              },
            );
          }),
          '\n',
        );

        configFile.addCodeExpression(
          'CONFIG_SCHEMA',
          mergedExpression.wrap((contents) => `{${contents}}`),
        );

        await builder.apply(
          configFile.renderToAction(
            'services/config.ts',
            'src/services/config.ts',
          ),
        );

        const configVars = sortedConfigEntries.map(([key, { devValue }]) => ({
          name: key,
          value: devValue,
        }));

        const devEnvVars = [...configVars, ...customEnvVars];

        if (devEnvVars.length > 0) {
          const developmentEnvFile = `${devEnvVars
            .map(({ name, value }) => `${name}=${value}`)
            .join('\n')}\n`;

          builder.writeFile('.env.development', developmentEnvFile);
        }
      },
    };
  },
});

export default ReactConfigGenerator;
