// @ts-nocheck

import { WebsocketHandler } from '@fastify/websocket';
import { YogaNodeServerInstance } from '@graphql-yoga/node';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ExecutionArgs, ExecutionResult } from 'graphql';
import { CloseCode } from 'graphql-ws';
import { makeHandler } from 'graphql-ws/lib/use/@fastify/websocket';
import { createAuthInfoFromAuthorization } from '%auth-service';
import { logError } from '%error-logger';
import { logger } from '%logger-service';
import { HttpError } from '%http-errors';
import { createContextFromRequest } from '%request-service-context';

interface RootValueWithExecutor {
  execute: (args: ExecutionArgs) => Promise<ExecutionResult>;
  subscribe: (args: ExecutionArgs) => Promise<ExecutionResult>;
}

export function getGraphqlWsHandler(
  graphQLServer: YogaNodeServerInstance<
    {
      request: FastifyRequest;
      reply: FastifyReply;
    },
    // fixes type error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    unknown
  >
): WebsocketHandler {
  return makeHandler({
    execute: (args) => (args.rootValue as RootValueWithExecutor).execute(args),
    onConnect: async (ctx) => {
      try {
        // attach auth info to request
        const authorizationHeader = ctx.connectionParams?.authorization;
        const authInfo = await createAuthInfoFromAuthorization(
          typeof authorizationHeader === 'string'
            ? authorizationHeader
            : undefined
        );
        ctx.extra.request.auth = authInfo;

        // set expiry for socket based on auth token expiry
        const tokenExpiry = authInfo.user?.tokenExpiry;
        if (tokenExpiry) {
          const { socket } = ctx.extra.connection;

          const timeoutHandle = setTimeout(() => {
            try {
              socket.close(CloseCode.Forbidden, 'token-expired');
            } catch (err) {
              logError(err);
            }
          }, tokenExpiry.getTime() - Date.now());
          socket.on('close', () => clearTimeout(timeoutHandle));
        }
      } catch (err) {
        // only a subset of HTTP errors are mapped
        const httpToSocketErrorMap: Record<number, CloseCode> = {
          403: CloseCode.Forbidden,
          // due to implementation of graphql-ws, only Forbidden will be retried
          // https://github.com/enisdenjo/graphql-ws/blob/master/src/client.ts#L827
          401: CloseCode.Forbidden,
          400: CloseCode.BadRequest,
        };
        logger.error(
          `websocket connection failed: ${
            err instanceof Error ? err.message : typeof err
          }`
        );
        if (err instanceof HttpError && httpToSocketErrorMap[err.statusCode]) {
          ctx.extra.connection.socket.close(
            httpToSocketErrorMap[err.statusCode],
            err.code
          );
        } else {
          logError(err);
          ctx.extra.connection.socket.close(
            CloseCode.InternalServerError,
            'unknown-error'
          );
        }
      }
    },
    subscribe: (args) =>
      (args.rootValue as RootValueWithExecutor).subscribe(args),
    onSubscribe: (ctx, msg) => {
      try {
        const { schema, execute, subscribe, parse, validate } =
          graphQLServer.getEnveloped(ctx);

        const args = {
          schema,
          operationName: msg.payload.operationName,
          document: parse(msg.payload.query),
          variableValues: msg.payload.variables,
          contextValue: createContextFromRequest(ctx.extra.request),
          rootValue: {
            execute,
            subscribe,
          },
        };

        const errors = validate(args.schema, args.document);
        if (errors.length) return errors;
        return args;
      } catch (err) {
        logError(err);
        throw err;
      }
    },
  });
}
