// @ts-nocheck
import * as Sentry from '@sentry/node';
import type { TraceparentData, Transaction } from '@sentry/types';
import { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { extractSentryRequestData, isSentryEnabled } from '../services/sentry';

declare module 'fastify' {
  interface FastifyRequest {
    sentryTransaction: Transaction;
  }
}

function getTransactionName(request: FastifyRequest): string {
  return `${request.method} ${request.routerPath}`;
}

export const sentryPlugin = fp(async (fastify) => {
  fastify.decorateRequest('sentryTransaction', null);

  if (!isSentryEnabled()) {
    return;
  }

  fastify.addHook('onRequest', (req, reply, done) => {
    let traceparentData: TraceparentData | undefined;
    if (typeof req.headers['sentry-trace'] === 'string') {
      traceparentData = Sentry.extractTraceparentData(
        req.headers['sentry-trace'],
      );
    }

    const requestData = extractSentryRequestData(req);
    const transaction = Sentry.startTransaction(
      {
        name: getTransactionName(req),
        op: 'http.server',
        ...traceparentData,
      },
      { request: requestData },
    );
    req.sentryTransaction = transaction;

    Sentry.getCurrentHub().configureScope((scope) => {
      transaction.setData('url', requestData.url);
      transaction.setData('query', requestData.query_string);
      scope.setSpan(transaction);
    });

    done();
  });

  fastify.addHook('onResponse', async (req, reply) => {
    if (!req.sentryTransaction) {
      return;
    }
    setImmediate(() => {
      const transaction = req.sentryTransaction;
      transaction.setHttpStatus(reply.statusCode);
      transaction.finish();
    });
  });
});
