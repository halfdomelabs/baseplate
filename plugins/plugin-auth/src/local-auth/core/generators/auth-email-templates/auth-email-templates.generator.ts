import { emailTemplatesProvider } from '@baseplate-dev/plugin-email';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for auth email templates.
 *
 * Registers auth-related email templates (password reset, password changed,
 * account verification) with the transactional email library and generates
 * the corresponding .tsx template files.
 */
export const authEmailTemplatesGenerator = createGenerator({
  name: 'local-auth/auth-email-templates',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        emailTemplates: emailTemplatesProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      run({ emailTemplates, paths, renderers }) {
        emailTemplates.registerExport({
          exportName: 'AccountVerificationEmail',
          exportPath: paths.accountVerificationEmail,
        });

        emailTemplates.registerExport({
          exportName: 'PasswordChangedEmail',
          exportPath: paths.passwordChangedEmail,
        });

        emailTemplates.registerExport({
          exportName: 'PasswordResetEmail',
          exportPath: paths.passwordResetEmail,
        });

        return {
          build: async (builder) => {
            await builder.apply(
              renderers.accountVerificationEmail.render({}),
              renderers.passwordChangedEmail.render({}),
              renderers.passwordResetEmail.render({}),
            );
          },
        };
      },
    }),
  }),
});
