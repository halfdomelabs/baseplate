#!/usr/bin/env node

import { prisma } from '../services/prisma.js';
import { seedInitialUser } from './seed-initial-user.js';

async function main(): Promise<void> {
  try {
    /* TPL_SEED_BODY:START */
    await seedInitialUser();
    /* TPL_SEED_BODY:END */
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
