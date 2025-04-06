import type { TypescriptCodeBlock } from '@halfdomelabs/core-generators';

import {
  projectScope,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactRouterProvider } from '@src/generators/core/react-router/index.js';

import { authHooksProvider } from '../auth-hooks/index.js';

const descriptorSchema = z.object({});

export interface AuthIdentifyProvider {
  addBlock(block: TypescriptCodeBlock): void;
}

export const authIdentifyProvider =
  createProviderType<AuthIdentifyProvider>('auth-identify');

export const authIdentifyGenerator = createGenerator({
  name: 'auth/auth-identify',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactRouter: reactRouterProvider,
        authHooks: authHooksProvider,
      },
      exports: {
        authIdentify: authIdentifyProvider.export(projectScope),
      },
      run({ reactRouter, authHooks }) {
        const blocks: TypescriptCodeBlock[] = [];
        return {
          providers: {
            authIdentify: {
              addBlock(block) {
                blocks.push(block);
              },
            },
          },
          build: () => {
            if (blocks.length > 0) {
              reactRouter.addRouteHeader(
                TypescriptCodeUtils.mergeBlocks(blocks)
                  .wrap(
                    (contents) => `
              const { userId } = useSession();

            useEffect(() => {
              if (!userId) return;
              
              ${contents}
            }, [userId]);
            `,
                    [
                      "import {useSession} from '%auth-hooks/useSession'",
                      "import {useEffect} from 'react'",
                    ],
                  )
                  .withImportMappers(authHooks),
              );
            }
          },
        };
      },
    }),
  }),
});
