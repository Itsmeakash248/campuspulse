#!/usr/bin/env node
/**
 * Prints a connection check and row counts for the CampusPulse Supabase tables.
 * Usage: npm run check:supabase
 */

require('../config/env');

const supabase = require('../models/supabase-client');

const tables = [
  'users',
  'lab_assets',
  'asset_allocations',
  'grievances',
  'journal_submissions',
  'audit_logs'
];

async function main() {
  if (!supabase.configured) {
    console.error('Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.');
    process.exit(1);
  }

  console.log(`Project: ${process.env.SUPABASE_URL}`);

  let failed = false;
  for (const table of tables) {
    const { count, error } = await supabase.client
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      failed = true;
      console.log(`  ${table.padEnd(20)} error: ${error.message}`);
    } else {
      console.log(`  ${table.padEnd(20)} ${count} rows`);
    }
  }

  if (failed) process.exit(1);
  console.log('Supabase connection is ready.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
