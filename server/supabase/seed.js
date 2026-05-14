// Seed script — run once: node supabase/seed.js
// Populates Supabase with demo users, patients, devices, alerts, and AI predictions

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import {
  MOCK_PATIENTS,
  MOCK_USERS,
  MOCK_DEVICES,
  MOCK_ALERTS,
  MOCK_PREDICTIONS,
} from '../utils/mockData.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seed() {
  console.log('🌱 Seeding PDCompanion database...\n');

  // 1. Users (with hashed passwords)
  console.log('👤 Creating users...');
  const usersToInsert = await Promise.all(
    MOCK_USERS.map(async ({ name, email, password, role }) => ({
      name,
      email,
      password_hash: await bcrypt.hash(password, 10),
      role,
    }))
  );
  const { data: users, error: userErr } = await supabase
    .from('pd_users')
    .upsert(usersToInsert, { onConflict: 'email' })
    .select();
  if (userErr) console.error('  ❌ Users:', userErr.message);
  else console.log(`  ✅ ${users.length} users created`);

  // 2. Patients (link first user as patient user)
  console.log('🧑‍⚕️ Creating patients...');
  const patientUser = users?.find((u) => u.role === 'patient');
  const patientsToInsert = MOCK_PATIENTS.map((p, i) => ({
    ...p,
    user_id: i === 0 ? patientUser?.id : null,
  }));
  const { data: patients, error: patErr } = await supabase
    .from('pd_patients')
    .upsert(patientsToInsert, { onConflict: 'id' })
    .select();
  if (patErr) console.error('  ❌ Patients:', patErr.message);
  else console.log(`  ✅ ${patients.length} patients created`);

  // 3. Devices
  console.log('📱 Creating devices...');
  const { data: devices, error: devErr } = await supabase
    .from('pd_devices')
    .upsert(MOCK_DEVICES, { onConflict: 'id' })
    .select();
  if (devErr) console.error('  ❌ Devices:', devErr.message);
  else console.log(`  ✅ ${devices.length} devices created`);

  // 4. Alerts
  console.log('🚨 Creating alerts...');
  const { data: alerts, error: altErr } = await supabase
    .from('pd_alerts')
    .insert(MOCK_ALERTS)
    .select();
  if (altErr) console.error('  ❌ Alerts:', altErr.message);
  else console.log(`  ✅ ${alerts.length} alerts created`);

  // 5. AI Predictions
  console.log('🧠 Creating AI predictions...');
  const { data: preds, error: predErr } = await supabase
    .from('pd_ai_predictions')
    .insert(MOCK_PREDICTIONS)
    .select();
  if (predErr) console.error('  ❌ Predictions:', predErr.message);
  else console.log(`  ✅ ${preds.length} predictions created`);

  console.log('\n✅ Seed complete!\n');
  console.log('Demo login credentials:');
  MOCK_USERS.forEach(({ email, password, role }) => {
    console.log(`  ${role.padEnd(12)} →  ${email}  /  ${password}`);
  });
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
