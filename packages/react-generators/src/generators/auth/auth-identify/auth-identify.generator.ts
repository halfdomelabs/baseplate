import type { TsCodeFragment } from '@halfdomelabs/core-generators';
import type { InferFieldMapSchemaFromBuilder } from '@halfdomelabs/utils';

import {
  projectScope,
  TsCodeUtils,
  tsImportBuilder,
} from '@halfdomelabs/core-generators';
import {
  createConfigFieldMap,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { createFieldMapSchemaBuilder } from '@halfdomelabs/utils';
import { z } from 'zod';

import { reactRouterConfigProvider } from '@src/generators/core/react-router/react-router.generator.js';

import { authHooksProvider } from '../_providers/auth-hooks.js';

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
    main: createGeneratorTask({
      dependencies: {
        reactRouterConfig: reactRouterConfigProvider,
        authHooks: authHooksProvider,
      },
      exports: {
        authIdentify: authIdentifyProvider.export(projectScope),
      },
      run({ reactRouterConfig, authHooks }) {
        const fieldMap = createConfigFieldMap(configSchema);
        return {
          providers: {
            authIdentify: fieldMap,
          },
          build: () => {
            const { identifyFragments } = fieldMap.getValues();
            if (identifyFragments.size > 0) {
              reactRouterConfig.renderHeaders.set(
                'auth-identify',
                TsCodeUtils.templateWithImports([
                  tsImportBuilder(['useSession']).from(
                    authHooks.getImportMap()['%auth-hooks/useSession']?.path ??
                      '',
                  ),
                  tsImportBuilder(['useEffect']).from('react'),
                ])`
                const { userId } = useSession();

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
