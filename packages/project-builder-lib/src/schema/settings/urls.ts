import { z } from 'zod';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { appEntityType } from '../apps/types.js';

/**
 * URL settings schema
 *
 * The origins themselves live on the apps that serve them (`app.url`). This
 * section only records which web app is the primary client, which generators
 * read at compile time when they must pick one.
 */
export const createUrlsSettingsSchema = definitionSchema((ctx) =>
  z.object({
    /**
     * The project's primary web app.
     *
     * When unset, the first web app not named "admin" is used.
     */
    defaultWebAppRef: z.optional(
      ctx.withRef({
        type: appEntityType,
        onDelete: 'SET_UNDEFINED',
      }),
    ),
  }),
);
