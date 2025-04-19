import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTaskWithInfo,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';

import {
  createReactConfigImports,
  reactConfigImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_REACT_CONFIG_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

/**
 * A single entry in the environment variables for the react app.
 */
export interface ReactConfigEntry {
  /**
   * A comment to describe the config entry.
   */
  comment: string;
  /**
   * The Zod validator for the config entry.
   */
  validator: TsCodeFragment | string;
  /**
   * The default value for the config entry in the .env.development file.
   */
  devDefaultValue: string;
}

const [setupTask, reactConfigProvider, reactConfigValuesProvider] =
  createConfigProviderTaskWithInfo(
    (t) => ({
      // The config entries for the react app.
      configEntries: t.map<string, ReactConfigEntry>(),
      // Extra environment variables for the react app in the .env.development file.
      additionalDevEnvVars: t.map<string, string>(),
    }),
    {
      prefix: 'react-config',
      configScope: projectScope,
      // TODO: Temporary until we remove the need for the old typescript import map
      infoFromDescriptor: () => ({
        getImportMap: () => ({
          '%react-config': {
            path: '@/src/services/config',
            allowedImports: ['config'],
          },
        }),
      }),
    },
  );

export { reactConfigProvider };

export const reactConfigGenerator = createGenerator({
  name: 'core/react-config',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask({}),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['zod']),
    }),
    setupDefaultConfigEntries: createProviderTask(
      reactConfigProvider,
      (reactConfig) => {
        reactConfig.configEntries.set('VITE_ENVIRONMENT', {
          comment: 'Environment the app is running in',
          validator: tsCodeFragment(
            `z.enum(['development', 'test', 'staging', 'production'])`,
            tsImportBuilder(['z']).from('zod'),
          ),
          devDefaultValue: 'development',
        });
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactConfigValues: reactConfigValuesProvider,
      },
      exports: {
        reactConfigImports: reactConfigImportsProvider.export(projectScope),
      },
      run({
        typescriptFile,
        reactConfigValues: { configEntries, additionalDevEnvVars },
      }) {
        return {
          providers: {
            reactConfigImports: createReactConfigImports('@/src/services'),
          },
          build: async (builder) => {
            const sortedConfigEntries = sortBy(
              [...configEntries],
              [(entry) => entry[0]],
            );
            const sortedConfigFields = sortedConfigEntries.map(
              ([key, { comment, validator }]) =>
                TsCodeUtils.template`${
                  comment ? `${TsCodeUtils.formatAsComment(comment)}\n` : ''
                }${key}: ${validator},`,
            );
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_CONFIG_TS_TEMPLATES.config,
                destination: 'src/services/config.ts',
                variables: {
                  TPL_CONFIG_SCHEMA: TsCodeUtils.template`{
                  ${TsCodeUtils.mergeFragmentsPresorted(sortedConfigFields, '\n')}
              }`,
                },
              }),
            );

            const devEnvVars = [
              ...sortedConfigEntries.map(([key, { devDefaultValue }]) => [
                key,
                devDefaultValue,
              ]),
              ...sortBy([...additionalDevEnvVars], [([key]) => key]),
            ];

            if (devEnvVars.length > 0) {
              const developmentEnvFile = `${devEnvVars
                .map(([name, value]) => `${name}=${value}`)
                .join('\n')}\n`;

              builder.writeFile({
                id: 'development-env',
                destination: '.env.development',
                contents: developmentEnvFile,
              });
            }
          },
        };
      },
    }),
  }),
});

export { reactConfigImportsProvider } from './generated/ts-import-maps.js';
