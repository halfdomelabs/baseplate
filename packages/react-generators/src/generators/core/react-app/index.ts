import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptCodeWrapper,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createOrderedList,
  createProviderType,
  OrderedList,
} from '@baseplate/sync';
import { z } from 'zod';
import { reactProvider } from '../react';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type ReactAppProvider = {
  getRenderWrappers(): OrderedList<TypescriptCodeWrapper>;
  setRenderRoot(root: TypescriptCodeExpression): void;
  addRenderSibling(sibling: TypescriptCodeExpression): void;
};

export const reactAppProvider =
  createProviderType<ReactAppProvider>('react-app');

const ReactAppGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {
    react: reactProvider,
    typescript: typescriptProvider,
  },
  exports: {
    reactApp: reactAppProvider,
  },
  createGenerator(descriptor, { react, typescript }) {
    const renderWrappers = createOrderedList<TypescriptCodeWrapper>();
    let renderRoot: TypescriptCodeExpression =
      TypescriptCodeUtils.createExpression('<div />');
    const renderSiblings: TypescriptCodeExpression[] = [];

    const appFile = typescript.createTemplate({
      COMPONENT_CODE: { type: 'code-block' },
      RENDER_WRAPPERS: { type: 'code-wrapper' },
      RENDER_ROOT: { type: 'code-expression', default: '<div />' },
    });
    const srcFolder = react.getSrcFolder();

    react
      .getIndexFile()
      .addCodeExpression(
        'APP',
        TypescriptCodeUtils.createExpression(
          '<App />',
          `import App from '@/${srcFolder}/app/App';`
        )
      );
    return {
      getProviders: () => ({
        reactApp: {
          getRenderWrappers() {
            return renderWrappers;
          },
          setRenderRoot(root) {
            renderRoot = root;
          },
          addRenderSibling(sibling) {
            renderSiblings.push(sibling);
          },
        },
      }),
      build: async (builder) => {
        const rootWithSiblings = TypescriptCodeUtils.mergeExpressions(
          [renderRoot, ...renderSiblings],
          '\n'
        );

        appFile.addCodeEntries({
          RENDER_WRAPPERS: renderWrappers.getItems(),
          RENDER_ROOT: rootWithSiblings,
        });

        const destination = `${srcFolder}/app/App.tsx`;
        await builder.apply(appFile.renderToAction('App.tsx', destination));
      },
    };
  },
});

export default ReactAppGenerator;
