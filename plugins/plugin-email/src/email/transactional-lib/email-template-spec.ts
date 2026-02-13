import type { AnyGeneratorBundle } from '@baseplate-dev/sync';

import { createFieldMapSpec } from '@baseplate-dev/project-builder-lib';

/**
 * Spec for registering email template generators with the transactional library.
 *
 * Plugins push generator bundles during initialization, which are then added
 * as children of the transactional-lib compilation. As siblings of the
 * transactional-lib generator, they share packageScope and can depend on
 * emailTemplatesProvider to register exports in emails/index.ts.
 */
export const emailTemplateSpec = createFieldMapSpec(
  'email/email-template',
  (t) => ({
    generators: t.array<AnyGeneratorBundle>(),
  }),
);
