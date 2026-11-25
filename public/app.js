/**
 * CampusPulse, smart campus lab resource, grievance resolution and digital journal platform
 * Course: Server Side Web Development (SSWD), BCA Semester 3
 * Institution: KLE Technological University, Hubballi
 *
 * public/app.js, frontend controller and live console behaviour
 */

// Application state
const state = {
  currentMode: 'interactive', // 'interactive' | 'report'
  currentTab: 'lab-grid',
  assets: [],
  grievances: [],
  journals: [],
  analytics: null,
  codeModules: [],
  selectedAsset: null,
  charts: {},
  workstationFilter: 'all',
  journalFilter: 'all',
  codeIndex: 0,
  lastFocused: null
};

const STATUS_ORDER = ['available', 'occupied', 'maintenance', 'offline'];
const STATUS_LABELS = {
  available: 'Available',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
  offline: 'Offline'
};
const STATUS_TEXT = {
  PENDING: 'Pending',
  IN_REVIEW: 'In review',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  SUBMITTED: 'Submitted',
  VERIFIED: 'Verified'
};
const formatStatus = (status) => STATUS_TEXT[status] || status;
const CATEGORY_ORDER = ['Hardware', 'Software', 'Network', 'Peripheral', 'Power'];
const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
const RELEASE_DISARM_MS = 4000;

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupModals();
  setupFilters();
  setupHelpNotes();
  setupReportControls();
  setupConsoleActions();
  await refreshAllData();
  initCharts();
  updateCharts();
  renderCodeInspector();
  checkApiHealth();
  window.setInterval(checkApiHealth, 30000);
});

// API helper, keeps error messages readable for the toast layer
async function fetchJson(url, options) {
  const response = await fetch(url, options);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload || payload.success === false) {
    const message = payload && payload.error
      ? payload.error
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

// Navigation: view mode, indexed tabs, keyboard support
function setupNavigation() {
  const btnInteractive = document.getElementById('btn-mode-interactive');
  const btnReport = document.getElementById('btn-mode-report');
  const containerInteractive = document.getElementById('interactive-mode-container');
  const containerReport = document.getElementById('report-mode-container');
  const tabLinks = Array.from(document.querySelectorAll('.tab-link'));

  const setMode = (mode) => {
    const isReport = mode === 'report';
    state.currentMode = mode;

    if (btnInteractive) {
      btnInteractive.classList.toggle('active', !isReport);
      btnInteractive.setAttribute('aria-pressed', String(!isReport));
    }
    if (btnReport) {
      btnReport.classList.toggle('active', isReport);
      btnReport.setAttribute('aria-pressed', String(isReport));
    }
    if (containerInteractive) containerInteractive.hidden = isReport;
    if (containerReport) containerReport.hidden = !isReport;

    document.body.classList.toggle('mode-report', isReport);
    document.body.classList.toggle('mode-interactive', !isReport);

    if (isReport) {
      window.scrollTo({ top: 0, behavior: PREFERS_REDUCED_MOTION.matches ? 'auto' : 'smooth' });
    }
  };

  if (btnInteractive) btnInteractive.addEventListener('click', () => setMode('interactive'));
  if (btnReport) btnReport.addEventListener('click', () => setMode('report'));

  const activateTab = (tabId, shouldFocus) => {
    const targetLink = tabLinks.find((link) => link.dataset.tab === tabId);
    if (!targetLink) return;

    tabLinks.forEach((link) => {
      const selected = link === targetLink;
      link.classList.toggle('active', selected);
      link.setAttribute('aria-selected', String(selected));
      link.tabIndex = selected ? 0 : -1;
    });

    document.querySelectorAll('.tab-content-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === tabId);
    });

    state.currentTab = tabId.replace(/^tab-/, '');

    if (tabId === 'tab-analytics') {
      updateCharts();
      window.requestAnimationFrame(() => {
        Object.values(state.charts).forEach((chart) => chart && chart.resize());
      });
    }

    if (shouldFocus) targetLink.focus();
  };

  tabLinks.forEach((link, index) => {
    link.addEventListener('click', () => activateTab(link.dataset.tab, false));
    link.addEventListener('keydown', (event) => {
      let nextIndex = null;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabLinks.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabLinks.length) % tabLinks.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabLinks.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      activateTab(tabLinks[nextIndex].dataset.tab, true);
    });
  });

  // In-page buttons that jump to a panel
  document.querySelectorAll('[data-goto-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-goto-tab');
      activateTab(tabId, false);
      const target = document.getElementById(tabId);
      if (target) {
        target.scrollIntoView({ behavior: PREFERS_REDUCED_MOTION.matches ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });
}

