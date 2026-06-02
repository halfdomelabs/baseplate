import type { WebsocketHandler } from '@fastify/websocket';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ExecutionArgs, ExecutionResult } from 'graphql';
import type { ConnectionInitMessage, ServerOptions } from 'graphql-ws';
import type { YogaServerInstance } from 'graphql-yoga';
import type * as ws from 'ws';

import { GraphQLError } from 'graphql';
import {
  CloseCode,
  DEPRECATED_GRAPHQL_WS_PROTOCOL,
  handleProtocols,
  makeServer,
} from 'graphql-ws';

import { userSessionService } from '@src/modules/accounts/auth/services/user-session.service.js';
import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { logError } from '@src/services/error-logger.js';
import { logger } from '@src/services/logger.js';
import { HttpError } from '@src/utils/http-errors.js';
import { createContextFromRequest } from '@src/utils/request-service-context.js';

interface RootValueWithExecutor {
  execute: (args: ExecutionArgs) => Promise<ExecutionResult>;
  subscribe: (args: ExecutionArgs) => Promise<ExecutionResult>;
}

/**
 * The extra that will be put in the `Context`.
 */
interface Extra {
  /**
   * The underlying socket between the server and the client.
   */
  readonly socket: ws.WebSocket;
  /**
   * The initial HTTP upgrade request before the actual
   * socket and connection is established.
   */
  readonly request: FastifyRequest;
}

/**
 * Make a handler to use on a [@fastify/websocket](https://github.com/fastify/fastify-websocket) route.
 *
 * This has been adapted from the graphql-ws version due to https://github.com/enisdenjo/graphql-ws/issues/553.
 */
export function makeHandler<
  P extends ConnectionInitMessage['payload'] = ConnectionInitMessage['payload'],
  E extends Record<PropertyKey, unknown> = Record<PropertyKey, never>,
