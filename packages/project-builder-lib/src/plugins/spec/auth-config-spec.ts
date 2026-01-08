import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { createFieldMapSpec } from '../utils/create-field-map-spec.js';

export interface AuthRole {
  id: string;
  name: string;
  comment: string;
  builtIn: boolean;
}

type AuthConfigGetter = (definition: ProjectDefinition) => {
  roles: AuthRole[];
  modelNames: {
    user: string;
  };
};

/**
 * Spec for allowing plugins to declare standard auth configurations
 */
export const authConfigSpec = createFieldMapSpec('core/auth-config', (t) => ({
  getAuthConfig: t.scalar<AuthConfigGetter>(),
}));
