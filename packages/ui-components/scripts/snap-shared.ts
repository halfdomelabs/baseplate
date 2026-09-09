/**
 * Shared pieces of the local Storybook screenshot workflow (`storybook:snap` and
 * `storybook:snap:diff`). See `.agents/ui-components.md` for the usage docs.
 */

import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Bumped when the manifest shape changes so stale folders fail loudly. */
export const MANIFEST_VERSION = 1;

export const MANIFEST_FILENAME = 'manifest.json';

export interface SnapManifest {
  manifestVersion: number;
  theme: 'light' | 'dark';
  /** The `--grep` pattern, or null when everything was captured. */
  grep: string | null;
  viewport: { width: number; height: number };
  deviceScaleFactor: number;
  playwrightVersion: string;
  storyCount: number;
  gitSha: string | null;
  gitBranch: string | null;
  capturedAt: string;
}

/**
 * Settings that must match for a before/after pair to be comparable. A mismatch
 * in any of them turns the diff into noise — every story reads as changed, or
 * half of them read as added/removed.
 */
export const COMPARABLE_MANIFEST_KEYS = [
  'theme',
  'grep',
  'deviceScaleFactor',
] as const;

/** Story ids are already lowercase and dash-separated, but never trust them as paths. */
export function storyIdToFilename(storyId: string): string {
  return `${storyId.replaceAll(/[^a-z0-9-]/gi, '_')}.png`;
}

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.map': 'application/json',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export interface StaticServer {
  origin: string;
  close: () => Promise<void>;
}

/**
 * Serves a built Storybook over loopback. A real origin rather than `file://`
 * because the built preview fetches `index.json` and loads ES modules, both of
 * which the file protocol blocks.
 */
export async function serveDirectory(root: string): Promise<StaticServer> {
  const server = http.createServer((req, res) => {
    const requestPath = new URL(req.url ?? '/', 'http://localhost').pathname;
    const relative = decodeURIComponent(
      requestPath.endsWith('/') ? `${requestPath}index.html` : requestPath,
    );
    const resolved = path.join(root, relative);

    // Reject anything that escapes the served root.
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const stream = createReadStream(resolved);
    stream.on('error', () => {
      res.writeHead(404).end('Not found');
    });
    stream.on('open', () => {
      res.writeHead(200, {
        'Content-Type':
          MIME_TYPES[path.extname(resolved).toLowerCase()] ??
          'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      stream.pipe(res);
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Static server did not bind to a TCP port');
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
  };
}

async function tryGit(args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', args);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function readGitState(): Promise<{
  sha: string | null;
  branch: string | null;
}> {
  const [sha, branch] = await Promise.all([
    tryGit(['rev-parse', '--short', 'HEAD']),
    tryGit(['rev-parse', '--abbrev-ref', 'HEAD']),
  ]);
  return { sha, branch };
}

const RED = '\u001B[31m';
const YELLOW = '\u001B[33m';
const DIM = '\u001B[2m';
const RESET = '\u001B[0m';

export function warn(message: string): void {
  console.warn(`${YELLOW}warning${RESET} ${message}`);
}

export function dim(message: string): string {
  return `${DIM}${message}${RESET}`;
}

/**
 * A problem with the run itself — bad flags, a folder that was never captured —
 * as opposed to a real visual difference. The entry scripts report these on
 * stderr and exit 2, keeping exit 1 to mean "there are changed stories".
 */
class SnapError extends Error {
  override name = 'SnapError';
}

export function fail(message: string): never {
  throw new SnapError(message);
}

export function reportFatal(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${RED}error${RESET} ${message}`);
}
