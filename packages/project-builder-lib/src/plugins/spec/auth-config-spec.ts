import type { ProjectDefinition } from '@src/schema/project-definition.js';

import type { PluginSpecImplementation } from './types.js';

import { createPluginSpec } from './types.js';

type UserAccountModelGetter = (definition: ProjectDefinition) => string;

/**
 * Spec for allowing plugins to declare standard auth configurations
 */
export interface AuthConfigSpec extends PluginSpecImplementation {
  registerUserAccountModelGetter: (
    pluginId: string,
    getter: UserAccountModelGetter,
  ) => void;
  getUserAccountModel: (definition: ProjectDefinition) => string | undefined;
}

export function createAuthConfigImplementation(): AuthConfigSpec {
  let userAccountModelGetter: UserAccountModelGetter | undefined;
  let assignedBy: string | undefined;

  return {
    registerUserAccountModelGetter(pluginId, getter) {
      if (userAccountModelGetter) {
        throw new Error(
          `User account model is already registered by ${assignedBy}`,
        );
      }
      userAccountModelGetter = getter;
      assignedBy = pluginId;
    },
    getUserAccountModel(definition) {
      return userAccountModelGetter?.(definition);
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const authConfigSpec = createPluginSpec('core/auth-config', {
  defaultInitializer: createAuthConfigImplementation,
});
