// @ts-nocheck
import { URL } from 'url';
import * as Sentry from '@sentry/node';
import { extractTraceparentData } from '@sentry/tracing';
import type { TraceparentData, Transaction } from '@sentry/types';
import { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import {
  extractSentryRequestData,
  getUrlQueryString,
} from '../services/sentry';

declare module 'fastify' {
  interface FastifyRequest {
    sentryTransaction: Transaction;
  }
}

function getTransactionName(request: FastifyRequest): string {
  const parsedUrl = new URL(request.url, 'http://a');
  return `${request.method} ${parsedUrl.pathname}`;
}

export const sentryPlugin = fp(async (fastify) => {
  fastify.decorateRequest('sentryTransaction', null);

  fastify.addHook('onRequest', async (req) => {
    let traceparentData: TraceparentData | undefined;
    if (typeof req.headers['sentry-trace'] === 'string') {
      traceparentData = extractTraceparentData(req.headers['sentry-trace']);
    }
    req.sentryTransaction = Sentry.startTransaction(
      {
        name: getTransactionName(req),
        op: 'http.server',
        ...traceparentData,
      },
      { request: extractSentryRequestData(req) }
    );
  });

  fastify.addHook('onResponse', async (req, reply) => {
    if (!req.sentryTransaction) {
      return;
    }
    setImmediate(() => {
      const transaction = req.sentryTransaction;
      transaction.setData('url', req.url);
      transaction.setData('query', getUrlQueryString(req.url));
      transaction.setHttpStatus(reply.statusCode);
      transaction.finish();
    });
  });
});
