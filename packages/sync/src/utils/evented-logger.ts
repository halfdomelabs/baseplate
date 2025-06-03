import { createTypedEventEmitter } from '@baseplate-dev/utils';

export interface Logger {
  error(message: unknown): void;
  warn(message: string): void;
  info(message: string): void;
  debug(message: string): void;
}

export interface EventedLogger extends Logger {
  onLog(listener: (message: string) => void): () => void;
  onError(listener: (message: string) => void): () => void;
}

export function createEventedLogger({
  noConsole = false,
}: {
  noConsole?: boolean;
} = {}): EventedLogger {
  const eventEmitter = createTypedEventEmitter<{
    log: string;
    error: string;
  }>();
  return {
    error(message) {
      eventEmitter.emit(
        'error',
        ((): string => {
          if (typeof message === 'string') {
            return message;
          } else if (message instanceof Error) {
            return String(message);
          } else {
            return typeof message;
          }
        })(),
      );
      if (!noConsole) console.error(message);
    },
    warn(message) {
      eventEmitter.emit('log', message);
      if (!noConsole) console.warn(message);
    },
    info(message) {
      eventEmitter.emit('log', message);
      if (!noConsole) console.info(message);
    },
    debug(message) {
      eventEmitter.emit('log', message);
      if (!noConsole) console.debug(message);
    },
    onLog(listener) {
      return eventEmitter.on('log', listener);
    },
    onError(listener) {
      return eventEmitter.on('error', listener);
    },
  };
}
