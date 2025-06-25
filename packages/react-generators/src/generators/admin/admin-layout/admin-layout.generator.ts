import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { authComponentsImportsProvider } from '#src/generators/auth/_providers/auth-components.js';
import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';
import { reactRoutesProvider } from '#src/providers/routes.js';

import { ADMIN_ADMIN_LAYOUT_GENERATED } from './generated/index.js';

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
    paths: ADMIN_ADMIN_LAYOUT_GENERATED.paths.task,
    main: createGeneratorTask({
      dependencies: {
        reactComponentsImports: reactComponentsImportsProvider,
        reactRoutes: reactRoutesProvider,
        authComponentsImports: authComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
        authHooksImports: authHooksImportsProvider,
        paths: ADMIN_ADMIN_LAYOUT_GENERATED.paths.provider,
      },
      run({
        reactComponentsImports,
        reactRoutes,
        authComponentsImports,
        typescriptFile,
        authHooksImports,
        paths,
      }) {
        reactRoutes.registerLayout({
          key: 'admin',
          element: tsCodeFragment(
            `<RequireAuth><AdminLayout /></RequireAuth>`,
            [
              tsImportBuilder(['AdminLayout']).from(paths.adminLayout),
              authComponentsImports.RequireAuth.declaration(),
            ],
          ),
        });

        return {
          build: async (builder) => {
            const navEntries = Object.fromEntries(
              links.map((link) => [
                link.path,
                TsCodeUtils.templateWithImports([
                  reactComponentsImports.NavigationMenuItemWithLink.declaration(),
                  tsImportBuilder(['NavLink']).from('react-router-dom'),
                ])`
                <NavigationMenuItemWithLink asChild>
                  <NavLink to="${link.path}" className="flex-row items-center gap-2">
                    <${TsCodeUtils.importFragment(link.icon, getIconImport(link.icon))} />
                    ${link.label}
                  </NavLink>
                </NavigationMenuItemWithLink>
                `,
              ]),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_LAYOUT_GENERATED.templates.adminLayout,
                destination: paths.adminLayout,
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
