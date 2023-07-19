// @ts-nocheck

import { execSync } from 'child_process';
import path from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { parse } from 'pg-connection-string';

const TEST_DATABASE_NAME = 'TEST_DATABASE_NAME_VALUE';

export function replaceDatabase(
  connectionString: string,
  database: string
): string {
  const { host, user = '', password = '', port } = parse(connectionString);

  return `postgresql://${user || ''}:${password || ''}@${host || ''}:${
    port || 5432
  }/${database}`;
}

export function getTestPrisma(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
}

export async function createTestDatabase(databaseUrl: string): Promise<string> {
  const prismaClient = getTestPrisma(databaseUrl);

  try {
    await prismaClient.$executeRaw`DROP DATABASE IF EXISTS ${Prisma.raw(
      TEST_DATABASE_NAME
    )}`;
    await prismaClient.$executeRaw`CREATE DATABASE ${Prisma.raw(
      TEST_DATABASE_NAME
    )}`;
  } finally {
    await prismaClient.$disconnect();
  }

  const testDatabaseUrl = replaceDatabase(databaseUrl, TEST_DATABASE_NAME);

  execSync('pnpm prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../../../'),
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
    },
  });

  return testDatabaseUrl;
}

export async function destroyTestDatabase(databaseUrl: string): Promise<void> {
  const prismaClient = getTestPrisma(databaseUrl);

  try {
    await prismaClient.$executeRaw`DROP DATABASE IF EXISTS ${Prisma.raw(
      TEST_DATABASE_NAME
    )}`;
  } finally {
    await prismaClient.$disconnect();
  }
}
