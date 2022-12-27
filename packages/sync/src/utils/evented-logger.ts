import { createTypedEventEmitter } from './typed-event-emitter';

export interface Logger {
  log(message: string): void;
  error(message: string): void;
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
    log(message) {
      eventEmitter.emit('log', message);
      if (!noConsole) console.log(message);
    },
    error(message) {
      eventEmitter.emit('error', message);
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
