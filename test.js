/**
 * CampusPulse — Verification & API Test Suite
 */

const http = require('http');
const app = require('./server');

let server;
const PORT = 3001; // Use separate port for test execution

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
        }
      },
      (res) => {
        let rawData = '';
        res.on('data', chunk => rawData += chunk);
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : {};
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: rawData });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting CampusPulse REST API Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(name, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Health check
  const health = await request('GET', '/api/health');
  assert('GET /api/health returns 200 ONLINE', health.status === 200 && health.data.status === 'ONLINE');

  // 2. Team endpoint
  const team = await request('GET', '/api/team');
  assert('GET /api/team contains Akash and guide Prof. Aruna Mam', 
    team.status === 200 && team.data.team.length === 1 && team.data.team[0].name === 'Akash' && team.data.guide.name === 'Prof. Aruna Mam');

  // 3. Workstations list
  const assets = await request('GET', '/api/lab-assets');
  assert('GET /api/lab-assets returns 40 workstations', assets.status === 200 && assets.data.total === 40);

  // 4. Single workstation detail
  const pc01 = await request('GET', '/api/lab-assets/PC-01');
  assert('GET /api/lab-assets/PC-01 details match', pc01.status === 200 && pc01.data.data.tag === 'PC-01');

  // 5. Workstation allocation
  const allocRes = await request('POST', '/api/lab-assets/PC-05/allocate', {
    usn: '01FE25BCA209',
    studentName: 'Akash',
    purpose: 'SSWD Lab Prg 36 Verification'
  });
  assert('POST /api/lab-assets/PC-05/allocate succeeds', allocRes.status === 200 && allocRes.data.success);

  // 6. Workstation release
  const relRes = await request('POST', '/api/lab-assets/PC-05/release');
  assert('POST /api/lab-assets/PC-05/release succeeds', relRes.status === 200 && relRes.data.success);

  // 7. Grievance creation
  const grvRes = await request('POST', '/api/grievances', {
    workstationTag: 'PC-08',
    studentUsn: '01FE25BCA219',
    studentName: 'Student Roll #219',
    category: 'Hardware',
    priority: 'High',
    title: 'Monitor flickering during React/Express compile',
    description: 'Display drops HDMI signal at 1080p 60Hz.'
  });
  assert('POST /api/grievances logs new ticket with SLA', grvRes.status === 201 && grvRes.data.data.ticketId);
  const newTicketId = grvRes.data.data.ticketId;

  // 8. Grievance status update
  const grvUpdate = await request('PATCH', `/api/grievances/${newTicketId}/status`, {
    status: 'IN_REVIEW',
    resolutionNotes: 'HDMI cable swap initiated.'
  });
  assert('PATCH /api/grievances/:id/status updates to IN_REVIEW', grvUpdate.status === 200 && grvUpdate.data.data.status === 'IN_REVIEW');

  // 9. Digital Journal list
  const journals = await request('GET', '/api/journals');
  assert('GET /api/journals returns submissions', journals.status === 200 && journals.data.total > 0);
  const targetSubId = journals.data.data[0]._id;

  // 10. Grade Journal submission
  const gradeRes = await request('PATCH', `/api/journals/${targetSubId}/grade`, {
    marks: 10,
    comments: 'Excellent Express router architecture',
    faculty: 'Prof. Aruna Mam'
  });
  assert('PATCH /api/journals/:id/grade assigns marks and sets VERIFIED', gradeRes.status === 200 && gradeRes.data.data.status === 'VERIFIED');

  // 11. Dashboard Analytics
  const analytics = await request('GET', '/api/analytics/dashboard');
  assert('GET /api/analytics/dashboard returns full telemetry', 
    analytics.status === 200 && analytics.data.data.workstations.total === 40);

  // 12. Code Inspector
  const code = await request('GET', '/api/code-inspector');
  assert('GET /api/code-inspector returns source files', code.status === 200 && code.data.modules.length >= 3);

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

server = app.listen(PORT, () => {
  runTests().catch(err => {
    console.error('Test run failed with error:', err);
    server.close();
    process.exit(1);
  });
});
