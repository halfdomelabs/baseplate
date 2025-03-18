/* eslint-disable no-empty-pattern -- required by Playwright */
import type { BuilderServiceManager } from '@halfdomelabs/project-builder-server';
import type { FastifyInstance } from 'fastify';

import {
  getLatestMigrationVersion,
  prettyStableStringify,
  type ProjectDefinition,
} from '@halfdomelabs/project-builder-lib';
import { test as base } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pino } from 'pino';

import { serveWebServer } from '@src/server.js';
import { DEFAULT_LOGGER_OPTIONS } from '@src/services/logger.js';

/**
 * Start the server on an available port
 */
async function startServerOnAvailablePort(): Promise<{
  fastifyInstance: FastifyInstance;
  serviceManager: BuilderServiceManager;
  port: number;
}> {
  // Start the server on a random port
  const port = Math.floor(Math.random() * 5000) + 10_000;

  for (let i = 0; i < 100; i++) {
    try {
      const usedPort = port + i;
      const server = await serveWebServer([], {
        port: usedPort,
        browser: false,
        logger: pino({
          ...DEFAULT_LOGGER_OPTIONS,
          level: 'error',
        }),
      });
      return {
        fastifyInstance: server.fastifyInstance,
        serviceManager: server.serviceManager,
        port: usedPort,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'EADDRINUSE'
      ) {
        continue;
      } else {
        throw error;
      }
    }
  }

  throw new Error('Could not find available port');
}

/**
 * The payload for a project
 */
interface ProjectPayload {
  /**
   * The ID of the project
   */
  id: string;
  /**
   * The start URL of the project
   */
  startUrl: string;
  /**
   * Make a URL for the project with the project ID/server URL added
   * @param path - The path to append to the base URL
   * @returns The full URL
   */
  makeUrl: (path: string) => string;
  /**
   * Read the project definition from the project directory
   * @returns The project definition
   */
  readProjectDefinition: () => Promise<ProjectDefinition>;
  /**
   * Write the project definition to the project directory
   * @param projectDefinition - The project definition to write
   */
  writeProjectDefinition: (
    projectDefinition: ProjectDefinition,
  ) => Promise<void>;
}

// Extend the base Playwright test with our fixture
export const test = base.extend<
  {
    addProject: (
      projectDefinition?: ProjectDefinition,
    ) => Promise<ProjectPayload>;
    addInitializedProject: () => Promise<ProjectPayload>;
  },
  {
    server: {
      url: string;
      port: number;
      builderServiceManager: BuilderServiceManager;
    };
  }
>({
  server: [
    async ({}, use) => {
      let fastifyInstance: FastifyInstance | undefined;

      try {
        // Start the server
        const serverResult = await startServerOnAvailablePort();
        fastifyInstance = serverResult.fastifyInstance;
        const { port } = serverResult;

        // Create the fixture object
        const fixture = {
          url: `http://localhost:${port}`,
          port,
          builderServiceManager: serverResult.serviceManager,
        };

        // Use the fixture in the test
        await use(fixture);
      } finally {
        if (fastifyInstance) {
          await fastifyInstance.close().catch((err: unknown) => {
            console.warn(`Failed to close server: ${String(err)}`);
          });
        }
      }
    },
    { scope: 'worker' },
  ],
  addProject: async ({ server }, use, { parallelIndex }) => {
    const temporaryDirectory = path.join(
      os.tmpdir(),
      `baseplate-test-${parallelIndex}`,
    );
    let projectIdx = 0;
    try {
      await use(async (projectDefinition: ProjectDefinition | undefined) => {
        // Generate a unique temp directory for this test run
        const tempDir = path.join(temporaryDirectory, `project-${projectIdx}`);
        projectIdx++;

        // Delete the temp directory if it exists
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (err) {
          console.warn(`Failed to clean up temp directory: ${tempDir}`, err);
        }

        // Create temp directory
        await fs.mkdir(path.join(tempDir, 'baseplate'), { recursive: true });

        // Write package.json for the project
        await fs.writeFile(
          path.join(tempDir, 'package.json'),
          JSON.stringify(
            {
              name: 'test-project',
              version: '0.0.1',
              private: true,
            },
            null,
            2,
          ),
        );

        async function writeProjectDefinition(
          projectDefinition: ProjectDefinition,
        ): Promise<void> {
          await fs.writeFile(
            path.join(tempDir, 'baseplate/project-definition.json'),
            prettyStableStringify(projectDefinition),
          );
        }

        async function readProjectDefinition(): Promise<ProjectDefinition> {
          const contents = await fs.readFile(
            path.join(tempDir, 'baseplate/project-definition.json'),
            'utf8',
          );
          return JSON.parse(contents) as ProjectDefinition;
        }

        if (projectDefinition) {
          await writeProjectDefinition(projectDefinition);
        }

        // Add service to the server
        const service = server.builderServiceManager.addService(tempDir);

        return {
          id: service.id,
          startUrl: `${server.url}/?projectId=${service.id}`,
          makeUrl: (path: string) =>
            `${server.url}/${path}?projectId=${service.id}`,
          writeProjectDefinition,
          readProjectDefinition,
        };
      });
    } finally {
      // Remove all services from the server
      server.builderServiceManager.removeAllServices();

      // Clean up the temp directory
      try {
        await fs.rm(temporaryDirectory, { recursive: true, force: true });
      } catch (err) {
        console.warn(
          `Failed to clean up temp directory: ${temporaryDirectory}`,
          err,
        );
      }
    }
  },
  addInitializedProject: async ({ addProject }, use) => {
    await use(
      async () =>
        await addProject({
          name: 'test-project',
          version: '0.0.1',
          cliVersion: '0.0.1',
          portOffset: 7000,
          apps: [],
          features: [],
          models: [],
          isInitialized: true,
          schemaVersion: getLatestMigrationVersion(),
        }),
    );
  },
});

export { expect } from '@playwright/test';
