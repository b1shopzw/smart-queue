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
    const employees = await prisma.employees.findMany({ take: 5 });
    console.log('Employees found:', employees.length);
    console.log('Employees:', JSON.stringify(employees, null, 2));
  } catch (e) {
    console.error('Query failed:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
