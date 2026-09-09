import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { GeneratorOutputFormatter } from './formatter.js';
import type { FileData } from './generator-task-output.js';

export interface FormatterInputSessionOptions {
  /**
   * The formatters whose declared inputs should be mirrored.
   */
  formatters: GeneratorOutputFormatter[];
  /**
   * Root of the project being formatted.
   */
  outputDirectory: string;
  /**
   * The files this operation generates, keyed by output-relative path.
   */
  files: ReadonlyMap<string, FileData>;
}

/**
 * Collects the generated text of every path the formatters declare as an input.
 *
 * @param formatters The formatters to collect declared inputs from
 * @param files The files this operation generates
 * @returns The declared inputs' contents, keyed by output-relative path
 */
function collectDeclaredInputs(
  formatters: GeneratorOutputFormatter[],
  files: ReadonlyMap<string, FileData>,
): Map<string, string> {
  const declaredInputs = new Map<string, string>();
  for (const formatter of formatters) {
    for (const relativePath of formatter.materializedFormatterInputs ?? []) {
      const contents = files.get(relativePath)?.contents;
      // A declared input this operation does not produce is left out, which
      // leaves the formatter on its configured working-tree path.
      if (typeof contents === 'string') {
        declaredInputs.set(relativePath, contents);
      }
    }
  }
  return declaredInputs;
}

/**
 * Directory holding one formatting operation's mirrored inputs.
 *
 * Lives under `node_modules` so it is already ignored by git and prettier, and
 * inside the project so bare imports still resolve through `node_modules`. The
 * name is unique per operation because `prettier-plugin-tailwindcss` keys its
 * design-system cache on the stylesheet's path rather than its contents, so a
 * reused path would serve a stale design system; it also keeps a concurrent
 * operation on the same project from removing this one's mirror.
 *
 * @param outputDirectory Root of the project being formatted
 * @param operationId Identifier unique to this formatting operation
 * @returns Absolute path of the mirror root
 */
function getMirrorRoot(outputDirectory: string, operationId: string): string {
  return path.join(
    outputDirectory,
    'node_modules/.cache/baseplate-fmt',
    operationId,
  );
}

/**
 * Runs an operation with the formatters' declared inputs mirrored to disk.
 *
 * Formatters that read files from disk would otherwise see the working tree's
 * previous version, since files are formatted in memory before anything is
 * written.
 *
 * @param options Formatters, project root and the files being generated
 * @param operation Receives each declared input's mirrored absolute path keyed
 * by its output-relative path, or undefined when there is nothing to mirror
 * @returns The operation's result
 */
export async function withFormatterInputSession<T>(
  { formatters, outputDirectory, files }: FormatterInputSessionOptions,
  operation: (
    materializedFormatterInputs: ReadonlyMap<string, string> | undefined,
  ) => Promise<T>,
): Promise<T> {
  const declaredInputs = collectDeclaredInputs(formatters, files);
  if (declaredInputs.size === 0) return operation(undefined);

  const mirrorRoot = getMirrorRoot(outputDirectory, randomUUID());
  const mirroredPaths = new Map<string, string>();

  try {
    for (const [relativePath, contents] of declaredInputs) {
      const mirroredPath = path.join(mirrorRoot, relativePath);
      await mkdir(path.dirname(mirroredPath), { recursive: true });
      await writeFile(mirroredPath, contents);
      mirroredPaths.set(relativePath, mirroredPath);
    }
    return await operation(mirroredPaths);
  } finally {
    await rm(mirrorRoot, { recursive: true, force: true });
  }
}
