import type { AxiosError } from 'axios';

import { isAxiosError } from 'axios';

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
  if (data instanceof ArrayBuffer) return new TextDecoder('utf8').decode(data);
  if (data instanceof Buffer) return data.toString('utf8');
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
