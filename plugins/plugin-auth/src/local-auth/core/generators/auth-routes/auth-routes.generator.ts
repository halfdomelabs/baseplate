import {
  TsCodeUtils,
  tsImportBuilder,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH_CORE_AUTH_ROUTES_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  requireNameOnRegistration: z.boolean(),
});

/**
 * Generator for auth routes for logging in and registering
 */
export const authRoutesGenerator = createGenerator({
  name: 'auth/core/auth-routes',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ requireNameOnRegistration }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ renderers, paths }) {
        const schemaFields: Record<string, string> = {
          email: 'z.email().transform((value) => value.toLowerCase())',
          ...(requireNameOnRegistration
            ? { name: 'z.string().min(1).max(100)' }
            : {}),
          password: `z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH)`,
        };

        const registerSchema = tsTemplateWithImports(
          tsImportBuilder(['PASSWORD_MAX_LENGTH', 'PASSWORD_MIN_LENGTH']).from(
            paths.constants,
          ),
        )`z.object(${TsCodeUtils.mergeFragmentsAsObject(schemaFields)})`;

        const inputFields: Record<string, string> = {
          email: 'data.email',
          ...(requireNameOnRegistration ? { name: 'data.name' } : {}),
          password: 'data.password',
        };

        const registerInput = TsCodeUtils.mergeFragmentsAsObjectPresorted(
          inputFields,
          { wrapWithParenthesis: false },
        );

        return {
          build: async (builder) => {
            await builder.apply(
              renderers.mainGroup.render({
                variables: {
                  register: {
                    TPL_REGISTER_SCHEMA: registerSchema,
                    TPL_REGISTER_INPUT: registerInput,
                    TPL_NAME_FORM_CONTROL: requireNameOnRegistration
                      ? `<InputFieldController
              control={control}
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Name"
              label="Name"
            />`
                      : '',
                  },
                },
              }),
            );
            await builder.apply(renderers.verifyEmail.render({}));
          },
        };
      },
    }),
  }),
});
