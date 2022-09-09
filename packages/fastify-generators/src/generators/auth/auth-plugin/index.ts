import {
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithTasks } from '@baseplate/sync';
import { z } from 'zod';
import { loggerServiceSetupProvider } from '@src/generators/core/logger-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { authInfoImportProvider, authServiceProvider } from '../auth-service';

const descriptorSchema = z.object({});

const AuthPluginGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'logger-request-context',
      dependencies: { loggerServiceSetup: loggerServiceSetupProvider },
      run({ loggerServiceSetup }) {
        loggerServiceSetup.addMixin(
          'userId',
          TypescriptCodeUtils.createExpression(
            "requestContext.get('user')?.id",
            "import { requestContext } from '@fastify/request-context';"
          )
        );

        return {};
      },
    });

    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        authService: authServiceProvider,
        appModule: appModuleProvider,
        typescript: typescriptProvider,
        authInfoImport: authInfoImportProvider,
      },
      run({ authService, appModule, typescript, node, authInfoImport }) {
        node.addPackages({ '@fastify/request-context': '4.0.0' });

        appModule.registerFieldEntry(
          'plugins',
          new TypescriptCodeExpression(
            'authPlugin',
            `import {authPlugin} from '@/${appModule.getModuleFolder()}/plugins/auth-plugin'`
          )
        );
        return {
          getProviders: () => ({}),
          build: async (builder) => {
            builder.setBaseDirectory(appModule.getModuleFolder());

            await builder.apply(
              typescript.createCopyAction({
                source: 'plugins/auth-plugin.ts',
                importMappers: [authInfoImport, authService],
              })
            );

            await builder.apply(
              typescript.createCopyAction({ source: 'utils/headers.ts' })
            );
          },
        };
      },
    });
  },
});

export default AuthPluginGenerator;