>(
  options: ServerOptions<P, Extra & Partial<E>>,
  /**
   * The timout between dispatched keep-alive messages. Internally uses the [ws Ping and Pongs](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#pings_and_pongs_the_heartbeat_of_websockets)
   * to check that the link between the clients and the server is operating and to prevent the link
   * from being broken due to idling.
   *
   * @default 12_000 // 12 seconds
   */
  keepAlive = 12_000,
): WebsocketHandler {
  const isProd = process.env.NODE_ENV === 'production';
  const server = makeServer(options);

  // we dont have access to the fastify-websocket server instance yet,
  // register an error handler on first connection ONCE only
  let handlingServerEmittedErrors = false;

  return function handler(socket, request) {
    // might be too late, but meh
    this.websocketServer.options.handleProtocols = handleProtocols;

    // handle server emitted errors only if not already handling
    if (!handlingServerEmittedErrors) {
      handlingServerEmittedErrors = true;
      this.websocketServer.once('error', (err) => {
        logger.error(
          'Internal error emitted on the WebSocket server. ' +
            'Please check your implementation.',
          err,
        );

        // catch the first thrown error and re-throw it once all clients have been notified
        let firstErr: Error | null = null;

        // report server errors by erroring out all clients with the same error
        for (const client of this.websocketServer.clients) {
          try {
            client.close(
              CloseCode.InternalServerError,
              isProd
                ? 'Internal server error'
                : (err instanceof Error ? err.message : String(err)).slice(
                    0,
                    1024,
                  ),
            );
          } catch (err) {
            firstErr =
              firstErr ?? (err instanceof Error ? err : new Error(String(err)));
          }
        }

        if (firstErr) throw firstErr;
      });
    }

    // used as listener on two streams, prevent superfluous calls on close
    let emittedErrorHandled = false;
    function handleEmittedError(err: Error): void {
      if (emittedErrorHandled) return;
      emittedErrorHandled = true;
      logError(err, {
        context:
          'Internal error emitted on a WebSocket socket. ' +
          'Please check your implementation.',
      });
      socket.close(
        CloseCode.InternalServerError,
        isProd
          ? 'Internal server error'
          : (err instanceof Error ? err.message : String(err)).slice(0, 1024),
      );
    }

    // fastify-websocket uses the WebSocket.createWebSocketStream,
    // therefore errors get emitted on both the connection and the socket
    socket.once('error', handleEmittedError);

    // keep alive through ping-pong messages
    let pongWait: ReturnType<typeof setTimeout> | null = null;
    const pingInterval =
      keepAlive > 0 && Number.isFinite(keepAlive)
        ? setInterval(() => {
            // ping pong on open sockets only
            if (socket.readyState === socket.OPEN) {
              // terminate the connection after pong wait has passed because the client is idle
              pongWait = setTimeout(() => {
                socket.terminate();
              }, keepAlive);

              // listen for client's pong and stop socket termination
              socket.once('pong', () => {
                if (pongWait) {
                  clearTimeout(pongWait);
                  pongWait = null;
                }
              });

              socket.ping();
            }
          }, keepAlive)
        : null;

    const closed = server.opened(
      {
        protocol: socket.protocol,
        send: (data) =>
          new Promise((resolve, reject) => {
            if (socket.readyState !== socket.OPEN) {
              resolve();
              return;
            }
            socket.send(data, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }),
        close: (code, reason) => {
          socket.close(code, reason);
        },
        onMessage: (cb) =>
          socket.on('message', (event) => {
            let messageText: string;
            if (Buffer.isBuffer(event)) {
              messageText = event.toString('utf8');
            } else if (event instanceof ArrayBuffer) {
              messageText = Buffer.from(event).toString('utf8');
            } else if (Array.isArray(event)) {
              // Concatenate all buffers and convert to string
              messageText = Buffer.concat(event).toString('utf8');
            } else {
              throw new TypeError(
                `Unsupported data type for websocket message ${typeof event}`,
              );
            }
            cb(String(messageText)).catch((err: unknown) => {
              logError(err, {
                context:
                  'Internal error occurred during message handling. ' +
                  'Please check your implementation.',
              });
              socket.close(
                CloseCode.InternalServerError,
                isProd
                  ? 'Internal server error'
                  : (err instanceof Error ? err.message : String(err)).slice(
                      0,
                      1024,
                    ),
              );
            });
          }),
      },
      { socket, request } as Extra & Partial<E>,
    );

    socket.once('close', (code, reason) => {
      if (pongWait) clearTimeout(pongWait);
      if (pingInterval) clearInterval(pingInterval);
      if (
        !isProd &&
        code === (CloseCode.SubprotocolNotAcceptable as number) &&
        socket.protocol === DEPRECATED_GRAPHQL_WS_PROTOCOL
      )
        logger.warn(
          `Client provided the unsupported and deprecated subprotocol "${socket.protocol}" used by subscriptions-transport-ws.` +
            'Please see https://www.apollographql.com/docs/apollo-server/data/subscriptions/#switching-from-subscriptions-transport-ws.',
        );
      closed(code, String(reason)).catch((err: unknown) => logError(err));
    });
  };
}

export function getGraphqlWsHandler(
  graphQLServer: YogaServerInstance<
    {
      req: FastifyRequest;
      reply: FastifyReply;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >,
): WebsocketHandler {
  return makeHandler({
    execute: (args) => (args.rootValue as RootValueWithExecutor).execute(args),
    /* TPL_ON_CONNECT:START */ onConnect: async (ctx) => {
      try {
        // attach auth info to request
        const authorizationHeader = ctx.connectionParams?.authorization;
        const sessionInfo = await userSessionService.getSessionInfoFromToken(
          ctx.extra.request,
          typeof authorizationHeader === 'string'
            ? authorizationHeader
            : undefined,
        );
        ctx.extra.request.auth = createAuthContextFromSessionInfo(sessionInfo);

        // set expiry for socket based on auth token expiry
        const tokenExpiry = sessionInfo?.expiresAt;
        if (tokenExpiry) {
          const { socket } = ctx.extra;

          const timeoutHandle = setTimeout(() => {
            try {
              socket.close(CloseCode.Forbidden, 'token-expired');
            } catch (err) {
              logError(err);
            }
          }, tokenExpiry.getTime() - Date.now());
          socket.on('close', () => {
            clearTimeout(timeoutHandle);
          });
        }
      } catch (err) {
        // only a subset of HTTP errors are mapped
        const httpToSocketErrorMap: Partial<Record<number, CloseCode>> = {
          403: CloseCode.Forbidden,
          // due to implementation of graphql-ws, only Forbidden will be retried
          // https://github.com/enisdenjo/graphql-ws/blob/master/src/client.ts#L827
          401: CloseCode.Forbidden,
          400: CloseCode.BadRequest,
        };
        logger.error(
          `websocket connection failed: ${
            err instanceof Error ? err.message : typeof err
          }`,
        );
        if (err instanceof HttpError && httpToSocketErrorMap[err.statusCode]) {
          ctx.extra.socket.close(
            httpToSocketErrorMap[err.statusCode],
            err.code,
          );
        } else {
          logError(err);
          ctx.extra.socket.close(
            CloseCode.InternalServerError,
            'unknown-error',
          );
        }
      }
    } /* TPL_ON_CONNECT:END */,
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
        if (errors.length > 0) return errors;
        return args;
      } catch (err) {
        logError(err);
        return [
          new GraphQLError('Error creating subscription', {
            originalError: err as Error,
          }),
        ];
      }
    },
  });
}
