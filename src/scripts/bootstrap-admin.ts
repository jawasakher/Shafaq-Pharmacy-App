import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const phone = process.env.ADMIN_BOOTSTRAP_PHONE?.trim();

if (process.env.NODE_ENV === 'production') {
  throw new Error('Admin bootstrap is disabled in production');
}

if (!phone) {
  throw new Error('ADMIN_BOOTSTRAP_PHONE is required');
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

try {
  const user = await prisma.user.update({
    where: { phone },
    data: { role: 'ADMIN' },
    select: {
      id: true,
      phone: true,
      role: true,
    },
  });

  console.log(JSON.stringify(user));
} finally {
  await prisma.$disconnect();
}
