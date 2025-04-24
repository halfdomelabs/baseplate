// @ts-nocheck

import { prisma } from '../services/prisma.js';

/* eslint-disable no-console */

async function main(): Promise<void> {
  try {
    // your seed script goes here
    await prisma.$queryRaw`SELECT 1;`;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
