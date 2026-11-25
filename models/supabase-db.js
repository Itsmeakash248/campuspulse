/**
 * Supabase/Postgres persistence adapter for CampusPulse.
 * Exposes the same async store contract used by routes/api.js.
 */

const {
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
} = require('./mappers');

function upstreamError(context, error) {
  const wrapped = new Error(`${context}: ${error.message || 'Supabase request failed'}`);
  wrapped.status = 500;
  wrapped.code = error.code;
  wrapped.details = error.details;
  wrapped.hint = error.hint;
  return wrapped;
}

function dataOf(result, context) {
  if (result.error) throw upstreamError(context, result.error);
  return result.data;
}

function createSupabaseStore(client) {
  async function findAsset(id) {
    let result = await client.from('lab_assets').select('*').eq('tag', id).maybeSingle();
    let row = dataOf(result, 'Read workstation');
    if (row) return assetToApp(row);

    result = await client.from('lab_assets').select('*').eq('id', id).maybeSingle();
    row = dataOf(result, 'Read workstation');
    return row ? assetToApp(row) : null;
  }

  async function findGrievance(id) {
    let result = await client.from('grievances').select('*').eq('id', id).maybeSingle();
    let row = dataOf(result, 'Read grievance');
    if (row) return grievanceToApp(row);

    result = await client.from('grievances').select('*').eq('ticket_id', id).maybeSingle();
    row = dataOf(result, 'Read grievance');
    return row ? grievanceToApp(row) : null;
  }

  async function findJournal(id) {
    const result = await client.from('journal_submissions').select('*').eq('id', id).maybeSingle();
    const row = dataOf(result, 'Read journal submission');
    return row ? journalToApp(row) : null;
  }

  async function nextTicketId() {
    const countResult = await client
      .from('grievances')
      .select('*', { count: 'exact', head: true });
    if (countResult.error) throw upstreamError('Count grievances', countResult.error);

    let sequence = (countResult.count || 0) + 1;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `TKT-302-${String(sequence).padStart(2, '0')}`;
      const existing = await client
        .from('grievances')
        .select('id')
        .eq('ticket_id', candidate)
        .maybeSingle();
      if (existing.error) throw upstreamError('Check grievance ticket', existing.error);
      if (!existing.data) return candidate;
      sequence += 1;
    }

    return `TKT-302-${String(Date.now()).slice(-6)}`;
  }

  async function writeAudit(entry) {
    const row = auditToRow(entry);
    const result = await client.from('audit_logs').insert(row).select().single();
    return auditToApp(dataOf(result, 'Write audit log'));
  }

  async function incrementAssetIssue(tag, priority) {
    const asset = await findAsset(tag);
    if (!asset) return null;

    const patch = { issue_count: Number(asset.issueCount || 0) + 1 };
    if (priority === 'Critical' || priority === 'High') {
      patch.status = 'maintenance';
      patch.assigned_to = null;
      patch.student_name = null;
      patch.current_program = 'Hardware Diagnostics / Network Recable';
    }

    const result = await client
      .from('lab_assets')
      .update(patch)
      .eq('tag', asset.tag)
      .select()
      .single();
    return assetToApp(dataOf(result, 'Update workstation issue count'));
  }

  return {
    mode: 'supabase',

    users: {
      async find(query = {}) {
        let request = client.from('users').select('*');
        if (query.role) request = request.eq('role', query.role);
        if (query.usn) request = request.eq('usn', query.usn);
        if (query._id) request = request.eq('id', query._id);
        const result = await request.order('name', { ascending: true });
        return dataOf(result, 'Read users').map(userToApp);
      },

      async findById(id) {
        let result = await client.from('users').select('*').eq('id', id).maybeSingle();
        let row = dataOf(result, 'Read user');
        if (row) return userToApp(row);

        result = await client.from('users').select('*').eq('usn', id).maybeSingle();
        row = dataOf(result, 'Read user');
        return row ? userToApp(row) : null;
      }
    },

    labAssets: {
      async find(query = {}) {
        let request = client.from('lab_assets').select('*');
        if (query.status) request = request.eq('status', query.status);
        if (query.row) request = request.eq('row_no', query.row);
        if (query.tag) request = request.eq('tag', query.tag);
        if (query._id) request = request.eq('id', query._id);
        const result = await request.order('seat_no', { ascending: true });
        return dataOf(result, 'Read workstations').map(assetToApp);
      },

      findById: findAsset,

      async updateStatus(tag, newStatus, studentDetails = {}) {
        const asset = await findAsset(tag);
        if (!asset) return null;

        const patch = {
          status: newStatus,
          last_heartbeat: new Date().toISOString()
        };

        if (newStatus === 'occupied') {
          patch.assigned_to = studentDetails.usn || asset.assignedTo;
          patch.student_name = studentDetails.studentName || asset.studentName;
          patch.current_program = studentDetails.currentProgram || asset.currentProgram;
        } else if (newStatus === 'available') {
          patch.assigned_to = null;
          patch.student_name = null;
          patch.current_program = 'Idle (Ready for Session)';
        }

        const result = await client
          .from('lab_assets')
          .update(patch)
          .eq('tag', asset.tag)
          .select()
          .single();
        return assetToApp(dataOf(result, 'Update workstation'));
      },

      incrementIssue: incrementAssetIssue
    },

    allocations: {
      async find() {
        const result = await client
          .from('asset_allocations')
          .select('*')
          .order('check_in_time', { ascending: false });
        return dataOf(result, 'Read allocations').map(allocationToApp);
      },

      async create(data) {
        const allocation = {
          _id: newId('alloc'),
          ...data,
          checkInTime: new Date().toISOString(),
          checkOutTime: null,
          sessionStatus: 'active'
        };
        const result = await client
          .from('asset_allocations')
          .insert(allocationToRow(allocation))
          .select()
          .single();
        return allocationToApp(dataOf(result, 'Create allocation'));
      },

      async checkOut(workstationTag) {
        const read = await client
          .from('asset_allocations')
          .select('*')
          .eq('workstation_tag', workstationTag)
          .eq('session_status', 'active')
          .order('check_in_time', { ascending: false })
          .limit(1)
          .maybeSingle();
        const active = dataOf(read, 'Read active allocation');
        if (!active) return null;

        const result = await client
          .from('asset_allocations')
          .update({
            check_out_time: new Date().toISOString(),
            session_status: 'completed'
          })
          .eq('id', active.id)
          .select()
          .single();
        return allocationToApp(dataOf(result, 'Check out allocation'));
      }
    },

    grievances: {
      async find(query = {}) {
        let request = client.from('grievances').select('*');
        if (query.status) request = request.eq('status', query.status);
        if (query.category) request = request.eq('category', query.category);
        if (query.workstationTag) request = request.eq('workstation_tag', query.workstationTag);
        if (query.studentUsn) request = request.eq('student_usn', query.studentUsn);
        const result = await request.order('created_at', { ascending: false });
        return dataOf(result, 'Read grievances').map(grievanceToApp);
      },

      findById: findGrievance,

      async create(data) {
        const ticketId = await nextTicketId();
        const now = new Date().toISOString();
        const grievance = {
          _id: newId('grv'),
          ticketId,
          workstationTag: data.workstationTag,
          seatNo: parseInt(data.workstationTag.replace('PC-', ''), 10) || 0,
          studentUsn: data.studentUsn,
          studentName: data.studentName || 'Student',
          category: data.category || 'Hardware',
          priority: data.priority || 'Medium',
          title: data.title,
          description: data.description,
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
          assignedTo: 'Admin 302',
          slaMinutes: data.priority === 'Critical' ? 60 : data.priority === 'High' ? 120 : 240,
          elapsedMinutes: 0,
          resolutionNotes: ''
        };

        const result = await client
          .from('grievances')
          .insert(grievanceToRow(grievance))
          .select()
          .single();
        const created = grievanceToApp(dataOf(result, 'Create grievance'));

        await incrementAssetIssue(data.workstationTag, grievance.priority);

        await writeAudit({
          action: 'GRIEVANCE_FILED',
          actor: data.studentUsn,
          details: `Ticket ${ticketId} created for ${data.workstationTag} (${grievance.category})`,
          ip: '127.0.0.1'
        });

        return created;
      },

      async updateStatus(id, status, resolutionNotes = '') {
        const existing = await findGrievance(id);
        if (!existing) return null;

        const patch = {
          status,
          updated_at: new Date().toISOString()
        };
        if (resolutionNotes) patch.resolution_notes = resolutionNotes;

        const result = await client
          .from('grievances')
          .update(patch)
          .eq('id', existing._id)
          .select()
          .single();
        const updated = grievanceToApp(dataOf(result, 'Update grievance status'));

        if (status === 'RESOLVED') {
          const asset = await findAsset(updated.workstationTag);
          if (asset && asset.status === 'maintenance') {
            await client
              .from('lab_assets')
              .update({
                status: 'available',
                assigned_to: null,
                student_name: null,
                current_program: 'Idle (Ready for Session)',
                last_heartbeat: new Date().toISOString()
              })
              .eq('tag', asset.tag);
          }
        }

        await writeAudit({
          action: 'GRIEVANCE_STATUS_UPDATE',
          actor: 'Admin 302',
          details: `Ticket ${updated.ticketId} updated to ${status}. Notes: ${resolutionNotes || 'None'}`,
          ip: '127.0.0.1'
        });

        return updated;
      }
    },

    journals: {
      async find(query = {}) {
        let request = client.from('journal_submissions').select('*');
        if (query.usn) request = request.eq('student_usn', query.usn);
        if (query.status) request = request.eq('status', query.status);
        if (query.studentUsn) request = request.eq('student_usn', query.studentUsn);
        if (query.programNumber) request = request.eq('program_number', query.programNumber);
        const result = await request.order('submitted_at', { ascending: false });
        return dataOf(result, 'Read journal submissions').map(journalToApp);
      },

      findById: findJournal,

      async create(data) {
        const now = new Date().toISOString();
        const submission = {
          _id: newId('sub'),
          programNumber: parseInt(data.programNumber, 10),
          programTitle: data.programTitle || `SSWD Program ${data.programNumber}`,
          studentUsn: data.studentUsn,
          studentName: data.studentName || 'Student',
          submittedAt: now,
          status: 'SUBMITTED',
          plagiarismScore: parseFloat((Math.random() * 5 + 2).toFixed(1)),
          syntaxValidationPassed: true,
          marksAwarded: null,
          maxMarks: 10,
          facultyComments: 'Queued for viva verification by Prof. Aruna Mam',
          verifiedBy: null
        };

        const result = await client
          .from('journal_submissions')
          .insert(journalToRow(submission))
          .select()
          .single();
        const created = journalToApp(dataOf(result, 'Create journal submission'));

        await writeAudit({
          action: 'JOURNAL_SUBMISSION',
          actor: data.studentUsn,
          details: `Submitted Program ${created.programNumber}: ${created.programTitle}`,
          ip: '127.0.0.1'
        });

        return created;
      },

      async grade(id, marks, comments, faculty = 'Prof. Aruna Mam') {
        const existing = await findJournal(id);
        if (!existing) return null;

        const result = await client
          .from('journal_submissions')
          .update({
            marks_awarded: marks,
            faculty_comments: comments,
            status: 'VERIFIED',
            verified_by: faculty
          })
          .eq('id', existing._id)
          .select()
          .single();
        const graded = journalToApp(dataOf(result, 'Grade journal submission'));

        await writeAudit({
          action: 'JOURNAL_EVALUATION',
          actor: faculty,
          details: `Graded Prg ${graded.programNumber} for ${graded.studentName} (${marks}/10)`,
          ip: '127.0.0.1'
        });

        return graded;
      }
    },

    auditLogs: {
      async find() {
        const result = await client
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);
        return dataOf(result, 'Read audit logs').map(auditToApp);
      },

      create: writeAudit
    },

    async getAnalytics() {
      const [assetResult, grievanceResult, journalResult, userResult] = await Promise.all([
        client.from('lab_assets').select('*'),
        client.from('grievances').select('*'),
        client.from('journal_submissions').select('*'),
        client.from('users').select('*')
      ]);

      const assets = dataOf(assetResult, 'Read analytics workstations').map(assetToApp);
      const grievances = dataOf(grievanceResult, 'Read analytics grievances').map(grievanceToApp);
      const journals = dataOf(journalResult, 'Read analytics journals').map(journalToApp);
      const users = dataOf(userResult, 'Read analytics users').map(userToApp);

      const totalPCs = assets.length;
      const occupiedPCs = assets.filter((a) => a.status === 'occupied').length;
      const availablePCs = assets.filter((a) => a.status === 'available').length;
      const maintenancePCs = assets.filter((a) => a.status === 'maintenance').length;
      const offlinePCs = assets.filter((a) => a.status === 'offline').length;

      const categoryCounts = {};
      for (const grievance of grievances) {
        categoryCounts[grievance.category] = (categoryCounts[grievance.category] || 0) + 1;
      }

      const totalSubmissions = journals.length;
      const verifiedSubmissions = journals.filter((j) => j.status === 'VERIFIED').length;
      const plagiarismScores = journals
        .map((j) => Number(j.plagiarismScore))
        .filter((score) => Number.isFinite(score));
      const averagePlagiarism = plagiarismScores.length
        ? `${(plagiarismScores.reduce((sum, score) => sum + score, 0) / plagiarismScores.length).toFixed(1)}%`
        : '0.0%';
      const completionVelocity = totalSubmissions
        ? `${Math.round((verifiedSubmissions / totalSubmissions) * 100)}%`
        : '0%';

      return {
        workstations: {
          total: totalPCs,
          occupied: occupiedPCs,
          available: availablePCs,
          maintenance: maintenancePCs,
          offline: offlinePCs,
          utilizationRate: totalPCs ? Math.round((occupiedPCs / totalPCs) * 100) : 0
        },
        grievances: {
          total: grievances.length,
          pending: grievances.filter((g) => g.status === 'PENDING').length,
          inReview: grievances.filter((g) => g.status === 'IN_REVIEW').length,
          resolved: grievances.filter((g) => g.status === 'RESOLVED').length,
          categories: categoryCounts
        },
        journals: {
          totalSubmissions,
          verifiedSubmissions,
          averagePlagiarism,
          completionVelocity
        },
        curriculum: {
          subject: 'Server Side Web Development (SSWD)',
          semester: 'BCA Semester 3',
          university: 'KLE Technological University, Hubballi',
          lab: 'Lab 302 (Networked Computing Centre)',
          totalPrograms: 39,
          facultyGuide: 'Prof. Aruna Mam',
          teamMembers: users.filter((u) => u.role === 'student')
        }
      };
    }
  };
}

module.exports = createSupabaseStore;
