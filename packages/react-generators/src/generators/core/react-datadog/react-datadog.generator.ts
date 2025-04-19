import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectProvider,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';
import { authIdentifyProvider } from '@src/generators/auth/auth-identify/auth-identify.generator.js';

import { reactConfigProvider } from '../react-config/react-config.generator.js';

const descriptorSchema = z.object({});

export type ReactDatadogProvider = unknown;

export const reactDatadogProvider =
  createProviderType<ReactDatadogProvider>('react-datadog');

export const reactDatadogGenerator = createGenerator({
  name: 'core/react-datadog',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['@datadog/browser-logs']),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        reactConfig: reactConfigProvider,
        authIdentify: authIdentifyProvider,
        project: projectProvider,
      },
      exports: {
        reactDatadog: reactDatadogProvider.export(projectScope),
      },
      run({ typescript, reactConfig, authIdentify, project }) {
        const [datadogImport, datadogPath] = makeImportAndFilePath(
          'src/services/datadog.ts',
        );

        reactConfig.configEntries.set('VITE_DATADOG_CLIENT_TOKEN', {
          comment: 'Client token for Datadog logging (optional)',
          validator: 'z.string().optional()',
          devDefaultValue: '',
        });

        reactConfig.configEntries.set('VITE_DATADOG_SITE', {
          comment:
            'Site for Datadog logging (optional, defaults to datadoghq.com)',
          validator: 'z.string().optional()',
          devDefaultValue: '',
        });

        authIdentify.addBlock(
          TypescriptCodeUtils.createBlock(
            `identifyDatadogUser({
        id: userId,
      });`,
            `import { identifyDatadogUser } from '${datadogImport}';`,
          ),
        );

        return {
          providers: {
            reactDatadog: {},
          },
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'datadog.ts',
                destination: datadogPath,
                importMappers: [reactConfig],
                replacements: {
                  APP_NAME: quot(project.getProjectName()),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
