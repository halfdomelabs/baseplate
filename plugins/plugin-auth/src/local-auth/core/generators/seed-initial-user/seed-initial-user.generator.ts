import {
  TsCodeUtils,
  tsImportBuilder,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import { prismaSeedProvider } from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { LOCAL_AUTH_CORE_SEED_INITIAL_USER_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  initialUserRoles: z.array(z.string()),
});

/**
 * Generator for local-auth/core/seed-initial-user
 */
export const seedInitialUserGenerator = createGenerator({
  name: 'local-auth/core/seed-initial-user',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ initialUserRoles }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    prismaSeed: createGeneratorTask({
      dependencies: {
        prismaSeed: prismaSeedProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ prismaSeed, paths }) {
        prismaSeed.addSeedFragment(
          'initial-user',
          tsTemplateWithImports([
            tsImportBuilder(['seedInitialUser']).from(paths.seedInitialUser),
          ])`await seedInitialUser();`,
        );
        prismaSeed.addSeedEnvField({
          name: 'INITIAL_USER_EMAIL',
          exampleValue: 'admin@example.com',
        });
        prismaSeed.addSeedEnvField({
          name: 'INITIAL_USER_PASSWORD',
          exampleValue: 'password',
        });
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.seedInitialUser.render({
                variables: {
                  TPL_INITIAL_USER_ROLES:
                    TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      initialUserRoles.map((role) => quot(role)).sort(),
                    ),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
