// @ts-nocheck

function getFormattedErrorSuffix(error: unknown): string {
  ERROR_FORMATTERS;

  return 'Please try again later.';
}

export function formatError(
  error: unknown,
  context = 'Sorry, something went wrong.'
): string {
  const suffix = getFormattedErrorSuffix(error);
  return `${context} ${suffix}`;
}
