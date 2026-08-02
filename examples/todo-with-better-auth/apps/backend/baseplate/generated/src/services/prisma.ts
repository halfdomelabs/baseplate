import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';
import { getConfig } from './config.js';

const adapter = new PrismaPg({ connectionString: getConfig().DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
