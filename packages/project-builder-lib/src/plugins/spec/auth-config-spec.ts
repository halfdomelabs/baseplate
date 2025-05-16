import type { AuthRole } from '@src/schema/index.js';
import type { ProjectDefinition } from '@src/schema/project-definition.js';

import type { PluginSpecImplementation } from './types.js';

import { createPluginSpec } from './types.js';

type UserAccountModelGetter = (definition: ProjectDefinition) => string;
type AuthRolesGetter = (definition: ProjectDefinition) => AuthRole[];

/**
 * Spec for allowing plugins to declare standard auth configurations
 */
export interface AuthConfigSpec extends PluginSpecImplementation {
  getUserAccountModel: UserAccountModelGetter;
  getAuthRoles: AuthRolesGetter;
}

/**
 * Spec for adding config component for plugin
 */
export const authConfigSpec = createPluginSpec<AuthConfigSpec>(
  'core/auth-config',
  {},
);
