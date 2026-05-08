import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const branches = await prisma.branches.findMany();
    console.log('Branches found:', branches.length);
    if (branches.length > 0) {
      console.log('Sample branch:', JSON.stringify(branches[0], null, 2));
    } else {
      console.log('No branches in database.');
    }
  } catch (e) {
    console.error('Query failed:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
