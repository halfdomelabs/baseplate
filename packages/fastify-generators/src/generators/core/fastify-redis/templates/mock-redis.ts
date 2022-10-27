// @ts-nocheck
import Redis from 'ioredis';

// We need to mock Redis otherwise open connections may prevent Jest from exiting

// Require allows us to avoid using ioredis-mock types which are out of date

// eslint-disable-next-line
const IoRedisMock = require('ioredis-mock') as new (
  ...args: unknown[]
) => Redis;

class IoRedisMockAugmented extends IoRedisMock {
  constructor(...args: unknown[]) {
    super(...args);

    // add options object to maintain compatability with IoRedis
    this.options = {};

    // slight hack to bump mock Redis version to v6
    const originalInfo = this.info.bind(this);
    this.info = async (): Promise<string> => {
      const infoResult = await originalInfo();
      return infoResult.replace(/redis_version:[0-9.]+/, 'redis_version:6.2.7');
    };
  }
}

Object.keys(IoRedisMock).forEach((key) => {
  (IoRedisMockAugmented as unknown as Record<string, unknown>)[key] = (
    IoRedisMock as unknown as Record<string, unknown>
  )[key];
});

jest.mock('ioredis', () => IoRedisMockAugmented);
