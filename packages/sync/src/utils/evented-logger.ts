import { createTypedEventEmitter } from '@baseplate-dev/utils';

export interface LogMessage {
  level: LogLevel;
  message: string;
  metadata?: {
    err?: SerializedError;
    [key: string]: unknown;
  };
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface Logger {
  error(message: unknown): void;
  error(obj: object, message?: string): void;
  warn(message: string): void;
  warn(obj: object, message?: string): void;
  info(message: string): void;
  info(obj: object, message?: string): void;
  debug(message: string): void;
  debug(obj: object, message?: string): void;
}

export interface SerializedError {
  type: string;
  message: string;
  stack?: string;
  cause?: SerializedError;
  [key: string]: unknown;
}
export interface EventedLogger extends Logger {
  onMessage(listener: (message: LogMessage) => void): () => void;
  onLog(listener: (message: string) => void): () => void;
  onError(listener: (message: string) => void): () => void;
}

function serializeError(error: Error): SerializedError {
  const serialized: SerializedError = {
    type: error.constructor.name,
    message: error.message,
  };

  if (error.stack) {
    serialized.stack = error.stack;
  }

  // Handle nested errors (cause property)
  if (error.cause && error.cause instanceof Error) {
    serialized.cause = serializeError(error.cause);
  }

  // Copy any additional enumerable properties
  for (const key of Object.getOwnPropertyNames(error)) {
    if (
      key !== 'name' &&
      key !== 'message' &&
      key !== 'stack' &&
      key !== 'cause'
    ) {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(error, key);
        if (descriptor?.enumerable) {
          serialized[key] = (error as unknown as Record<string, unknown>)[key];
        }
      } catch {
        // Ignore properties that can't be accessed
      }
    }
  }

  return serialized;
}

interface LogArgs {
  message: string;
  metadata?: LogMessage['metadata'];
}

function parseLogArgs(...args: [unknown, string?] | [string]): LogArgs {
  if (args.length === 1) {
    const arg = args[0];

    if (typeof arg === 'string') {
      return { message: arg };
    } else if (arg instanceof Error) {
      // Error object - serialize to metadata.err
      return {
        message: arg.message,
        metadata: { err: serializeError(arg) },
      };
    } else if (typeof arg === 'object' && arg !== null) {
      // Object - check for message/msg properties
      const obj = arg as Record<string, unknown>;
      const message =
        typeof obj.message === 'string'
          ? obj.message
          : typeof obj.msg === 'string'
            ? obj.msg
            : '';

      // Create metadata without the message/msg properties
      const metadata: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key !== 'message' && key !== 'msg') {
          metadata[key] = value;
        }
      }

      return {
        message,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };
    } else {
      return { message: String(arg) };
    }
  } else {
    const [firstArg, stringMessage] = args;

    if (firstArg instanceof Error) {
      // Error with message override
      return {
        message: stringMessage ?? firstArg.message,
        metadata: { err: serializeError(firstArg) },
      };
    } else if (typeof firstArg === 'object' && firstArg !== null) {
      // Object with message override
      const obj = firstArg as Record<string, unknown>;
      const fallbackMessage =
        typeof obj.message === 'string'
          ? obj.message
          : typeof obj.msg === 'string'
            ? obj.msg
            : '';

      // Create metadata without message/msg properties
      const metadata: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key !== 'message' && key !== 'msg') {
          metadata[key] = value;
        }
      }

      return {
        message: stringMessage ?? fallbackMessage,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };
    } else {
      return {
        message: stringMessage ?? String(firstArg),
        metadata: undefined,
      };
    }
  }
}

export function createEventedLogger(): EventedLogger {
  const eventEmitter = createTypedEventEmitter<{
    message: LogMessage;
    log: string;
    error: string;
  }>();
  return {
    error(...args: [unknown] | [object, string?]) {
      const parsed = parseLogArgs(...args);
      eventEmitter.emit('error', parsed.message);
      eventEmitter.emit('message', {
        level: 'error',
        message: parsed.message,
        metadata: parsed.metadata,
      });
    },
    warn(...args: [string] | [object, string?]) {
      const parsed = parseLogArgs(...args);
      eventEmitter.emit('log', parsed.message);
      eventEmitter.emit('message', {
        level: 'warn',
        message: parsed.message,
        metadata: parsed.metadata,
      });
    },
    info(...args: [string] | [object, string?]) {
      const parsed = parseLogArgs(...args);
      eventEmitter.emit('log', parsed.message);
      eventEmitter.emit('message', {
        level: 'info',
        message: parsed.message,
        metadata: parsed.metadata,
      });
    },
    debug(...args: [string] | [object, string?]) {
      const parsed = parseLogArgs(...args);
      eventEmitter.emit('log', parsed.message);
      eventEmitter.emit('message', {
        level: 'debug',
        message: parsed.message,
        metadata: parsed.metadata,
      });
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
