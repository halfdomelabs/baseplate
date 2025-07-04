import { TsCodeUtils, tsImportBuilder } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';

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
    renderers: ADMIN_ADMIN_LAYOUT_GENERATED.renderers.task,
    route: createGeneratorTask({
      dependencies: {
        renderers: ADMIN_ADMIN_LAYOUT_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.adminRoute.render({}));
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
                  reactComponentsImports.NavigationMenuItemWithLink.declaration(),
                  tsImportBuilder(['Link']).from('@tanstack/react-router'),
                ])`
                <NavigationMenuItemWithLink asChild>
                  <Link to="${link.path}" className="flex-row items-center gap-2">
                    <${TsCodeUtils.importFragment(link.icon, getIconImport(link.icon))} />
                    ${link.label}
                  </Link>
                </NavigationMenuItemWithLink>
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
