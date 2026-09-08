import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { GeneratorOutputFormatter } from '../formatter.js';

/** Reads a path's generated contents, or undefined when this sync does not produce it. */
export type ReadInputContents = (
  relativePath: string,
) => Promise<string | undefined>;

/**
 * A mirrored copy of the files a formatter reads from disk, owned by one
 * formatting operation.
 */
export interface FormatterInputSession {
  /**
   * Each declared input's output-relative path mapped to its mirrored absolute path.
   */
  readonly inputs: ReadonlyMap<string, string>;
  cleanup: () => Promise<void>;
}

/**
 * Directory holding one formatting operation's mirrored inputs.
 *
 * Lives under `node_modules` so it is already ignored by git and prettier, and
 * inside the project so bare `@import`s still resolve through `node_modules`.
 */
function getMirrorRoot(outputDirectory: string, operationId: string): string {
  return path.join(
    outputDirectory,
    'node_modules/.cache/baseplate-fmt',
    operationId,
  );
}

/**
 * Mirrors every formatter's declared inputs for one formatting operation.
 *
 * Formatters that read files from disk would otherwise see the working tree's
 * previous version, since a sync formats in memory before writing anything.
 * Mirroring this sync's own contents to a private path fixes that, and the path
 * being per-operation matters on its own: `prettier-plugin-tailwindcss` keys its
 * design-system cache on the stylesheet's path rather than its contents, so a
 * shared path would serve a stale design system to the next operation.
 *
 * Inputs are declared by generators rather than discovered, so a stylesheet that
 * `@import`s another file must declare both. Relative paths inside a mirrored
 * file (`@import './typeset.css'`, `@source '../../lib/src'`) resolve against
 * the mirror, so imports must stay within the mirrored set; `@source` globs
 * resolve to nothing there, which is harmless because they affect which CSS is
 * emitted rather than how classes are sorted.
 *
 * @param options Session options.
 * @returns A session, or undefined when there is nothing to mirror.
 */
export async function createFormatterInputSession({
  formatters,
  outputDirectory,
  readGeneratedContents,
}: {
  formatters: GeneratorOutputFormatter[];
  outputDirectory: string;
  readGeneratedContents: ReadInputContents;
}): Promise<FormatterInputSession | undefined> {
  const declaredInputs = [
    ...new Set(formatters.flatMap((f) => f.materializedFormatterInputs ?? [])),
  ];
  if (declaredInputs.length === 0) return undefined;

  const mirrorRoot = getMirrorRoot(outputDirectory, randomUUID());
  const inputs = new Map<string, string>();

  for (const relativePath of declaredInputs) {
    const contents = await readGeneratedContents(relativePath);
    // A declared input this sync does not produce leaves the formatter on its
    // configured path, which is the behaviour from before mirroring existed.
    if (contents === undefined) continue;

    const mirroredPath = path.join(mirrorRoot, relativePath);
    await mkdir(path.dirname(mirroredPath), { recursive: true });
    await writeFile(mirroredPath, contents);
    inputs.set(relativePath, mirroredPath);
  }

  const cleanup = (): Promise<void> =>
    rm(mirrorRoot, { recursive: true, force: true });

  if (inputs.size === 0) {
    await cleanup();
    return undefined;
  }

  return { inputs, cleanup };
}
