import type { TsCodeFragment } from '@baseplate-dev/core-generators';
import type { InferFieldMapSchemaFromBuilder } from '@baseplate-dev/utils';

import {
  packageScope,
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createConfigFieldMap,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { createFieldMapSchemaBuilder } from '@baseplate-dev/utils';
import { z } from 'zod';

import { reactRouterConfigProvider } from '#src/generators/core/react-router/index.js';

import { authHooksImportsProvider } from '../_providers/auth-hooks.js';

const descriptorSchema = z.object({});

const configSchema = createFieldMapSchemaBuilder((t) => ({
  identifyFragments: t.map<string, TsCodeFragment>(),
}));

export type AuthIdentifyProvider = InferFieldMapSchemaFromBuilder<
  typeof configSchema
>;

export const authIdentifyProvider =
  createProviderType<AuthIdentifyProvider>('auth-identify');

export const authIdentifyGenerator = createGenerator({
  name: 'auth/auth-identify',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    authContext: createGeneratorTask({
      dependencies: {
        reactRouterConfig: reactRouterConfigProvider,
        authHooksImports: authHooksImportsProvider,
      },
      run({ reactRouterConfig, authHooksImports }) {
        reactRouterConfig.routerSetupFragments.set(
          'auth-context',
          tsTemplate`const session = ${authHooksImports.useSession.fragment()}();\nconst { userId } = session;`,
        );
        reactRouterConfig.rootContextFields.add({
          name: 'userId',
          type: tsTemplate`string | undefined`,
          optional: true,
          routerProviderInitializer: {
            code: tsTemplate`userId`,
            dependencies: ['userId'],
          },
        });
        reactRouterConfig.rootContextFields.add({
          name: 'session',
          type: authHooksImports.SessionData.typeFragment(),
          optional: false,
          routerProviderInitializer: {
            code: tsTemplate`session`,
            dependencies: ['session'],
          },
        });
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        reactRouterConfig: reactRouterConfigProvider,
      },
      exports: {
        authIdentify: authIdentifyProvider.export(packageScope),
      },
      run({ reactRouterConfig }) {
        const fieldMap = createConfigFieldMap(configSchema);
        return {
          providers: {
            authIdentify: fieldMap,
          },
          build: () => {
            const { identifyFragments } = fieldMap.getValues();
            if (identifyFragments.size > 0) {
              reactRouterConfig.routerSetupFragments.set(
                'auth-identify',
                TsCodeUtils.templateWithImports([
                  tsImportBuilder(['useEffect']).from('react'),
                ])`
                useEffect(() => {
                  if (!userId) return;
                  
                  ${TsCodeUtils.mergeFragments(identifyFragments)}
                }, [userId]);
                `,
              );
            }
          },
        };
      },
    }),
  }),
});
