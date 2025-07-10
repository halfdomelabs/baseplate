import type { RenderTextTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { renderTextTemplateGroupAction } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_TAILWIND_PATHS } from './template-paths.js';
import { CORE_REACT_TAILWIND_TEMPLATES } from './typed-templates.js';

export interface CoreReactTailwindRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTextTemplateGroupActionInput<
          typeof CORE_REACT_TAILWIND_TEMPLATES.mainGroup
        >,
        'group' | 'paths'
      >,
    ) => BuilderAction;
  };
}

const coreReactTailwindRenderers =
  createProviderType<CoreReactTailwindRenderers>(
    'core-react-tailwind-renderers',
  );

const coreReactTailwindRenderersTask = createGeneratorTask({
  dependencies: { paths: CORE_REACT_TAILWIND_PATHS.provider },
  exports: { coreReactTailwindRenderers: coreReactTailwindRenderers.export() },
  run({ paths }) {
    return {
      providers: {
        coreReactTailwindRenderers: {
          mainGroup: {
            render: (options) =>
              renderTextTemplateGroupAction({
                group: CORE_REACT_TAILWIND_TEMPLATES.mainGroup,
                paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_TAILWIND_RENDERERS = {
  provider: coreReactTailwindRenderers,
  task: coreReactTailwindRenderersTask,
};
