import crypto from 'crypto';
import { ProjectConfig } from '@baseplate/project-builder-lib';
import { FastifyInstance } from 'fastify';
import { logger } from '@src/services/logger';
import { FilePayload, ProjectBuilderApi } from './api';

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
  { directories }: { directories: string[] }
): Promise<void> {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const apis = await Promise.all(
    directories.map(async (directory) => {
      const id = crypto
        .createHash('shake256', { outputLength: 9 })
        .update(directory)
        .digest('base64')
        .replace('/', '-')
        .replace('+', '_');
      const api = new ProjectBuilderApi(directory, id);
      await api.init();
      return api;
    })
  );

  console.log(
    `Loaded projects:\n${apis
      .map((api) => `${api.directory}: ${api.id}`)
      .join('\n')}`
  );

  fastify.get('/api/auth', (req) => {
    // DNS rebinding attack prevention
    if (!req.headers.host?.startsWith('localhost')) {
      throw new Error(`Must connect from localhost`);
    }
    return { csrfToken };
  });

  fastify.addHook('onRequest', async (request, reply) => {
    const headerCsrfToken = request.headers['x-csrf-token'];

    const IGNORED_PATHS = ['/api/auth', '/api/ws'];
    if (IGNORED_PATHS.includes(request.url)) {
      return;
    }

    if (headerCsrfToken !== csrfToken) {
      await reply
        .code(403)
        .send({ error: 'Invalid CSRF token', code: 'invalid-csrf-token' });
    }
  });

  fastify.get('/api/projects', async () =>
    Promise.all(
      apis.map(async (api) => {
        const config = await api.readConfig();
        if (!config) {
          throw new Error(`File config missing for ${api.directory}`);
        }
        const parsedContents = JSON.parse(config.contents) as ProjectConfig;
        return {
          id: api.id,
          name: parsedContents.name,
          directory: api.directory,
        };
      })
    )
  );

  function getApi(id: string): ProjectBuilderApi {
    const api = apis.find((a) => a.id === id);
    if (!api) {
      throw new Error(`No project with id ${id}`);
    }
    return api;
  }

  fastify.addSchema({
    $id: 'apiIdSchema',
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  });

  fastify.get<{
    Params: { id: string };
  }>('/api/project-json/:id', {
    schema: { params: { $ref: 'apiIdSchema#' } },
    handler: async (req) => {
      const { id } = req.params;
      const api = getApi(id);
      const file = await api.readConfig();
      return { file };
    },
  });

  fastify.post<{
    Params: { id: string };
  }>('/api/start-sync/:id', {
    schema: {
      params: { $ref: 'apiIdSchema#' },
    },
    handler: (req) => {
      const { id } = req.params;
      const api = getApi(id);

      api.buildProject().catch((err) => console.error(err));

      return { success: true };
    },
  });

  fastify.post<{
    Params: { id: string };
    Body: { contents: string; lastModifiedAt: string };
  }>('/api/project-json/:id', {
    schema: {
      params: { $ref: 'apiIdSchema#' },
      body: {
        type: 'object',
        properties: {
          contents: { type: 'string' },
          lastModifiedAt: { type: 'string' },
        },
      },
    },
    handler: async (req) => {
      const { contents, lastModifiedAt } = req.body;
      const { id } = req.params;
      const api = getApi(id);

      const result = await api.writeConfig({ contents, lastModifiedAt });

      return result;
    },
  });

  fastify.get('/api/ws', { websocket: true }, (connection) => {
    let unsubscribe: () => void | undefined;
    let isAuthenticated = false;
    function sendWebsocketMessage(message: ServerWebsocketMessage): void {
      connection.socket.send(JSON.stringify(message));
    }
    connection.socket.on('message', (rawData) => {
      const message = JSON.parse(rawData.toString()) as ClientWebsocketMessage;

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
        const unsubscribeProjectJsonChanged = getApi(msg.id).on(
          'project-json-changed',
          (payload) => {
            sendWebsocketMessage({
              type: 'project-json-changed',
              file: payload,
              id: msg.id,
            });
          }
        );
        const unsubscribeConsoleEmitted = getApi(msg.id).on(
          'command-console-emitted',
          (payload) => {
            sendWebsocketMessage({
              type: 'command-console-emitted',
              message: payload.message,
            });
          }
        );
        unsubscribe = () => {
          unsubscribeProjectJsonChanged();
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
            logger.error(`Invalid CSRF token: ${message.csrfKey}`);
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
    });

    connection.socket.on('close', () => {
      if (unsubscribe) {
        unsubscribe();
      }
    });
  });

  fastify.addHook('onClose', () => {
    apis.map((api) => api.close());
  });
}
