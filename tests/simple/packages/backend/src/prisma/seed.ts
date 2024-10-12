import { prisma } from '../services/prisma.js';

/* eslint-disable no-console */

async function main(): Promise<void> {
  try {
    // your seed script goes here
    await prisma.blogPost.createMany({
      data: [
        {
          title: 'First post',
          content: 'Hello world!',
        },
        {
          title: 'Second post',
          content: 'Goodbye world!',
        },
      ],
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
