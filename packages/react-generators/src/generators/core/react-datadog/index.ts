import {
  makeImportAndFilePath,
  nodeProvider,
  projectProvider,
  projectScope,
  quot,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';
import { authIdentifyProvider } from '@src/generators/auth/auth-identify/index.js';

import { reactConfigProvider } from '../react-config/index.js';

const descriptorSchema = z.object({});

export type ReactDatadogProvider = unknown;

export const reactDatadogProvider =
  createProviderType<ReactDatadogProvider>('react-datadog');

export const reactDatadogGenerator = createGenerator({
  name: 'core/react-datadog',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        typescript: typescriptProvider,
        reactConfig: reactConfigProvider,
        node: nodeProvider,
        authIdentify: authIdentifyProvider,
        project: projectProvider,
      },
      exports: {
        reactDatadog: reactDatadogProvider.export(projectScope),
      },
      run({ typescript, node, reactConfig, authIdentify, project }) {
        const [datadogImport, datadogPath] = makeImportAndFilePath(
          'src/services/datadog.ts',
        );

        node.addPackages({
          '@datadog/browser-logs': REACT_PACKAGES['@datadog/browser-logs'],
        });

        reactConfig.getConfigMap().set('VITE_DATADOG_CLIENT_TOKEN', {
          comment: 'Client token for Datadog logging (optional)',
          validator: TypescriptCodeUtils.createExpression(
            'z.string().optional()',
          ),
          devValue: '',
        });

        reactConfig.getConfigMap().set('VITE_DATADOG_SITE', {
          comment:
            'Site for Datadog logging (optional, defaults to datadoghq.com)',
          validator: TypescriptCodeUtils.createExpression(
            'z.string().optional()',
          ),
          devValue: '',
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
    });
  },
});
