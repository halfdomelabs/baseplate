import {
  DEFAULT_TYPESCRIPT_COMPILER_OPTIONS,
  nodeProvider,
  packageScope,
  TsCodeUtils,
  tsTemplate,
  typescriptSetupProvider,
} from '@baseplate-dev/core-generators';
import { REACT_PACKAGES } from '@baseplate-dev/react-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import path from 'node:path';
import { z } from 'zod';

import { EMAIL_TRANSACTIONAL_LIB_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Package versions for the transactional email library
 */
const TRANSACTIONAL_LIB_PACKAGES = {
  prod: {
    '@react-email/components': '1.0.3',
    react: REACT_PACKAGES.react,
    'react-dom': REACT_PACKAGES['react-dom'],
  },
  dev: {
    '@types/react': REACT_PACKAGES['@types/react'],
  },
} as const;

export interface EmailTemplateExport {
  exportName: string;
  exportPath: string;
}

export interface EmailTemplatesProvider {
  registerExport(templateExport: EmailTemplateExport): void;
}

export const emailTemplatesProvider =
  createProviderType<EmailTemplatesProvider>('email-templates');

/**
 * Generator for email/transactional-lib
 *
 * This generator sets up a transactional email library using React Email components.
 * It configures TypeScript for JSX and adds the necessary dependencies.
 */
export const transactionalLibGenerator = createGenerator({
  name: 'email/transactional-lib',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: EMAIL_TRANSACTIONAL_LIB_GENERATED.paths.task,
    imports: EMAIL_TRANSACTIONAL_LIB_GENERATED.imports.task,
    renderers: EMAIL_TRANSACTIONAL_LIB_GENERATED.renderers.task,

    // Configure TypeScript for JSX support
    configureTypescript: createGeneratorTask({
      dependencies: {
        typescriptSetup: typescriptSetupProvider,
      },
      run({ typescriptSetup }) {
        // Add JSX support for React Email components
        typescriptSetup.compilerOptions.set({
          ...DEFAULT_TYPESCRIPT_COMPILER_OPTIONS,
          jsx: 'react-jsx',
        });
      },
    }),

    // Add react-email dependencies
    nodePackages: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
      },
      run({ node }) {
        node.packages.addPackages({
          prod: TRANSACTIONAL_LIB_PACKAGES.prod,
          dev: TRANSACTIONAL_LIB_PACKAGES.dev,
        });
      },
    }),

    // Render templates
    main: createGeneratorTask({
      dependencies: {
        renderers: EMAIL_TRANSACTIONAL_LIB_GENERATED.renderers.provider,
        paths: EMAIL_TRANSACTIONAL_LIB_GENERATED.paths.provider,
      },
      exports: {
        emailTemplates: emailTemplatesProvider.export(packageScope),
      },
      run({ renderers, paths }) {
        const emailTemplates: EmailTemplateExport[] = [
          {
            exportName: 'TestEmail',
            exportPath: paths.emailsTest,
          },
        ];

        return {
          providers: {
            emailTemplates: {
              registerExport: (template) => {
                emailTemplates.push(template);
              },
            },
          },
          build: async (builder) => {
            const emailsIndexDir = path.posix.dirname(paths.emailsIndex);

            const emailTemplatesIndex = TsCodeUtils.mergeFragments(
              Object.fromEntries(
                emailTemplates.map((template) => {
                  const relativePath = path.posix
                    .relative(emailsIndexDir, template.exportPath)
                    .replace(/\.tsx?$/, '.js');
                  const moduleSpecifier = relativePath.startsWith('.')
                    ? relativePath
                    : `./${relativePath}`;

                  return [
                    template.exportPath,
                    tsTemplate`export { default as ${template.exportName} } from '${moduleSpecifier}';`,
                  ];
                }),
              ),
            );

            await builder.apply(
              renderers.mainGroup.render({
                variables: {
                  emailsIndex: {
                    TPL_EMAIL_TEMPLATES: emailTemplatesIndex,
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
