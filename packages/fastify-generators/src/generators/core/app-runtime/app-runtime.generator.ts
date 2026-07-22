import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { CORE_APP_RUNTIME_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generates the app runtime composition root: `createAppRuntime()` and the
 * `RuntimeServices` bag it delivers. Slices (queues, email, storage, etc.)
 * register themselves here in follow-on generators; this generator emits
 * the scaffolding with zero services registered.
 */
export const appRuntimeGenerator = createGenerator({
  name: 'core/app-runtime',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_APP_RUNTIME_GENERATED.paths.task,
    imports: CORE_APP_RUNTIME_GENERATED.imports.task,
    renderers: CORE_APP_RUNTIME_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: CORE_APP_RUNTIME_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.runtimeServices.render({}));
            await builder.apply(renderers.appRuntime.render({}));
          },
        };
      },
    }),
  }),
});
