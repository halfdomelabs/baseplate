import {
  tsCodeFragment,
  TsCodeUtils,
  tsHoistedFragment,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { snakeCase } from 'es-toolkit';
import { z } from 'zod';

import { configServiceProvider } from '../config-service/index.js';
import { CORE_APP_URLS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  /** The backend's own public origin. */
  apiUrl: z.string(),
  /** Every web app that can act as a client of this backend. */
  webApps: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      /** Whether this is the app the backend links to when no client is in scope. */
      isDefault: z.boolean(),
    }),
  ),
});

/** Validator shared by every origin field. */
const ORIGIN_VALIDATOR = tsCodeFragment('originUrl', undefined, {
  hoistedFragments: [
    tsHoistedFragment(
      'origin-url-validator',
      `const originUrl = z
  .url({ protocol: /^https?$/ })
  .refine(
    (url) => {
      const parsed = new URL(url);
      return parsed.pathname === '/' && !parsed.search && !parsed.hash;
    },
    'Must be an origin without a path, e.g. https://app.example.com',
  )
  .transform((url) => url.replace(/\\/+$/, ''));`,
      tsImportBuilder(['z']).from('zod'),
    ),
  ],
});

/** Env var holding one web app's origin. */
function webUrlConfigKey(appName: string): string {
  return `WEB_URL_${snakeCase(appName).toUpperCase()}`;
}

/** Generates the service that resolves the app's own public origins. */
export const appUrlsGenerator = createGenerator({
  name: 'core/app-urls',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ apiUrl, webApps }) => {
    const webAppConfigKeys = webApps.map((app) => ({
      ...app,
      configKey: webUrlConfigKey(app.name),
    }));

    const duplicateKey = webAppConfigKeys.find(
      (app, idx) =>
        app.configKey === 'API_URL' ||
        webAppConfigKeys.findIndex((o) => o.configKey === app.configKey) !==
          idx,
    );
    if (duplicateKey) {
      throw new Error(
        `Web app "${duplicateKey.name}" maps to config field ${duplicateKey.configKey}, which is already taken. Rename the app so each one gets a distinct URL config field.`,
      );
    }

    return {
      paths: CORE_APP_URLS_GENERATED.paths.task,
      imports: CORE_APP_URLS_GENERATED.imports.task,
      renderers: CORE_APP_URLS_GENERATED.renderers.task,
      configService: createProviderTask(
        configServiceProvider,
        (configService) => {
          configService.configFields.set('API_URL', {
            validator: ORIGIN_VALIDATOR,
            comment: `Public origin of this backend, used for links a third party has to reach (e.g. https://api.example.com)`,
            seedValue: apiUrl,
            exampleValue: apiUrl,
          });

          for (const { name, url, configKey } of webAppConfigKeys) {
            configService.configFields.set(configKey, {
              validator: ORIGIN_VALIDATOR,
              comment: `Public origin of the ${name} web app (e.g. https://app.example.com)`,
              seedValue: url,
              exampleValue: url,
            });
          }

          configService.configFields.set('ADDITIONAL_WEB_ORIGINS', {
            validator: tsCodeFragment(`z.string().default('')`),
            comment:
              "Additional origins to trust beyond this project's web apps, comma-separated. For a preview deployment or a marketing site. Each must be an exact origin.",
            exampleValue: '',
          });
        },
      ),
      main: createGeneratorTask({
        dependencies: {
          renderers: CORE_APP_URLS_GENERATED.renderers.provider,
        },
        run({ renderers }) {
          return {
            build: async (builder) => {
              await builder.apply(
                renderers.appUrls.render({
                  variables: {
                    TPL_WEB_APP_NAMES: tsCodeFragment(
                      webAppConfigKeys.map((app) => quot(app.name)).join(' | '),
                    ),
                    TPL_WEB_APP_ORIGINS: TsCodeUtils.mergeFragmentsAsObject(
                      Object.fromEntries(
                        webAppConfigKeys.map((app) => [
                          app.name,
                          `config.${app.configKey}`,
                        ]),
                      ),
                    ),
                  },
                }),
              );
            },
          };
        },
      }),
    };
  },
});
