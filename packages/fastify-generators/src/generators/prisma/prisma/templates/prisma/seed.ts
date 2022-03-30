// @ts-nocheck

/* eslint-disable no-console */

async function main(): Promise<void> {
  try {
    // your seed script goes here
    await PRISMA_SERVICE.$queryRaw`SELECT 1;`;
  } finally {
    await PRISMA_SERVICE.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
