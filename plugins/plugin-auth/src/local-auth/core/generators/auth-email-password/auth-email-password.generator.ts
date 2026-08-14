import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  configServiceProvider,
  createPothosPrismaObjectTypeOutputName,
  pothosTypeOutputProvider,
} from '@baseplate-dev/fastify-generators';
import { transactionalLibConfigProvider } from '@baseplate-dev/plugin-email';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

import { LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  adminRoles: z.array(z.string()),
  devWebDomainPort: z.number(),
  requireNameOnRegistration: z.boolean(),
  emailOtp: z.boolean().default(false),
  disableRegistration: z.boolean().default(false),
});

/**
 * Sets up email / password authentication
 */
export const authEmailPasswordGenerator = createGenerator({
  name: 'local-auth/core/auth-email-password',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({
    adminRoles,
    devWebDomainPort,
    requireNameOnRegistration,
    emailOtp,
    disableRegistration,
  }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    config: createProviderTask(configServiceProvider, (configService) => {
      configService.configFields.set('AUTH_FRONTEND_URL', {
        validator: tsCodeFragment('z.url()'),
        comment:
          'Frontend URL for authentication flows including password reset and email verification (e.g., https://app.example.com)',
        exampleValue: `http://localhost:${devWebDomainPort}`,
      });
    }),
    appModule: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        appModule: appModuleProvider,
      },
      run({ paths, appModule }) {
        appModule.moduleImports.push(
          paths.schemaUserPasswordMutations,
          paths.schemaPasswordResetMutations,
          paths.schemaInviteMutations,
          paths.schemaEmailVerificationMutations,
        );
        if (emailOtp) {
          appModule.moduleImports.push(paths.schemaEmailOtpMutations);
        }
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        renderers: GENERATED_TEMPLATES.renderers.provider,
        transactionalLibConfig: transactionalLibConfigProvider,
        userObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(
            createPothosPrismaObjectTypeOutputName(LOCAL_AUTH_MODELS.user),
          ),
      },
      run({ paths, renderers, transactionalLibConfig, userObjectType }) {
        const transactionalLibPackageName =
          transactionalLibConfig.getTransactionalLibPackageName();

        const adminRolesFragment = TsCodeUtils.mergeFragmentsAsArrayPresorted(
          adminRoles.map((r) => quot(r)).toSorted(),
        );
        const userObjectTypeFragment =
          userObjectType.getTypeReference().fragment;

        // Kept as its own fragment (rather than a separate mutations file)
        // since the backend serves every web app, and only one field needs
        // to disappear when every web app has registration disabled.
        const registerMutationFragment = disableRegistration
          ? ''
          : tsCodeFragment(
              `builder.mutationField('registerWithEmailPassword', (t) =>
  t.fieldWithInputPayload({
    authorize: ['public'],
    payload: {
      session: t.payload.field({ type: userSessionPayload }),
    },
    input: {
      email: t.input.field({ required: true, type: 'String' }),
      name: t.input.field({ required: false, type: 'String' }),
      password: t.input.field({ required: true, type: 'String' }),
    },
    resolve: async (root, { input }, context) =>
      registerUserWithEmailAndPassword({
        input: {
          ...input,
          name: input.name ?? undefined,
        },
        context,
      }),
  }),
);`,
              tsImportBuilder(['registerUserWithEmailAndPassword']).from(
                paths.servicesUserPassword,
              ),
            );

        return {
          build: async (builder) => {
            await builder.apply(
              renderers.moduleGroup.render({
                variables: {
                  schemaUserPasswordMutations: {
                    TPL_ADMIN_ROLES: adminRolesFragment,
                    TPL_REGISTER_MUTATION: registerMutationFragment,
                    TPL_USER_OBJECT_TYPE: userObjectTypeFragment,
                  },
                  servicesPasswordReset: {
                    TPL_PASSWORD_RESET_EMAIL: TsCodeUtils.importFragment(
                      'PasswordResetEmail',
                      transactionalLibPackageName,
                    ),
                    TPL_PASSWORD_CHANGED_EMAIL: TsCodeUtils.importFragment(
                      'PasswordChangedEmail',
                      transactionalLibPackageName,
                    ),
                  },
                  servicesUserPassword: {
                    TPL_NAME_REQUIRED_CHECK: requireNameOnRegistration
                      ? tsCodeFragment(
                          "if (!name) {\n    throw new BadRequestError('Name is required', 'name-required');\n  }",
                        )
                      : '',
                  },
                },
              }),
            );
            await builder.apply(
              renderers.servicesInvite.render({
                variables: {
                  TPL_INVITE_EMAIL: TsCodeUtils.importFragment(
                    'InviteEmail',
                    transactionalLibPackageName,
                  ),
                },
              }),
            );
            await builder.apply(
              renderers.schemaInviteMutations.render({
                variables: {
                  TPL_ADMIN_ROLES: adminRolesFragment,
                  TPL_USER_OBJECT_TYPE: userObjectTypeFragment,
                },
              }),
            );
            await builder.apply(
              renderers.servicesEmailVerification.render({
                variables: {
                  TPL_ACCOUNT_VERIFICATION_EMAIL: TsCodeUtils.importFragment(
                    'AccountVerificationEmail',
                    transactionalLibPackageName,
                  ),
                },
              }),
            );
            await builder.apply(
              renderers.schemaEmailVerificationMutations.render({}),
            );
            if (emailOtp) {
              await builder.apply(renderers.constantsOtp.render({}));
              await builder.apply(
                renderers.servicesEmailOtp.render({
                  variables: {
                    TPL_EMAIL_OTP_EMAIL: TsCodeUtils.importFragment(
                      'EmailOtpEmail',
                      transactionalLibPackageName,
                    ),
                    // The user lookup lives inside the fragment so it is not
                    // left unused when names are not required.
                    TPL_NAME_REQUIRED_CHECK: requireNameOnRegistration
                      ? tsCodeFragment(
                          "const existingUser = await prisma.user.findUnique({\n    where: { email },\n    select: { id: true },\n  });\n\n  if (!existingUser && !name) {\n    throw new BadRequestError('Name is required', 'name-required');\n  }",
                        )
                      : '',
                  },
                }),
              );
              await builder.apply(renderers.schemaEmailOtpMutations.render({}));
            }
          },
        };
      },
    }),
  }),
});
