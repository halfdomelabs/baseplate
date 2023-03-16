import {
  makeImportAndFilePath,
  nodeProvider,
  projectProvider,
  quot,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { z } from 'zod';
import { authIdentifyProvider } from '@src/generators/auth/auth-identify';
import { reactConfigProvider } from '../react-config';

const descriptorSchema = z.object({});

export type ReactDatadogProvider = unknown;

export const reactDatadogProvider =
  createProviderType<ReactDatadogProvider>('react-datadog');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    typescript: typescriptProvider,
    reactConfig: reactConfigProvider,
    node: nodeProvider,
    authIdentify: authIdentifyProvider,
    project: projectProvider,
  },
  exports: {
    reactDatadog: reactDatadogProvider,
  },
  run({ typescript, node, reactConfig, authIdentify, project }) {
    const [datadogImport, datadogPath] = makeImportAndFilePath(
      'src/services/datadog.ts'
    );

    node.addPackages({
      '@datadog/browser-logs': '4.19.1',
    });

    reactConfig.getConfigMap().set('VITE_DATADOG_CLIENT_TOKEN', {
      comment: 'Client token for Datadog logging (optional)',
      validator: TypescriptCodeUtils.createExpression('z.string().optional()'),
      devValue: '',
    });

    reactConfig.getConfigMap().set('VITE_DATADOG_SITE', {
      comment: 'Site for Datadog logging (optional, defaults to datadoghq.com)',
      validator: TypescriptCodeUtils.createExpression('z.string().optional()'),
      devValue: '',
    });

    authIdentify.addBlock(
      TypescriptCodeUtils.createBlock(
        `identifyDatadogUser({
        id: user.id,
        email: user.email,
      });`,
        `import { identifyDatadogUser } from '${datadogImport}';`
      )
    );

    return {
      getProviders: () => ({
        reactDatadog: {},
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'datadog.ts',
            destination: datadogPath,
            importMappers: [reactConfig],
            replacements: {
              APP_NAME: quot(project.getProjectName()),
            },
          })
        );
      },
    };
  },
}));

const ReactDatadogGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default ReactDatadogGenerator;
