import type {
  FileData,
  GeneratorOutput,
  PostWriteCommand,
} from '@baseplate-dev/sync';

interface CreateTestGeneratorOutputOptions {
  /** Map of relative file paths to their string contents */
  files: Record<string, string | Buffer>;
  /** Post-write commands to include (default: []) */
  postWriteCommands?: PostWriteCommand[];
}

/**
 * Creates a GeneratorOutput from a simple file map.
 * Useful for testing snapshot/diff logic without running the full compilation pipeline.
 */
export function createTestGeneratorOutput(
  options: CreateTestGeneratorOutputOptions,
): GeneratorOutput {
  const files = new Map<string, FileData>();
  for (const [filePath, contents] of Object.entries(options.files)) {
    files.set(filePath, { id: filePath, contents });
  }
  return {
    files,
    postWriteCommands: options.postWriteCommands ?? [],
    globalFormatters: [],
  };
}
