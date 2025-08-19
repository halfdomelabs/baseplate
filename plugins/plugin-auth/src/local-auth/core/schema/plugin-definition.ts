import type { def } from '@baseplate-dev/project-builder-lib';

import {
  authRoleEntityType,
  definitionSchema,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createLocalAuthPluginDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    initialUserRoles: ctx.withDefault(
      z.array(
        ctx.withRef({
          type: authRoleEntityType,
          onDelete: 'DELETE',
        }),
      ),
      [],
    ),
    userAdminRoles: ctx.withDefault(
      z.array(
        ctx.withRef({
          type: authRoleEntityType,
          onDelete: 'DELETE',
        }),
      ),
      [],
    ),
  }),
);

export type LocalAuthPluginDefinition = def.InferOutput<
  typeof createLocalAuthPluginDefinitionSchema
>;

export type LocalAuthPluginDefinitionInput = def.InferInput<
  typeof createLocalAuthPluginDefinitionSchema
>;
