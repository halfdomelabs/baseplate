import type { ProjectDefinition } from '#src/schema/project-definition.js';

import type { PluginSpecImplementation } from './types.js';

import { createPluginSpec } from './types.js';

type UserAccountModelGetter = (definition: ProjectDefinition) => string;

/**
 * Spec for allowing plugins to declare user model configurations
 */
export interface AuthModelConfigSpec extends PluginSpecImplementation {
  getUserModel: UserAccountModelGetter;
}

/**
 * Spec for adding user model config component for plugin
 */
export const authModelConfigSpec = createPluginSpec<AuthModelConfigSpec>(
  'core/auth-model-config',
  {},
);
