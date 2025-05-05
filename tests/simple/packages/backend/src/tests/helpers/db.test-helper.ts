import { execSync } from 'child_process';
import path from 'path';

import { Prisma, PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { parse } from 'pg-connection-string';

const TEST_DATABASE_NAME = 'simple_backend_test';

export function replaceDatabase(
  connectionString: string,
  database: string,
): string {
  const { host, user, password, port } = parse(connectionString);

  return `postgresql://${user ?? ''}:${password ?? ''}@${host ?? ''}:${
    port ? port : 5432
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
      TEST_DATABASE_NAME,
    )}`;
    await prismaClient.$executeRaw`CREATE DATABASE ${Prisma.raw(
      TEST_DATABASE_NAME,
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

export async function createTestDatabaseFromTemplate(
  databaseUrl: string,
  templateDatabaseName: string,
): Promise<string> {
  const prismaClient = getTestPrisma(databaseUrl);
  const newDatabaseName = `${templateDatabaseName}-${nanoid(8)}`;

  try {
    await prismaClient.$executeRaw`CREATE DATABASE ${Prisma.raw(
      newDatabaseName,
    )} WITH TEMPLATE ${Prisma.raw(templateDatabaseName)}`;
  } finally {
    await prismaClient.$disconnect();
  }

  return replaceDatabase(databaseUrl, newDatabaseName);
}

export async function destroyTestDatabase(databaseUrl: string): Promise<void> {
  const prismaClient = getTestPrisma(databaseUrl);

  try {
    await prismaClient.$executeRaw`DROP DATABASE IF EXISTS ${Prisma.raw(
      TEST_DATABASE_NAME,
    )}`;
  } finally {
    await prismaClient.$disconnect();
  }
}
