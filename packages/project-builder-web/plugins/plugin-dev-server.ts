import type { FSWatcher } from 'chokidar';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';

/* eslint-disable import-x/no-extraneous-dependencies */
import chokidar from 'chokidar';
import mime from 'mime';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Safely concatenate two paths and prevent directory traversal attacks.
 * @param {string} basePath - The base directory path.
 * @param {string} relativePath - The relative path to concatenate to the base path.
 * @returns {string} The safely concatenated and normalized absolute path.
 */
function pathSafeJoin(
  basePath: string,
  relativePath: string,
): string | undefined {
  const normalizedBasePath = path.resolve(basePath);
  const combinedPath = path.join(normalizedBasePath, relativePath);

  // Ensure that the combined path is within the base path
  if (!combinedPath.startsWith(normalizedBasePath)) {
    return undefined;
  }

  return combinedPath;
}

/**
 * Serves plugin web assets dynamically so that they can be loaded independently of
 * project-builder-server which can be restarted.
 */
export function pluginDevServerPlugin(): Plugin {
  // find all available plugins in the workspace
  const pluginPackageLocation = path.resolve(
    import.meta.dirname,
    '../../../plugins',
  );
  const plugins = fs
    .readdirSync(pluginPackageLocation)
    .filter(
      (file) =>
        fs.statSync(path.join(pluginPackageLocation, file)).isDirectory() &&
        fs.existsSync(path.join(pluginPackageLocation, file, 'dist', 'web')) &&
        fs.existsSync(path.join(pluginPackageLocation, file, 'package.json')),
    )
    .map((file) => {
      const pluginLocation = path.join(pluginPackageLocation, file);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(pluginLocation, 'package.json'), 'utf8'),
      ) as { name: string };
      return {
        id: packageJson.name.replace('@', '').replace(/\//g, '_'),
        location: pluginLocation,
      };
    });

  let watcher: FSWatcher | undefined;

  return {
    name: 'plugin-dev-server-plugin',
    handleHotUpdate({ modules, server }) {
      if (
        modules.some((module) => module.file?.includes('project-builder-lib'))
      ) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
    configureServer(server: ViteDevServer) {
      // watch plugin folders for changes
      const pluginAssetPaths = plugins.map((plugin) =>
        path.join(plugin.location, 'dist', 'web'),
      );

      if (!watcher) {
        watcher = chokidar.watch(pluginAssetPaths, {
          ignoreInitial: true,
        });

        let timeout: NodeJS.Timeout | undefined;

        watcher.on('add', () => {
          // debounce sending
          if (timeout) {
            clearTimeout(timeout);
          }
          timeout = setTimeout(() => {
            server.ws.send({
              type: 'custom',
              event: 'plugin-assets-changed',
            });
          }, 500);
        });
      }

      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.url?.startsWith('/api/plugins/')) {
            const urlMatch =
              /^\/api\/plugins\/([^/]+)\/([^/]+)\/web\/([^?]*)(.*)$/.exec(
                req.url,
              );
            if (urlMatch) {
              const pluginKey = urlMatch[2];
              const assetPath = urlMatch[3];

              const pluginMatch = plugins.find((plugin) =>
                pluginKey.startsWith(plugin.id),
              );

              if (!pluginMatch) {
                next();
                return;
              }

              const basePath = path.join(pluginMatch.location, 'dist', 'web');
              const fullAssetPath = pathSafeJoin(basePath, assetPath);

              if (!fullAssetPath) {
                res.statusCode = 404;
                res.end('Not found');
                return;
              }

              const respondWithAsset = (): void => {
                res.setHeader(
                  'Content-Type',
                  mime.getType(fullAssetPath) ?? 'application/octet-stream',
                );
                res.end(fs.readFileSync(fullAssetPath));
              };

              if (fs.existsSync(fullAssetPath)) {
                respondWithAsset();
                return;
              } else {
                // try for 10 seconds in case it's still being written
                let tries = 0;
                const interval = setInterval(() => {
                  if (fs.existsSync(fullAssetPath)) {
                    clearInterval(interval);
                    respondWithAsset();
                  } else {
                    tries++;
                    if (tries > 50) {
                      clearInterval(interval);
                      res.statusCode = 404;
                      res.end('Not found');
                    }
                  }
                }, 200);
                return;
              }
            }
          }

          next();
        },
      );
    },
  };
}
