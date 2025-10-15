// @ts-nocheck

import { PrismaClient } from '$client';
import { config } from '%configServiceImports';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: config.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
