import { AUTH_DEFAULT_ROLES, authRoleEntityType } from '@src/schema/index.js';

import { createSchemaMigration } from './types.js';

interface OldConfig {
  auth: {
    roles: {
      id: string;
      name: string;
      comment: string;
    }[];
  };
}

interface NewConfig {
  auth: {
    roles: {
      id: string;
      name: string;
      builtIn: boolean;
      comment: string;
    }[];
  };
}

export const migration008AnonymousPublicRole = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 8,
  name: 'anonymousPublicRole',
  description: 'Migrate anonymous to public role',
  migrate: (config) => ({
    ...config,
    auth: {
      ...config.auth,
      roles: [
        ...AUTH_DEFAULT_ROLES.map((role) => {
          const existingRole = config.auth.roles.find(
            (r) =>
              r.name === role.name ||
              (r.name === 'anonymous' && role.name === 'public'),
          );
          return {
            id: existingRole?.id ?? authRoleEntityType.generateNewId(),
            name: role.name,
            comment: role.comment,
            builtIn: true,
          };
        }),
        ...config.auth.roles
          .filter(
            (r) =>
              !AUTH_DEFAULT_ROLES.some((role) => role.name === r.name) &&
              r.name !== 'anonymous',
          )
          .map((r) => ({
            id: r.id,
            name: r.name,
            comment: r.comment,
            builtIn: false,
          })),
      ],
    },
  }),
});
