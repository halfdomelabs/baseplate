import { TsCodeUtils, tsImportBuilder } from '@baseplate-dev/core-generators';
import {
  reactAppConfigProvider,
  reactRouterConfigProvider,
} from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { LOCAL_AUTH_CORE_REACT_SESSION_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for React session management
 */
export const reactSessionGenerator = createGenerator({
  name: 'local-auth/core/react-session',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    reactAppConfig: createGeneratorTask({
      dependencies: {
        reactAppConfig: reactAppConfigProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ reactAppConfig, paths }) {
        reactAppConfig.renderWrappers.set('react-session', {
          wrap: (contents) =>
            TsCodeUtils.templateWithImports([
              tsImportBuilder(['UserSessionProvider']).from(
                paths.userSessionProvider,
              ),
            ])`<UserSessionProvider>${contents}</UserSessionProvider>`,
          type: 'router',
        });
      },
    }),
    reactRouterConfig: createGeneratorTask({
      dependencies: {
        reactRouterConfig: reactRouterConfigProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ reactRouterConfig, paths }) {
        reactRouterConfig.routerSetupFragments.set(
          'auth-session-router-sync',
          TsCodeUtils.templateWithImports([
            tsImportBuilder(['useEffect']).from('react'),
            tsImportBuilder(['userSessionClient']).from(
              paths.userSessionClient,
            ),
          ])`
          // RouterProvider only copies the context into the router when it renders, so push
          // the session in as soon as it changes. Otherwise a navigation triggered in the
          // same tick as a sign in or sign out runs its guards against the old session.
          useEffect(
            () =>
              userSessionClient.subscribe(() => {
                const currentSession = userSessionClient.getSession();
                if (!currentSession) return;
                router.update({
                  ...router.options,
                  context: {
                    ...router.options.context,
                    session: currentSession,
                    userId: currentSession.userId,
                  },
                });
              }),
            [],
          );
          `,
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.mainGroup.render({
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