// Fetch every collection from the REST API
async function refreshAllData(options = {}) {
  const announce = options.announce === true;
  const requests = [
    ['assets', '/api/lab-assets'],
    ['grievances', '/api/grievances'],
    ['journals', '/api/journals'],
    ['analytics', '/api/analytics/dashboard'],
    ['code', '/api/code-inspector']
  ];

  const results = await Promise.allSettled(requests.map(([, url]) => fetchJson(url)));
  const failures = [];

  results.forEach((result, index) => {
    const key = requests[index][0];
    if (result.status === 'rejected') {
      failures.push(`${key}: ${result.reason.message}`);
      return;
    }
    const payload = result.value;
    if (key === 'assets') state.assets = Array.isArray(payload.data) ? payload.data : [];
    if (key === 'grievances') state.grievances = Array.isArray(payload.data) ? payload.data : [];
    if (key === 'journals') state.journals = Array.isArray(payload.data) ? payload.data : [];
    if (key === 'analytics') state.analytics = payload.data || null;
    if (key === 'code') state.codeModules = Array.isArray(payload.modules) ? payload.modules : [];
  });

  updateKpis();
  renderBoard();
  renderWorkstationGrid();
  renderGrievanceTable();
  renderJournalTable();
  updateFilterCounts();
  applyWorkstationFilter();
  applyJournalFilter();
  updateCharts();

  if (failures.length) {
    setLastSync(null);
    if (announce) showToast(`Some records could not be refreshed. ${failures[0]}`, 'error');
    console.error('CampusPulse API refresh failed:', failures);
    return false;
  }

  setLastSync(new Date());
  if (announce) showToast('Telemetry refreshed from the Express API.', 'success');
  return true;
}

function countWorkstations() {
  const counts = { total: state.assets.length || 40, available: 0, occupied: 0, maintenance: 0, offline: 0, utilizationRate: 0 };
  state.assets.forEach((asset) => {
    if (Object.prototype.hasOwnProperty.call(counts, asset.status)) counts[asset.status] += 1;
  });
  counts.utilizationRate = counts.total
    ? Math.round((counts.occupied / counts.total) * 100)
    : 0;
  return counts;
}

function summarizeGrievances() {
  const summary = { total: state.grievances.length, pending: 0, inReview: 0, resolved: 0, categories: {} };
  CATEGORY_ORDER.forEach((category) => { summary.categories[category] = 0; });
  state.grievances.forEach((ticket) => {
    if (ticket.status === 'PENDING') summary.pending += 1;
    if (ticket.status === 'IN_REVIEW') summary.inReview += 1;
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') summary.resolved += 1;
    if (Object.prototype.hasOwnProperty.call(summary.categories, ticket.category)) {
      summary.categories[ticket.category] += 1;
    }
  });
  return summary;
}

function summarizeJournals() {
  const verified = state.journals.filter((submission) => submission.status === 'VERIFIED').length;
  const scores = state.journals
    .map((submission) => Number(submission.plagiarismScore))
    .filter((score) => Number.isFinite(score));
  const average = scores.length
    ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
    : '0.0';
  return {
    totalSubmissions: state.journals.length,
    verifiedSubmissions: verified,
    averagePlagiarism: `${average}%`
  };
}

// KPI counters and live console board
function updateKpis() {
  const workstations = state.analytics && state.analytics.workstations
    ? state.analytics.workstations
    : countWorkstations();
  const grievances = state.analytics && state.analytics.grievances
    ? state.analytics.grievances
    : summarizeGrievances();
  const journals = state.analytics && state.analytics.journals
    ? state.analytics.journals
    : summarizeJournals();

  setText('kpi-workstations', `${workstations.occupied} / ${workstations.total}`);
  setText('kpi-utilization', `${workstations.utilizationRate}% of seats in use`);
  setText('kpi-grievances', `${grievances.pending + grievances.inReview} active`);
  setText('kpi-resolved-grv', `${grievances.resolved} of ${grievances.total} resolved`);
  setText('kpi-journals', `${journals.verifiedSubmissions} verified`);
  setText('kpi-journal-plagiarism', `Average similarity ${journals.averagePlagiarism}`);
}

