import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MANIFEST_FILENAME = '.generation-manifest.json';

interface GenerationManifest {
  generatedAt: string;
  files: Record<string, string>;
}

/**
 * Computes SHA-256 hash of a file's contents.
 */
async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively collects all files in a directory, returning paths relative to the root.
 * Skips the manifest file itself and node_modules.
 */
async function collectFiles(dir: string, rootDir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (
      entry.name === 'node_modules' ||
      entry.name === MANIFEST_FILENAME ||
      entry.name === 'baseplate'
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, rootDir)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Creates and writes a generation manifest for the given directory.
 * Call this after `generateTestProject` completes.
 */
export async function writeGenerationManifest(
  outputDir: string,
): Promise<void> {
  const files = await collectFiles(outputDir, outputDir);
  const fileHashes: Record<string, string> = {};

  await Promise.all(
    files.map(async (file) => {
      fileHashes[file] = await hashFile(path.join(outputDir, file));
    }),
  );

  const manifest: GenerationManifest = {
    generatedAt: new Date().toISOString(),
    files: fileHashes,
  };

  await writeFile(
    path.join(outputDir, MANIFEST_FILENAME),
    JSON.stringify(manifest, null, 2),
  );
}

interface StalenessResult {
  isStale: boolean;
  modifiedFiles: string[];
  newFiles: string[];
}

/**
 * Checks if any files in the output directory have been modified since the
 * generation manifest was written. Returns details about which files changed.
 *
 * If no manifest exists, returns not stale (assumes a fresh or manual directory).
 */
async function checkStaleness(outputDir: string): Promise<StalenessResult> {
  const manifestPath = path.join(outputDir, MANIFEST_FILENAME);

  let manifest: GenerationManifest;
  try {
    const content = await readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(content) as GenerationManifest;
  } catch {
    // No manifest means we can't check — treat as not stale
    return { isStale: false, modifiedFiles: [], newFiles: [] };
  }

  const currentFiles = await collectFiles(outputDir, outputDir);
  const modifiedFiles: string[] = [];
  const newFiles: string[] = [];

  // Check for modified and new files
  await Promise.all(
    currentFiles.map(async (file) => {
      const currentHash = await hashFile(path.join(outputDir, file));
      if (!(file in manifest.files)) {
        newFiles.push(file);
      } else if (currentHash !== manifest.files[file]) {
        modifiedFiles.push(file);
      }
    }),
  );

  return {
    isStale: modifiedFiles.length > 0 || newFiles.length > 0,
    modifiedFiles,
    newFiles,
  };
}

/**
 * Checks staleness and throws an error if the directory has been modified.
 * Used by `test-project generate --overwrite` to warn before overwriting.
 */
export async function assertNotStale(outputDir: string): Promise<void> {
  const result = await checkStaleness(outputDir);

  if (!result.isStale) {
    return;
  }

  const lines = [`Files in ${outputDir} have been modified since generation:`];

  for (const file of result.modifiedFiles) {
    lines.push(`  - ${file} (modified)`);
  }
  for (const file of result.newFiles) {
    lines.push(`  - ${file} (new)`);
  }

  lines.push(
    '',
    `Run 'baseplate-dev test-project save <name>' to save changes first, or`,
    `use --force to overwrite anyway.`,
  );

  throw new Error(lines.join('\n'));
}
