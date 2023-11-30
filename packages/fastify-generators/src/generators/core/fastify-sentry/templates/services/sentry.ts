// @ts-nocheck
import os from 'os';
import * as Sentry from '@sentry/node';

const SENTRY_ENABLED = !!CONFIG.SENTRY_DSN;

const IGNORED_TRANSACTION_PATHS = ['/healthz'];

const SENTRY_TRACES_SAMPLE_RATE = 1.0;

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: CONFIG.SENTRY_DSN,
    environment: CONFIG.APP_ENVIRONMENT,
    serverName: os.hostname(),
    integrations: SENTRY_INTEGRATIONS,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    tracesSampler: (samplingContext) => {
      if (
        samplingContext?.request?.url &&
        IGNORED_TRANSACTION_PATHS.includes(samplingContext?.request?.url)
      ) {
        return false;
      }
      return true;
    },
  });
}

export function isSentryEnabled(): boolean {
  return SENTRY_ENABLED;
}

export function configureSentryScope(scope: Sentry.Scope): void {
  SCOPE_CONFIGURATION_BLOCKS;
}

export function logErrorToSentry(
  error: Error,
  additionalContext?: Record<string, unknown>,
): string | undefined {
  if (!SENTRY_ENABLED) {
    return;
  }
  let sentryId: string | undefined;
  Sentry.withScope((scope) => {
    configureSentryScope(scope);

    if (additionalContext) {
      scope.setExtras(additionalContext);
    }

    sentryId = Sentry.captureException(error);
  });

  return sentryId;
}
