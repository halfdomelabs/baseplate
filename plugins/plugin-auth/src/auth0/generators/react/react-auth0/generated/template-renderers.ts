import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH0_REACT_AUTH0_PATHS } from './template-paths.js';
import { AUTH0_REACT_AUTH0_TEMPLATES } from './typed-templates.js';

export interface Auth0ReactAuth0Renderers {
  authLoadedGate: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH0_REACT_AUTH0_TEMPLATES.authLoadedGate
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const auth0ReactAuth0Renderers = createProviderType<Auth0ReactAuth0Renderers>(
  'auth0-react-auth0-renderers',
);

const auth0ReactAuth0RenderersTask = createGeneratorTask({
  dependencies: {
    paths: AUTH0_REACT_AUTH0_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { auth0ReactAuth0Renderers: auth0ReactAuth0Renderers.export() },
  run({ paths, reactComponentsImports, reactErrorImports, typescriptFile }) {
    return {
      providers: {
        auth0ReactAuth0Renderers: {
          authLoadedGate: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH0_REACT_AUTH0_TEMPLATES.authLoadedGate,
                destination: paths.authLoadedGate,
                importMapProviders: {
                  reactComponentsImports,
                  reactErrorImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH0_REACT_AUTH0_RENDERERS = {
  provider: auth0ReactAuth0Renderers,
  task: auth0ReactAuth0RenderersTask,
};
