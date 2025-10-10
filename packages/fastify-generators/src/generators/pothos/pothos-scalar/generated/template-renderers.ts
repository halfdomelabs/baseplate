import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { pothosImportsProvider } from '#src/generators/pothos/pothos/generated/ts-import-providers.js';

import { POTHOS_POTHOS_SCALAR_PATHS } from './template-paths.js';
import { POTHOS_POTHOS_SCALAR_TEMPLATES } from './typed-templates.js';

export interface PothosPothosScalarRenderers {
  date: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof POTHOS_POTHOS_SCALAR_TEMPLATES.date
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  dateTime: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof POTHOS_POTHOS_SCALAR_TEMPLATES.dateTime
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  json: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof POTHOS_POTHOS_SCALAR_TEMPLATES.json
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  jsonObject: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof POTHOS_POTHOS_SCALAR_TEMPLATES.jsonObject
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  uuid: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof POTHOS_POTHOS_SCALAR_TEMPLATES.uuid
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const pothosPothosScalarRenderers =
  createProviderType<PothosPothosScalarRenderers>(
    'pothos-pothos-scalar-renderers',
  );

const pothosPothosScalarRenderersTask = createGeneratorTask({
  dependencies: {
    paths: POTHOS_POTHOS_SCALAR_PATHS.provider,
    pothosImports: pothosImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    pothosPothosScalarRenderers: pothosPothosScalarRenderers.export(),
  },
  run({ paths, pothosImports, typescriptFile }) {
    return {
      providers: {
        pothosPothosScalarRenderers: {
          date: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_SCALAR_TEMPLATES.date,
                destination: paths.date,
                importMapProviders: {
                  pothosImports,
                },
                ...options,
              }),
          },
          dateTime: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_SCALAR_TEMPLATES.dateTime,
                destination: paths.dateTime,
                importMapProviders: {
                  pothosImports,
                },
                ...options,
              }),
          },
          json: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_SCALAR_TEMPLATES.json,
                destination: paths.json,
                importMapProviders: {
                  pothosImports,
                },
                ...options,
              }),
          },
          jsonObject: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_SCALAR_TEMPLATES.jsonObject,
                destination: paths.jsonObject,
                importMapProviders: {
                  pothosImports,
                },
                ...options,
              }),
          },
          uuid: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_SCALAR_TEMPLATES.uuid,
                destination: paths.uuid,
                importMapProviders: {
                  pothosImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const POTHOS_POTHOS_SCALAR_RENDERERS = {
  provider: pothosPothosScalarRenderers,
  task: pothosPothosScalarRenderersTask,
};
