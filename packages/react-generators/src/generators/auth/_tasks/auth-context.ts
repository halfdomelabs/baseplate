import { tsTemplate } from '@baseplate-dev/core-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import { reactRouterConfigProvider } from '#src/generators/core/index.js';

import { authHooksImportsProvider } from '../_providers/auth-hooks.js';

/**
 * Re-usable task that creates the expected auth context for Router
 */
export const authContextTask = createGeneratorTask({
  dependencies: {
    reactRouterConfig: reactRouterConfigProvider,
    authHooksImports: authHooksImportsProvider,
  },
  run({ reactRouterConfig, authHooksImports }) {
    reactRouterConfig.routerSetupFragments.set(
      'auth-context',
      tsTemplate`const { userId } = ${authHooksImports.useSession.fragment()}()`,
    );
    reactRouterConfig.rootContextFields.add({
      name: 'userId',
      type: tsTemplate`string | undefined`,
      optional: true,
      routerProviderInitializer: {
        code: tsTemplate`userId`,
        dependencies: ['userId'],
      },
    });
  },
});
