/**
 * Shared Vercel serverless adapter.
 * Vercel can pass the function path without its /api mount, so restore it
 * before handing the request to the same Express app used locally.
 */

const app = require('../server');

module.exports = function handler(req, res) {
  const url = req.url || '/';

  if (url === '/' || url === '' || url === '/api') {
    req.url = '/api';
  } else if (!url.startsWith('/api/')) {
    req.url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  }

  return app(req, res);
};
