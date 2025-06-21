import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { CORE_REACT_CONFIG_GENERATED } from './generated/index.js';

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
  createConfigProviderTask(
    (t) => ({
      // The config entries for the react app.
      configEntries: t.map<string, ReactConfigEntry>(),
      // Extra environment variables for the react app in the .env.development file.
      additionalDevEnvVars: t.map<string, string>(),
    }),
    {
      prefix: 'react-config',
      configScope: packageScope,
    },
  );

export { reactConfigProvider };

export const reactConfigGenerator = createGenerator({
  name: 'core/react-config',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['zod']),
    }),
    paths: CORE_REACT_CONFIG_GENERATED.paths.task,
    imports: CORE_REACT_CONFIG_GENERATED.imports.task,
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
        paths: CORE_REACT_CONFIG_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        reactConfigValues: { configEntries, additionalDevEnvVars },
        paths,
      }) {
        return {
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
                template: CORE_REACT_CONFIG_GENERATED.templates.config,
                destination: paths.config,
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
