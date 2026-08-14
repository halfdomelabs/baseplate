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
  emailOtp: z.boolean().default(false),
  disableRegistration: z.boolean().default(false),
});

/**
 * Generator for auth routes for logging in and registering
 */
export const authRoutesGenerator = createGenerator({
  name: 'auth/core/auth-routes',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({
    requireNameOnRegistration,
    emailOtp,
    disableRegistration,
  }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ renderers, paths }) {
        const schemaFields: Record<string, string> = {
          email: `z.email('Please enter a valid email address').transform((value) => value.toLowerCase())`,
          ...(requireNameOnRegistration
            ? { name: `z.string().min(1, 'Please enter your name').max(100)` }
            : {}),
          password: `z.string().min(PASSWORD_MIN_LENGTH, \`Password must be at least \${PASSWORD_MIN_LENGTH} characters\`).max(PASSWORD_MAX_LENGTH)`,
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
                  login: {
                    TPL_OTP_LOGIN_LINK: emailOtp
                      ? `<Link
              to="/auth/login-otp"
              search={{ return_to }}
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              Sign in with a code instead
            </Link>`
                      : '',
                    TPL_REGISTER_LINK: disableRegistration
                      ? ''
                      : `<div>
              Don&apos;t have an account?{' '}
              <Link
                to="/auth/register"
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>`,
                  },
                },
              }),
            );
            await builder.apply(renderers.verifyEmail.render({}));
            await builder.apply(renderers.acceptInvite.render({}));
            if (emailOtp) {
              await builder.apply(renderers.otpConstants.render({}));
              await builder.apply(renderers.loginOtp.render({}));
            }
            if (!disableRegistration) {
              await builder.apply(
                renderers.register.render({
                  variables: {
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
                }),
              );
            }
          },
        };
      },
    }),
  }),
});
