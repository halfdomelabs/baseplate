// Runs once per test file. A per-worker prefix keeps concurrent workers from
// reading each other's keys, since they share one Redis instance.
if (process.env.TEST_MODE !== 'unit') {
  const workerId = Number(process.env.VITEST_POOL_ID ?? '1');
  process.env.REDIS_KEY_PREFIX = `test:${workerId}:`;
}
