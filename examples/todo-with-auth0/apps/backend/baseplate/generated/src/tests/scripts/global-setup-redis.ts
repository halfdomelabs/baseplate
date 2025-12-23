export default function setup(): void {
  // Set Redis key prefix for test isolation
  process.env.REDIS_KEY_PREFIX = 'test:';
  console.info('Redis key prefix set to "test:" for isolation');
}
