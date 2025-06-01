import type {
  GeneratorTaskOutputBuilder,
  WriteFileOptions,
} from '@baseplate-dev/sync';

interface WriteJsonToBuilderOptions extends WriteFileOptions {
  /**
   * The ID of the file to write
   */
  id: string;
  /**
   * The destination of the file to write
   */
  destination: string;
  /**
   * The contents of the file to write
   */
  contents: unknown;
}

/**
 * Writes a JSON file to the builder
 */
export function writeJsonToBuilder(
  builder: GeneratorTaskOutputBuilder,
  options: WriteJsonToBuilderOptions,
): void {
  const { id, destination, contents, ...rest } = options;

  const jsonString = `${JSON.stringify(contents, null, 2)}\n`;

  builder.writeFile({
    id,
    destination,
    contents: jsonString,
    options: rest,
  });
}
