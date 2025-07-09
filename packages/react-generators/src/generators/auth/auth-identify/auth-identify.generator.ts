import type { TsCodeFragment } from '@baseplate-dev/core-generators';
import type { InferFieldMapSchemaFromBuilder } from '@baseplate-dev/utils';

import {
  packageScope,
  TsCodeUtils,
  tsImportBuilder,
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

import { authContextTask } from '../_tasks/auth-context.js';

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
    authContext: authContextTask,
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
