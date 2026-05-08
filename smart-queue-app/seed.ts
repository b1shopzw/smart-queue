import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const fallbackBanks = [
  { id: '1', name: 'CBZ Bank - Harare Main', lat: -17.8248, lon: 31.0530, type: 'Bank' },
  { id: '2', name: 'Stanbic Bank - Avondale', lat: -17.7950, lon: 31.0350, type: 'Bank' },
  { id: '3', name: 'Steward Bank - Bulawayo', lat: -20.1500, lon: 28.5833, type: 'Bank' },
  { id: '4', name: 'FBC Bank - Mutare', lat: -18.9700, lon: 32.6600, type: 'Bank' },
  { id: '5', name: 'Ecobank - Gweru', lat: -19.4500, lon: 29.8167, type: 'Bank' },
  { id: '101', name: 'Makombe Building - Passport (Harare)', lat: -17.8290, lon: 31.0500, type: 'Passport' },
  { id: '102', name: 'Bulawayo Passport HQ', lat: -20.1550, lon: 28.5850, type: 'Passport' },
  { id: '103', name: 'Mutare Passport Office', lat: -18.9720, lon: 32.6630, type: 'Passport' },
  { id: '201', name: 'Market Square - ID Center (Harare)', lat: -17.8320, lon: 31.0450, type: 'National ID' },
  { id: '202', name: 'Bulawayo Civil Registry (ID)', lat: -20.1520, lon: 28.5800, type: 'National ID' },
  { id: '203', name: 'Mutare Civil Registry (ID)', lat: -18.9700, lon: 32.6600, type: 'National ID' },
];

async function seedAdmins() {
  console.log('Fetching branches...');
  const { data: branches, error: fetchErr } = await supabase.from('branches').select('*');
  if (fetchErr) {
    console.error('Error fetching branches:', fetchErr);
    return;
  }

  console.log(`Found ${branches?.length} branches. Seeding admins...`);

  for (const branch of (branches || [])) {
    const empId = `ZIM${branch.branch_id}`;
    const adminName = `Admin ${branch.bank_name.split(' ')[0]}`;

    const employee = {
      emp_id: empId,
      name: adminName,
      email: `admin${branch.branch_id}@zimqueue.com`,
      role: 'BRANCH_MANAGER',
      branch_id: branch.branch_id,
      password: 'password123', // Admin might use this, though login seems to just use ID + Name
      active: true,
    };

    // Try to select first to avoid duplicate errors if not using upsert properly
    const { data: existing } = await supabase.from('employees').select('id').eq('emp_id', empId).single();
    
    if (existing) {
      console.log(`Admin ${empId} already exists.`);
    } else {
      const { error } = await supabase.from('employees').insert(employee);
      if (error) {
        console.error('Error inserting admin', empId, error);
      } else {
        console.log(`Created admin for ${branch.bank_name}: ID => ${empId}, Name => ${adminName}`);
      }
    }
  }
  console.log('Done seeding admins.');
}

seedAdmins();
