/**
 * Store selector.
 * Supabase is used when SUPABASE_URL and a key are present in .env.
 * Otherwise the original in-memory seed keeps the demo runnable.
 */

const memory = require('./db');
const supabase = require('./supabase-client');
const createSupabaseStore = require('./supabase-db');

const memoryStore = {
  mode: 'memory',

  users: {
    find: async (query = {}) => memory.users.find(query),
    findById: async (id) => memory.users.findById(id)
  },

  labAssets: {
    find: async (query = {}) => memory.lab_assets.find(query),
    findById: async (id) => memory.lab_assets.findById(id),
    updateStatus: async (tag, status, details = {}) => memory.lab_assets.updateStatus(tag, status, details)
  },

  allocations: {
    find: async () => memory.asset_allocations.find(),
    create: async (data) => memory.asset_allocations.create(data),
    checkOut: async (tag) => memory.asset_allocations.checkOut(tag)
  },

  grievances: {
    find: async (query = {}) => memory.grievances.find(query),
    findById: async (id) => memory.grievances.findById(id),
    create: async (data) => memory.grievances.create(data),
    updateStatus: async (id, status, notes) => memory.grievances.updateStatus(id, status, notes)
  },

  journals: {
    find: async (query = {}) => memory.journal_submissions.find(query),
    findById: async (id) => memory.journal_submissions.findById(id),
    create: async (data) => memory.journal_submissions.create(data),
    grade: async (id, marks, comments, faculty) => memory.journal_submissions.grade(id, marks, comments, faculty)
  },

  auditLogs: {
    find: async () => memory.audit_logs.find(),
    create: async (entry) => memory.audit_logs.create(entry)
  },

  getAnalytics: async () => memory.getAnalytics()
};

const store = supabase.configured ? createSupabaseStore(supabase.client) : memoryStore;
store.mode = supabase.configured ? 'supabase' : 'memory';

module.exports = store;
