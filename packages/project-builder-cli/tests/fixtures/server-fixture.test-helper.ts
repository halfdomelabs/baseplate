/* eslint-disable no-empty-pattern -- required by Playwright */
import type { BuilderServiceManager } from '@halfdomelabs/project-builder-server';
import type { FastifyInstance } from 'fastify';

import {
  prettyStableStringify,
  type ProjectDefinition,
} from '@halfdomelabs/project-builder-lib';
import { test as base } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { serveWebServer } from '@src/server.js';

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

// Extend the base Playwright test with our fixture
export const test = base.extend<
  {
    projectDefinition: ProjectDefinition | undefined;
    serviceUrl: string;
  },
  {
    server: {
      url: string;
      port: number;
      builderServiceManager: BuilderServiceManager;
    };
  }
>({
  projectDefinition: undefined,
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
  serviceUrl: async ({ projectDefinition, server }, use, { parallelIndex }) => {
    // Generate a unique temp directory for this test run
    const tempDir = path.join(os.tmpdir(), `baseplate-test-${parallelIndex}`);

    // Delete the temp directory if it exists
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Failed to clean up temp directory: ${tempDir}`, err);
    }

    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

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

    // Write the project definition
    async function writeProjectDefinition(
      content: ProjectDefinition,
    ): Promise<void> {
      await fs.writeFile(
        path.join(tempDir, 'project.json'),
        prettyStableStringify(content),
      );
    }

    if (projectDefinition) {
      await writeProjectDefinition(projectDefinition);
    }

    // Add service to the server
    const service = server.builderServiceManager.addService(tempDir);

    try {
      // Use the fixture in the test
      await use(`http://localhost:${server.port}`);
    } finally {
      // Remove the service from the server
      server.builderServiceManager.removeService(service.id);

      // Clean up the temp directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.warn(`Failed to clean up temp directory: ${tempDir}`, err);
      }
    }
  },
});

export { expect } from '@playwright/test';
