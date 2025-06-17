import { fileURLToPath } from 'node:url';

export async function getDefaultPlugins(logger) {
  // dynamically import to avoid loading the server package unnecessarily
  const { discoverPlugins } = await import(
    '@baseplate-dev/project-builder-server/plugins'
  );
  return discoverPlugins(fileURLToPath(import.meta.url), logger);
}
