import type { RenderTextTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { renderTextTemplateFileAction } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_PATHS } from './template-paths.js';
import { DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_TEMPLATES } from './typed-templates.js';

export interface DevAgentsCoreDevAgentsConfigRenderers {
  agentsMd: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<
          typeof DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_TEMPLATES.agentsMd
        >,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
  baseplateMd: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<
          typeof DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_TEMPLATES.baseplateMd
        >,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
  claudeMd: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<
          typeof DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_TEMPLATES.claudeMd
        >,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
}

const devAgentsCoreDevAgentsConfigRenderers =
  createProviderType<DevAgentsCoreDevAgentsConfigRenderers>(
    'dev-agents-core-dev-agents-config-renderers',
  );

const devAgentsCoreDevAgentsConfigRenderersTask = createGeneratorTask({
  dependencies: { paths: DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_PATHS.provider },
  exports: {
    devAgentsCoreDevAgentsConfigRenderers:
      devAgentsCoreDevAgentsConfigRenderers.export(),
  },
  run({ paths }) {
    return {
      providers: {
        devAgentsCoreDevAgentsConfigRenderers: {
          agentsMd: {
            render: (options) =>
              renderTextTemplateFileAction({
                template: DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_TEMPLATES.agentsMd,
                destination: paths.agentsMd,
                ...options,
              }),
          },
          baseplateMd: {
            render: (options) =>
              renderTextTemplateFileAction({
                template:
                  DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_TEMPLATES.baseplateMd,
                destination: paths.baseplateMd,
                ...options,
              }),
          },
          claudeMd: {
            render: (options) =>
              renderTextTemplateFileAction({
                template: DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_TEMPLATES.claudeMd,
                destination: paths.claudeMd,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_RENDERERS = {
  provider: devAgentsCoreDevAgentsConfigRenderers,
  task: devAgentsCoreDevAgentsConfigRenderersTask,
};
