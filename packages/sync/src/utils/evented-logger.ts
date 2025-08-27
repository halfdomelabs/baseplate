import { createTypedEventEmitter } from '@baseplate-dev/utils';

export interface Logger {
  error(message: unknown): void;
  warn(message: string): void;
  info(message: string): void;
  debug(message: string): void;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface EventedLogger extends Logger {
  onMessage(
    listener: (message: { level: LogLevel; message: string }) => void,
  ): () => void;
  onLog(listener: (message: string) => void): () => void;
  onError(listener: (message: string) => void): () => void;
}

export function createEventedLogger({
  noConsole = false,
}: {
  noConsole?: boolean;
} = {}): EventedLogger {
  const eventEmitter = createTypedEventEmitter<{
    message: { level: LogLevel; message: string };
    log: string;
    error: string;
  }>();
  return {
    error(message) {
      const messageString = ((): string => {
        if (typeof message === 'string') {
          return message;
        } else if (message instanceof Error) {
          return String(message);
        } else {
          return typeof message;
        }
      })();
      eventEmitter.emit('error', messageString);
      eventEmitter.emit('message', {
        level: 'error',
        message: messageString,
      });
      if (!noConsole) console.error(message);
    },
    warn(message) {
      eventEmitter.emit('log', message);
      eventEmitter.emit('message', {
        level: 'warn',
        message,
      });
      if (!noConsole) console.warn(message);
    },
    info(message) {
      eventEmitter.emit('log', message);
      eventEmitter.emit('message', {
        level: 'info',
        message,
      });
      if (!noConsole) console.info(message);
    },
    debug(message) {
      eventEmitter.emit('log', message);
      eventEmitter.emit('message', {
        level: 'debug',
        message,
      });
      if (!noConsole) console.debug(message);
    },
    onMessage(listener) {
      return eventEmitter.on('message', listener);
    },
    onLog(listener) {
      return eventEmitter.on('log', listener);
    },
    onError(listener) {
      return eventEmitter.on('error', listener);
    },
  };
}
