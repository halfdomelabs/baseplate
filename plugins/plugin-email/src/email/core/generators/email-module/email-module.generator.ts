import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  appRuntimeConfigProvider,
  configServiceProvider,
} from '@baseplate-dev/fastify-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { EMAIL_CORE_EMAIL_MODULE_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  transactionalLibPackageName: z.string(),
});

// Create a config provider for email adapters to register themselves
const [emailConfigTask, emailConfigProvider, emailConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      // The email adapter code fragment (e.g., postmarkEmailAdapter)
      emailAdapter: t.scalar<TsCodeFragment>(),
    }),
    {
      prefix: 'email',
      configScope: packageScope,
    },
  );

export { emailConfigProvider };

/**
 * Provider for transactional library configuration
 */
export interface TransactionalLibConfigProvider {
  getTransactionalLibPackageName(): string;
}

export const transactionalLibConfigProvider =
  createReadOnlyProviderType<TransactionalLibConfigProvider>(
    'email-transactional-lib-config',
  );

/**
 * Generator for email/core/email-module
 */
export const emailModuleGenerator = createGenerator({
  name: 'email/core/email-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ transactionalLibPackageName }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    imports: GENERATED_TEMPLATES.imports.task,
    emailConfig: emailConfigTask,
    // Export transactional lib config provider
    transactionalLibConfigTask: createGeneratorTask({
      outputs: {
        transactionalLibConfig:
          transactionalLibConfigProvider.export(packageScope),
      },
      run: () => ({
        build: () => ({
          transactionalLibConfig: {
            getTransactionalLibPackageName: () => transactionalLibPackageName,
          },
        }),
      }),
    }),
    // Add transactional lib package dependency
    nodePackages: createNodePackagesTask({
      prod: {
        [transactionalLibPackageName]: 'workspace:*',
      },
    }),
    // Add EMAIL_DEFAULT_FROM config field
    configService: createProviderTask(
      configServiceProvider,
      (configService) => {
        configService.configFields.set('EMAIL_DEFAULT_FROM', {
          comment: 'Default sender email address for transactional emails',
          validator: tsCodeFragment(
            `z.string().default('noreply@example.com')`,
            tsImportBuilder().named('z').from('zod'),
          ),
          exampleValue: 'noreply@example.com',
        });
      },
    ),
    // Register sendEmailWorker with the app module's queues field
    appModuleConfig: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        appModule: appModuleProvider,
      },
      run({ paths, appModule }) {
        appModule.moduleFields.set(
          'queues',
          'sendEmailWorker',
          tsCodeFragment(
            'sendEmailWorker',
            tsImportBuilder(['sendEmailWorker']).from(paths.sendEmailWorker),
          ),
        );
      },
    }),
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
        emailConfigValues: emailConfigValuesProvider,
      },
      run({ appRuntimeConfig, paths, emailConfigValues }) {
        const { emailAdapter } = emailConfigValues;
        if (!emailAdapter) {
          throw new Error(
            'No email adapter registered. Enable an email implementation plugin (e.g., Postmark).',
          );
        }
        appRuntimeConfig.services.set('email', {
          type: TsCodeUtils.typeImportFragment(
            'EmailService',
            paths.emailService,
          ),
        });
        // Internal: only the send worker names it, and keeping it off request
        // contexts is what makes bypassing the queue a compile error.
        appRuntimeConfig.services.set('emailTransport', {
          internal: true,
          type: TsCodeUtils.typeImportFragment(
            'EmailTransport',
            paths.emailTypes,
          ),
        });
        appRuntimeConfig.construction.set('email', {
          dependencies: ['queue'],
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createEmailService', paths.emailService)}({ queue })`,
        });
        appRuntimeConfig.construction.set('emailTransport', {
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createEmailTransport', paths.emailService)}(${emailAdapter})`,
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
              renderers.mainGroup.render({
                variables: {
                  emailService: {
                    TPL_RENDER_EMAIL: TsCodeUtils.importFragment(
                      'renderEmail',
                      transactionalLibPackageName,
                    ),
                    TPL_EMAIL_COMPONENT: TsCodeUtils.typeImportFragment(
                      'EmailComponent',
                      transactionalLibPackageName,
                    ),
                  },
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
