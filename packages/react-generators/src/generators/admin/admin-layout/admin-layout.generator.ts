import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { authComponentsImportsProvider } from '#src/generators/auth/_providers/auth-components.js';
import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import {
  reactComponentsImportsProvider,
  reactComponentsProvider,
} from '#src/generators/core/react-components/react-components.generator.js';
import { reactTailwindProvider } from '#src/generators/core/react-tailwind/react-tailwind.generator.js';
import { reactRoutesProvider } from '#src/providers/routes.js';

import { ADMIN_ADMIN_LAYOUT_TS_TEMPLATES } from './generated/ts-templates.js';

const linkItemSchema = z.object({
  type: z.literal('link'),
  label: z.string().min(1),
  icon: z.string().min(1),
  path: z.string().min(1),
});

export type AdminLayoutLinkItem = z.infer<typeof linkItemSchema>;

const descriptorSchema = z.object({
  links: z.array(linkItemSchema).optional(),
});

const ICON_CATEGORY_REGEX = /^[A-Z][a-z]*/;

function getIconImport(iconName: string): string {
  const category = ICON_CATEGORY_REGEX.exec(iconName);
  if (!category) {
    throw new Error(`Invalid icon name: ${iconName}`);
  }
  return `react-icons/${category[0].toLowerCase()}`;
}

export const adminLayoutGenerator = createGenerator({
  name: 'admin/admin-layout',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ links = [] }) => ({
    reactTailwind: createProviderTask(
      reactTailwindProvider,
      (reactTailwind) => {
        reactTailwind.addGlobalStyle(
          `body {
  overscroll-behavior-y: none;
}`,
        );
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        reactComponentsImports: reactComponentsImportsProvider,
        reactComponents: reactComponentsProvider,
        reactRoutes: reactRoutesProvider,
        authComponentsImports: authComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
        authHooksImports: authHooksImportsProvider,
      },
      run({
        reactComponentsImports,
        reactComponents,
        reactRoutes,
        authComponentsImports,
        typescriptFile,
        authHooksImports,
      }) {
        const layoutPath = `${reactComponents.getComponentsFolder()}/AdminLayout/index.tsx`;

        reactRoutes.registerLayout({
          key: 'admin',
          element: tsCodeFragment(
            `<RequireAuth><AdminLayout /></RequireAuth>`,
            [
              tsImportBuilder().default('AdminLayout').from(layoutPath),
              authComponentsImports.RequireAuth.declaration(),
            ],
          ),
        });

        return {
          build: async (builder) => {
            const navEntries = Object.fromEntries(
              links.map((link) => [
                link.path,
                TsCodeUtils.mergeFragmentsAsJsxElement('Sidebar.LinkItem', {
                  Icon: tsCodeFragment(
                    link.icon,
                    tsImportBuilder([link.icon]).from(getIconImport(link.icon)),
                  ),
                  to: link.path,
                  children: link.label,
                }),
              ]),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_LAYOUT_TS_TEMPLATES.adminLayout,
                destination: layoutPath,
                variables: {
                  TPL_SIDEBAR_LINKS: TsCodeUtils.mergeFragments(navEntries),
                },
                importMapProviders: {
                  authHooksImports,
                  reactComponentsImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
