/**
 * CampusPulse — Smart Campus Lab Resource, Grievance Resolution & Digital Journal Verification Platform
 * Course: Server Side Web Development (SSWD) - BCA Semester 3
 * Institution: KLE Technological University, Hubballi
 * 
 * routes/api.js - RESTful API router implementation
 */

const express = require('express');
const router = express.Router();
const store = require('../models/store');
const gemini = require('../models/gemini');

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// Small in-memory guard so a public demo cannot drain the Gemini quota.
const aiTriageHits = new Map();

function aiTriageLimiter(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (aiTriageHits.get(key) || []).filter((time) => now - time < 60_000);

  if (recent.length >= 8) {
    return res.status(429).json({
      success: false,
      error: 'Too many AI triage requests. Wait a minute and try again.'
    });
  }

  recent.push(now);
  aiTriageHits.set(key, recent);

  if (aiTriageHits.size > 500) {
    for (const [ip, times] of aiTriageHits) {
      if (!times.some((time) => now - time < 60_000)) aiTriageHits.delete(ip);
    }
  }

  next();
}

// 0. API Index
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'CampusPulse SSWD Core API Engine',
    database: store.mode,
    endpoints: [
      'GET /api/health',
      'GET /api/team',
      'POST /api/ai/triage',
      'GET /api/lab-assets',
      'GET /api/lab-assets/:tag',
      'POST /api/lab-assets/:tag/allocate',
      'POST /api/lab-assets/:tag/release',
      'GET /api/grievances',
      'POST /api/grievances',
      'PATCH /api/grievances/:id/status',
      'GET /api/journals',
      'POST /api/journals',
      'PATCH /api/journals/:id/grade',
      'GET /api/analytics/dashboard',
      'GET /api/audit-logs',
      'GET /api/code-inspector'
    ]
  });
});

// 1. Health & Meta Information
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'CampusPulse SSWD Core API Engine',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    database: store.mode,
    university: 'KLE Technological University, Hubballi',
    lab: 'BCA Lab 302'
  });
});

// 1b. Gemini AI Incident Triage
router.post('/ai/triage', aiTriageLimiter, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const title = String(body.title || '').trim().slice(0, 300);
  const description = String(body.description || '').trim().slice(0, 4000);

  if (!title && !description) {
    return res.status(400).json({
      success: false,
      error: 'Add an incident summary or detailed symptoms before running AI triage.'
    });
  }

  if (!gemini.configured) {
    return res.status(503).json({
      success: false,
      error: 'AI triage is not configured. Add GEMINI_API_KEY to .env.'
    });
  }

  try {
    const data = await gemini.triageGrievance({
      title,
      description,
      workstationTag: String(body.workstationTag || '').trim().slice(0, 20),
      category: String(body.category || '').trim().slice(0, 20),
      priority: String(body.priority || '').trim().slice(0, 20)
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 502).json({
      success: false,
      error: error.message
    });
  }
}));

// 2. Team & Academic Profile
router.get('/team', asyncHandler(async (req, res) => {
  const students = await store.users.find({ role: 'student' });
  const faculty = await store.users.find({ role: 'faculty' });
  res.status(200).json({
    success: true,
    course: 'Server Side Web Development (SSWD)',
    courseCode: '24BCA304',
    semester: 'BCA Semester 3',
    academicYear: '2024-2025',
    institution: 'School of Computer Science & Applications, KLE Technological University, Hubballi',
    guide: faculty[0],
    team: students
  });
}));

// 3. Lab Workstations (Assets)
router.get('/lab-assets', asyncHandler(async (req, res) => {
  const { status, row } = req.query;
  let assets = await store.labAssets.find();

  if (status) {
    assets = assets.filter((a) => a.status.toLowerCase() === status.toLowerCase());
  }
  if (row) {
    assets = assets.filter((a) => a.row === parseInt(row, 10));
  }

  res.status(200).json({
    success: true,
    total: assets.length,
    data: assets
  });
}));

