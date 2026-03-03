#!/usr/bin/env node

import { prisma } from '../services/prisma.js';

async function main(): Promise<void> {
  try {
    /* TPL_SEED_BODY:BLOCK */
    // any additional seed logic goes here
    await prisma.$queryRaw`SELECT 1;`;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
