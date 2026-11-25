/**
 * Loads .env before any module reads process.env.
 * Node 20.12+ ships process.loadEnvFile, so no extra dependency is needed.
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

function loadFallback(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || line.trim().startsWith('#')) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

if (fs.existsSync(envPath)) {
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envPath);
    } else {
      loadFallback(envPath);
    }
  } catch (error) {
    console.warn(`[ENV] Could not load ${envPath}: ${error.message}`);
  }
}

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
const geminiModel = (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim();

module.exports = {
  envPath,
  PORT: Number(process.env.PORT) || 3000,
  SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  SUPABASE_ANON_KEY: anonKey,
  SUPABASE_CONFIGURED: Boolean(supabaseUrl && (serviceRoleKey || anonKey)),
  SUPABASE_HAS_SERVICE_ROLE: Boolean(supabaseUrl && serviceRoleKey),
  GEMINI_API_KEY: geminiKey,
  GEMINI_MODEL: geminiModel,
  GEMINI_CONFIGURED: Boolean(geminiKey)
};
