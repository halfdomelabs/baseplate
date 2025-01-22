import type { Logger } from '@src/utils/evented-logger.js';

export function createTestLogger(): Logger & {
  getErrorOutput(): string;
  getWarnOutput(): string;
  getInfoOutput(): string;
  getDebugOutput(): string;
} {
  let [errorOutput, warnOutput, infoOutput, debugOutput] = Array.from({
    length: 4,
  }).fill('') as string[];
  return {
    error: (message) => {
      errorOutput += `${String(message)}\n`;
    },
    warn: (message) => {
      warnOutput += `${String(message)}\n`;
    },
    info: (message) => {
      infoOutput += `${String(message)}\n`;
    },
    debug: (message) => {
      debugOutput += `${String(message)}\n`;
    },
    getErrorOutput: () => errorOutput,
    getWarnOutput: () => warnOutput,
    getInfoOutput: () => infoOutput,
    getDebugOutput: () => debugOutput,
  };
}
