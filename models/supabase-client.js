/**
 * Server-only Supabase client. The service role key never reaches public/.
 */

const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

const client = env.SUPABASE_CONFIGURED
  ? createClient(env.SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: { 'X-Client-Info': 'campuspulse-sswd-server' }
      }
    })
  : null;

if (client && !env.SUPABASE_HAS_SERVICE_ROLE) {
  console.warn('[SUPABASE] SUPABASE_SERVICE_ROLE_KEY is missing; write requests may be blocked by RLS.');
}

module.exports = {
  client,
  configured: Boolean(client),
  hasServiceRole: env.SUPABASE_HAS_SERVICE_ROLE
};
