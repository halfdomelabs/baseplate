import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  authContextGenerator,
  authPluginGenerator,
  authRolesGenerator,
  pothosAuthGenerator,
  userSessionTypesGenerator,
} from '@baseplate-dev/fastify-generators';
import { authIdentifyGenerator } from '@baseplate-dev/react-generators';

import type { AuthRoleDefinition } from '../roles/index.js';

type BackendAuthGenerators =
  | 'authContext'
  | 'authPlugin'
  | 'authRoles'
  | 'userSessionTypes';

/**
 * Creates the common backend auth generators
 *
 * @param params - The parameters for the generators
 * @param params.roles - The roles of the auth plugin
 * @returns The common backend auth generators
 */
export function createCommonBackendAuthModuleGenerators({
  roles,
}: {
  roles: AuthRoleDefinition[];
}): Record<BackendAuthGenerators, GeneratorBundle> {
  return {
    authContext: authContextGenerator({}),
    authPlugin: authPluginGenerator({}),
    authRoles: authRolesGenerator({
      roles: roles.map((r) => ({
        name: r.name,
        comment: r.comment,
        builtIn: r.builtIn,
      })),
    }),
    userSessionTypes: userSessionTypesGenerator({}),
  };
}

export function createCommonBackendAuthRootGenerators(): Record<
  'pothosAuth',
  GeneratorBundle
> {
  return {
    pothosAuth: pothosAuthGenerator({}),
  };
}

type WebAuthGenerators = 'authIdentify';

export function createCommonWebAuthGenerators(): Record<
  WebAuthGenerators,
  GeneratorBundle
> {
  return {
    authIdentify: authIdentifyGenerator({}),
  };
}
