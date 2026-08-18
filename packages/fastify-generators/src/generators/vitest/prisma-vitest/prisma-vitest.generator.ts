import {
  createNodePackagesTask,
  extractPackageVersions,
  packageInfoProvider,
  typescriptFileProvider,
  vitestConfigProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  normalizePathToOutputPath,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import path from 'node:path';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/index.js';

import { VITEST_PRISMA_VITEST_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/** Longest identifier Postgres stores without silently truncating (bytes). */
const POSTGRES_MAX_IDENTIFIER_BYTES = 63;

/** Reserved for the `_template` suffix appended to the base test database name. */
const TEMPLATE_SUFFIX_BYTES = '_template'.length;

/**
 * Cap on parallel Vitest workers for DB-backed runs. Each worker clones its own
 * database from the template, so uncapped worker counts on high-core CI runners
 * can exhaust `max_connections` or hit clone-lock contention on the template.
 */
const DB_BACKED_TEST_MAX_WORKERS = 8;

/**
 * Vitest's 5s default is a unit-test default, too tight for a suite whose
 * database-backed tests hold real transactions against a Postgres every worker
 * contends for: their tail is set by CI load rather than by the test. Applied
 * to the whole suite, since a ceiling only bites a test that has already hung.
 */
const DB_BACKED_TEST_TIMEOUT_MS = 15_000;

/**
 * Validates the base test database name derived from the package name.
 *
 * The name is interpolated into `CREATE`/`DROP DATABASE` in the generated test
 * helper, so it must be a safe unquoted identifier. It must also leave room for
 * the `_template` suffix within Postgres's 63-byte limit, or two workers would
 * alias onto one truncated database.
 *
 * @param baseName Base database name (package name with hyphens replaced).
 * @returns The validated name, unchanged.
 */
function assertValidTestDatabaseName(baseName: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(baseName)) {
    throw new Error(
      `Test database name "${baseName}" is not a valid Postgres identifier. Expected only lowercase letters, digits and underscores.`,
    );
  }
  const maxBaseBytes = POSTGRES_MAX_IDENTIFIER_BYTES - TEMPLATE_SUFFIX_BYTES;
  if (Buffer.byteLength(baseName) > maxBaseBytes) {
    throw new Error(
      `Test database name "${baseName}" is too long (${Buffer.byteLength(baseName)} bytes); must be at most ${maxBaseBytes} bytes to leave room for the "_template" suffix.`,
    );
  }
  return baseName;
}

export const prismaVitestGenerator = createGenerator({
  name: 'vitest/prisma-vitest',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(FASTIFY_PACKAGES, ['vitest-mock-extended']),
    }),
    paths: VITEST_PRISMA_VITEST_GENERATED.paths.task,
    imports: VITEST_PRISMA_VITEST_GENERATED.imports.task,
    renderers: VITEST_PRISMA_VITEST_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        prismaImports: prismaImportsProvider,
        packageInfo: packageInfoProvider,
        vitestConfig: vitestConfigProvider,
        paths: VITEST_PRISMA_VITEST_GENERATED.paths.provider,
        renderers: VITEST_PRISMA_VITEST_GENERATED.renderers.provider,
      },
      run({
        packageInfo,
        typescriptFile,
        prismaImports,
        vitestConfig,
        paths,
        renderers,
      }) {
        return {
          build: async (builder) => {
            const testDatabaseName = assertValidTestDatabaseName(
              `${packageInfo.getPackageName().replaceAll('-', '_')}_test`,
            );

            await builder.apply(
              renderers.workerDatabaseTestHelper.render({
                variables: {
                  TPL_TEST_DB: quot(testDatabaseName),
                },
              }),
            );

            await builder.apply(renderers.dbTestHelper.render({}));

            await builder.apply(
              renderers.prismaTestHelper.render({
                variables: {
                  TPL_PRISMA_PATH: quot(
                    typescriptFile.resolveModuleSpecifier(
                      prismaImports.prisma.moduleSpecifier,
                      paths.prismaTestHelper,
                    ),
                  ),
                },
              }),
            );

            // The global setup migrates a template database once per run.
            await builder.apply(renderers.globalSetupPrisma.render({}));
            vitestConfig.globalSetupFiles.push(
              normalizePathToOutputPath(paths.globalSetupPrisma),
            );

            // The per-file setup points this worker at its own database before
            // the file's imports evaluate, so it must be a setupFile rather
            // than global.
            await builder.apply(
              renderers.setupDb.render({
                variables: {
                  TPL_DB_TEST_HELPER_PATH: quot(
                    typescriptFile.resolveModuleSpecifier(
                      paths.dbTestHelper,
                      path.dirname(paths.setupDb),
                    ),
                  ),
                },
              }),
            );
            vitestConfig.setupFiles.push(
              normalizePathToOutputPath(paths.setupDb),
            );

            vitestConfig.maxWorkers.set(DB_BACKED_TEST_MAX_WORKERS);
            vitestConfig.testTimeout.set(DB_BACKED_TEST_TIMEOUT_MS);
          },
        };
      },
    }),
  }),
});
