import { KEBAB_CASE_WITH_SLASH_SEPARATOR_REGEX } from '@src/utils/validation.js';

/**
 * A scope for a provider export
 */
export interface ProviderExportScope {
  /**
   * The name of the scope
   */
  readonly name: string;
  /**
   * The description of the scope
   */
  readonly description: string;
}

/**
 * Creates a provider export scope
 *
 * @param name The name of the scope
 * @param description The description of the scope
 * @returns The provider export scope
 */
export function createProviderExportScope(
  name: string,
  description: string,
): ProviderExportScope {
  if (!KEBAB_CASE_WITH_SLASH_SEPARATOR_REGEX.test(name)) {
    throw new Error(
      `Provider export scope name must be in kebab case (lowercase with dashes) with slashes to namespace the scope: ${name}`,
    );
  }
  return { name, description };
}
