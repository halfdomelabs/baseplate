const VITE_ENV_VARIABLES = [
  'VITE_AUTH0_AUDIENCE',
  'VITE_AUTH0_CLIENT_ID',
  'VITE_AUTH0_DOMAIN',
  'VITE_BULL_BOARD_BASE',
  'VITE_ENVIRONMENT',
  'VITE_GRAPH_API_ENDPOINT',
  'VITE_SENTRY_DSN',
];

export const hasMissingViteEnvVariables = (
  configEntryKeys: string[]
): boolean => {
  console.log('CONFIGENTRYKEYS', configEntryKeys);
  return !VITE_ENV_VARIABLES.every((variable) =>
    configEntryKeys.includes(variable)
  );
};
