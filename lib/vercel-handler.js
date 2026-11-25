/**
 * Shared Vercel serverless adapter.
 * Vercel can pass the function path without its /api mount, so restore it
 * before handing the request to the same Express app used locally.
 */

const app = require('../server');

module.exports = function handler(req, res) {
  let url = req.url || '/';
  const [pathname, search = ''] = url.split('?');

  // Vercel's catch-all function passes nested segments as ?path=..., e.g.
  // /api/analytics/dashboard becomes /api/analytics?path=dashboard.
  // Rebuild the original Express path before handing the request over.
  const params = new URLSearchParams(search);
  const segments = params.getAll('path');

  if (segments.length) {
    params.delete('path');
    const suffix = segments.join('/').replace(/^\/+/, '');
    const query = params.toString();
    url = `/api/${suffix}${query ? `?${query}` : ''}`;
  } else if (url === '/' || url === '' || url === '/api') {
    url = '/api';
  } else if (!url.startsWith('/api/')) {
    url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  }

  req.url = url;
  return app(req, res);
};
