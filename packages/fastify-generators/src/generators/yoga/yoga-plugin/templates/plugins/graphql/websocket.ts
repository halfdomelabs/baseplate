// @ts-nocheck

import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { createContextFromRequest } from '%requestServiceContextImports';
import { WebsocketHandler } from '@fastify/websocket';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ExecutionArgs, ExecutionResult, GraphQLError } from 'graphql';
import {
  CloseCode,
  ConnectionInitMessage,
  DEPRECATED_GRAPHQL_WS_PROTOCOL,
  handleProtocols,
  makeServer,
  ServerOptions,
} from 'graphql-ws';
import { YogaServerInstance } from 'graphql-yoga';
import * as ws from 'ws';

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
        let firstErr: unknown = null;

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
            firstErr = firstErr ?? err;
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
      keepAlive > 0 && isFinite(keepAlive)
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
            if (socket.readyState !== socket.OPEN) return resolve();
            socket.send(data, (err) => (err ? reject(err) : resolve()));
          }),
        close: (code, reason) => socket.close(code, reason),
        onMessage: (cb) =>
          socket.on('message', (event) => {
            cb(String(event)).catch((err) => {
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
      closed(code, String(reason)).catch((err) => logError(err));
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
    TPL_ON_CONNECT,

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
        return [
          new GraphQLError('Error creating subscription', {
            originalError: err as Error,
          }),
        ];
      }
    },
  });
}
