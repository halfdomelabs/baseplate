// @ts-nocheck

import type { AxiosError, AxiosInstance } from 'axios';

import axios, { isAxiosError } from 'axios';

const originalStackSymbol = Symbol('originalStack');

interface ConfigWithOriginalStack {
  [originalStackSymbol]?: string;
}

/**
 * A workaround for https://github.com/axios/axios/issues/2387 where
 * the stack trace is lost when using axios.
 *
 * This will add the original stack trace to the axios error.
 */
export function setupAxiosBetterStackTrace(client: AxiosInstance): void {
  client.interceptors.request.use((config) => {
    // stash the stack trace
    (config as ConfigWithOriginalStack)[originalStackSymbol] =
      new Error().stack;
    return config;
  });

  client.interceptors.response.use(undefined, (err: unknown) => {
    if (isAxiosError(err)) {
      const originalStack = (err.config as ConfigWithOriginalStack)?.[
        originalStackSymbol
      ];
      err.stack = [err.stack, originalStack?.split('\n').slice(2).join('\n')]
        .filter(Boolean)
        .join('\n');
    }
    throw err;
  });
}

export const axiosClient = axios.create();

setupAxiosBetterStackTrace(axiosClient);

interface AxiosErrorInfo {
  axiosUrl?: string;
  axiosMethod?: string;
  axiosResponse?: string;
}

const MAX_AXIOS_ERROR_RESPONSE = 100;

function normalizeAxiosResponse(error: AxiosError): string | undefined {
  const data = error.response?.data;
  if (!data) return undefined;
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) return new TextDecoder('utf-8').decode(data);
  if (data instanceof Buffer) return data.toString('utf-8');
  if (
    Array.isArray(data) ||
    (typeof data === 'object' && data.constructor.name === 'Object')
  ) {
    try {
      return JSON.stringify(data);
    } catch {
      return '<unserializable>';
    }
  }
  return `<${typeof data === 'object' ? data.constructor.name : typeof data}>`;
}

export function getAxiosErrorInfo(error: unknown): AxiosErrorInfo | undefined {
  if (!isAxiosError(error)) return undefined;
  return {
    axiosUrl: error.config?.url,
    axiosMethod: error.config?.method,
    axiosResponse: normalizeAxiosResponse(error)?.slice(
      0,
      MAX_AXIOS_ERROR_RESPONSE,
    ),
  };
}
