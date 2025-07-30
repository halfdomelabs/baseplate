import {
  tsImportBuilder,
  tsTemplate,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import {
  reactComponentsImportsProvider,
  reactRouterConfigProvider,
} from '#src/generators/core/index.js';

import { authHooksImportsProvider } from '../_providers/auth-hooks.js';
import { AUTH_AUTH_ERRORS_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';
import { authErrorsImportsProvider } from './generated/ts-import-providers.js';

const descriptorSchema = z.object({});

/**
 * Provides a set of errors for authentication.
 */
export const authErrorsGenerator = createGenerator({
  name: 'auth/auth-errors',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    imports: GENERATED_TEMPLATES.imports.task,
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
    errorComponent: createGeneratorTask({
      dependencies: {
        reactRouterConfig: reactRouterConfigProvider,
        authHooksImports: authHooksImportsProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        authErrorsImports: authErrorsImportsProvider,
      },
      run({
        reactRouterConfig,
        authHooksImports,
        reactComponentsImports,
        authErrorsImports,
      }) {
        reactRouterConfig.errorComponentHeaderFragments.set(
          'auth-errors',
          tsTemplate`const logout = ${authHooksImports.useLogOut.fragment()}()`,
        );
        reactRouterConfig.errorComponentBodyFragments.set(
          'auth-errors',
          tsTemplateWithImports([
            tsImportBuilder(['Link']).from('@tanstack/react-router'),
            reactComponentsImports.ErrorDisplay.declaration(),
            reactComponentsImports.Button.declaration(),
            authErrorsImports.InvalidRoleError.declaration(),
          ])`if (error instanceof InvalidRoleError) {
            return (
              <ErrorDisplay
                header="Access Denied"
                error="You are not authorized to access this page. Please contact support if you believe this is an error."
                actions={
                  <div className="flex gap-2">
                    <Link to="/">
                      <Button>Return Home</Button>
                    </Link>
                    <Button variant="secondary" onClick={logout}>
                      Logout
                    </Button>
                  </div>
                }
              />
            );
          }`,
        );
      },
    }),
  }),
});
