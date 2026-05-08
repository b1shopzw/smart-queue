import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing old data...');
  // Wipe employees first because of foreign key constraint
  await prisma.employees.deleteMany({});
  await prisma.branches.deleteMany({});

  console.log('Seeding branches...');
  
  // Create CBZ banks
  const branch1 = await prisma.branches.create({
    data: {
      branch_id: 'CBZ-HRE-001',
      bank_code: 'CBZ',
      bank_name: 'CBZ Bank',
      city: 'Harare',
      suburb: 'CBD',
      lat: -17.8254,
      lng: 31.0311,
      institution_type: 'bank',
      branch_num: 1,
      active: true,
    }
  });

  const branch2 = await prisma.branches.create({
    data: {
      branch_id: 'CBZ-HRE-002',
      bank_code: 'CBZ',
      bank_name: 'CBZ Bank',
      city: 'Harare',
      suburb: 'Avondale',
      lat: -17.8000,
      lng: 31.0333,
      institution_type: 'bank',
      branch_num: 2,
      active: true,
    }
  });

  // Create Passport offices
  const branch3 = await prisma.branches.create({
    data: {
      branch_id: 'PP-HRE-001',
      bank_code: null,
      bank_name: 'Registrar General',
      city: 'Harare',
      suburb: 'Makombe Building',
      lat: -17.8290,
      lng: 31.0450,
      institution_type: 'passport',
      branch_num: 1,
      active: true,
    }
  });

  // Create National ID
  const branch4 = await prisma.branches.create({
    data: {
      branch_id: 'ID-GWE-001',
      bank_code: null,
      bank_name: 'Registrar General',
      city: 'Gweru',
      suburb: 'City Centre',
      lat: -19.4500,
      lng: 29.8167,
      institution_type: 'id_centre',
      branch_num: 1,
      active: true,
    }
  });

  console.log('Seeding employees...');

  // Create Super Admin
  await prisma.employees.create({
    data: {
      emp_id: 'SUP-001',
      name: 'Simba (Super)',
      role: 'super_admin',
      branch_id: branch1.branch_id,
      active: true,
    }
  });

  // Create Bank Admin (Sees all CBZ)
  await prisma.employees.create({
    data: {
      emp_id: 'BNK-001',
      name: 'Bank Manager S.',
      role: 'bank_admin',
      branch_id: branch1.branch_id,
      active: true,
    }
  });

  // Create Branch Admin (Sees only Avondale)
  await prisma.employees.create({
    data: {
      emp_id: 'BRN-002',
      name: 'Rutendo Chikwanda',
      role: 'branch_admin',
      branch_id: branch2.branch_id,
      active: true,
    }
  });

  // Create Passport Admin
  await prisma.employees.create({
    data: {
      emp_id: 'PASS-001',
      name: 'Passport Officer P.',
      role: 'passport_admin',
      branch_id: branch3.branch_id,
      active: true,
    }
  });

  // Create ID Admin
  await prisma.employees.create({
    data: {
      emp_id: 'ID-001',
      name: 'ID Officer G.',
      role: 'id_admin',
      branch_id: branch4.branch_id,
      active: true,
    }
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
