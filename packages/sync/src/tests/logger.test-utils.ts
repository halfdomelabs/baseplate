import type { Logger } from '#src/utils/evented-logger.js';

export interface TestLogger extends Logger {
  getErrorOutput(): string;
  getWarnOutput(): string;
  getInfoOutput(): string;
  getDebugOutput(): string;
}

export function createTestLogger(): TestLogger {
  let [errorOutput, warnOutput, infoOutput, debugOutput] = Array.from({
    length: 4,
  }).fill('') as string[];

  const formatMessage = (messageOrObj: unknown, message?: string): string => {
    if (typeof messageOrObj === 'string') {
      return messageOrObj;
    } else if (typeof messageOrObj === 'object' && messageOrObj !== null) {
      const obj = messageOrObj as Record<string, unknown>;
      const msg =
        message ??
        (typeof obj.message === 'string'
          ? obj.message
          : typeof obj.msg === 'string'
            ? obj.msg
            : '');
      const metadata = JSON.stringify(messageOrObj);
      return msg ? `${msg} ${metadata}` : metadata;
    } else {
      return String(messageOrObj);
    }
  };

  return {
    error: (messageOrObj: unknown, message?: string) => {
      errorOutput += `${formatMessage(messageOrObj, message)}\n`;
    },
    warn: (messageOrObj: string | object, message?: string) => {
      warnOutput += `${formatMessage(messageOrObj, message)}\n`;
    },
    info: (messageOrObj: string | object, message?: string) => {
      infoOutput += `${formatMessage(messageOrObj, message)}\n`;
    },
    debug: (messageOrObj: string | object, message?: string) => {
      debugOutput += `${formatMessage(messageOrObj, message)}\n`;
    },
    getErrorOutput: () => errorOutput,
    getWarnOutput: () => warnOutput,
    getInfoOutput: () => infoOutput,
    getDebugOutput: () => debugOutput,
  };
}