router.get('/lab-assets/:tag', asyncHandler(async (req, res) => {
  const asset = await store.labAssets.findById(req.params.tag.toUpperCase());
  if (!asset) {
    return res.status(404).json({ success: false, error: `Workstation ${req.params.tag} not found.` });
  }
  res.status(200).json({ success: true, data: asset });
}));

router.post('/lab-assets/:tag/allocate', asyncHandler(async (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const { usn, studentName, purpose } = req.body;

  if (!usn || !studentName) {
    return res.status(400).json({ success: false, error: 'USN and Student Name are required for seat allocation.' });
  }

  const asset = await store.labAssets.findById(tag);
  if (!asset) {
    return res.status(404).json({ success: false, error: `Workstation ${tag} not found.` });
  }

  if (asset.status === 'occupied') {
    return res.status(409).json({ success: false, error: `Workstation ${tag} is already occupied by ${asset.studentName} (${asset.assignedTo}).` });
  }

  if (asset.status === 'offline') {
    return res.status(400).json({ success: false, error: `Workstation ${tag} is currently offline for maintenance.` });
  }

  const updatedAsset = await store.labAssets.updateStatus(tag, 'occupied', {
    usn,
    studentName,
    currentProgram: purpose || 'Active SSWD Lab Session'
  });

  const allocation = await store.allocations.create({
    workstationTag: tag,
    seatNo: updatedAsset.seatNo,
    usn,
    studentName,
    sessionPurpose: purpose || 'General SSWD Laboratory Practice'
  });

  await store.auditLogs.create({
    action: 'WORKSTATION_ALLOCATED',
    actor: usn,
    details: `Seat ${tag} assigned to ${studentName}`,
    ip: req.ip || '127.0.0.1'
  });

  res.status(200).json({
    success: true,
    message: `Workstation ${tag} allocated to ${studentName} successfully.`,
    asset: updatedAsset,
    allocation
  });
}));

router.post('/lab-assets/:tag/release', asyncHandler(async (req, res) => {
  const tag = req.params.tag.toUpperCase();
  const asset = await store.labAssets.findById(tag);

  if (!asset) {
    return res.status(404).json({ success: false, error: `Workstation ${tag} not found.` });
  }

  const prevUser = asset.studentName || asset.assignedTo || 'Student';
  const updatedAsset = await store.labAssets.updateStatus(tag, 'available');
  await store.allocations.checkOut(tag);

  await store.auditLogs.create({
    action: 'WORKSTATION_RELEASED',
    actor: tag,
    details: `Seat ${tag} checked out by ${prevUser}. Restored to available status.`,
    ip: req.ip || '127.0.0.1'
  });

  res.status(200).json({
    success: true,
    message: `Workstation ${tag} released successfully.`,
    asset: updatedAsset
  });
}));

// 4. Grievance Management
router.get('/grievances', asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  let items = await store.grievances.find();

  if (status) {
    items = items.filter((g) => g.status.toUpperCase() === status.toUpperCase());
  }
  if (category) {
    items = items.filter((g) => g.category.toLowerCase() === category.toLowerCase());
  }

  res.status(200).json({
    success: true,
    total: items.length,
    data: items
  });
}));

router.post('/grievances', asyncHandler(async (req, res) => {
  const { workstationTag, studentUsn, studentName, category, priority, title, description } = req.body;

  if (!workstationTag || !studentUsn || !title || !description) {
    return res.status(400).json({
      success: false,
      error: 'workstationTag, studentUsn, title, and description are required fields.'
    });
  }

  const created = await store.grievances.create({
    workstationTag: workstationTag.toUpperCase(),
    studentUsn,
    studentName: studentName || 'Student',
    category: category || 'Hardware',
    priority: priority || 'Medium',
    title,
    description
  });

  res.status(201).json({
    success: true,
    message: `Grievance ticket ${created.ticketId} logged successfully with SLA monitoring.`,
    data: created
  });
}));

