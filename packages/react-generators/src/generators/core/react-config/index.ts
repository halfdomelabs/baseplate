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
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';

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

export const reactConfigGenerator = createGenerator({
  name: 'core/react-config',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        typescript: typescriptProvider,
      },
      exports: {
        reactConfig: reactConfigProvider.export(projectScope),
      },
      run({ node, typescript }) {
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
          zod: REACT_PACKAGES.zod,
        });
        return {
          providers: {
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
          },
          build: async (builder) => {
            const configFile = typescript.createTemplate({
              CONFIG_SCHEMA: { type: 'code-expression' },
            });

            const configEntries = configEntryMap.value();
            const sortedConfigEntries = sortBy(Object.entries(configEntries), [
              (entry) => entry[0],
            ]);
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

            const configVars = sortedConfigEntries.map(
              ([key, { devValue }]) => ({
                name: key,
                value: devValue,
              }),
            );

            const devEnvVars = [...configVars, ...customEnvVars];

            if (devEnvVars.length > 0) {
              const developmentEnvFile = `${devEnvVars
                .map(({ name, value }) => `${name}=${value}`)
                .join('\n')}\n`;

              builder.writeFile({
                id: 'react-config/development-env',
                filePath: '.env.development',
                contents: developmentEnvFile,
              });
            }
          },
        };
      },
    }),
  ],
});
