import { ProjectConfig } from '@halfdomelabs/project-builder-lib';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { TypedEventEmitterBase } from 'src/utils/typed-event-emitter';
import { config as envConfig } from './config';

import PREVIEW_APP from './preview-app.json';

const URL_BASE = undefined;

const axiosClient = axios.create();

let csrfToken: string | undefined;

const IS_PREVIEW = envConfig.VITE_PREVIEW_MODE;

async function getCsrfToken(): Promise<string> {
  const response = await axios.get<{ csrfToken: string }>('/api/auth');
  return response.data.csrfToken;
}

axiosClient.interceptors.request.use(async (config) => {
  if (!csrfToken) {
    csrfToken = await getCsrfToken();
  }
  return {
    ...config,
    headers: {
      'x-csrf-token': csrfToken,
    },
  };
});

axiosClient.interceptors.response.use(undefined, (error) => {
  const { config, response } = error as AxiosError<{ code: string }>;
  // retry if csrf token is invalid
  if (
    config &&
    !(config as { csrfRetry: boolean }).csrfRetry &&
    response?.data.code === 'invalid-csrf-token'
  ) {
    csrfToken = undefined;
    return axiosClient({ ...config, csrfRetry: true } as AxiosRequestConfig);
  }
  return Promise.reject(error);
});

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
  const response = await axiosClient.get<Project[]>('/api/projects');
  return response.data;
}

export interface FilePayload {
  contents: string;
  lastModifiedAt: string;
}

export async function downloadProjectConfig(
  id: string
): Promise<FilePayload | null> {
  if (IS_PREVIEW) {
    return {
      lastModifiedAt: new Date().toISOString(),
      contents: JSON.stringify(PREVIEW_APP as ProjectConfig),
    };
  }
  const response = await axiosClient.get<{ file: FilePayload | null }>(
    `/api/project-json/${id}`,
    { baseURL: URL_BASE }
  );
  return response.data.file;
}

type WriteResult =
  | { type: 'success'; lastModifiedAt: string }
  | { type: 'modified-more-recently' };

export async function uploadProjectConfig(
  id: string,
  contents: FilePayload
): Promise<WriteResult> {
  if (IS_PREVIEW) {
    return { type: 'success', lastModifiedAt: new Date().toISOString() };
  }
  const response = await axiosClient.post<WriteResult>(
    `/api/project-json/${id}`,
    contents,
    {
      baseURL: URL_BASE,
    }
  );

  return response.data;
}

export async function startSync(id: string): Promise<void> {
  if (IS_PREVIEW) {
    return;
  }
  await axiosClient.post(`/api/start-sync/${id}`, undefined, {
    baseURL: URL_BASE,
  });
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
            console.log(`Websocket connection successfully established!`);
            break;
          case 'command-console-emitted':
          case 'project-json-changed':
            this.emit('message', message);
            break;
          case 'error':
            this.emit('error', new Error(message.message));
            console.error(`Error from websocket: ${message.message}`);
            break;
          default:
            console.error(
              'Unknown message type',
              (message as { type: string }).type
            );
            break;
        }
      }
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
      })
    );
  }

  close(): void {
    if (!this.socket) {
      return;
    }
    this.socket.close();
  }
}
