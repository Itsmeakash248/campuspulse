/**
 * Maps the app's existing camelCase objects to Supabase snake_case rows.
 * The frontend contract stays unchanged; only the persistence layer knows SQL names.
 */

const crypto = require('crypto');

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function timestamp(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function json(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function numberOrNull(value) {
  return value === undefined || value === null || value === '' ? null : Number(value);
}

// Users --------------------------------------------------------------------
function userToApp(row) {
  return {
    _id: row.id,
    name: row.name,
    usn: row.usn,
    rollNo: row.roll_no,
    email: row.email,
    role: row.role,
    specialization: row.specialization,
    avatar: row.avatar
  };
}

function userToRow(user) {
  return {
    id: user._id || newId('usr'),
    name: user.name,
    usn: user.usn || null,
    roll_no: user.rollNo || null,
    email: user.email || null,
    role: user.role || 'student',
    specialization: user.specialization || null,
    avatar: user.avatar || null
  };
}

// Lab assets ---------------------------------------------------------------
function assetToApp(row) {
  return {
    _id: row.id,
    tag: row.tag,
    seatNo: Number(row.seat_no),
    row: Number(row.row_no),
    column: Number(row.column_no),
    status: row.status,
    assignedTo: row.assigned_to,
    studentName: row.student_name,
    currentProgram: row.current_program,
    specs: json(row.specs, {}),
    ipAddress: row.ip_address,
    macAddress: row.mac_address,
    lastHeartbeat: timestamp(row.last_heartbeat),
    issueCount: Number(row.issue_count || 0)
  };
}

function assetToRow(asset) {
  return {
    id: asset._id || newId('asset'),
    tag: asset.tag,
    seat_no: asset.seatNo,
    row_no: asset.row,
    column_no: asset.column,
    status: asset.status || 'available',
    assigned_to: asset.assignedTo || null,
    student_name: asset.studentName || null,
    current_program: asset.currentProgram || 'Idle (Ready for Session)',
    specs: json(asset.specs, {}),
    ip_address: asset.ipAddress || null,
    mac_address: asset.macAddress || null,
    last_heartbeat: timestamp(asset.lastHeartbeat) || new Date().toISOString(),
    issue_count: Number(asset.issueCount || 0)
  };
}

// Allocation sessions ------------------------------------------------------
function allocationToApp(row) {
  return {
    _id: row.id,
    workstationTag: row.workstation_tag,
    seatNo: Number(row.seat_no),
    usn: row.usn,
    studentName: row.student_name,
    checkInTime: timestamp(row.check_in_time),
    checkOutTime: timestamp(row.check_out_time),
    sessionPurpose: row.session_purpose,
    sessionStatus: row.session_status
  };
}

function allocationToRow(allocation) {
  return {
    id: allocation._id || newId('alloc'),
    workstation_tag: allocation.workstationTag,
    seat_no: allocation.seatNo,
    usn: allocation.usn,
    student_name: allocation.studentName,
    check_in_time: timestamp(allocation.checkInTime) || new Date().toISOString(),
    check_out_time: timestamp(allocation.checkOutTime),
    session_purpose: allocation.sessionPurpose || null,
    session_status: allocation.sessionStatus || 'active'
  };
}

// Grievances ---------------------------------------------------------------
function grievanceToApp(row) {
  return {
    _id: row.id,
    ticketId: row.ticket_id,
    workstationTag: row.workstation_tag,
    seatNo: Number(row.seat_no),
    studentUsn: row.student_usn,
    studentName: row.student_name,
    category: row.category,
    priority: row.priority,
    title: row.title,
    description: row.description,
    status: row.status,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
    assignedTo: row.assigned_to,
    slaMinutes: Number(row.sla_minutes),
    elapsedMinutes: Number(row.elapsed_minutes || 0),
    resolutionNotes: row.resolution_notes || ''
  };
}

function grievanceToRow(grievance) {
  return {
    id: grievance._id || newId('grv'),
    ticket_id: grievance.ticketId,
    workstation_tag: grievance.workstationTag,
    seat_no: grievance.seatNo,
    student_usn: grievance.studentUsn,
    student_name: grievance.studentName || 'Student',
    category: grievance.category || 'Hardware',
    priority: grievance.priority || 'Medium',
    title: grievance.title,
    description: grievance.description,
    status: grievance.status || 'PENDING',
    created_at: timestamp(grievance.createdAt) || new Date().toISOString(),
    updated_at: timestamp(grievance.updatedAt) || new Date().toISOString(),
    assigned_to: grievance.assignedTo || 'Admin 302',
    sla_minutes: Number(grievance.slaMinutes || 240),
    elapsed_minutes: Number(grievance.elapsedMinutes || 0),
    resolution_notes: grievance.resolutionNotes || ''
  };
}

// Journal submissions ------------------------------------------------------
function journalToApp(row) {
  return {
    _id: row.id,
    programNumber: Number(row.program_number),
    programTitle: row.program_title,
    studentUsn: row.student_usn,
    studentName: row.student_name,
    submittedAt: timestamp(row.submitted_at),
    status: row.status,
    plagiarismScore: Number(row.plagiarism_score),
    syntaxValidationPassed: Boolean(row.syntax_validation_passed),
    marksAwarded: numberOrNull(row.marks_awarded),
    maxMarks: Number(row.max_marks),
    facultyComments: row.faculty_comments || '',
    verifiedBy: row.verified_by
  };
}

function journalToRow(journal) {
  return {
    id: journal._id || newId('sub'),
    program_number: journal.programNumber,
    program_title: journal.programTitle,
    student_usn: journal.studentUsn,
    student_name: journal.studentName || 'Student',
    submitted_at: timestamp(journal.submittedAt) || new Date().toISOString(),
    status: journal.status || 'SUBMITTED',
    plagiarism_score: Number(journal.plagiarismScore || 0),
    syntax_validation_passed: journal.syntaxValidationPassed !== false,
    marks_awarded: numberOrNull(journal.marksAwarded),
    max_marks: Number(journal.maxMarks || 10),
    faculty_comments: journal.facultyComments || '',
    verified_by: journal.verifiedBy || null
  };
}

// Audit logs ---------------------------------------------------------------
function auditToApp(row) {
  return {
    _id: row.id,
    timestamp: timestamp(row.timestamp),
    action: row.action,
    actor: row.actor,
    details: row.details,
    ip: row.ip
  };
}

function auditToRow(log) {
  return {
    id: log._id || newId('log'),
    timestamp: timestamp(log.timestamp) || new Date().toISOString(),
    action: log.action,
    actor: log.actor || null,
    details: log.details || null,
    ip: log.ip || null
  };
}

module.exports = {
  newId,
  userToApp,
  userToRow,
  assetToApp,
  assetToRow,
  allocationToApp,
  allocationToRow,
  grievanceToApp,
  grievanceToRow,
  journalToApp,
  journalToRow,
  auditToApp,
  auditToRow
};
