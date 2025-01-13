/**
 * A regex for validating kebab case strings
 */
export const KEBAB_CASE_REGEX = /^[a-z0-9][-a-z0-9]*$/;

/**
 * A regex for validating kebab case strings with slashes to namespace the scope
 */
export const KEBAB_CASE_WITH_SLASH_SEPARATOR_REGEX = /^[a-z0-9][-a-z0-9/]*$/;
