import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { requestServiceContextSetupProvider } from '@src/generators/core/request-service-context';
import { serviceContextSetupProvider } from '@src/generators/core/service-context';
import { authInfoImportProvider } from '../auth-service';

const descriptorSchema = z.object({
  authInfoRef: z.string().min(1),
});

type Descriptor = z.infer<typeof descriptorSchema>;

export type AuthContextProvider = unknown;

export const authContextProvider =
  createProviderType<AuthContextProvider>('auth-context');

const createMainTask = createTaskConfigBuilder(
  ({ authInfoRef }: Descriptor) => ({
    name: 'main',
    dependencies: {
      serviceContextSetup: serviceContextSetupProvider,
      requestServiceContextSetup: requestServiceContextSetupProvider,
      authInfoImport: authInfoImportProvider
        .dependency()
        .reference(authInfoRef),
    },
    exports: {
      authContext: authContextProvider,
    },
    run({ serviceContextSetup, requestServiceContextSetup, authInfoImport }) {
      return {
        getProviders: () => ({
          authContext: {},
        }),
        build: () => {
          const authInfoType = TypescriptCodeUtils.createExpression(
            'AuthInfo',
            'import { AuthInfo } from "%auth-info";',
            {
              importMappers: [authInfoImport],
            }
          );

          serviceContextSetup.addContextField('auth', {
            type: authInfoType,
            value: TypescriptCodeUtils.createExpression('auth'),
            contextArg: [
              {
                name: 'auth',
                type: authInfoType,
                // TODO: Figure out how to allow role service to inject test default here
                testDefault: TypescriptCodeUtils.createExpression(
                  'createAuthInfoFromUser(null, ["system"])',
                  'import { createAuthInfoFromUser } from "%auth-info";',
                  { importMappers: [authInfoImport] }
                ),
              },
            ],
          });

          requestServiceContextSetup.addContextPassthrough({
            name: 'auth',
            creator(req) {
              return TypescriptCodeUtils.createExpression(`${req}.auth`);
            },
          });
        },
      };
    },
  })
);

const AuthContextGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default AuthContextGenerator;
