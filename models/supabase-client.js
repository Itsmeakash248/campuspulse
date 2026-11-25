/**
 * Server-only Supabase client. The service role key never reaches public/.
 */

const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

const key = env.SUPABASE_SERVICE_ROLE_KEY;

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

module.exports = {
  client,
  configured: Boolean(client),
  hasServiceRole: env.SUPABASE_HAS_SERVICE_ROLE
};
