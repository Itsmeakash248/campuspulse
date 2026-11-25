#!/usr/bin/env node
/**
 * Builds the static frontend for Vercel.
 * The Express API is deployed from /api as serverless functions;
 * everything in /public becomes the static output root.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'public');
const target = path.join(root, 'dist');

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, {
  recursive: true,
  filter: (file) => !file.split(path.sep).includes('.hallmark')
});

const entries = fs.readdirSync(target);
console.log(`Built static frontend: ${entries.length} entries in dist/`);
