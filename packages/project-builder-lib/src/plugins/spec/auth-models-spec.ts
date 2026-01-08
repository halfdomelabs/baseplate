import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { createFieldMapSpec } from '#src/index.js';

type AuthModelsGetter = (definition: ProjectDefinition) => {
  user: string;
};

export const authModelsSpec = createFieldMapSpec(
  'core/auth-models',
  (t) => ({
    getAuthModels: t.scalar<AuthModelsGetter>(),
  }),
  {
    use: (values) => ({
      getAuthModels: (definition: ProjectDefinition) =>
        values.getAuthModels?.(definition),
      getAuthModelsOrThrow: (definition: ProjectDefinition) => {
        const authModels = values.getAuthModels?.(definition);
        if (!authModels) {
          throw new Error('Auth models not found');
        }
        return authModels;
      },
    }),
  },
);
