/**
 * CampusPulse — Smart Campus Lab Resource, Grievance Resolution & Digital Journal Verification Platform
 * Course: Server Side Web Development (SSWD) - BCA Semester 3
 * Institution: KLE Technological University, Hubballi
 * 
 * server.js - Express Server Main Entry Point
 */

const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRouter = require('./routes/api');
const store = require('./models/store');

const app = express();
const PORT = env.PORT || 3000;

// Trust the Vercel/reverse-proxy forwarding headers for req.ip
app.set('trust proxy', 1);

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Body parsing middleware
// Vercel can hand the function an already-parsed body. Reuse it instead of
// reading the request stream a second time (which throws "stream is not readable").
const parseJson = express.json();
const parseForm = express.urlencoded({ extended: true });

app.use((req, res, next) => {
  if (req.body !== undefined && req.body !== null) return next();

  parseJson(req, res, (err) => {
    if (err) return next(err);
    parseForm(req, res, next);
  });
});

// HTTP Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount REST API Router
app.use('/api', apiRouter);

// Fallback route for Single Page Application
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Route Handler for undefined API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    requestedUrl: req.originalUrl
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[UNCAUGHT EXCEPTION]', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

// Start Express HTTP Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('================================================================');
    console.log(` CampusPulse SSWD Server running on http://localhost:${PORT}`);
    console.log(` Institution: KLE Technological University, Hubballi`);
    console.log(` Lab: BCA Lab 302 | Course: Server Side Web Development (24BCA304)`);
    console.log(` Team: Akash`);
    console.log(` Data store: ${store.mode === 'supabase' ? 'Supabase Postgres' : 'in-memory seed (add Supabase keys to .env)'}`);
    console.log('================================================================');
  });
}

module.exports = app;
