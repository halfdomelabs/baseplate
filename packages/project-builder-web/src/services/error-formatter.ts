function getFormattedErrorSuffix(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Please try again later.';
}

export function formatError(
  error: unknown,
  context = 'Sorry, something went wrong.'
): string {
  const suffix = getFormattedErrorSuffix(error);
  return `${context} ${suffix}`;
}
