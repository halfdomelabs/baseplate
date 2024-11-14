import { logger } from './console.js';

let isExiting = false;
const exitCallbacks: (() => void)[] = [];

export function onProcessExit(callback: () => void): () => void {
  exitCallbacks.push(callback);

  return () => {
    const index = exitCallbacks.indexOf(callback);
    if (index !== -1) {
      exitCallbacks.splice(index, 1);
    }
  };
}

const handleInterrupt: NodeJS.SignalsListener = (signal) => {
  logger.info(`\nReceived ${signal}, exiting...`);
  isExiting = true;
  for (const callback of exitCallbacks) callback();
};

export function isExitingProcess(): boolean {
  return isExiting;
}

process.on('SIGINT', () => {
  handleInterrupt('SIGINT');
});
process.on('SIGTERM', () => {
  handleInterrupt('SIGTERM');
});
