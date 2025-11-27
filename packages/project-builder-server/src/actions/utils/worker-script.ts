import type { LogLevel } from '@baseplate-dev/sync';

import { createEventedLogger } from '@baseplate-dev/sync';
import { parentPort, workerData } from 'node:worker_threads';
import z from 'zod';

import type { ServiceAction, ServiceActionContext } from '../types.js';

export interface WorkerData {
  actionName: string;
  input: unknown;
  context: Omit<ServiceActionContext, 'logger'>;
}

interface WorkerMessageSuccess {
  type: 'success';
  result: unknown;
}

interface WorkerMessageError {
  type: 'error';
  error: {
    message: string;
    stack?: string;
    name?: string;
  };
}

interface WorkerMessageLog {
  type: 'log';
  level: LogLevel;
  message: string;
  metadata?: object;
}

export type WorkerMessage =
  | WorkerMessageSuccess
  | WorkerMessageError
  | WorkerMessageLog;

const { actionName, input, context } = workerData as WorkerData;

function sendMessage(message: WorkerMessage): void {
  if (!parentPort) {
    throw new Error(
      'Parent port not found. This script must be run in a worker.',
    );
  }
  parentPort.postMessage(message);
}

try {
  const actionRegistry = await import('../registry.js');

  const action = actionRegistry.ALL_SERVICE_ACTIONS.find(
    (action) => action.name === actionName,
  ) as ServiceAction | undefined;

  if (!action) {
    throw new Error(
      `Action ${actionName} not found. Make sure it is registered in the action registry.`,
    );
  }

  const proxyLogger = createEventedLogger();

  const contextWithLogger = {
    ...context,
    logger: proxyLogger,
  };

  proxyLogger.onMessage((message) => {
    sendMessage({
      type: 'log',
      level: message.level,
      message: message.message,
      metadata: message.metadata,
    });
  });

  const result = await action.handler(
    input as z.objectInputType<typeof action.inputSchema, z.ZodType, 'strip'>,
    contextWithLogger,
  );
  const validatedResult = z.object(action.outputSchema).parse(result);
  sendMessage({ type: 'success', result: validatedResult });
} catch (error) {
  // Send error details with stack trace
  if (error instanceof Error) {
    sendMessage({
      type: 'error',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    });
  } else {
    sendMessage({
      type: 'error',
      error: {
        message: String(error),
      },
    });
  }
}
