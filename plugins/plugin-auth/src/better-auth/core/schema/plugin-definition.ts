import type { def } from '@baseplate-dev/project-builder-lib';

import {
  authRoleEntityType,
  definitionSchema,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createBetterAuthPluginDefinitionSchema = definitionSchema((ctx) =>
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

export type BetterAuthPluginDefinition = def.InferOutput<
  typeof createBetterAuthPluginDefinitionSchema
>;

export type BetterAuthPluginDefinitionInput = def.InferInput<
  typeof createBetterAuthPluginDefinitionSchema
>;
