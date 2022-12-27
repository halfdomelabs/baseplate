import open from 'open';
import { logger } from '@src/services/logger';
import { buildServer } from './server';

interface WebServerOptions {
  browser: boolean;
  port: number;
}

export async function startWebServer(
  directories: string[],
  { browser, port = 3230 }: WebServerOptions
): Promise<void> {
  const server = await buildServer(directories);

  server.listen({ port }).catch((err) => logger.error(err));

  if (browser) {
    open(`http://localhost:${port}`).catch((err) => logger.error(err));
  }
}
