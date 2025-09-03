import {
  fileExists,
  findNearestPackageJson,
  handleFileNotFoundError,
  readJsonWithSchema,
  writeStablePrettyJson,
} from '@baseplate-dev/utils/node';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

const devServerConfigSchema = z.object({
  port: z.number(),
  token: z.string().min(1),
});

export type DevServerConfig = z.infer<typeof devServerConfigSchema>;

const PORT_RANGE_START = 41_000;
const PORT_RANGE_END = 49_999;

const ROOT_PACKAGE_NAME = '@baseplate-dev/root';

async function isRootPackage(packageJsonPath: string): Promise<boolean> {
  const content = await readJsonWithSchema(
    packageJsonPath,
    z.object({ name: z.string() }),
  );
  return content.name === ROOT_PACKAGE_NAME;
}

/**
 * Detects the appropriate root directory based on project type
 */
async function detectProjectRoot(startDir: string): Promise<string> {
  // Check if we're in the Baseplate monorepo
  const packageJsonPath = await findNearestPackageJson({ cwd: startDir });
  if (packageJsonPath) {
    // Check current package.json
    if (await isRootPackage(packageJsonPath)) {
      return path.dirname(packageJsonPath);
    }

    // Check parent directory for monorepo root
    const parentDir = path.dirname(path.dirname(packageJsonPath));
    const parentPkgPath = await findNearestPackageJson({ cwd: parentDir });
    if (parentPkgPath && (await isRootPackage(parentPkgPath))) {
      return path.dirname(parentPkgPath);
    }
  }

  // Check if we're in a generated Baseplate project
  let currentDir = path.resolve(startDir);
  while (currentDir !== path.dirname(currentDir)) {
    const projectDefPath = path.join(
      currentDir,
      'baseplate',
      'project-definition.json',
    );
    if (await fileExists(projectDefPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error(
    `Project root not found. Please run this command from the root of a Baseplate project or the Baseplate monorepo.`,
  );
}

/**
 * Gets or creates a dev server configuration
 */
export async function getOrCreateDevServerConfig(
  directory: string,
): Promise<DevServerConfig> {
  // Detect project root
  const rootDirectory = await detectProjectRoot(directory);

  // Config path is always in .baseplate/dev-server.json
  const configPath = path.join(rootDirectory, '.baseplate', 'dev-server.json');

  // Try to load existing config
  const existingConfig = await readJsonWithSchema(
    configPath,
    devServerConfigSchema,
  ).catch(handleFileNotFoundError);

  if (existingConfig) {
    return existingConfig;
  }

  // Generate deterministic port based on root directory path
  const hash = crypto
    .createHash('md5')
    .update(path.resolve(rootDirectory))
    .digest();

  const offset = hash.readUInt16BE(0) % (PORT_RANGE_END - PORT_RANGE_START);
  const port = PORT_RANGE_START + offset;

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');

  const config: DevServerConfig = {
    port,
    token,
  };

  // Ensure .baseplate directory exists
  const baseplateDir = path.dirname(configPath);
  await fs.mkdir(baseplateDir, { recursive: true });

  // Save config
  await writeStablePrettyJson(configPath, config);

  return config;
}
