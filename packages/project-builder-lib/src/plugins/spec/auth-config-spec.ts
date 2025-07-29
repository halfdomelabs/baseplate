import type { ProjectDefinition } from '#src/schema/project-definition.js';

import type { PluginSpecImplementation } from './types.js';

import { createPluginSpec } from './types.js';

export interface AuthRole {
  id: string;
  name: string;
}

type AuthRolesGetter = (definition: ProjectDefinition) => AuthRole[];

/**
 * Spec for allowing plugins to declare standard auth configurations
 */
export interface AuthConfigSpec extends PluginSpecImplementation {
  getAuthRoles: AuthRolesGetter;
}

/**
 * Spec for adding config component for plugin
 */
export const authConfigSpec = createPluginSpec<AuthConfigSpec>(
  'core/auth-config',
  {},
);
