import { createSchemaMigration } from './types.js';

interface OldConfig {
  apps?: {
    id: string;
    type: string;
    name: string;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

interface NewConfig {
  apps?: {
    id: string;
    type: string;
    name: string;
    adminApp?: {
      enabled: boolean;
      pathPrefix: string;
      allowedRoles?: { id: string }[];
      sections?: {
        id: string;
        name: string;
        type: string;
        [key: string]: unknown;
      }[];
    };
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

export const migration016WebAdminConfig = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 16,
  name: 'webAdminApp',
  description:
    'Convert admin apps to web apps with adminApp and add adminApp to existing web apps',
  migrate: (config) => {
    if (!config.apps) {
      return config as NewConfig;
    }

    const apps = config.apps.map((app) => {
      // Convert admin apps to web apps with adminConfig enabled
      if (app.type === 'admin') {
        const { sections, allowedRoles, ...restApp } = app;
        return {
          ...restApp,
          type: 'web',
          adminApp: {
            enabled: true,
            pathPrefix: '/admin',
            sections: sections ?? [],
            allowedRoles: allowedRoles ?? undefined,
          },
        };
      }

      // Add adminApp to web apps that don't already have it
      if (app.type === 'web' && !('adminApp' in app)) {
        return {
          ...app,
          adminApp: {
            enabled: false,
            pathPrefix: '/admin',
          },
        };
      }

      return app;
    });

    return {
      ...config,
      apps,
    } as NewConfig;
  },
});
