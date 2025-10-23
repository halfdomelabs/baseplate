#!/usr/bin/env node

import { prisma } from '../services/prisma.js';

async function main(): Promise<void> {
  try {
    // any additional seed logic goes here
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

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
