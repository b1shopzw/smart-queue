const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branches.findMany();
  
  console.log(`Found ${branches.length} branches. Seeding admins...`);

  for (const branch of branches) {
    const empId = `ADMIN-${branch.branch_id}`;
    
    // We try to upsert the employee so we don't duplicate on rerun
    await prisma.employees.upsert({
      where: { emp_id: empId },
      update: {},
      create: {
        emp_id: empId,
        name: `Admin ${branch.bank_name.split(' ')[0]}`,
        email: `admin${branch.branch_id}@zimqueue.com`,
        role: 'BRANCH_MANAGER',
        branch_id: branch.branch_id,
        active: true,
      }
    });

    console.log(`Created admin for ${branch.bank_name}: ID => ${empId}, Name => Admin ${branch.bank_name.split(' ')[0]}`);
  }

  console.log('Finished seeding admins!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
