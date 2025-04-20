import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { reactBaseConfigProvider } from '../react/react.generator.js';
import { CORE_REACT_APP_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

type CodeFragmentWrapper = (contents: TsCodeFragment) => TsCodeFragment;

/**
 * Type of render wrapper which determines the order of where it comes
 *
 * - `auth`: Wrapper for authentication
 * - `data`: Wrapper for data fetching
 */
type RenderWrapperType = 'auth' | 'data' | 'router';

const WRAPPER_PRIORITY: Record<RenderWrapperType, number> = {
  auth: 0,
  data: 1,
  router: 2,
};

export interface RenderWrapper {
  wrap: CodeFragmentWrapper;
  type: RenderWrapperType;
}

const [setupTask, reactAppConfigProvider, reactAppConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      errorBoundary: t.scalar<CodeFragmentWrapper>(),
      renderWrappers: t.map<string, RenderWrapper>(),
      renderSiblings: t.map<string, TsCodeFragment>(),
      renderRoot: t.scalar<TsCodeFragment>(),
    }),
    {
      prefix: 'react-app',
      configScope: projectScope,
    },
  );

export { reactAppConfigProvider };

const appPath = '@/src/app/App.tsx';

export const reactAppGenerator = createGenerator({
  name: 'core/react-app',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    reactBaseConfig: createProviderTask(
      reactBaseConfigProvider,
      (reactBaseConfig) => {
        reactBaseConfig.appFragment.set(
          tsCodeFragment(
            '<App />',
            tsImportBuilder().default('App').from('@/src/app/App'),
          ),
        );
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactAppConfigValues: reactAppConfigValuesProvider,
      },
      run({
        typescriptFile,
        reactAppConfigValues: {
          errorBoundary,
          renderWrappers,
          renderSiblings,
          renderRoot,
        },
      }) {
        return {
          build: async (builder) => {
            const rootWithSiblings = TsCodeUtils.mergeFragmentsPresorted([
              renderRoot ?? '<div />',
              ...sortBy([...renderSiblings.entries()], [([key]) => key]).map(
                ([, sibling]) => sibling,
              ),
              '\n',
            ]);

            const sortedWrappers = [
              errorBoundary,
              ...sortBy(
                [...renderWrappers.entries()],
                [
                  ([, wrapper]) => WRAPPER_PRIORITY[wrapper.type],
                  ([key]) => key,
                ],
              ).map(([, wrapper]) => wrapper.wrap),
            ].filter((x) => x !== undefined);

            let rootWithWrappers = rootWithSiblings;

            for (const wrapper of sortedWrappers.toReversed()) {
              rootWithWrappers = wrapper(rootWithWrappers);
            }

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_APP_TS_TEMPLATES.app,
                destination: appPath,
                variables: {
                  TPL_RENDER_ROOT: rootWithWrappers,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
