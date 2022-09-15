// We need to mock Redis otherwise open connections may prevent Jest from exiting

// Require allows us to avoid using ioredis-mock types which are out of date
// eslint-disable-next-line
jest.mock('ioredis', () => require('ioredis-mock'));
