import {
  baseLibraryValidators,
  definitionSchemaWithSlots,
  libraryEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const TRANSACTIONAL_LIB_TYPE =
  '@baseplate-dev/plugin-email/transactional-lib';

export const createTransactionalLibSchema = definitionSchemaWithSlots(
  { librarySlot: libraryEntityType },
  () =>
    z.object({
      ...baseLibraryValidators,
      type: z.literal(TRANSACTIONAL_LIB_TYPE),
    }),
);

export const transactionalLibDefinitionSchemaEntry = {
  name: TRANSACTIONAL_LIB_TYPE,
  definitionSchema: createTransactionalLibSchema,
};
