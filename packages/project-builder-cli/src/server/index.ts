import open from 'open';
import { logger } from '@src/services/logger.js';
import { buildServer } from './server.js';

interface WebServerOptions {
  browser: boolean;
  port: number;
}

export async function startWebServer(
  directories: string[],
  { browser, port = 3230 }: WebServerOptions
): Promise<void> {
  const server = await buildServer(directories);

  try {
    await server.listen({ port });
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      err.code !== 'EADDRINUSE'
    ) {
      // wait a bit and try again since it could be tsx restarting
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
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
