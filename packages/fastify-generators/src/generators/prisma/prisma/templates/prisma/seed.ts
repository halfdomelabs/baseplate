// @ts-nocheck

import { prisma } from '../services/prisma.js';

async function main(): Promise<void> {
  try {
    // your seed script goes here
    await prisma.$queryRaw`SELECT 1;`;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
