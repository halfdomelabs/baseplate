/**
 * Creates a placeholder module specifier to refer to a specific import
 * provider in a Typescript template.
 *
 * @param providerExportName - The name of the provider export.
 * @returns The placeholder module specifier name.
 */
export function createPlaceholderModuleSpecifier(
  providerExportName: string,
): string {
  return `%${providerExportName.replace(/Provider$/, '')}`;
}
