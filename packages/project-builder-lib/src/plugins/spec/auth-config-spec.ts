import type { ProjectDefinition } from '@src/schema/project-definition.js';

import type { PluginSpecImplementation } from './types.js';

import { createPluginSpec } from './types.js';

type UserAccountModelGetter = (definition: ProjectDefinition) => string;

/**
 * Spec for allowing plugins to declare standard auth configurations
 */
export interface AuthConfigSpec extends PluginSpecImplementation {
  getUserAccountModel: UserAccountModelGetter;
}

/**
 * Spec for adding config component for plugin
 */
export const authConfigSpec = createPluginSpec<AuthConfigSpec>(
  'core/auth-config',
  {},
);
