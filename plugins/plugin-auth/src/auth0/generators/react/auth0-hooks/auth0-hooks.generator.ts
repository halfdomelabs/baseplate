import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactApolloProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import {
  createGenerator,
  createGeneratorTask,
  renderTextTemplateFileAction,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH0_AUTH0_HOOKS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  userQueryName: z.string().default('user'),
});

export const auth0HooksGenerator = createGenerator({
  name: 'auth0/auth0-hooks',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ userQueryName }) => ({
    paths: AUTH0_AUTH0_HOOKS_GENERATED.paths.task,
    imports: AUTH0_AUTH0_HOOKS_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactApollo: reactApolloProvider,
        reactErrorImports: reactErrorImportsProvider,
        generatedGraphqlImports: generatedGraphqlImportsProvider,
        paths: AUTH0_AUTH0_HOOKS_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        reactErrorImports,
        generatedGraphqlImports,
        reactApollo,
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: AUTH0_AUTH0_HOOKS_GENERATED.templates.hooksGroup,
                paths,
                variables: {
                  useCurrentUser: {
                    TPL_USER: userQueryName,
                  },
                },
                importMapProviders: {
                  generatedGraphqlImports,
                  reactErrorImports,
                },
              }),
            );

            await builder.apply(
              renderTextTemplateFileAction({
                template:
                  AUTH0_AUTH0_HOOKS_GENERATED.templates.useCurrentUserGql,
                destination: paths.useCurrentUserGql,
                variables: {
                  TPL_USER_QUERY_NAME: userQueryName,
                },
              }),
            );

            reactApollo.registerGqlFile(paths.useCurrentUserGql);
          },
        };
      },
    }),
  }),
});
