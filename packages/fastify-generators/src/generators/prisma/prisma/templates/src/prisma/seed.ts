#!/usr/bin/env node
// @ts-nocheck

import { prisma } from '$service';

async function main(): Promise<void> {
  try {
    TPL_SEED_BODY;
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
