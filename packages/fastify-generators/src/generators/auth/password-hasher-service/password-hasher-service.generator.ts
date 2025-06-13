import {
  createNodePackagesTask,
  extractPackageVersions,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import { AUTH_PASSWORD_HASHER_SERVICE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const passwordHasherServiceGenerator = createGenerator({
  name: 'auth/password-hasher-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH_PASSWORD_HASHER_SERVICE_GENERATED.paths.task,
    imports: AUTH_PASSWORD_HASHER_SERVICE_GENERATED.imports.task,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['@node-rs/argon2']),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: AUTH_PASSWORD_HASHER_SERVICE_GENERATED.paths.provider,
      },
      run({ typescriptFile, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  AUTH_PASSWORD_HASHER_SERVICE_GENERATED.templates
                    .passwordHasherService,
                destination: paths.passwordHasherService,
              }),
            );
          },
        };
      },
    }),
  }),
});
