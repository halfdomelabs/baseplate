import open from 'open';

import { WebServerOptions, buildServer } from './server.js';

export interface StartWebServerOptions extends WebServerOptions {
  browser: boolean;
  port?: number;
}

const DEFAULT_PORT = 3230;

export async function startWebServer(
  options: StartWebServerOptions,
): Promise<void> {
  const { browser, port = DEFAULT_PORT, logger } = options;
  const server = await buildServer(options);

  try {
    await server.listen({ port });
  } catch (err) {
    if (
      err instanceof Error &&
      typeof err === 'object' &&
      'code' in err &&
      err.code === 'EADDRINUSE'
    ) {
      logger.info('Port in use - retrying in 500ms...');
      // wait a bit and try again since it could be tsx restarting
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
      await server.listen({ port });
    } else {
      throw err;
    }
  }

  if (browser) {
    open(`http://localhost:${port}`).catch((err) => logger.error(err));
  }
}
