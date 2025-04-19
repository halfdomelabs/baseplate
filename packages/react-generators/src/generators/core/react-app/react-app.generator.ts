import type {
  TypescriptCodeExpression,
  TypescriptCodeWrapper,
} from '@halfdomelabs/core-generators';
import type { OrderedList } from '@halfdomelabs/sync';

import {
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createOrderedList,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactBaseConfigProvider } from '../react/react.generator.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface ReactAppProvider {
  setErrorBoundary(errorBoundary: TypescriptCodeWrapper): void;
  getRenderWrappers(): OrderedList<TypescriptCodeWrapper>;
  setRenderRoot(root: TypescriptCodeExpression): void;
  addRenderSibling(sibling: TypescriptCodeExpression): void;
}

export const reactAppProvider =
  createProviderType<ReactAppProvider>('react-app');

export const reactAppGenerator = createGenerator({
  name: 'core/react-app',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactBaseConfig: reactBaseConfigProvider,
        typescript: typescriptProvider,
      },
      exports: {
        reactApp: reactAppProvider.export(projectScope),
      },
      run({ reactBaseConfig, typescript }) {
        const renderWrappers = createOrderedList<TypescriptCodeWrapper>();
        let errorBoundary: TypescriptCodeWrapper | undefined;
        let renderRoot: TypescriptCodeExpression =
          TypescriptCodeUtils.createExpression('<div />');
        const renderSiblings: TypescriptCodeExpression[] = [];

        const appFile = typescript.createTemplate({
          COMPONENT_CODE: { type: 'code-block' },
          RENDER_WRAPPERS: { type: 'code-wrapper' },
          RENDER_ROOT: { type: 'code-expression', default: '<div />' },
        });

        reactBaseConfig.appFragment.set(
          tsCodeFragment(
            '<App />',
            tsImportBuilder().default('App').from('@/src/app/App'),
          ),
        );

        return {
          providers: {
            reactApp: {
              getRenderWrappers() {
                return renderWrappers;
              },
              setRenderRoot(root) {
                renderRoot = root;
              },
              setErrorBoundary(wrapper: TypescriptCodeWrapper) {
                if (errorBoundary) {
                  throw new Error('Error boundary already set');
                }
                errorBoundary = wrapper;
              },
              addRenderSibling(sibling) {
                renderSiblings.push(sibling);
              },
            },
          },
          build: async (builder) => {
            const rootWithSiblings = TypescriptCodeUtils.mergeExpressions(
              [renderRoot, ...renderSiblings],
              '\n',
            );

            appFile.addCodeEntries({
              RENDER_WRAPPERS: TypescriptCodeUtils.mergeWrappers([
                ...(errorBoundary ? [errorBoundary] : []),
                ...renderWrappers.getItems(),
              ]),
              RENDER_ROOT: rootWithSiblings,
            });

            const destination = `src/app/App.tsx`;
            await builder.apply(appFile.renderToAction('App.tsx', destination));
          },
        };
      },
    }),
  }),
});
