import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { reactPagesProvider } from '@src/providers/pages';
import { reactComponentsProvider } from '../react-components';

const descriptorSchema = yup.object({
  layoutKey: yup.string(),
});

const ReactNotFoundHandlerGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactPages: reactPagesProvider,
    reactComponents: reactComponentsProvider,
    typescript: typescriptProvider,
  },
  createGenerator({ layoutKey }, { reactPages, reactComponents, typescript }) {
    const [notFoundPageImport, notFoundPagePath] = makeImportAndFilePath(
      `${reactPages.getDirectoryBase()}/NotFoundPage.tsx`
    );

    reactPages.registerRoute({
      path: '*',
      element: TypescriptCodeUtils.createExpression(
        `<NotFoundPage />`,
        `import NotFoundPage from '${notFoundPageImport}';`,
        {
          importMappers: [reactComponents],
        }
      ),
      layoutKey,
    });
    return {
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'NotFoundPage.tsx',
            destination: notFoundPagePath,
            importMappers: [reactComponents],
          })
        );
      },
    };
  },
});

export default ReactNotFoundHandlerGenerator;
