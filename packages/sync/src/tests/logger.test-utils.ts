import type { Logger, LogLevel } from '#src/utils/evented-logger.js';

export interface TestLogger extends Logger {
  getErrorOutput(): string;
  getWarnOutput(): string;
  getInfoOutput(): string;
  getDebugOutput(): string;
}

function formatMessage(messageOrObj: unknown, message?: string): string {
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
}

export function createTestLogger(): TestLogger {
  let [errorOutput, warnOutput, infoOutput, debugOutput] = Array.from({
    length: 4,
  }).fill('') as string[];

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

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] <= LOG_LEVEL_ORDER[minLevel];
}

export function createConsoleLogger(minLevel: LogLevel = 'debug'): Logger {
  return {
    error: (messageOrObj: unknown, message?: string) => {
      if (shouldLog('error', minLevel)) {
        console.error(formatMessage(messageOrObj, message));
      }
    },
    warn: (messageOrObj: string | object, message?: string) => {
      if (shouldLog('warn', minLevel)) {
        console.warn(formatMessage(messageOrObj, message));
      }
    },
    info: (messageOrObj: string | object, message?: string) => {
      if (shouldLog('info', minLevel)) {
        console.info(formatMessage(messageOrObj, message));
      }
    },
    debug: (messageOrObj: string | object, message?: string) => {
      if (shouldLog('debug', minLevel)) {
        console.debug(formatMessage(messageOrObj, message));
      }
    },
  };
}
