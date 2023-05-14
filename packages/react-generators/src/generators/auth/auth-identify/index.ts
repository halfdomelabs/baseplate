import {
  TypescriptCodeBlock,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { reactRouterProvider } from '@src/generators/core/react-router';
import { authHooksProvider } from '../auth-hooks';

const descriptorSchema = z.object({});

export interface AuthIdentifyProvider {
  addBlock(block: TypescriptCodeBlock): void;
}

export const authIdentifyProvider =
  createProviderType<AuthIdentifyProvider>('auth-identify');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    reactRouter: reactRouterProvider,
    authHooks: authHooksProvider,
  },
  exports: {
    authIdentify: authIdentifyProvider,
  },
  run({ reactRouter, authHooks }) {
    const blocks: TypescriptCodeBlock[] = [];
    return {
      getProviders: () => ({
        authIdentify: {
          addBlock(block) {
            blocks.push(block);
          },
        },
      }),
      build: () => {
        if (blocks.length) {
          reactRouter.addRouteHeader(
            TypescriptCodeUtils.mergeBlocks(blocks)
              .wrap(
                (contents) => `
              const { user } = useCurrentUser();

            useEffect(() => {
              if (!user) return;
              
              ${contents}
            }, [user]);
            `,
                [
                  "import {useCurrentUser} from '%auth-hooks/useCurrentUser'",
                  "import {useEffect} from 'react'",
                ]
              )
              .withImportMappers(authHooks)
          );
        }
      },
    };
  },
}));

const AuthIdentifyGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default AuthIdentifyGenerator;
