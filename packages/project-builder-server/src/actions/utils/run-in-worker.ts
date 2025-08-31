import type z from 'zod';

import path from 'node:path';
import { Worker } from 'node:worker_threads';

import type { ServiceAction, ServiceActionContext } from '../types.js';
import type { WorkerData, WorkerMessage } from './worker-script.js';

/**
 * Executes an action in a new worker thread.
 * Each execution gets a fresh worker thread that loads the latest version of the action file.
 *
 * @param actionPath - Path to the action file (relative to project root or absolute)
 * @param input - Input data for the action
 * @param context - Service action context (must be serializable)
 * @returns Promise that resolves with the action result
 */
export async function runActionInWorker<
  TInputShape extends z.ZodRawShape,
  TOutputShape extends z.ZodRawShape,
>(
  serviceAction: ServiceAction<TInputShape, TOutputShape>,
  input: z.objectOutputType<TInputShape, z.ZodTypeAny, 'strip'>,
  context: ServiceActionContext,
): Promise<z.objectInputType<TOutputShape, z.ZodTypeAny, 'strip'>> {
  return new Promise((resolve, reject) => {
    const { logger, ...restContext } = context;

    // Log when a new action execution begins with input arguments
    logger.info(
      `Starting execution of action: ${serviceAction.name} with input ${JSON.stringify(input, null, 2)}`,
    );

    const worker = new Worker(
      path.join(import.meta.dirname, 'worker-script.js'),
      {
        workerData: {
          actionName: serviceAction.name,
          input,
          context: restContext,
        } satisfies WorkerData,
      },
    );

    const timeout = setTimeout(() => {
      worker.terminate().catch((err: unknown) => {
        context.logger.error(err);
      });
      reject(new Error(`Action execution timed out for ${serviceAction.name}`));
    }, 60_000); // 60 second timeout

    worker.on('message', (message) => {
      const typedMessage = message as WorkerMessage;

      if (typedMessage.type === 'log') {
        logger[typedMessage.level](typedMessage.message);
        return;
      }

      clearTimeout(timeout);

      if (typedMessage.type === 'success') {
        resolve(
          typedMessage.result as z.objectInputType<
            TOutputShape,
            z.ZodTypeAny,
            'strip'
          >,
        );
      } else {
        // Reconstruct error with stack trace
        const error = new Error(typedMessage.error.message);
        error.name = typedMessage.error.name ?? 'Error';
        error.stack = typedMessage.error.stack;
        reject(error);
      }

      worker.terminate().catch((err: unknown) => {
        context.logger.error(err);
      });
    });

    worker.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
      worker.terminate().catch((err: unknown) => {
        context.logger.error(err);
      });
    });

    worker.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(
          new Error(
            `Worker stopped with exit code ${code} for action ${serviceAction.name}`,
          ),
        );
      }
    });
  });
}
