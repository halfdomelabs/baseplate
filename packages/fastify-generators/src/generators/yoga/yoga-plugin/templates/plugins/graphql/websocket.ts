// @ts-nocheck

import { WebsocketHandler } from '@fastify/websocket';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ExecutionArgs, ExecutionResult } from 'graphql';
import { CloseCode } from 'graphql-ws';
import { makeHandler } from 'graphql-ws/lib/use/@fastify/websocket';
import { YogaServerInstance } from 'graphql-yoga';
import { createAuthInfoFromAuthorization } from '@src/modules/accounts/auth/services/auth-service';
import { logError } from '@src/services/error-logger';
import { logger } from '@src/services/logger';
import { HttpError } from '@src/utils/http-errors';
import { createContextFromRequest } from '@src/utils/request-service-context';

interface RootValueWithExecutor {
  execute: (args: ExecutionArgs) => Promise<ExecutionResult>;
  subscribe: (args: ExecutionArgs) => Promise<ExecutionResult>;
}

export function getGraphqlWsHandler(
  graphQLServer: YogaServerInstance<
    {
      request: FastifyRequest;
      reply: FastifyReply;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >
): WebsocketHandler {
  return makeHandler({
    execute: (args) => (args.rootValue as RootValueWithExecutor).execute(args),
    onConnect: async (ctx) => {
      try {
        // attach auth info to request
        const authorizationHeader = ctx.connectionParams?.authorization;
        const authInfo = await createAuthInfoFromAuthorization(
          ctx.extra.request,
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { schema, execute, subscribe, parse, validate } =
          graphQLServer.getEnveloped({
            ...ctx,
            req: ctx.extra.request,
            socket: ctx.extra.socket,
            params: msg.payload,
          });

        const args = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          schema,
          operationName: msg.payload.operationName,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          document: parse(msg.payload.query),
          variableValues: msg.payload.variables,
          contextValue: createContextFromRequest(ctx.extra.request),
          rootValue: {
            execute,
            subscribe,
          },
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errors = validate(args.schema, args.document);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
        if (errors.length) return errors;
        return args;
      } catch (err) {
        logError(err);
        throw err;
      }
    },
  });
}
