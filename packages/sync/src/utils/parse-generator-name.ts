const generatorNameRegex = /^([^#]+)#(.+\/)?([^#/]+)$/;

/**
 * A parsed generator name.
 */
interface ParsedGeneratorName {
  /**
   * The package name e.g. `@baseplate-dev/core-generators`
   */
  packageName: string;
  /**
   * The full path of the generator e.g. `core/node`
   */
  generatorPath: string;
  /**
   * The basename of the generator, e.g. `node`
   */
  generatorBasename: string;
}

/**
 * Parses a generator name string in the format "package#subdir/name" or "package#name".
 *
 * @param generatorName - The full generator name string.
 * @returns An object containing the package name, generator path, and full generator name.
 * @throws If the generator name does not match the expected format.
 */
export function parseGeneratorName(generatorName: string): ParsedGeneratorName {
  const match = generatorNameRegex.exec(generatorName);
  const packageName = match?.[1];
  const generatorBasename = match?.[3];
  if (packageName === undefined || generatorBasename === undefined) {
    throw new Error(
      `Invalid generator name: ${generatorName}. Should be of form "package#group/name"`,
    );
  }

  return {
    packageName,
    generatorPath: `${match?.at(2) ?? ''}${generatorBasename}`,
    generatorBasename,
  };
}
