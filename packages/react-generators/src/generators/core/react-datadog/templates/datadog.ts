// @ts-nocheck

import { datadogLogs } from '@datadog/browser-logs';
import { config } from '%react-config';

const DATADOG_ENABLED = !!config.REACT_APP_DATADOG_CLIENT_TOKEN;

if (DATADOG_ENABLED) {
  datadogLogs.init({
    clientToken: config.REACT_APP_DATADOG_CLIENT_TOKEN || '',
    site: config.REACT_APP_DATADOG_SITE || 'datadoghq.com',
    service: APP_NAME,
    env: config.REACT_APP_ENVIRONMENT,
    forwardConsoleLogs: ['log', 'info', 'warn', 'error'],
    forwardErrorsToLogs: true,
  });
}

export function identifyDatadogUser(user: { id: string; email: string }): void {
  if (DATADOG_ENABLED) {
    datadogLogs.setGlobalContextProperty('userId', user.id);
    datadogLogs.setGlobalContextProperty('userEmail', user.email);
  }
}
