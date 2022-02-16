// @ts-nocheck
import os from 'os';
import { URL } from 'url';
import * as Sentry from '@sentry/node';
import type { ExtractedNodeRequestData } from '@sentry/types';
import { FastifyRequest } from 'fastify';
import { requestContext } from 'fastify-request-context';
import _ from 'lodash';

import '@sentry/tracing';

const SENTRY_ENABLED = !!CONFIG.SENTRY_DSN;

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: CONFIG.SENTRY_DSN,
    environment: CONFIG.APP_ENVIRONMENT,
    serverName: os.hostname(),
    tracesSampleRate: 1.0,
  });
}

const SENSITIVE_HEADERS = ['authorization'];

// filters headers that are sensitive or not strings
function filterHeaders(
  headers: FastifyRequest['headers']
): Record<string, string> {
  return _.fromPairs(
    Object.keys(headers)
      .filter((key) => typeof headers[key] === 'string')
      .filter((key) => !SENSITIVE_HEADERS.includes(key))
      .map((key) => [key, headers[key] as string])
  );
}

export function getUrlQueryString(url: string): string {
  // need arbitrary base to make URL work
  const parsedUrl = new URL(url, 'http://a');
  return parsedUrl.search;
}

export function extractSentryRequestData(
  request: FastifyRequest | REQUEST_INFO_TYPE
): ExtractedNodeRequestData {
  return {
    headers: filterHeaders(request.headers),
    method: request.method,
    url: request.url,
    query_string: getUrlQueryString(request.url),
  };
}

export function logErrorToSentry(error: Error): void {
  if (!SENTRY_ENABLED) {
    return;
  }
  Sentry.withScope((scope) => {
    const requestData = requestContext.get('reqInfo');
    if (requestData) {
      scope.setUser({
        ip_address: requestData.ip,
      });
      scope.setTag('path', requestData.url);
      scope.setTag('request_id', requestData.id);
      const sentryRequestData = extractSentryRequestData(requestData);
      scope.addEventProcessor((event) => ({
        ...event,
        request: { ...event.request, ...sentryRequestData },
      }));
    }
    Sentry.captureException(error);
  });
}
