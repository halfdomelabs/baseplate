import {
  FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from '@trpc/server/adapters/fastify';
import crypto from 'crypto';
import { FastifyInstance } from 'fastify';

import {
  FilePayload,
  ProjectBuilderService,
} from '../service/builder-service.js';
import { createContext } from '@src/api/context.js';
import { getCsrfToken } from '@src/api/crsf.js';
import { AppRouter, createAppRouter } from '@src/api/index.js';
import {
  GeneratorEngineSetupConfig,
  getGeneratorEngine,
} from '@src/sync/index.js';
import { HttpError, NotFoundError } from '@src/utils/http-errors.js';

interface ConnectMessage {
  type: 'connect';
  csrfKey: string;
}

interface SubscribeMessage {
  type: 'subscribe';
  id: string;
}

type ClientWebsocketMessage = ConnectMessage | SubscribeMessage;

interface ConnectedMessage {
  type: 'connected';
}

interface ProjectJsonChangedMessage {
  type: 'project-json-changed';
  id: string;
  file: FilePayload | null;
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

interface CommandConsoleEmittedMessage {
  type: 'command-console-emitted';
  message: string;
}

type ServerWebsocketMessage =
  | ConnectedMessage
  | ErrorMessage
  | ProjectJsonChangedMessage
  | CommandConsoleEmittedMessage;

export async function baseplatePlugin(
  fastify: FastifyInstance,
  {
    directories,
    cliVersion,
    generatorSetupConfig,
  }: {
    directories: string[];
    cliVersion: string;
    generatorSetupConfig: GeneratorEngineSetupConfig;
  },
): Promise<void> {
  const csrfToken = getCsrfToken();
  const services = await Promise.all(
    directories.map(async (directory) => {
      const id = crypto
        .createHash('shake256', { outputLength: 9 })
        .update(directory)
        .digest('base64')
        .replace('/', '-')
        .replace('+', '_');
      const service = new ProjectBuilderService({
        directory,
        id,
        generatorSetupConfig,
        cliVersion,
      });
      await service.init();
      return service;
    }),
  );

  fastify.log.info(
    `Loaded projects:\n${services
      .map((api) => `${api.directory}: ${api.id}`)
      .join('\n')}`,
  );

  await fastify.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    useWSS: true,
    trpcOptions: {
      router: createAppRouter({
        services,
        cliVersion,
        logger: fastify.log,
      }),
      createContext,
      onError: ({ error }) => {
        fastify.log.error(error);
      },
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>);

  fastify.get('/api/auth', (req) => {
    // DNS rebinding attack prevention
    const host = req.headers.host ?? '';
    if (
      !host.startsWith('localhost:') &&
      host !== 'localhost' &&
      !host.startsWith('127.0.0.1') &&
      host !== '127.0.0.1'
    ) {
      throw new Error(`Must connect from localhost`);
    }
    return { csrfToken };
  });

  function getApi(id: string): ProjectBuilderService {
    const service = services.find((a) => a.id === id);
    if (!service) {
      throw new NotFoundError(`No project with id ${id}`);
    }
    return service;
  }

  fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error(error);

    if (error instanceof HttpError) {
      await reply.code(error.statusCode).send({
        ...error.extraData,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        reqId: request.id,
      });
    } else if (error.statusCode && error.statusCode < 500) {
      await reply.code(error.statusCode).send({
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        reqId: request.id,
      });
    } else {
      await reply.code(500).send({
        message: error?.message,
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: error.statusCode,
        reqId: request.id,
        stack: error?.stack,
      });
    }
  });

  fastify.get('/api/ws', { websocket: true }, (connection) => {
    let unsubscribe: () => void | undefined;
    let isAuthenticated = false;
    function sendWebsocketMessage(message: ServerWebsocketMessage): void {
      connection.socket.send(JSON.stringify(message));
    }
    connection.socket.on('message', (rawData) => {
      try {
        const message = JSON.parse(
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          rawData.toString('utf-8'),
        ) as ClientWebsocketMessage;

        const handleSubscribe = (msg: SubscribeMessage): void => {
          if (!isAuthenticated) {
            sendWebsocketMessage({
              type: 'error',
              message: `Not Authenticated`,
            });
          }
          if (unsubscribe) {
            unsubscribe();
          }
          const unsubscribeConsoleEmitted = getApi(msg.id).on(
            'command-console-emitted',
            (payload) => {
              sendWebsocketMessage({
                type: 'command-console-emitted',
                message: payload.message,
              });
            },
          );
          unsubscribe = () => {
            unsubscribeConsoleEmitted();
          };
        };

        switch (message.type) {
          case 'connect':
            if (csrfToken !== message.csrfKey) {
              sendWebsocketMessage({
                type: 'error',
                message: `Invalid CSRF token`,
              });
              fastify.log.error(`Invalid CSRF token: ${message.csrfKey}`);
              connection.socket.close(403);
              break;
            }
            isAuthenticated = true;
            sendWebsocketMessage({ type: 'connected' });
            break;
          case 'subscribe':
            handleSubscribe(message);
            break;
          default:
            sendWebsocketMessage({
              type: 'error',
              message: `Unknown websocket message type: ${
                (message as { type: string }).type
              }`,
            });
            break;
        }
      } catch (err) {
        fastify.log.error(err);
        sendWebsocketMessage({
          type: 'error',
          message: err instanceof Error ? err.message : JSON.stringify(err),
        });
        connection.socket.close();
      }
    });

    connection.socket.on('close', () => {
      if (unsubscribe) {
        unsubscribe();
      }
    });
  });

  fastify.addHook('onClose', () => {
    services.map((service) => service.close());
  });

  // pre-warm up generator engine so syncing is faster on first request
  setTimeout(() => {
    getGeneratorEngine(generatorSetupConfig).catch((err) =>
      fastify.log.error(err),
    );
  }, 500);
}
