import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createPlaceholderAuthPluginDefinitionSchema = definitionSchema(
  () => z.object({}),
);

export type PlaceholderAuthPluginDefinitionInput = def.InferInput<
  typeof createPlaceholderAuthPluginDefinitionSchema
>;
