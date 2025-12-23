import { loadEnvFile } from 'node:process';

loadEnvFile('.env');

export default async function setup(): Promise<void> {
  // Environment loaded
}
