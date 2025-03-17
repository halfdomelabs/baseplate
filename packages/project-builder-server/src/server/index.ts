import type { FastifyInstance } from 'fastify';

import open from 'open';

import type { WebServerOptions } from './server.js';

import { buildServer } from './server.js';

export interface StartWebServerOptions extends WebServerOptions {
  browser: boolean;
  port?: number;
}

const DEFAULT_PORT = 3230;

export { BuilderServiceManager } from './builder-service-manager.js';

export async function startWebServer(
  options: StartWebServerOptions,
): Promise<FastifyInstance> {
  const { browser, port = DEFAULT_PORT, logger } = options;
  const server = await buildServer(options);

  try {
    await server.listen({ port });
  } catch (error) {
    if (
      error instanceof Error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'EADDRINUSE'
    ) {
      logger.info('Port in use - retrying in 500ms...');
      // wait a bit and try again since it could be tsx restarting
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
      await server.listen({ port });
    } else {
      throw error;
    }
  }

  if (browser) {
    open(`http://localhost:${port}`).catch((error: unknown) => {
      logger.error(error);
    });
  }

  return server;
}
