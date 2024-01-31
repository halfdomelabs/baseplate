// @ts-nocheck
import { hasTracingEnabled } from '@sentry/core';
import * as Sentry from '@sentry/node';
import type {
  ExtractedNodeRequestData,
  Transaction,
  TransactionSource,
} from '@sentry/types';
import {
  addRequestDataToTransaction,
  extractPathForTransaction,
} from '@sentry/utils';
import {
  FastifyRequest,
  onRequestHookHandler,
  onResponseHookHandler,
} from 'fastify';
import fp from 'fastify-plugin';
import { configureSentryScope, isSentryEnabled } from '../services/sentry';

declare module 'fastify' {
  interface FastifyRequest {
    sentryTransaction: Transaction;
  }
}

const REQUEST_DATA_INCLUDES = [
  'headers',
  'method',
  'query_string',
  'url',
  'cookies',
];

function getRequestData(req: FastifyRequest): ExtractedNodeRequestData {
  const requestData = Sentry.extractRequestData(req.raw, {
    include: REQUEST_DATA_INCLUDES,
  });
  // strip authorization and cookies header from request data
  const { authorization, cookies, ...rest } = requestData?.headers ?? {};
  requestData.headers = rest;
  return requestData;
}

function getTransactionPath(req: FastifyRequest): [string, TransactionSource] {
  return extractPathForTransaction(req.raw, {
    path: true,
    method: true,
    customRoute: req.routeOptions.url,
  });
}

/**
 * Wraps the request handler in a Sentry context so that errors are
 * captured correctly and request data is added to the event.
 */
const errorWrapperHook: onRequestHookHandler = (req, reply, done) => {
  Sentry.runWithAsyncContext(() => {
    const currentHub = Sentry.getCurrentHub();

    currentHub.configureScope((scope) => {
      scope.addEventProcessor((event) => {
        const requestData = getRequestData(req);

        // attach request data to event
        event.request = { ...event.request, ...requestData };
        // attach route path, request ID, and transaction as well
        const routePath = req.routeOptions.url;
        event.extra = { ...event.extra, routePath, reqId: req.id };
        event.tags = { ...event.tags, routePath };
        event.transaction ||= getTransactionPath(req)[0];
        // attach IP
        event.user = { ...event.user, ip_address: req.ip };

        return event;
      });
    });

    done();
  });
};

const tracingRequestHook: onRequestHookHandler = (req, reply, done) => {
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    done();
    return;
  }

  const sentryTrace =
    typeof req.headers['sentry-trace'] === 'string'
      ? req.headers['sentry-trace']
      : undefined;
  const baggage = req.headers.baggage;
  const [name, source] = getTransactionPath(req);

  const transaction = Sentry.continueTrace({ sentryTrace, baggage }, (ctx) =>
    Sentry.startTransaction(
      {
        name,
        op: 'http.server',
        origin: 'auto.fastify.tracingHook',
        ...ctx,
        metadata: { ...ctx.metadata, request: req.raw, source },
      },
      { request: getRequestData(req) },
    ),
  );

  const hub = Sentry.getCurrentHub();
  hub.configureScope((scope) => {
    scope.setSpan(transaction);
  });
  req.sentryTransaction = transaction;

  done();
};

const tracingResponseHook: onResponseHookHandler = (req, reply, done) => {
  if (!req.sentryTransaction) {
    done();
    return;
  }
  const transaction = req.sentryTransaction;
  setImmediate(() => {
    Sentry.getCurrentHub().configureScope((scope) => {
      configureSentryScope(scope);
    });
    addRequestDataToTransaction(transaction, req.raw);
    if (!transaction.status) {
      transaction.setHttpStatus(reply.statusCode);
    }
    transaction.finish();
  });
  done();
};

export const sentryPlugin = fp(async (fastify) => {
  fastify.decorateRequest('sentryTransaction', null);

  if (!isSentryEnabled()) {
    return;
  }

  fastify.addHook('onRequest', errorWrapperHook);

  if (hasTracingEnabled()) {
    fastify.addHook('onRequest', tracingRequestHook);

    fastify.addHook('onResponse', tracingResponseHook);
  }

  fastify.addHook('onClose', (instance, done) => {
    Sentry.close(2000).then(() => done(), done);
  });
});
