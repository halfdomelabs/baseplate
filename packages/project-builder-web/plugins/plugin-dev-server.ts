import chokidar from 'chokidar';
import mime from 'mime';
import fs from 'node:fs';
import { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { ViteDevServer, Plugin } from 'vite';

/**
 * Safely concatenate two paths and prevent directory traversal attacks.
 * @param {string} basePath - The base directory path.
 * @param {string} relativePath - The relative path to concatenate to the base path.
 * @returns {string} The safely concatenated and normalized absolute path.
 */
export function pathSafeJoin(
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
  const pluginPackageLocation = path.resolve(__dirname, '../../../plugins');
  const plugins = fs
    .readdirSync(pluginPackageLocation)
    .filter((file) => {
      return (
        fs.statSync(path.join(pluginPackageLocation, file)).isDirectory() &&
        fs.existsSync(path.join(pluginPackageLocation, file, 'dist', 'web'))
      );
    })
    .map((file) => {
      const pluginLocation = path.join(pluginPackageLocation, file);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(pluginLocation, 'package.json'), 'utf-8'),
      ) as { name: string };
      return {
        id: packageJson.name.replace('@', '').replace(/\//g, '_'),
        location: pluginLocation,
      };
    });

  let watcher: chokidar.FSWatcher | undefined;

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
      const pluginAssetPaths = plugins.map((plugin) => {
        return path.join(plugin.location, 'dist', 'web');
      });

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
          }, 300);
        });
      }

      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.url?.startsWith('/api/plugins/')) {
            const urlMatch = req.url.match(
              /^\/api\/plugins\/([^/]+)\/([^/]+)\/web\/([^?]*)(.*)$/,
            );
            if (urlMatch) {
              const [, , pluginId, assetPath] = urlMatch;

              const pluginMatch = plugins.find((plugin) =>
                pluginId.startsWith(plugin.id),
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

              if (fs.existsSync(fullAssetPath)) {
                res.setHeader(
                  'Content-Type',
                  mime.getType(fullAssetPath) ?? 'application/octet-stream',
                );
                res.end(fs.readFileSync(fullAssetPath));
                return;
              } else {
                // wait 1 second to load the file sync in case it's still being written
                setTimeout(() => {
                  if (fs.existsSync(fullAssetPath)) {
                    res.setHeader(
                      'Content-Type',
                      mime.getType(fullAssetPath) ?? 'application/octet-stream',
                    );
                    res.end(fs.readFileSync(fullAssetPath));
                  } else {
                    res.statusCode = 404;
                    res.end('Not found');
                  }
                }, 1000);
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
