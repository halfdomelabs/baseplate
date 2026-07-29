import { camelCase, constantCase, kebabCase, pascalCase } from 'change-case';

/**
 * Extracts the generator short name from a generator name, e.g.
 * `core/react-routes` -> `react-routes`.
 */
function getGeneratorShortName(generatorName: string): string {
  const shortName = generatorName.split('#')[1];
  if (shortName === undefined) {
    throw new Error(`Generator name ${generatorName} does not contain a #`);
  }
  return shortName;
}

/**
 * Gets the constant name for a generated template file for a particular generator
 * e.g. `core/react-routes` + `templates` -> `CORE_REACT_ROUTES_TEMPLATES`
 *
 * @param generatorName - The name of the generator.
 * @param suffix - The suffix of the export name.
 * @returns The export name for the generated template file.
 */
export function getGeneratedTemplateConstantName(
  generatorName: string,
  suffix: string,
): string {
  return `${constantCase(getGeneratorShortName(generatorName))}_${constantCase(suffix)}`;
}

/**
 * Gets the export name for a generated template file for a particular generator
 * e.g. `core/react-routes` + `templates` -> `coreReactRoutesTemplates`
 *
 * @param generatorName - The name of the generator.
 * @param suffix - The suffix of the export name.
 * @returns The export name for the generated template file.
 */
export function getGeneratedTemplateExportName(
  generatorName: string,
  suffix: string,
): string {
  return `${camelCase(getGeneratorShortName(generatorName))}${pascalCase(suffix)}`;
}

/**
 * Gets the interface name for a generated template file for a particular generator
 * e.g. `core/react-routes` + `templates` -> `CoreReactRoutesTemplates`
 *
 * @param generatorName - The name of the generator.
 * @param suffix - The suffix of the interface name.
 * @returns The interface name for the generated template file.
 */
export function getGeneratedTemplateInterfaceName(
  generatorName: string,
  suffix: string,
): string {
  return `${pascalCase(getGeneratorShortName(generatorName))}${pascalCase(suffix)}`;
}

export function getGeneratedTemplateProviderName(
  generatorName: string,
  suffix: string,
): string {
  return `${kebabCase(getGeneratorShortName(generatorName))}-${kebabCase(suffix)}`;
}
