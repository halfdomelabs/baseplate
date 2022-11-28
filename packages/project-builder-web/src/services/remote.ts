import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import ReconnectingWebSocket from 'reconnecting-websocket';

const URL_BASE = undefined;

const axiosClient = axios.create();

let csrfToken: string | undefined;

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
  const response = await axiosClient.post<WriteResult>(
    `/api/project-json/${id}`,
    contents,
    {
      baseURL: URL_BASE,
    }
  );

  return response.data;
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

type ServerWebsocketMessage =
  | ConnectedMessage
  | ErrorMessage
  | ProjectJsonChangedMessage;

interface ProjectWebsocketClientOptions {
  onProjectJsonChanged?: (payload: ProjectJsonChangedMessage) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

interface ProjectWebsocketClient {
  subscribe(id: string): void;
  close(): void;
}

export function createProjectWebsocketClient(
  options: ProjectWebsocketClientOptions
): ProjectWebsocketClient {
  const websocketUrl = `${
    (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
    window.location.host
  }/api/ws`;
  const socket = new ReconnectingWebSocket(websocketUrl);

  socket.addEventListener('message', ({ data }: MessageEvent<string>) => {
    const message = JSON.parse(data) as ServerWebsocketMessage;
    switch (message.type) {
      case 'connected':
        console.log(`Websocket connection successfully established!`);
        break;
      case 'project-json-changed':
        options.onProjectJsonChanged?.(message);
        break;
      case 'error':
        console.error(`Error from websocket: ${message.message}`);
        break;
      default:
        console.error(
          'Unknown message type',
          (message as { type: string }).type
        );
        break;
    }
  });

  function sendMessage(message: ClientWebsocketMessage): void {
    socket.send(JSON.stringify(message));
  }

  socket.addEventListener('open', () => {
    getCsrfToken()
      .then((csrfKey) => {
        sendMessage({
          type: 'connect',
          csrfKey,
        });
        options.onOpen?.();
      })
      .catch((err) => {
        options.onError?.(err as Error);
      });
  });
  socket.addEventListener('close', () => options.onClose?.());

  socket.addEventListener('error', (event) => options.onError?.(event.error));

  return {
    subscribe(id) {
      sendMessage({ type: 'subscribe', id });
    },
    close() {
      socket.close();
    },
  };
}