router.patch('/grievances/:id/status', asyncHandler(async (req, res) => {
  const { status, resolutionNotes } = req.body;
  const validStatuses = ['PENDING', 'IN_REVIEW', 'RESOLVED', 'CLOSED'];

  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  const updated = await store.grievances.updateStatus(req.params.id, status.toUpperCase(), resolutionNotes);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Grievance ticket not found.' });
  }

  res.status(200).json({
    success: true,
    message: `Ticket ${updated.ticketId} status updated to ${status}.`,
    data: updated
  });
}));

// 5. Digital Lab Journal Verification Desk
router.get('/journals', asyncHandler(async (req, res) => {
  const { usn, status } = req.query;
  let items = await store.journals.find();

  if (usn) {
    items = items.filter((j) => j.studentUsn === usn);
  }
  if (status) {
    items = items.filter((j) => j.status === status.toUpperCase());
  }

  res.status(200).json({
    success: true,
    total: items.length,
    data: items
  });
}));

router.post('/journals', asyncHandler(async (req, res) => {
  const { programNumber, programTitle, studentUsn, studentName, codeSnippet } = req.body;

  if (!programNumber || !studentUsn) {
    return res.status(400).json({
      success: false,
      error: 'programNumber and studentUsn are required fields.'
    });
  }

  const created = await store.journals.create({
    programNumber,
    programTitle,
    studentUsn,
    studentName: studentName || 'Student',
    codeSnippet: codeSnippet || '// SSWD Implementation'
  });

  res.status(201).json({
    success: true,
    message: `Journal submission for Program #${created.programNumber} uploaded for faculty evaluation.`,
    data: created
  });
}));

router.patch('/journals/:id/grade', asyncHandler(async (req, res) => {
  const { marks, comments, faculty } = req.body;

  if (marks === undefined || marks === null || isNaN(marks) || marks < 0 || marks > 10) {
    return res.status(400).json({
      success: false,
      error: 'Valid marks between 0 and 10 are required.'
    });
  }

  const graded = await store.journals.grade(
    req.params.id,
    parseFloat(marks),
    comments || 'Verified in Laboratory Session',
    faculty || 'Prof. Aruna Mam'
  );

  if (!graded) {
    return res.status(404).json({ success: false, error: 'Journal submission not found.' });
  }

  res.status(200).json({
    success: true,
    message: `Program #${graded.programNumber} graded successfully with ${marks}/10.`,
    data: graded
  });
}));

// 6. Analytics Dashboard Telemetry
router.get('/analytics/dashboard', asyncHandler(async (req, res) => {
  const analytics = await store.getAnalytics();
  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: analytics
  });
}));

// 7. Audit Logs
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const logs = await store.auditLogs.find();
  res.status(200).json({
    success: true,
    total: logs.length,
    data: logs
  });
}));

// 8. Source Code & Schema Exposer for Code Inspector & Academic Report
const fs = require('fs');
const path = require('path');

function readModule(relativePath) {
  try {
    return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  } catch (error) {
    return `// Unable to read ${relativePath}: ${error.message}`;
  }
}

router.get('/code-inspector', (req, res) => {
  res.status(200).json({
    success: true,
    modules: [
      {
        filename: "server.js",
        description: "Express Server Bootstrap, Environment Loading & Middleware Pipeline",
        language: "javascript",
        code: readModule('server.js')
      },
      {
        filename: "models/supabase-db.js",
        description: "Supabase Postgres Persistence Adapter & Query Layer",
        language: "javascript",
        code: readModule('models/supabase-db.js')
      },
      {
        filename: "models/mappers.js",
        description: "camelCase API Objects to snake_case Postgres Row Mapping",
        language: "javascript",
        code: readModule('models/mappers.js')
      },
      {
        filename: "models/gemini.js",
        description: "Server-only Gemini AI Triage Client & Response Normalisation",
        language: "javascript",
        code: readModule('models/gemini.js')
      },
      {
        filename: "routes/api.js",
        description: "RESTful Express Route Controllers & Parameter Validation",
        language: "javascript",
        code: readModule('routes/api.js')
      }
    ]
  });
});

module.exports = router;
