import {
  makeImportAndFilePath,
  quot,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import * as yup from 'yup';
import { authComponentsProvider } from '@src/generators/auth/auth-components';
import { authHooksProvider } from '@src/generators/auth/auth-hooks';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactRoutesProvider } from '@src/providers/routes';

const descriptorSchema = yup.object({
  links: yup.array(
    yup.object({
      label: yup.string().required(),
      icon: yup.string().required(),
      path: yup.string().required(),
    })
  ),
});

export type AdminLayoutProvider = unknown;

export const adminLayoutProvider =
  createProviderType<AdminLayoutProvider>('admin-layout');

const ICON_CATEGORY_REGEX = /^[A-Z][a-z]*/;

const AdminLayoutGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactComponents: reactComponentsProvider,
    reactRoutes: reactRoutesProvider,
    authComponents: authComponentsProvider,
    typescript: typescriptProvider,
    authHooks: authHooksProvider,
  },
  exports: {
    adminLayout: adminLayoutProvider,
  },
  createGenerator(
    { links = [] },
    { reactComponents, reactRoutes, authComponents, typescript, authHooks }
  ) {
    const adminLayout = typescript.createTemplate(
      {
        SIDEBAR_NAV: { type: 'code-expression' },
      },
      {
        importMappers: [reactComponents, authHooks],
      }
    );

    function getIconImport(iconName: string): string {
      const category = ICON_CATEGORY_REGEX.exec(iconName);
      if (!category) {
        throw new Error(`Invalid icon name: ${iconName}`);
      }
      return `react-icons/${category[0].toLowerCase()}`;
    }

    const navEntries = links.map((link) =>
      TypescriptCodeUtils.mergeExpressionsAsJsxElement('Sidebar.LinkItem', {
        Icon: TypescriptCodeUtils.createExpression(
          link.icon,
          `import { ${link.icon} } from '${getIconImport(link.icon)}';`
        ),
        to: quot(link.path),
        children: link.label,
      })
    );

    adminLayout.addCodeEntries({
      SIDEBAR_NAV: TypescriptCodeUtils.mergeExpressions(navEntries),
    });

    const [layoutImport, layoutPath] = makeImportAndFilePath(
      `${reactComponents.getComponentsFolder()}/AdminLayout/index.tsx`
    );

    reactRoutes.registerLayout({
      key: 'admin',
      element: TypescriptCodeUtils.createExpression(
        `<RequireAuth><AdminLayout /></RequireAuth>`,
        [
          `import AdminLayout from '${layoutImport}';`,
          `import {RequireAuth} from '%auth-components'`,
        ],
        {
          importMappers: [authComponents],
        }
      ),
    });

    return {
      getProviders: () => ({
        adminLayout: {},
      }),
      build: async (builder) => {
        await builder.apply(
          adminLayout.renderToAction('AdminLayout.tsx', layoutPath)
        );
      },
    };
  },
});

export default AdminLayoutGenerator;
