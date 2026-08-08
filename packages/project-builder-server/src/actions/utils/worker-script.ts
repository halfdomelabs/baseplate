import type { LogLevel } from '@baseplate-dev/sync';

import { createEventedLogger } from '@baseplate-dev/sync';
import { parentPort, workerData } from 'node:worker_threads';

import type { ServiceAction, ServiceActionContext } from '../types.js';

import { ACTION_LOADERS } from '../action-loaders.js';

type ActionLoader = () => Promise<ServiceAction>;

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
  const loadAction = (ACTION_LOADERS as Record<string, ActionLoader>)[
    actionName
  ];

  if (!loadAction) {
    throw new Error(
      `Action ${actionName} not found. Make sure it is registered in ACTION_LOADERS.`,
    );
  }

  const action: ServiceAction = await loadAction();

  // The loader map's keys are type-checked against the manifest, but nothing
  // types a loader's key against the action it returns, so a mismapped entry
  // would run the wrong handler and validate against the wrong output schema.
  if (action.name !== actionName) {
    throw new Error(
      `ACTION_LOADERS maps ${actionName} to the ${action.name} action.`,
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

  const result = await action.handler(input, contextWithLogger);
  const validatedResult = action.outputSchema.parse(result);
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
