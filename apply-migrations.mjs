#!/usr/bin/env node

/**
 * Freebie Migrations - Display for Manual Execution
 * 
 * Supabase doesn't support programmatic SQL execution via the JS client.
 * This script displays the migrations that need to be run manually.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔗 Supabase Freebie Migrations\n');

// Read migration files
const migration1 = fs.readFileSync(path.join(__dirname, 'migrations', 'add_freebie_column.sql'), 'utf-8');
const migration2 = fs.readFileSync(path.join(__dirname, 'migrations', 'add_freebie_storage_columns.sql'), 'utf-8');

console.log('⚠️  MANUAL EXECUTION REQUIRED\n');
console.log('The Supabase JS Client does not support direct SQL execution.');
console.log('Please execute these migrations manually via the Supabase SQL Editor.\n');

console.log('📍 Steps:');
console.log('1. Open: https://supabase.com/dashboard');
console.log('2. Select your project (ofmzpgbuawtwtzgrtiwr)');
console.log('3. Click "SQL Editor"');
console.log('4. Click "New Query"');
console.log('5. Copy & paste MIGRATION 1 below, then execute');
console.log('6. Copy & paste MIGRATION 2 below, then execute\n');

console.log('═'.repeat(80));
console.log('MIGRATION 1: Add Freebie Column');
console.log('═'.repeat(80));
console.log(migration1);
console.log('\n');

console.log('═'.repeat(80));
console.log('MIGRATION 2: Add Storage and Owner Columns');
console.log('═'.repeat(80));
console.log(migration2);
console.log('\n');

console.log('═'.repeat(80));
console.log('VERIFICATION (run after migrations)');
console.log('═'.repeat(80));
console.log(`
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('is_freebie', 'max_storage_bytes', 'owner_name')
ORDER BY column_name;
`.trim());
console.log('\n');

console.log('✅ After executing migrations:');
console.log('1. Run the verification query above');
console.log('2. Should see 3 rows (is_freebie, max_storage_bytes, owner_name)');
console.log('3. Then test at: https://snapworxx.com/admin/dashboard\n');
