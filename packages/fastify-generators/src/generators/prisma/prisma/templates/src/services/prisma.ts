// @ts-nocheck

import { PrismaClient } from '$client';
import { getConfig } from '%configServiceImports';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: getConfig().DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
