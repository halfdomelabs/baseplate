import {
  makeImportAndFilePath,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { authComponentsProvider } from '@src/generators/auth/auth-components/auth-components.generator.js';
import { authHooksProvider } from '@src/generators/auth/auth-hooks/auth-hooks.generator.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/react-components.generator.js';
import { reactTailwindProvider } from '@src/generators/core/react-tailwind/react-tailwind.generator.js';
import { reactRoutesProvider } from '@src/providers/routes.js';

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

export type AdminLayoutProvider = unknown;

export const adminLayoutProvider =
  createProviderType<AdminLayoutProvider>('admin-layout');

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
    main: createGeneratorTask({
      dependencies: {
        reactComponents: reactComponentsProvider,
        reactRoutes: reactRoutesProvider,
        authComponents: authComponentsProvider,
        typescript: typescriptProvider,
        authHooks: authHooksProvider,
        reactTailwind: reactTailwindProvider,
      },
      exports: {
        adminLayout: adminLayoutProvider.export(projectScope),
      },
      run({
        reactComponents,
        reactRoutes,
        authComponents,
        typescript,
        authHooks,
        reactTailwind,
      }) {
        const adminLayout = typescript.createTemplate(
          {
            SIDEBAR_NAV: { type: 'code-expression' },
          },
          {
            importMappers: [reactComponents, authHooks],
          },
        );

        const navEntries = links.map((link) =>
          TypescriptCodeUtils.mergeExpressionsAsJsxElement('Sidebar.LinkItem', {
            Icon: TypescriptCodeUtils.createExpression(
              link.icon,
              `import { ${link.icon} } from '${getIconImport(link.icon)}';`,
            ),
            to: quot(link.path),
            children: link.label,
          }),
        );

        adminLayout.addCodeEntries({
          SIDEBAR_NAV: TypescriptCodeUtils.mergeExpressions(navEntries),
        });

        const [layoutImport, layoutPath] = makeImportAndFilePath(
          `${reactComponents.getComponentsFolder()}/AdminLayout/index.tsx`,
        );

        reactRoutes.registerLayout({
          key: 'admin',
          element: tsCodeFragment(
            `<RequireAuth><AdminLayout /></RequireAuth>`,
            [
              tsImportBuilder().default('AdminLayout').from(layoutImport),
              tsImportBuilder(['RequireAuth']).from(
                authComponents.getImportMap()['%auth-components']?.path ?? '',
              ),
            ],
          ),
        });

        reactTailwind.addGlobalStyle(
          `body {
  overscroll-behavior-y: none;
}`,
        );

        return {
          providers: {
            adminLayout: {},
          },
          build: async (builder) => {
            await builder.apply(
              adminLayout.renderToAction('AdminLayout.tsx', layoutPath),
            );
          },
        };
      },
    }),
  }),
});