function renderBoard() {
  const workstations = state.analytics && state.analytics.workstations
    ? state.analytics.workstations
    : countWorkstations();

  setText('console-total', `${workstations.total} seats`);
  setText('console-util', `${workstations.utilizationRate}% in use`);
  setText('hero-in-use', workstations.occupied);
  setText('hero-attention', workstations.maintenance);
  setText('hero-offline', workstations.offline);
  setText('hero-free', workstations.available);

  STATUS_ORDER.forEach((status) => {
    setText(`board-${status}`, workstations[status]);
    const segment = document.querySelector(`#status-spectrum [data-status="${status}"]`);
    if (!segment) return;
    const value = Number(workstations[status]) || 0;
    segment.hidden = value === 0;
    segment.style.flexGrow = String(value);
    segment.title = `${value} ${STATUS_LABELS[status].toLowerCase()}`;
  });

  const spectrum = document.getElementById('status-spectrum');
  if (spectrum) {
    spectrum.setAttribute(
      'aria-label',
      `${workstations.available} available, ${workstations.occupied} occupied, ${workstations.maintenance} in maintenance and ${workstations.offline} offline out of ${workstations.total} seats`
    );
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
}

function setLastSync(value) {
  const element = document.getElementById('last-sync');
  if (!element) return;
  if (!value) {
    element.textContent = 'Sync failed, retrying on the next refresh';
    element.removeAttribute('title');
    return;
  }
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  element.textContent = `Synced ${formatter.format(value)}`;
  element.title = value.toLocaleString();
}

// 40 workstation floor map
function renderWorkstationGrid() {
  const gridContainer = document.getElementById('workstation-grid');
  if (!gridContainer) return;
  gridContainer.innerHTML = '';

  if (!state.assets.length) {
    const empty = document.createElement('p');
    empty.className = 'grid-empty';
    empty.textContent = 'No workstation records were returned by the API.';
    gridContainer.appendChild(empty);
    return;
  }

  state.assets.forEach((asset) => {
    const card = document.createElement('button');
    const label = STATUS_LABELS[asset.status] || asset.status;
    card.type = 'button';
    card.className = `pc-node status-${asset.status}`;
    card.dataset.tag = asset.tag;
    card.dataset.status = asset.status;
    card.setAttribute('aria-label', `${asset.tag}, seat ${asset.seatNo}, ${label}${asset.studentName ? `, assigned to ${asset.studentName}` : ''}`);
    card.title = `${asset.tag}, ${label}`;

    let occupant = 'Open seat';
    if (asset.status === 'occupied' && asset.studentName) {
      const parts = asset.studentName.trim().split(/\s+/);
      occupant = asset.studentName.length <= 14
        ? asset.studentName
        : `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    if (asset.status === 'maintenance') occupant = 'Service window';
    if (asset.status === 'offline') occupant = 'Out of service';

    card.innerHTML = `
      <span class="pc-top">
        <span class="pc-seat">${escapeHtml(String(asset.seatNo).padStart(2, '0'))}</span>
        <span class="pc-state">${escapeHtml(label)}</span>
      </span>
      <span class="pc-tag">${escapeHtml(asset.tag)}</span>
      <span class="pc-user" title="${escapeHtml(occupant)}">${escapeHtml(occupant)}</span>
    `;

    card.addEventListener('click', () => openWorkstationModal(asset.tag));
    gridContainer.appendChild(card);
  });
}

// Workstation modal, allocation and release
function openWorkstationModal(tag) {
  const asset = state.assets.find((item) => item.tag === tag);
  if (!asset) return;
  state.selectedAsset = asset;

  const modal = document.getElementById('modal-workstation');
  if (!modal) return;

  setText('modal-pc-tag', asset.tag);
  setText('modal-pc-sub', `Seat ${asset.seatNo}. Hardware and allocation profile`);
  const statusElement = document.getElementById('modal-pc-status');
  if (statusElement) {
    statusElement.textContent = STATUS_LABELS[asset.status] || asset.status;
    statusElement.className = `status-${asset.status}`;
  }
  setText('modal-pc-ip', asset.ipAddress || 'Not reported');
  setText('modal-pc-specs', `${asset.specs.cpu} | ${asset.specs.ram} | ${asset.specs.os}`);
  setText('modal-pc-user', asset.studentName ? `${asset.studentName} (${asset.assignedTo})` : 'Unassigned');
  setText('modal-pc-program', asset.currentProgram || 'Idle');

  const allocForm = document.getElementById('form-allocate-workstation');
  const releaseBtn = document.getElementById('btn-release-workstation');
  const unavailableNote = document.getElementById('modal-unavailable');

  if (allocForm) allocForm.hidden = asset.status !== 'available';
  if (releaseBtn) {
    releaseBtn.hidden = asset.status !== 'occupied';
    releaseBtn.disabled = false;
    disarmRelease();
  }
  if (unavailableNote) unavailableNote.hidden = asset.status !== 'maintenance' && asset.status !== 'offline';

  openModal(modal, asset.status === 'occupied' ? '#btn-release-workstation' : '#alloc-usn');
}

// Grievance table and status control
function renderGrievanceTable() {
  const tbody = document.getElementById('grievance-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!state.grievances.length) {
    tbody.innerHTML = '<tr><td colspan="8"><span class="grid-empty">No grievance tickets are in the ledger.</span></td></tr>';
    setText('grievance-summary', 'No grievance tickets logged yet.');
    return;
  }

  state.grievances.forEach((ticket) => {
    const tr = document.createElement('tr');
    const priorityClass = `badge-${String(ticket.priority).toLowerCase()}`;
    const statusClass = `badge-${String(ticket.status).toLowerCase()}`;
    const elapsed = Number(ticket.elapsedMinutes) || 0;
    const slaMinutes = Number(ticket.slaMinutes) || 240;
    const slaPercent = Math.min(100, Math.round((elapsed / slaMinutes) * 100));
    const slaTone = slaPercent >= 80 ? 'bad' : slaPercent >= 50 ? 'warn' : 'ok';
    const description = ticket.description.length > 64
      ? `${ticket.description.slice(0, 64)}...`
      : ticket.description;

    tr.innerHTML = `
      <td data-label="Ticket ID"><strong>${escapeHtml(ticket.ticketId)}</strong></td>
      <td data-label="Seat tag"><code>${escapeHtml(ticket.workstationTag)}</code></td>
      <td data-label="Student">
        <span class="cell-title">${escapeHtml(ticket.studentName)}</span>
        <span class="cell-muted">${escapeHtml(ticket.studentUsn)}</span>
      </td>
      <td data-label="Priority"><span class="badge ${priorityClass}">${escapeHtml(ticket.priority)}</span></td>
      <td data-label="Issue summary">
        <span class="cell-title">${escapeHtml(ticket.title)}</span>
        <span class="cell-muted">${escapeHtml(ticket.category)}: ${escapeHtml(description)}</span>
      </td>
      <td data-label="Status"><span class="badge ${statusClass}">${escapeHtml(formatStatus(ticket.status))}</span></td>
      <td data-label="SLA" class="sla">
        <span class="sla-text">${elapsed} of ${slaMinutes} min</span>
        <span class="sla-track"><span class="sla-fill" data-tone="${slaTone}" style="--sla:${slaPercent}%"></span></span>
      </td>
      <td data-label="Triage action">
        <select class="form-control compact status-select" data-ticket-id="${escapeHtml(ticket.ticketId)}" data-previous="${escapeHtml(ticket.status)}" aria-label="Triage action for ${escapeHtml(ticket.ticketId)}">
          <option value="PENDING"${ticket.status === 'PENDING' ? ' selected' : ''}>Pending</option>
          <option value="IN_REVIEW"${ticket.status === 'IN_REVIEW' ? ' selected' : ''}>In review</option>
          <option value="RESOLVED"${ticket.status === 'RESOLVED' ? ' selected' : ''}>Resolved</option>
          <option value="CLOSED"${ticket.status === 'CLOSED' ? ' selected' : ''}>Closed</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const active = state.grievances.filter((ticket) => ticket.status === 'PENDING' || ticket.status === 'IN_REVIEW').length;
  const resolved = state.grievances.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length;
  setText('grievance-summary', `${state.grievances.length} tickets logged, ${active} active and ${resolved} resolved. SLA windows run 60, 120 and 240 minutes.`);

  tbody.onchange = (event) => {
    const select = event.target.closest('select[data-ticket-id]');
    if (!select) return;
    window.updateTicketStatus(select.dataset.ticketId, select.value, select);
  };
}

// Update grievance status action
window.updateTicketStatus = async function updateTicketStatus(ticketId, newStatus, selectElement) {
  const select = selectElement || null;
  if (select) select.disabled = true;

  try {
    await fetchJson(`/api/grievances/${encodeURIComponent(ticketId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        resolutionNotes: `Status changed to ${formatStatus(newStatus)} via the Lab Triage Desk.`
      })
    });
    await refreshAllData();
    showToast(`Ticket ${ticketId} moved to ${formatStatus(newStatus)}.`, 'success');
  } catch (error) {
    if (select) {
      select.value = select.dataset.previous || select.value;
      select.disabled = false;
    }
    showToast(error.message, 'error');
  }
};

// Digital lab journal table
function renderJournalTable() {
  const tbody = document.getElementById('journal-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!state.journals.length) {
    tbody.innerHTML = '<tr><td colspan="7"><span class="grid-empty">No journal submissions are in the ledger.</span></td></tr>';
    setText('journal-summary', 'No journal submissions logged yet.');
    return;
  }

  state.journals.forEach((submission) => {
    const tr = document.createElement('tr');
    const verified = submission.status === 'VERIFIED';
    const score = Math.min(100, Math.max(0, Number(submission.plagiarismScore) || 0));
    const scoreTone = score >= 20 ? 'bad' : score >= 10 ? 'warn' : 'ok';
    const marks = submission.marksAwarded !== null
      ? `${submission.marksAwarded} / 10`
      : '<span class="badge badge-pending">Pending</span>';

    tr.dataset.status = verified ? 'verified' : 'pending';

    tr.innerHTML = `
      <td data-label="Program"><strong>Program #${escapeHtml(submission.programNumber)}</strong></td>
      <td data-label="Title and module"><span class="cell-title">${escapeHtml(submission.programTitle)}</span></td>
      <td data-label="Student">
        <span class="cell-title">${escapeHtml(submission.studentName)}</span>
        <span class="cell-muted">${escapeHtml(submission.studentUsn)}</span>
      </td>
      <td data-label="Similarity">
        <span class="similarity">
          <span class="similarity-value">${escapeHtml(submission.plagiarismScore)}%</span>
          <span class="similarity-track"><span class="similarity-fill" data-tone="${scoreTone}" style="--score:${score}%"></span></span>
        </span>
      </td>
      <td data-label="Marks (out of 10)"><strong>${marks}</strong></td>
      <td data-label="Evaluation status">
        <span class="badge ${verified ? 'badge-resolved' : 'badge-pending'}">${escapeHtml(formatStatus(submission.status))}</span>
      </td>
      <td data-label="Action">
        <button class="btn btn-secondary btn-small" type="button" data-grade-id="${escapeHtml(submission._id)}" data-grade-name="${escapeHtml(submission.studentName)}" data-grade-program="${escapeHtml(submission.programNumber)}" aria-label="${verified ? 'Review' : 'Grade'} viva for Program ${escapeHtml(submission.programNumber)}, ${escapeHtml(submission.studentName)}">
          ${verified ? 'Review viva' : 'Grade viva'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const verifiedCount = state.journals.filter((submission) => submission.status === 'VERIFIED').length;
  const pendingCount = state.journals.length - verifiedCount;
  setText('journal-summary', `${state.journals.length} submissions, ${verifiedCount} verified and ${pendingCount} awaiting viva.`);

  tbody.onclick = (event) => {
    const button = event.target.closest('button[data-grade-id]');
    if (!button) return;
    window.openGradeModal(button.dataset.gradeId, button.dataset.gradeName, button.dataset.gradeProgram);
  };
}

// Grade modal
window.openGradeModal = function openGradeModal(subId, studentName, prgNum) {
  const modal = document.getElementById('modal-grade');
  if (!modal) return;

  const submission = state.journals.find((item) => item._id === subId);
  document.getElementById('grade-sub-id').value = subId;
  setText('grade-sub-info', `Evaluating Program #${prgNum} for ${studentName}`);

  const marksInput = document.getElementById('grade-marks');
  const commentsInput = document.getElementById('grade-comments');
  if (marksInput) marksInput.value = submission && submission.marksAwarded !== null ? submission.marksAwarded : '';
  if (commentsInput) commentsInput.value = submission && submission.comments ? submission.comments : '';

  openModal(modal, '#grade-marks');
};

// Help notes, filters and console controls
function setupHelpNotes() {
  const bindToggle = (buttonId, noteId) => {
    const button = document.getElementById(buttonId);
    const note = document.getElementById(noteId);
    if (!button || !note) return;
    button.addEventListener('click', () => {
      const isOpen = !note.hidden;
      note.hidden = isOpen;
      button.setAttribute('aria-expanded', String(!isOpen));
    });
  };

  bindToggle('btn-help-allocate', 'allocate-note');
  bindToggle('btn-help-grading', 'grading-note');
}

function setupFilters() {
  const workstationFilter = document.getElementById('workstation-filter');
  if (workstationFilter) {
    workstationFilter.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-filter]');
      if (!button) return;
      state.workstationFilter = button.dataset.filter;
      workstationFilter.querySelectorAll('button[data-filter]').forEach((chip) => {
        const active = chip === button;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-pressed', String(active));
      });
      applyWorkstationFilter();
    });
  }

  const journalFilter = document.getElementById('journal-filter');
  if (journalFilter) {
    journalFilter.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-journal-filter]');
      if (!button) return;
      state.journalFilter = button.dataset.journalFilter;
      journalFilter.querySelectorAll('button[data-journal-filter]').forEach((chip) => {
        const active = chip === button;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-pressed', String(active));
      });
      applyJournalFilter();
    });
  }
}

function updateFilterCounts() {
  const workstationFilter = document.getElementById('workstation-filter');
  if (workstationFilter) {
    const counts = countWorkstations();
    const all = workstationFilter.querySelector('[data-count="all"]');
    if (all) all.textContent = String(counts.total);
    STATUS_ORDER.forEach((status) => {
      const node = workstationFilter.querySelector(`[data-count="${status}"]`);
      if (node) node.textContent = String(counts[status]);
    });
  }

  const journalFilter = document.getElementById('journal-filter');
  if (journalFilter) {
    const verified = state.journals.filter((submission) => submission.status === 'VERIFIED').length;
    const all = journalFilter.querySelector('[data-count="all"]');
    const verifiedNode = journalFilter.querySelector('[data-count="verified"]');
    const pendingNode = journalFilter.querySelector('[data-count="pending"]');
    if (all) all.textContent = String(state.journals.length);
    if (verifiedNode) verifiedNode.textContent = String(verified);
    if (pendingNode) pendingNode.textContent = String(state.journals.length - verified);
  }
}

function applyWorkstationFilter() {
  const grid = document.getElementById('workstation-grid');
  const status = document.getElementById('lab-filter-status');
  if (!grid) return;

  let shown = 0;
  grid.querySelectorAll('.pc-node').forEach((card) => {
    const visible = state.workstationFilter === 'all' || card.dataset.status === state.workstationFilter;
    card.hidden = !visible;
    if (visible) shown += 1;
  });

  if (status) {
    status.textContent = state.workstationFilter === 'all'
      ? `Showing all ${shown} seats`
      : `Showing ${shown} ${state.workstationFilter} ${shown === 1 ? 'seat' : 'seats'}`;
  }
}

function applyJournalFilter() {
  const tbody = document.getElementById('journal-table-body');
  if (!tbody) return;

  tbody.querySelectorAll('tr[data-status]').forEach((row) => {
    row.hidden = state.journalFilter !== 'all' && row.dataset.status !== state.journalFilter;
  });
}

function setupConsoleActions() {
  const refreshButton = document.getElementById('btn-refresh-data');
  if (!refreshButton) return;

  refreshButton.addEventListener('click', async () => {
    refreshButton.disabled = true;
    refreshButton.setAttribute('aria-busy', 'true');

    const labShell = document.getElementById('lab-shell');
    if (labShell) {
      labShell.classList.remove('is-sweeping');
      // Restart the sweep animation on every refresh
      void labShell.offsetWidth;
      labShell.classList.add('is-sweeping');
      window.setTimeout(() => labShell.classList.remove('is-sweeping'), 1500);
    }

    await refreshAllData({ announce: true });
    await checkApiHealth();

    refreshButton.disabled = false;
    refreshButton.removeAttribute('aria-busy');
  });
}

// API health indicator
async function checkApiHealth() {
  const status = document.getElementById('api-status');
  const text = document.getElementById('api-status-text');
  const detail = document.getElementById('api-status-detail');
  if (!status || !text) return;

  status.dataset.state = 'connecting';
  text.textContent = 'Connecting';
  if (detail) detail.textContent = 'Express API';

  try {
    const response = await fetch('/api/health', {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    const payload = await response.json();
    if (!response.ok || payload.status !== 'ONLINE') throw new Error('API is not online');

    status.dataset.state = 'online';
    text.textContent = 'API online';
    const dataStore = payload.database === 'supabase' ? 'Supabase' : 'in-memory store';
    if (detail) detail.textContent = dataStore;
    status.title = `${payload.service}. Data store: ${dataStore}. Uptime ${Math.round(payload.uptime)} seconds.`;
  } catch {
    status.dataset.state = 'offline';
    text.textContent = 'API offline';
    if (detail) detail.textContent = 'No response';
    status.title = 'The Express API did not answer the health check.';
  }
}

// Toast layer, replaces browser alerts
function showToast(message, type = 'info') {
  const region = document.getElementById('toast-region');
  if (!region) return;

  while (region.children.length >= 3) {
    region.firstElementChild.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const copy = document.createElement('p');
  copy.className = 'toast-message';
  copy.textContent = message;

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'toast-close';
  close.setAttribute('aria-label', 'Dismiss notification');
  close.innerHTML = '<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M5 5l10 10"></path><path d="M15 5L5 15"></path></svg>';

  const dismiss = () => {
    window.clearTimeout(timer);
    toast.remove();
  };
  const timer = window.setTimeout(dismiss, 6000);

  close.addEventListener('click', dismiss);
  toast.append(copy, close);
  region.append(toast);
}

// Modals, forms, focus management
function openModal(modal, focusSelector) {
  if (!modal) return;
  state.lastFocused = document.activeElement;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-modal');

  window.setTimeout(() => {
    const target = (focusSelector && modal.querySelector(focusSelector)) || modal.querySelector('.modal-close');
    if (target) target.focus();
  }, 30);
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal-overlay.active')) {
    document.body.classList.remove('has-modal');
  }
  if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
    state.lastFocused.focus();
  }
  state.lastFocused = null;
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach((modal) => closeModal(modal));
}

function disarmRelease() {
  const button = document.getElementById('btn-release-workstation');
  const label = document.getElementById('release-label');
  if (!button || !label) return;
  button.dataset.armed = 'false';
  label.textContent = 'Check out and release seat';
  if (button.releaseTimer) {
    window.clearTimeout(button.releaseTimer);
    button.releaseTimer = null;
  }
}

function clearAiTriage() {
  const panel = document.getElementById('ai-triage-result');
  if (!panel) return;
  panel.hidden = true;
  panel.replaceChildren();
}

function renderAiTriage(result) {
  const panel = document.getElementById('ai-triage-result');
  if (!panel) return;

  panel.replaceChildren();

  const meta = document.createElement('div');
  meta.className = 'ai-triage-meta';

  const priority = document.createElement('span');
  priority.className = `badge badge-${String(result.priority).toLowerCase()}`;
  priority.textContent = `${result.priority} priority`;

  const category = document.createElement('span');
  category.className = 'ai-triage-chip';
  category.textContent = result.category;

  const sla = document.createElement('span');
  sla.className = 'ai-triage-chip';
  sla.textContent = `SLA ${result.slaMinutes} min`;

  meta.append(priority, category, sla);

  const summary = document.createElement('p');
  summary.className = 'ai-triage-summary';
  summary.textContent = result.summary;

  panel.append(meta, summary);

  if (Array.isArray(result.suggestedActions) && result.suggestedActions.length) {
    const steps = document.createElement('ol');
    steps.className = 'ai-triage-steps';
    result.suggestedActions.forEach((step) => {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    });
    panel.append(steps);
  }

  const source = document.createElement('p');
  source.className = 'ai-triage-source';
  source.textContent = `${result.model} · review before dispatch`;
  panel.append(source);

  panel.hidden = false;
}

function setupModals() {
  document.querySelectorAll('.modal-close, .modal-cancel').forEach((button) => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal-overlay');
      closeModal(modal);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal(modal);
    });
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal(modal);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter((element) => !element.hidden && element.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    });
  });

  const btnNewGrievance = document.getElementById('btn-open-grievance-modal');
  if (btnNewGrievance) {
    btnNewGrievance.addEventListener('click', () => {
      clearAiTriage();
      openModal(document.getElementById('modal-grievance'), '#grv-pc-tag');
    });
  }

  const formAllocate = document.getElementById('form-allocate-workstation');
  if (formAllocate) {
    formAllocate.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!state.selectedAsset) return;
      const submit = formAllocate.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;

      const usn = document.getElementById('alloc-usn').value.trim();
      const studentName = document.getElementById('alloc-name').value.trim();
      const purpose = document.getElementById('alloc-purpose').value.trim();

      try {
        const data = await fetchJson(`/api/lab-assets/${encodeURIComponent(state.selectedAsset.tag)}/allocate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usn, studentName, purpose })
        });
        closeAllModals();
        formAllocate.reset();
        await refreshAllData();
        showToast(data.message, 'success');
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  const btnRelease = document.getElementById('btn-release-workstation');
  if (btnRelease) {
    btnRelease.addEventListener('click', async () => {
      if (!state.selectedAsset) return;

      if (btnRelease.dataset.armed !== 'true') {
        btnRelease.dataset.armed = 'true';
        const label = document.getElementById('release-label');
        if (label) label.textContent = 'Click again to confirm release';
        btnRelease.releaseTimer = window.setTimeout(disarmRelease, RELEASE_DISARM_MS);
        return;
      }

      disarmRelease();
      btnRelease.disabled = true;
      const tag = state.selectedAsset.tag;

      try {
        const data = await fetchJson(`/api/lab-assets/${encodeURIComponent(tag)}/release`, {
          method: 'POST'
        });
        closeAllModals();
        await refreshAllData();
        showToast(data.message, 'success');
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        btnRelease.disabled = false;
      }
    });
  }

  const formGrievance = document.getElementById('form-submit-grievance');
  if (formGrievance) {
    formGrievance.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = formGrievance.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;

      const payload = {
        workstationTag: document.getElementById('grv-pc-tag').value.trim(),
        studentUsn: document.getElementById('grv-usn').value.trim(),
        studentName: document.getElementById('grv-name').value.trim(),
        category: document.getElementById('grv-category').value,
        priority: document.getElementById('grv-priority').value,
        title: document.getElementById('grv-title').value.trim(),
        description: document.getElementById('grv-desc').value.trim()
      };

      try {
        const data = await fetchJson('/api/grievances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        formGrievance.reset();
        clearAiTriage();
        closeAllModals();
        await refreshAllData();
        showToast(data.message, 'success');
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  const btnAiTriage = document.getElementById('btn-ai-triage');
  if (btnAiTriage) {
    btnAiTriage.addEventListener('click', async () => {
      const title = document.getElementById('grv-title').value.trim();
      const description = document.getElementById('grv-desc').value.trim();

      if (!title && !description) {
        showToast('Add an incident summary or detailed symptoms before running AI triage.', 'error');
        return;
      }

      const label = btnAiTriage.textContent;
      btnAiTriage.disabled = true;
      btnAiTriage.textContent = 'Triaging…';
      clearAiTriage();

      try {
        const data = await fetchJson('/api/ai/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            workstationTag: document.getElementById('grv-pc-tag').value,
            category: document.getElementById('grv-category').value,
            priority: document.getElementById('grv-priority').value
          })
        });

        const result = data.data;
        document.getElementById('grv-category').value = result.category;
        document.getElementById('grv-priority').value = result.priority;
        renderAiTriage(result);
        showToast(`AI triage suggests ${result.priority} priority.`, 'success');
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        btnAiTriage.disabled = false;
        btnAiTriage.textContent = label;
      }
    });
  }

  const formGrade = document.getElementById('form-submit-grade');
  if (formGrade) {
    formGrade.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = formGrade.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;

      const subId = document.getElementById('grade-sub-id').value;
      const marks = document.getElementById('grade-marks').value;
      const comments = document.getElementById('grade-comments').value.trim();

      try {
        const data = await fetchJson(`/api/journals/${encodeURIComponent(subId)}/grade`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marks, comments, faculty: 'Prof. Aruna Mam' })
        });
        formGrade.reset();
        closeAllModals();
        await refreshAllData();
        showToast(data.message, 'success');
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }
}

// Chart.js telemetry, colours are read from the token block
function chartToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function chartTooltip() {
  return {
    backgroundColor: chartToken('--color-surface-3'),
    titleColor: chartToken('--color-ink'),
    bodyColor: chartToken('--color-ink-soft'),
    borderColor: chartToken('--color-rule-strong'),
    borderWidth: 1,
    padding: 10,
    cornerRadius: 2,
    titleFont: { family: chartToken('--font-body'), size: 11, weight: '600' },
    bodyFont: { family: chartToken('--font-body'), size: 11 }
  };
}

function initCharts() {
  if (typeof Chart === 'undefined') return;

  const bodyFont = chartToken('--font-body');
  const ink = chartToken('--color-ink');
  const inkSoft = chartToken('--color-ink-soft');
  const inkMuted = chartToken('--color-ink-muted');
  const rule = chartToken('--color-rule');
  const surface1 = chartToken('--color-surface-1');
  const accent = chartToken('--color-accent');
  const accentStrong = chartToken('--color-accent-strong');
  const animation = PREFERS_REDUCED_MOTION.matches ? false : { duration: 700, easing: 'easeOutQuart' };

  Chart.defaults.font.family = bodyFont;
  Chart.defaults.color = inkSoft;

  const ctxStatus = document.getElementById('chart-workstation-status');
  if (ctxStatus) {
    state.charts.workstationStatus = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Available', 'Occupied', 'Maintenance', 'Offline'],
        datasets: [{
          data: [30, 7, 2, 1],
          backgroundColor: [
            chartToken('--color-ok'),
            chartToken('--color-info'),
            chartToken('--color-warn'),
            chartToken('--color-bad')
          ],
          borderColor: surface1,
          borderWidth: 3,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        animation,
        layout: { padding: 6 },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: inkSoft,
              usePointStyle: true,
              pointStyle: 'rect',
              boxWidth: 8,
              boxHeight: 8,
              padding: 16,
              font: { family: bodyFont, size: 11 }
            }
          },
          tooltip: chartTooltip()
        }
      }
    });
  }

  const ctxGrievances = document.getElementById('chart-grievances-category');
  if (ctxGrievances) {
    state.charts.grievanceCategory = new Chart(ctxGrievances, {
      type: 'bar',
      data: {
        labels: CATEGORY_ORDER,
        datasets: [{
          label: 'Tickets',
          data: [1, 1, 1, 1, 0],
          backgroundColor: accent,
          hoverBackgroundColor: accentStrong,
          borderWidth: 0,
          borderRadius: 0,
          maxBarThickness: 48
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation,
        layout: { padding: { top: 4, right: 4 } },
        plugins: {
          legend: { display: false },
          tooltip: chartTooltip()
        },
        scales: {
          x: {
            border: { color: rule },
            grid: { display: false },
            ticks: { color: inkMuted, font: { family: bodyFont, size: 11 } }
          },
          y: {
            beginAtZero: true,
            suggestedMax: 3,
            border: { display: false },
            grid: { color: rule },
            ticks: {
              color: inkMuted,
              precision: 0,
              stepSize: 1,
              font: { family: bodyFont, size: 11 }
            }
          }
        }
      }
    });
  }

  // Keep a reference so a theme switch in devtools would not leave stale colours unnoticed
  state.chartInk = ink;
}

function updateCharts() {
  if (!state.analytics) return;
  const workstations = state.analytics.workstations;
  const grievances = state.analytics.grievances;

  if (state.charts.workstationStatus) {
    state.charts.workstationStatus.data.datasets[0].data = [
      workstations.available,
      workstations.occupied,
      workstations.maintenance,
      workstations.offline
    ];
    state.charts.workstationStatus.update();
  }

  if (state.charts.grievanceCategory) {
    state.charts.grievanceCategory.data.datasets[0].data = CATEGORY_ORDER.map((category) => grievances.categories[category] || 0);
    state.charts.grievanceCategory.update();
  }

  setText(
    'chart-status-summary',
    `${workstations.available} available, ${workstations.occupied} occupied, ${workstations.maintenance} in maintenance and ${workstations.offline} offline across ${workstations.total} seats.`
  );

  const categoryTotal = CATEGORY_ORDER.reduce((sum, category) => sum + (grievances.categories[category] || 0), 0);
  const activeCategories = CATEGORY_ORDER.filter((category) => (grievances.categories[category] || 0) > 0).length;
  setText(
    'chart-grievance-summary',
    `${categoryTotal} tickets logged across ${activeCategories} of ${CATEGORY_ORDER.length} categories.`
  );

  const statusCanvas = document.getElementById('chart-workstation-status');
  if (statusCanvas) {
    statusCanvas.setAttribute('aria-label', `Doughnut chart of workstation status. ${workstations.available} available, ${workstations.occupied} occupied, ${workstations.maintenance} in maintenance and ${workstations.offline} offline out of ${workstations.total}.`);
  }

  const grievanceCanvas = document.getElementById('chart-grievances-category');
  if (grievanceCanvas) {
    grievanceCanvas.setAttribute('aria-label', `Bar chart of grievance incidents by category. Hardware ${grievances.categories.Hardware || 0}, Software ${grievances.categories.Software || 0}, Network ${grievances.categories.Network || 0}, Peripheral ${grievances.categories.Peripheral || 0}, Power ${grievances.categories.Power || 0}.`);
  }
}

// Source inspector with file tabs and a copy action
function renderCodeInspector() {
  const container = document.getElementById('code-inspector-container');
  if (!container) return;

  if (!state.codeModules.length) {
    container.innerHTML = '<p class="code-empty">The API did not return any source modules.</p>';
    return;
  }

  state.codeIndex = Math.min(state.codeIndex, state.codeModules.length - 1);
  const current = state.codeModules[state.codeIndex];

  container.innerHTML = `
    <div class="code-shell">
      <div class="code-header">
        <div class="code-file">
          <span class="code-file-name">${escapeHtml(current.filename)}</span>
          <span class="code-file-note">${escapeHtml(current.description)}</span>
        </div>
        <div class="code-controls">
          <div class="code-tabs" role="tablist" aria-label="Source files">
            ${state.codeModules.map((module, index) => `
              <button class="code-tab" type="button" role="tab" data-code-index="${index}" aria-selected="${index === state.codeIndex}" tabindex="${index === state.codeIndex ? 0 : -1}" title="${escapeHtml(module.description)}">
                ${escapeHtml(module.filename.split(' ')[0])}
              </button>
            `).join('')}
          </div>
          <button class="code-copy" type="button" data-copy-source>Copy source</button>
        </div>
      </div>
      <pre class="code-body"><code>${escapeHtml(current.code)}</code></pre>
    </div>
  `;

  container.querySelectorAll('[data-code-index]').forEach((button) => {
    button.addEventListener('click', () => window.switchCodeTab(Number(button.dataset.codeIndex)));
  });

  const copyButton = container.querySelector('[data-copy-source]');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(current.code);
        showToast(`${current.filename} copied to the clipboard.`, 'success');
      } catch {
        showToast('The browser blocked clipboard access for this page.', 'error');
      }
    });
  }
}

window.switchCodeTab = function switchCodeTab(index) {
  state.codeIndex = index;
  renderCodeInspector();
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// A4 academic report controls
function setupReportControls() {
  const btnPrint = document.getElementById('btn-print-report');
  const btnTopPrint = document.getElementById('btn-top-print');
  const pageSelect = document.getElementById('select-a4-page');

  const triggerPrint = () => {
    const reportMode = document.getElementById('btn-mode-report');
    if (reportMode) reportMode.click();
    window.setTimeout(() => window.print(), 200);
  };

  if (btnPrint) btnPrint.addEventListener('click', triggerPrint);
  if (btnTopPrint) btnTopPrint.addEventListener('click', triggerPrint);

  if (pageSelect) {
    pageSelect.addEventListener('change', (event) => {
      const targetPage = document.getElementById(event.target.value);
      if (targetPage) {
        targetPage.scrollIntoView({ behavior: PREFERS_REDUCED_MOTION.matches ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }
}
