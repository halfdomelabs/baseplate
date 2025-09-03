import { describe, expect, it } from 'vitest';

import type { LogMessage } from './evented-logger.js';

import { createEventedLogger } from './evented-logger.js';

describe('createEventedLogger', () => {
  describe('string message logging', () => {
    it('should log string messages for all levels', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');

      expect(messages).toEqual([
        { level: 'error', message: 'error message', metadata: undefined },
        { level: 'warn', message: 'warn message', metadata: undefined },
        { level: 'info', message: 'info message', metadata: undefined },
        { level: 'debug', message: 'debug message', metadata: undefined },
      ]);

      unsubscribe();
    });
  });

  describe('object message logging', () => {
    it('should log object with message for all levels', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      const metadata = { userId: 123, action: 'test' };

      logger.error(metadata, 'error occurred');
      logger.warn(metadata, 'warning occurred');
      logger.info(metadata, 'info occurred');
      logger.debug(metadata, 'debug occurred');

      expect(messages).toEqual([
        { level: 'error', message: 'error occurred', metadata },
        { level: 'warn', message: 'warning occurred', metadata },
        { level: 'info', message: 'info occurred', metadata },
        { level: 'debug', message: 'debug occurred', metadata },
      ]);

      unsubscribe();
    });

    it('should log object without message', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      const metadata = { error: 'Something went wrong' };

      logger.error(metadata);
      logger.warn(metadata);
      logger.info(metadata);
      logger.debug(metadata);

      expect(messages).toEqual([
        { level: 'error', message: '', metadata },
        { level: 'warn', message: '', metadata },
        { level: 'info', message: '', metadata },
        { level: 'debug', message: '', metadata },
      ]);

      unsubscribe();
    });
  });

  describe('event listeners', () => {
    it('should support onLog listener', () => {
      const logger = createEventedLogger();
      const logMessages: string[] = [];
      const unsubscribe = logger.onLog((message) => {
        logMessages.push(message);
      });

      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');
      // Note: error doesn't emit to onLog

      expect(logMessages).toEqual([
        'warn message',
        'info message',
        'debug message',
      ]);
      unsubscribe();
    });

    it('should support onError listener', () => {
      const logger = createEventedLogger();
      const errorMessages: string[] = [];
      const unsubscribe = logger.onError((message) => {
        errorMessages.push(message);
      });

      logger.error('error message');
      logger.warn('warn message'); // This shouldn't trigger onError

      expect(errorMessages).toEqual(['error message']);
      unsubscribe();
    });

    it('should emit to onLog with object metadata message', () => {
      const logger = createEventedLogger();
      const logMessages: string[] = [];
      const unsubscribe = logger.onLog((message) => {
        logMessages.push(message);
      });

      logger.info({ userId: 123 }, 'User action');

      expect(logMessages).toEqual(['User action']);
      unsubscribe();
    });
  });

  describe('error handling', () => {
    it('should serialize Error objects when passed directly', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      const error = new TypeError('Something went wrong');
      logger.error(error);

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        level: 'error',
        message: 'Something went wrong',
        metadata: {
          err: {
            type: 'TypeError',
            message: 'Something went wrong',
            stack: expect.any(String) as string,
          },
        },
      });

      unsubscribe();
    });

    it('should handle Error with custom message override', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      const error = new Error('Original message');
      logger.error(error, 'Custom message');

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        level: 'error',
        message: 'Custom message',
        metadata: {
          err: {
            type: 'Error',
            message: 'Original message',
            stack: expect.any(String) as string,
          },
        },
      });

      unsubscribe();
    });

    it('should handle errors with additional properties', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      const error = new Error('Test error') as Error & {
        statusCode: number;
        code: string;
      };
      error.statusCode = 500;
      error.code = 'INTERNAL_ERROR';

      logger.error(error);

      expect(messages[0].metadata?.err).toMatchObject({
        type: 'Error',
        message: 'Test error',
        statusCode: 500,
        code: 'INTERNAL_ERROR',
      });

      unsubscribe();
    });

    it('should handle nested errors with cause', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      const rootCause = new Error('Root cause');
      const error = new Error('Main error', { cause: rootCause });

      logger.error(error);

      expect(messages[0].metadata?.err).toMatchObject({
        type: 'Error',
        message: 'Main error',
        cause: {
          type: 'Error',
          message: 'Root cause',
          stack: expect.any(String) as string,
        },
      });

      unsubscribe();
    });
  });

  describe('message and msg property handling', () => {
    it('should use message property from objects', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      logger.info({ message: 'Object with message', userId: 123 });

      expect(messages).toEqual([
        {
          level: 'info',
          message: 'Object with message',
          metadata: { userId: 123 },
        },
      ]);

      unsubscribe();
    });

    it('should use msg property from objects when message is not available', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      logger.info({ msg: 'Object with msg', userId: 123 });

      expect(messages).toEqual([
        {
          level: 'info',
          message: 'Object with msg',
          metadata: { userId: 123 },
        },
      ]);

      unsubscribe();
    });

    it('should prioritize message over msg property', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      logger.info({
        message: 'Priority message',
        msg: 'Lower priority',
        userId: 123,
      });

      expect(messages).toEqual([
        {
          level: 'info',
          message: 'Priority message',
          metadata: { userId: 123 },
        },
      ]);

      unsubscribe();
    });

    it('should handle objects with neither message nor msg', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      logger.info({ userId: 123, action: 'login' });

      expect(messages).toEqual([
        {
          level: 'info',
          message: '',
          metadata: { userId: 123, action: 'login' },
        },
      ]);

      unsubscribe();
    });

    it('should handle string message override with objects containing message/msg', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      logger.info(
        { message: 'Object message', userId: 123 },
        'Override message',
      );

      expect(messages).toEqual([
        {
          level: 'info',
          message: 'Override message',
          metadata: { userId: 123 },
        },
      ]);

      unsubscribe();
    });
  });

  describe('mixed patterns', () => {
    it('should handle object with err property correctly', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      const error = new Error('Test error');
      logger.error({ err: error, message: 'Custom message', userId: 123 });

      expect(messages).toEqual([
        {
          level: 'error',
          message: 'Custom message',
          metadata: {
            err: error, // Original error object preserved in this case
            userId: 123,
          },
        },
      ]);

      unsubscribe();
    });
  });

  describe('backward compatibility', () => {
    it('should maintain backward compatibility with existing string-only usage', () => {
      const logger = createEventedLogger();
      const messages: LogMessage[] = [];
      const unsubscribe = logger.onMessage((message) => {
        messages.push(message);
      });

      // These calls should work exactly as before
      logger.error('old style error');
      logger.warn('old style warn');
      logger.info('old style info');
      logger.debug('old style debug');

      expect(messages).toEqual([
        { level: 'error', message: 'old style error', metadata: undefined },
        { level: 'warn', message: 'old style warn', metadata: undefined },
        { level: 'info', message: 'old style info', metadata: undefined },
        { level: 'debug', message: 'old style debug', metadata: undefined },
      ]);

      unsubscribe();
    });
  });
});
