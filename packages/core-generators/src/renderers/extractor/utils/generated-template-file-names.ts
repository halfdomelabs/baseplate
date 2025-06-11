import { camelCase, constantCase, kebabCase, pascalCase } from 'change-case';

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
  return `${constantCase(generatorName.split('#')[1])}_${constantCase(suffix)}`;
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
  return `${camelCase(generatorName.split('#')[1])}${pascalCase(suffix)}`;
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
  return `${pascalCase(generatorName.split('#')[1])}${pascalCase(suffix)}`;
}

export function getGeneratedTemplateProviderName(
  generatorName: string,
  suffix: string,
): string {
  return `${kebabCase(generatorName.split('#')[1])}-${kebabCase(suffix)}`;
}
