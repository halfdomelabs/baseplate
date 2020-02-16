import { hello } from '.';

test('can run tests', () => {
  // this is a test
  expect(hello).toEqual('Hello :)');
});
