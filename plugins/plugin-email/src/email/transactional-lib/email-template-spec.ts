import type {
  ProjectDefinition,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import type { AnyGeneratorBundle } from '@baseplate-dev/sync';

import { createFieldMapSpec } from '@baseplate-dev/project-builder-lib';

interface EmailTemplateGeneratorOptions {
  projectDefinition: ProjectDefinition;
  definitionContainer: ProjectDefinitionContainer;
}

/**
 * An email template contribution: either a ready-made generator bundle, or a
 * function resolved at compile time when the generator needs the project
 * definition (e.g. to read a plugin's own config).
 *
 * Return `undefined` from the function form to contribute nothing.
 */
export type EmailTemplateGeneratorEntry =
  | AnyGeneratorBundle
  | ((
      options: EmailTemplateGeneratorOptions,
    ) => AnyGeneratorBundle | undefined);

/**
 * Spec for registering email template generators with the transactional library.
 *
 * Plugins push entries during initialization, which are then added as children
 * of the transactional-lib compilation. As siblings of the transactional-lib
 * generator, they share packageScope and can depend on emailTemplatesProvider
 * to register exports in emails/index.ts.
 */
export const emailTemplateSpec = createFieldMapSpec(
  'email/email-template',
  (t) => ({
    generators: t.array<EmailTemplateGeneratorEntry>(),
  }),
);
