import { tsCodeFragment } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { configServiceProvider } from '../config-service/index.js';
import { CORE_APP_SECRET_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * A development-only value, so a fresh project runs without provisioning
 * anything. Production must set its own; the comment on the field says so.
 */
const DEV_APP_SECRET = 'dev-only-app-secret-replace-in-production';

/** Shape of an acceptable secret: URL-safe, and long enough to seed HKDF. */
const SECRET_PATTERN = String.raw`/^[a-zA-Z0-9\-_+=/]{32,}$/`;

/**
 * Generates the application signing secret and the key-derivation service built
 * on top of it.
 *
 * The secret is never used directly. Callers ask for a key by purpose, so a key
 * compromised in one feature grants nothing in another, and no feature has to
 * provision a secret of its own.
 */
export const appSecretGenerator = createGenerator({
  name: 'core/app-secret',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_APP_SECRET_GENERATED.paths.task,
    imports: CORE_APP_SECRET_GENERATED.imports.task,
    renderers: CORE_APP_SECRET_GENERATED.renderers.task,
    configService: createProviderTask(
      configServiceProvider,
      (configService) => {
        configService.configFields.set('APP_SECRET', {
          validator: tsCodeFragment(`z.string().regex(${SECRET_PATTERN})`),
          comment:
            'Secret the app derives all signing keys from (at least 32 characters). Never used directly.',
          seedValue: DEV_APP_SECRET,
          exampleValue: DEV_APP_SECRET,
        });
        // Retired secrets. Values signed under one still verify, so rotating
        // APP_SECRET does not invalidate links already sent.
        configService.configFields.set('APP_SECRET_PREVIOUS', {
          // Entries are held to the same standard as APP_SECRET: they derive
          // keys that still verify, so a weak retired secret is a live weakness
          // rather than a historical one.
          validator: tsCodeFragment(
            `z
    .string()
    .default('')
    .refine(
      (value) =>
        value === '' ||
        value.split(',').every((entry) => ${SECRET_PATTERN}.test(entry.trim())),
      'Each entry must meet the same requirements as APP_SECRET',
    )`,
          ),
          comment:
            'Comma-separated previously-active values of APP_SECRET, in any order. Remove one to invalidate the tokens it signed. Leave empty until the first rotation.',
          exampleValue: '',
        });
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        renderers: CORE_APP_SECRET_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.appSecret.render({}));
          },
        };
      },
    }),
  }),
});
