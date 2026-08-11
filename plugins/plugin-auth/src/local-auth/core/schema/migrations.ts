import type { PluginConfigMigration } from '@baseplate-dev/project-builder-lib';

import { modelScalarFieldEntityType } from '@baseplate-dev/project-builder-lib';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

interface RawScalarField {
  id?: string;
  name: string;
  type: string;
  isOptional?: boolean;
  options?: Record<string, unknown>;
}

interface RawProjectDefinition {
  models?: {
    name: string;
    model?: { fields?: RawScalarField[] };
  }[];
}

export const LOCAL_AUTH_PLUGIN_CONFIG_MIGRATIONS: PluginConfigMigration[] = [
  {
    name: 'add-auth-verification-attempts',
    version: 1,
    // Emailed sign-in codes count failed guesses in a column so the counter can
    // be incremented in the database. The field is added for every project, not
    // just those with the flow enabled, because migrations run on a version
    // bump rather than when the setting is toggled — gating it here would break
    // anyone who turns the flow on later.
    migrate: () => ({
      updateProjectDefinition: (draft: unknown) => {
        const draftDef = draft as RawProjectDefinition;

        const authVerification = draftDef.models?.find(
          (model) => model.name === LOCAL_AUTH_MODELS.authVerification,
        );
        const fields = authVerification?.model?.fields;

        // Projects created after this change are seeded with the field already.
        if (!fields || fields.some((field) => field.name === 'attempts')) {
          return;
        }

        // Ahead of expiresAt/createdAt, matching the seeded field order so a
        // migrated definition and a fresh one produce the same schema.
        const timestampIndex = fields.findIndex(
          (field) => field.name === 'expiresAt',
        );
        const insertAt = timestampIndex === -1 ? fields.length : timestampIndex;

        fields.splice(insertAt, 0, {
          id: modelScalarFieldEntityType.generateNewId(),
          name: 'attempts',
          type: 'int',
          isOptional: false,
          options: { default: '0' },
        });
      },
    }),
  },
];
