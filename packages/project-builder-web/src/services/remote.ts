import { ProjectConfig } from '@halfdomelabs/project-builder-lib';
import axios from 'axios';
import ReconnectingWebSocket from 'reconnecting-websocket';

import { client } from './api';
import { config as envConfig } from './config';
import { logError } from './error-logger';
import { logger } from './logger';
import PREVIEW_APP from './preview-app.json';
import { TypedEventEmitterBase } from 'src/utils/typed-event-emitter';

const IS_PREVIEW = envConfig.VITE_PREVIEW_MODE;

async function getCsrfToken(): Promise<string> {
  const response = await axios.get<{ csrfToken: string }>('/api/auth');
  return response.data.csrfToken;
}

export interface Project {
  id: string;
  name: string;
  directory: string;
}

export async function getProjects(): Promise<Project[]> {
  if (IS_PREVIEW) {
    return [
      {
        id: 'preview-project',
        name: 'Preview Project',
        directory: '~/preview-project',
      },
    ];
  }
  const response = await client.projects.list.query();
  return response;
}

export async function getVersion(): Promise<string> {
  if (IS_PREVIEW) {
    return 'preview';
  }
  const response = await client.version.query();
  return response;
}

export interface FilePayload {
  contents: string;
  lastModifiedAt: string;
}

export async function downloadProjectConfig(
  id: string,
): Promise<FilePayload | null> {
  if (IS_PREVIEW) {
    return {
      lastModifiedAt: new Date().toISOString(),
      contents: JSON.stringify(PREVIEW_APP as ProjectConfig),
    };
  }
  const response = await client.projects.get.query({ id });
  return response.file;
}

type WriteResult =
  | { type: 'success'; lastModifiedAt: string }
  | { type: 'modified-more-recently' };

export async function uploadProjectConfig(
  id: string,
  contents: FilePayload,
): Promise<WriteResult> {
  if (IS_PREVIEW) {
    return { type: 'success', lastModifiedAt: new Date().toISOString() };
  }
  const response = await client.projects.writeConfig.mutate({
    id,
    contents: contents.contents,
    lastModifiedAt: contents.lastModifiedAt,
  });

  return response.result;
}

export async function startSync(id: string): Promise<void> {
  if (IS_PREVIEW) {
    return;
  }
  await client.projects.startSync.mutate({ id });
}

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

export class ProjectWebsocketClient extends TypedEventEmitterBase<{
  connectionOpened: unknown;
  connected: unknown;
  closed: unknown;
  error: Error;
  message: ServerWebsocketMessage;
}> {
  private socket?: ReconnectingWebSocket;

  constructor() {
    super();
    if (IS_PREVIEW) {
      return;
    }

    const websocketUrl = `${
      (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
      window.location.host
    }/api/ws`;
    this.socket = new ReconnectingWebSocket(websocketUrl);

    this.socket.addEventListener(
      'message',
      ({ data }: MessageEvent<string>) => {
        const message = JSON.parse(data) as ServerWebsocketMessage;
        switch (message.type) {
          case 'connected':
            this.emit('connected', null);
            logger.info(`Websocket connection successfully established!`);
            break;
          case 'command-console-emitted':
          case 'project-json-changed':
            this.emit('message', message);
            break;
          case 'error':
            this.emit('error', new Error(message.message));
            logError(new Error(`Error from websocket: ${message.message}`));
            break;
          default:
            logError(
              new Error(
                `Unknown message type from websocket ${
                  (message as { type: string }).type
                }`,
              ),
            );
            break;
        }
      },
    );

    this.socket.addEventListener('open', () => {
      getCsrfToken()
        .then((csrfKey) => {
          this.sendMessage({
            type: 'connect',
            csrfKey,
          });
          this.emit('connectionOpened', null);
        })
        .catch((err) => {
          this.emit('error', err as Error);
        });
    });
    this.socket.addEventListener('close', () => this.emit('closed', null));
  }

  sendMessage(message: ClientWebsocketMessage): void {
    if (!this.socket) {
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  subscribe(id: string): void {
    if (!this.socket) {
      return;
    }
    this.socket.send(
      JSON.stringify({
        type: 'subscribe',
        id,
      }),
    );
  }

  close(): void {
    if (!this.socket) {
      return;
    }
    this.socket.close();
  }
}
