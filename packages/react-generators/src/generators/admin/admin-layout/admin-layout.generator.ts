import { TsCodeUtils, tsImportBuilder } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { reactAuthRoutesProvider } from '#src/generators/auth/index.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';
import { reactRoutesProvider } from '#src/providers/index.js';

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
  requiredRoles: z.array(z.string()),
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
  buildTasks: ({ links = [], requiredRoles }) => ({
    paths: ADMIN_ADMIN_LAYOUT_GENERATED.paths.task,
    renderers: ADMIN_ADMIN_LAYOUT_GENERATED.renderers.task,
    route: createGeneratorTask({
      dependencies: {
        renderers: ADMIN_ADMIN_LAYOUT_GENERATED.renderers.provider,
        reactRoutes: reactRoutesProvider,
        reactAuth: reactAuthRoutesProvider,
      },
      run({ renderers, reactRoutes, reactAuth }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.adminRoute.render({
                variables: {
                  TPL_ROUTE_PATH: quot(reactRoutes.getRouteFilePath()),
                  TPL_LOGIN_URL_PATH: quot(reactAuth.getLoginUrlPath()),
                  TPL_REQUIRED_ROLES:
                    TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      requiredRoles.toSorted().map((role) => quot(role)),
                    ),
                },
              }),
            );
          },
        };
      },
    }),
    layout: createGeneratorTask({
      dependencies: {
        reactComponentsImports: reactComponentsImportsProvider,
        renderers: ADMIN_ADMIN_LAYOUT_GENERATED.renderers.provider,
      },
      run({ reactComponentsImports, renderers }) {
        return {
          build: async (builder) => {
            const navEntries = Object.fromEntries(
              links.map((link) => [
                link.path,
                TsCodeUtils.templateWithImports([
                  reactComponentsImports.SidebarMenuItem.declaration(),
                  reactComponentsImports.SidebarMenuButton.declaration(),
                  tsImportBuilder(['Link']).from('@tanstack/react-router'),
                ])`
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="${link.path}">
                      <${TsCodeUtils.importFragment(link.icon, getIconImport(link.icon))} />
                      <span>${link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                `,
              ]),
            );

            await builder.apply(
              renderers.adminLayout.render({
                variables: {
                  TPL_SIDEBAR_LINKS: TsCodeUtils.mergeFragments(navEntries),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
