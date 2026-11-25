#!/usr/bin/env node
/**
 * Seeds the Supabase tables from the original in-memory course-project data.
 *
 * Usage:
 *   npm run seed:supabase
 *   npm run seed:supabase -- --reset
 *
 * Prerequisites:
 *   1. Create a Supabase project.
 *   2. Run supabase/schema.sql in the Supabase SQL Editor.
 *   3. Put SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.
 */

require('../config/env');

const memory = require('../models/db');
const supabase = require('../models/supabase-client');
const {
  userToRow,
  assetToRow,
  allocationToRow,
  grievanceToRow,
  journalToRow,
  auditToRow
} = require('../models/mappers');

const reset = process.argv.includes('--reset');

async function clear(table) {
  const { error } = await supabase.client.from(table).delete().neq('id', '');
  if (error) throw new Error(`Could not clear ${table}: ${error.message}`);
}

async function upsert(table, rows) {
  if (!rows.length) {
    console.log(`  ${table}: 0 rows`);
    return;
  }

  const { error } = await supabase.client
    .from(table)
    .upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`Could not seed ${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length} rows`);
}

async function main() {
  if (!supabase.configured) {
    console.error('Supabase is not configured.');
    console.error('Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env, then retry.');
    process.exit(1);
  }

  if (!supabase.hasServiceRole) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is required to seed tables with RLS enabled.');
    process.exit(1);
  }

  console.log(`Seeding ${process.env.SUPABASE_URL}`);
  if (reset) {
    console.log('Clearing existing rows...');
    await clear('audit_logs');
    await clear('asset_allocations');
    await clear('grievances');
    await clear('journal_submissions');
    await clear('lab_assets');
    await clear('users');
  }

  console.log('Upserting seed records...');
  await upsert('users', memory.users.find({}).map(userToRow));
  await upsert('lab_assets', memory.lab_assets.find({}).map(assetToRow));
  await upsert('asset_allocations', memory.asset_allocations.find().map(allocationToRow));
  await upsert('grievances', memory.grievances.find({}).map(grievanceToRow));
  await upsert('journal_submissions', memory.journal_submissions.find({}).map(journalToRow));
  await upsert('audit_logs', memory.audit_logs.find().map(auditToRow));

  console.log('Done. Start the app with: npm start');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
