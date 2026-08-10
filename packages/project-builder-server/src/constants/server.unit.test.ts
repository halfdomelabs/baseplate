import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_SERVER_PORT, resolveServerPort } from './server.js';

describe('resolveServerPort', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.BASEPLATE_PORT;
    delete process.env.PORT_OFFSET;
    delete process.env.PORT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults to DEFAULT_SERVER_PORT', () => {
    expect(resolveServerPort()).toBe(DEFAULT_SERVER_PORT);
  });

  it('prefers the explicit port over all env vars', () => {
    process.env.BASEPLATE_PORT = '4500';
    process.env.PORT_OFFSET = '2';

    expect(resolveServerPort({ port: 4401 })).toBe(4401);
  });

  it('prefers BASEPLATE_PORT over the offset', () => {
    process.env.BASEPLATE_PORT = '4500';
    process.env.PORT_OFFSET = '2';

    expect(resolveServerPort()).toBe(4500);
  });

  it('applies PORT_OFFSET to the default port', () => {
    process.env.PORT_OFFSET = '3';

    expect(resolveServerPort()).toBe(DEFAULT_SERVER_PORT + 3);
  });

  it('ignores PORT so app env files cannot hijack the port', () => {
    process.env.PORT = '9999';

    expect(resolveServerPort()).toBe(DEFAULT_SERVER_PORT);
  });

  it('ignores a malformed PORT_OFFSET instead of returning NaN', () => {
    process.env.PORT_OFFSET = 'not-a-number';

    expect(resolveServerPort()).toBe(DEFAULT_SERVER_PORT);
  });

  it('ignores a malformed BASEPLATE_PORT instead of returning NaN', () => {
    process.env.BASEPLATE_PORT = 'not-a-number';
    process.env.PORT_OFFSET = '1';

    expect(resolveServerPort()).toBe(DEFAULT_SERVER_PORT + 1);
  });
});
