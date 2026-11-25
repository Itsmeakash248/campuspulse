/**
 * CampusPulse — Smart Campus Lab Resource, Grievance Resolution & Digital Journal Verification Platform
 * Course: Server Side Web Development (SSWD) - BCA Semester 3
 * Institution: KLE Technological University, Hubballi
 * 
 * models/db.js - In-memory fallback data store and seed database
 */

const crypto = require('crypto');

// Generate a unique ObjectId-like string
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

// -------------------------------------------------------------
// 1. COLLECTION: USERS
// -------------------------------------------------------------
const users = [
  {
    _id: "usr_001",
    name: "Akash",
    usn: "01FE25BCA209",
    rollNo: "209",
    email: "01fe25bca209@kletech.ac.in",
    role: "student",
    specialization: "Full Stack & Cloud Architecture",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Akash"
  },
  {
    _id: "usr_fac01",
    name: "Prof. Aruna Mam",
    usn: "FAC_SSWD_01",
    rollNo: "FAC01",
    email: "aruna.faculty@kletech.ac.in",
    role: "faculty",
    specialization: "Course Instructor & Lab In-charge",
    avatar: "https://api.dicebear.com/7.x/personas/svg?seed=Aruna"
  },
  {
    _id: "usr_adm01",
    name: "System Admin (Lab 302)",
    usn: "ADMIN_302",
    rollNo: "SYS302",
    email: "admin.lab302@kletech.ac.in",
    role: "admin",
    specialization: "Infrastructure & SLA Management",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Admin302"
  }
];

// -------------------------------------------------------------
// 2. COLLECTION: LAB_ASSETS (40 Workstations in BCA Lab 302)
// -------------------------------------------------------------
const lab_assets = [];
const softwareStack = ["Node.js v20.11", "Express v4.19", "MongoDB v7.0", "VS Code v1.87", "Git v2.43", "Postman v10.22"];

for (let i = 1; i <= 40; i++) {
  const numStr = i < 10 ? `0${i}` : `${i}`;
  const tag = `PC-${numStr}`;
  let status = "available";
  let assignedTo = null;
  let studentName = null;
  let currentProgram = "Idle (Ready for Session)";
  let issueCount = 0;

  // Realistically allocate some active students
  if (i === 1) {
    status = "occupied";
    assignedTo = "01FE25BCA209";
    studentName = "Akash";
    currentProgram = "SSWD Prg 28: Mongoose Aggregations";
  } else if (i === 2) {
    status = "occupied";
    assignedTo = "01FE25BCA219";
    studentName = "Student Roll #219";
    currentProgram = "SSWD Prg 24: Express Middleware & CORS";
  } else if (i === 3) {
    status = "occupied";
    assignedTo = "01FE25BCA223";
    studentName = "Student Roll #223";
    currentProgram = "SSWD Prg 32: Indexing & Geospatial Queries";
  } else if (i === 4) {
    status = "occupied";
    assignedTo = "01FE25BCA236";
    studentName = "Student Roll #236";
    currentProgram = "SSWD Prg 18: Client-Server Fetch Validation";
  } else if (i === 8 || i === 19) {
    status = "maintenance";
    currentProgram = "Hardware Diagnostics / Network Recable";
    issueCount = 1;
  } else if (i === 14 || i === 27 || i === 35) {
    status = "occupied";
    assignedTo = `01FE25BCA${240 + i}`;
    studentName = `Student Roll #${100 + i}`;
    currentProgram = `SSWD Prg ${(i % 39) + 1}: Express REST Implementation`;
  } else if (i === 40) {
    status = "offline";
    currentProgram = "Power Supply Unit Overhaul";
    issueCount = 1;
  }

  lab_assets.push({
    _id: `asset_${numStr}`,
    tag: tag,
    seatNo: i,
    row: Math.ceil(i / 10),
    column: ((i - 1) % 10) + 1,
    status: status, // available | occupied | maintenance | offline
    assignedTo: assignedTo,
    studentName: studentName,
    currentProgram: currentProgram,
    specs: {
      cpu: "Intel Core i7-12700 (12 cores, 2.10 GHz)",
      ram: "16 GB DDR4 3200MHz",
      storage: "512 GB NVMe M.2 SSD",
      os: "Ubuntu 22.04 LTS (Jammy Jellyfish) & Win 11 Pro Dual Boot",
      gpu: "Intel UHD Graphics 770",
      lanSpeed: "1000 Mbps Gigabit Ethernet",
      nodeVersion: "v20.11.0",
      mongoStatus: "Active Service (Port 27017)",
      installedSoftware: softwareStack
    },
    ipAddress: `192.168.302.${100 + i}`,
    macAddress: `00:1B:44:11:3A:${numStr}`,
    lastHeartbeat: new Date(Date.now() - Math.floor(Math.random() * 300000)).toISOString(),
    issueCount: issueCount
  });
}

// -------------------------------------------------------------
// 3. COLLECTION: ASSET_ALLOCATIONS (Session Logs)
// -------------------------------------------------------------
const asset_allocations = [
  {
    _id: "alloc_001",
    workstationTag: "PC-01",
    seatNo: 1,
    usn: "01FE25BCA209",
    studentName: "Akash",
    checkInTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    checkOutTime: null,
    sessionPurpose: "Course Project Engine & REST API Controller Development",
    sessionStatus: "active"
  },
  {
    _id: "alloc_002",
    workstationTag: "PC-02",
    seatNo: 2,
    usn: "01FE25BCA219",
    studentName: "Student Roll #219",
    checkInTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    checkOutTime: null,
    sessionPurpose: "SSWD Express Routing & Middleware Testing",
    sessionStatus: "active"
  },
  {
    _id: "alloc_003",
    workstationTag: "PC-03",
    seatNo: 3,
    usn: "01FE25BCA223",
    studentName: "Student Roll #223",
    checkInTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    checkOutTime: null,
    sessionPurpose: "MongoDB Collections & Schema Constraints Validation",
    sessionStatus: "active"
  },
  {
    _id: "alloc_004",
    workstationTag: "PC-04",
    seatNo: 4,
    usn: "01FE25BCA236",
    studentName: "Student Roll #236",
    checkInTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    checkOutTime: null,
    sessionPurpose: "A4 Report Printing Style & UI Responsiveness",
    sessionStatus: "active"
  }
];

// -------------------------------------------------------------
// 4. COLLECTION: GRIEVANCES (Ticketing & SLA Escalation)
// -------------------------------------------------------------
const grievances = [
  {
    _id: "grv_001",
    ticketId: "TKT-302-01",
    workstationTag: "PC-08",
    seatNo: 8,
    studentUsn: "01FE25BCA248",
    studentName: "Rohan Kulkarni",
    category: "Hardware",
    priority: "High",
    title: "USB Keyboard 3 keys intermittently failing during JS coding",
    description: "Keys 'E', 'R', and Enter fail to register consistently when compiling Node.js lab programs.",
    status: "IN_REVIEW",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    assignedTo: "Admin 302",
    slaMinutes: 120,
    elapsedMinutes: 95,
    resolutionNotes: "Replacement keyboard dispatched from central IT inventory."
  },
  {
    _id: "grv_002",
    ticketId: "TKT-302-02",
    workstationTag: "PC-19",
    seatNo: 19,
    studentUsn: "01FE25BCA259",
    studentName: "Pooja Patil",
    category: "Network",
    priority: "Critical",
    title: "Gigabit Ethernet link flaps during npm install dependencies",
    description: "Workstation loses LAN connection intermittently with 'ECONNRESET' during npm package installations.",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    assignedTo: "Unassigned",
    slaMinutes: 60,
    elapsedMinutes: 45,
    resolutionNotes: ""
  },
  {
    _id: "grv_003",
    ticketId: "TKT-302-03",
    workstationTag: "PC-40",
    seatNo: 40,
    studentUsn: "01FE25BCA280",
    studentName: "Vikram Naik",
    category: "Power",
    priority: "Critical",
    title: "SMPS power unit tripping under high CPU compilation loads",
    description: "System unexpectedly reboots when running simultaneous mongod instance and heavy Webpack builds.",
    status: "IN_REVIEW",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    assignedTo: "Hardware Engineer (KLE Tech)",
    slaMinutes: 240,
    elapsedMinutes: 180,
    resolutionNotes: "SMPS unit checked; capacitor replacement scheduled for evening batch."
  },
  {
    _id: "grv_004",
    ticketId: "TKT-302-04",
    workstationTag: "PC-12",
    seatNo: 12,
    studentUsn: "01FE25BCA212",
    studentName: "Sneha Joshi",
    category: "Software",
    priority: "Medium",
    title: "MongoDB service permissions denied for non-root student user",
    description: "systemctl status mongod indicated permission lock on /data/db directory.",
    status: "RESOLVED",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    assignedTo: "Admin 302",
    slaMinutes: 120,
    elapsedMinutes: 45,
    resolutionNotes: "Fixed chown permissions on /var/lib/mongodb and verified service restart."
  }
];

// -------------------------------------------------------------
// 5. COLLECTION: JOURNAL_SUBMISSIONS (SSWD Programs 1 to 39)
// -------------------------------------------------------------
const samplePrograms = [
  { num: 1, title: "Node.js Architecture & Global Objects", cat: "Node Core" },
  { num: 2, title: "Synchronous vs Asynchronous File I/O (fs module)", cat: "Node Core" },
  { num: 5, title: "Event Emitter & Custom Stream Pipelines", cat: "Node Core" },
  { num: 10, title: "HTTP Server & Raw URL Query Parameter Parsing", cat: "HTTP & Networking" },
  { num: 14, title: "Express.js Application Scaffolding & Routing", cat: "Express Framework" },
  { num: 18, title: "Custom Middleware for Logging, Auth & CORS", cat: "Express Framework" },
  { num: 22, title: "RESTful API CRUD with Status Code Handling", cat: "REST Architecture" },
  { num: 27, title: "MongoDB Driver Connection & BSON Document Ops", cat: "Database Integration" },
  { num: 31, title: "Mongoose Schema Modeling & Validator Hooks", cat: "Database Integration" },
  { num: 36, title: "Mongoose Aggregation Pipeline & Group Queries", cat: "Advanced Database" },
  { num: 39, title: "Full-Stack Server-Side Authentication & Session JWT", cat: "Security & Capstone" }
];

const journal_submissions = [
  {
    _id: "sub_001",
    programNumber: 14,
    programTitle: "Express.js Application Scaffolding & Routing",
    studentUsn: "01FE25BCA209",
    studentName: "Akash",
    submittedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: "VERIFIED",
    plagiarismScore: 3.2,
    syntaxValidationPassed: true,
    marksAwarded: 10,
    maxMarks: 10,
    facultyComments: "Clean modular router architecture. Outstanding error middleware implementation.",
    verifiedBy: "Prof. Aruna Mam"
  },
  {
    _id: "sub_002",
    programNumber: 27,
    programTitle: "MongoDB Driver Connection & BSON Document Ops",
    studentUsn: "01FE25BCA219",
    studentName: "Student Roll #219",
    submittedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    status: "VERIFIED",
    plagiarismScore: 4.1,
    syntaxValidationPassed: true,
    marksAwarded: 10,
    maxMarks: 10,
    facultyComments: "Proper connection pooling and graceful disconnection handling demonstrated.",
    verifiedBy: "Prof. Aruna Mam"
  },
  {
    _id: "sub_003",
    programNumber: 31,
    programTitle: "Mongoose Schema Modeling & Validator Hooks",
    studentUsn: "01FE25BCA223",
    studentName: "Student Roll #223",
    submittedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    status: "VERIFIED",
    plagiarismScore: 2.8,
    syntaxValidationPassed: true,
    marksAwarded: 10,
    maxMarks: 10,
    facultyComments: "Robust pre-save hooks and regex email validators implemented correctly.",
    verifiedBy: "Prof. Aruna Mam"
  },
  {
    _id: "sub_004",
    programNumber: 18,
    programTitle: "Custom Middleware for Logging, Auth & CORS",
    studentUsn: "01FE25BCA236",
    studentName: "Student Roll #236",
    submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: "VERIFIED",
    plagiarismScore: 5.0,
    syntaxValidationPassed: true,
    marksAwarded: 10,
    maxMarks: 10,
    facultyComments: "Proper NextFunction chaining and HTTP options preflight handling.",
    verifiedBy: "Prof. Aruna Mam"
  },
  {
    _id: "sub_005",
    programNumber: 36,
    programTitle: "Mongoose Aggregation Pipeline & Group Queries",
    studentUsn: "01FE25BCA209",
    studentName: "Akash",
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: "SUBMITTED",
    plagiarismScore: 4.8,
    syntaxValidationPassed: true,
    marksAwarded: null,
    maxMarks: 10,
    facultyComments: "Awaiting viva review in upcoming laboratory session.",
    verifiedBy: null
  },
  {
    _id: "sub_006",
    programNumber: 39,
    programTitle: "Full-Stack Server-Side Authentication & Session JWT",
    studentUsn: "01FE25BCA219",
    studentName: "Student Roll #219",
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "SUBMITTED",
    plagiarismScore: 6.2,
    syntaxValidationPassed: true,
    marksAwarded: null,
    maxMarks: 10,
    facultyComments: "Pending faculty viva verification.",
    verifiedBy: null
  }
];

// -------------------------------------------------------------
// 6. COLLECTION: AUDIT_LOGS (Telemetry & Security)
// -------------------------------------------------------------
const audit_logs = [
  {
    _id: "log_001",
    timestamp: new Date(Date.now() - 3600000 * 2.1).toISOString(),
    action: "ALLOCATION_CHECKIN",
    actor: "01FE25BCA209",
    details: "Checked into PC-01 (Seat 1) for SSWD Course Project Development",
    ip: "192.168.302.101"
  },
  {
    _id: "log_002",
    timestamp: new Date(Date.now() - 3600000 * 2.0).toISOString(),
    action: "ALLOCATION_CHECKIN",
    actor: "01FE25BCA219",
    details: "Checked into PC-02 (Seat 2) for SSWD Course Project Development",
    ip: "192.168.302.102"
  },
  {
    _id: "log_003",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    action: "GRIEVANCE_FILED",
    actor: "01FE25BCA259",
    details: "Ticket TKT-302-02 created for Workstation PC-19 (Network)",
    ip: "192.168.302.119"
  },
  {
    _id: "log_004",
    timestamp: new Date(Date.now() - 3600000 * 1.0).toISOString(),
    action: "JOURNAL_EVALUATION",
    actor: "Prof. Aruna Mam",
    details: "Verified Program 18 for Student Roll #236 (01FE25BCA236), Awarded 10/10",
    ip: "192.168.302.1"
  }
];

// -------------------------------------------------------------
// DATABASE ACCESS API (in-memory model interface)
// -------------------------------------------------------------
const db = {
  users: {
    find: (query = {}) => {
      return users.filter(item => {
        for (const key of Object.keys(query)) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
    },
    findById: (id) => users.find(u => u._id === id || u.usn === id),
    findOne: (query) => db.users.find(query)[0] || null
  },

  lab_assets: {
    find: (query = {}) => {
      return lab_assets.filter(item => {
        for (const key of Object.keys(query)) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
    },
    findById: (id) => lab_assets.find(a => a._id === id || a.tag === id),
    findOne: (query) => db.lab_assets.find(query)[0] || null,
    updateStatus: (tag, newStatus, studentDetails = {}) => {
      const asset = lab_assets.find(a => a.tag === tag);
      if (!asset) return null;
      asset.status = newStatus;
      if (newStatus === "occupied") {
        asset.assignedTo = studentDetails.usn || asset.assignedTo;
        asset.studentName = studentDetails.studentName || asset.studentName;
        asset.currentProgram = studentDetails.currentProgram || asset.currentProgram;
      } else if (newStatus === "available") {
        asset.assignedTo = null;
        asset.studentName = null;
        asset.currentProgram = "Idle (Ready for Session)";
      }
      asset.lastHeartbeat = new Date().toISOString();
      return asset;
    }
  },

  asset_allocations: {
    find: () => [...asset_allocations].reverse(),
    create: (data) => {
      const newAlloc = {
        _id: `alloc_${generateId().slice(0, 8)}`,
        ...data,
        checkInTime: new Date().toISOString(),
        sessionStatus: "active"
      };
      asset_allocations.push(newAlloc);
      return newAlloc;
    },
    checkOut: (workstationTag) => {
      const active = asset_allocations.find(a => a.workstationTag === workstationTag && a.sessionStatus === "active");
      if (active) {
        active.checkOutTime = new Date().toISOString();
        active.sessionStatus = "completed";
      }
      return active;
    }
  },

  grievances: {
    find: (query = {}) => {
      return grievances.filter(item => {
        for (const key of Object.keys(query)) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      }).reverse();
    },
    findById: (id) => grievances.find(g => g._id === id || g.ticketId === id),
    create: (data) => {
      const count = grievances.length + 1;
      const ticketId = `TKT-302-${count < 10 ? '0' + count : count}`;
      const newGrievance = {
        _id: `grv_${generateId().slice(0, 8)}`,
        ticketId: ticketId,
        workstationTag: data.workstationTag,
        seatNo: parseInt(data.workstationTag.replace('PC-', ''), 10) || 0,
        studentUsn: data.studentUsn,
        studentName: data.studentName,
        category: data.category || "Hardware",
        priority: data.priority || "Medium",
        title: data.title,
        description: data.description,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTo: "Admin 302",
        slaMinutes: data.priority === "Critical" ? 60 : data.priority === "High" ? 120 : 240,
        elapsedMinutes: 0,
        resolutionNotes: ""
      };
      grievances.push(newGrievance);

      // Increment issue counter on workstation
      const asset = lab_assets.find(a => a.tag === data.workstationTag);
      if (asset) {
        asset.issueCount = (asset.issueCount || 0) + 1;
        if (data.priority === "Critical" || data.priority === "High") {
          asset.status = "maintenance";
        }
      }

      // Log audit
      db.audit_logs.create({
        action: "GRIEVANCE_FILED",
        actor: data.studentUsn,
        details: `Ticket ${ticketId} created for ${data.workstationTag} (${data.category})`,
        ip: "127.0.0.1"
      });

      return newGrievance;
    },
    updateStatus: (id, status, resolutionNotes = "") => {
      const grv = grievances.find(g => g._id === id || g.ticketId === id);
      if (!grv) return null;
      grv.status = status;
      grv.updatedAt = new Date().toISOString();
      if (resolutionNotes) grv.resolutionNotes = resolutionNotes;
      if (status === "RESOLVED") {
        const asset = lab_assets.find(a => a.tag === grv.workstationTag);
        if (asset && asset.status === "maintenance") {
          asset.status = "available";
        }
      }

      db.audit_logs.create({
        action: "GRIEVANCE_STATUS_UPDATE",
        actor: "Admin 302",
        details: `Ticket ${grv.ticketId} updated to ${status}. Notes: ${resolutionNotes || 'None'}`,
        ip: "127.0.0.1"
      });

      return grv;
    }
  },

  journal_submissions: {
    find: (query = {}) => {
      return journal_submissions.filter(item => {
        for (const key of Object.keys(query)) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      }).reverse();
    },
    findById: (id) => journal_submissions.find(j => j._id === id),
    create: (data) => {
      const newSub = {
        _id: `sub_${generateId().slice(0, 8)}`,
        programNumber: parseInt(data.programNumber, 10),
        programTitle: data.programTitle || `SSWD Program ${data.programNumber}`,
        studentUsn: data.studentUsn,
        studentName: data.studentName,
        submittedAt: new Date().toISOString(),
        status: "SUBMITTED",
        plagiarismScore: parseFloat((Math.random() * 5 + 2).toFixed(1)),
        syntaxValidationPassed: true,
        marksAwarded: null,
        maxMarks: 10,
        facultyComments: "Queued for viva verification by Prof. Aruna Mam",
        verifiedBy: null
      };
      journal_submissions.push(newSub);

      db.audit_logs.create({
        action: "JOURNAL_SUBMISSION",
        actor: data.studentUsn,
        details: `Submitted Program ${newSub.programNumber}: ${newSub.programTitle}`,
        ip: "127.0.0.1"
      });

      return newSub;
    },
    grade: (id, marks, comments, faculty = "Prof. Aruna Mam") => {
      const sub = journal_submissions.find(j => j._id === id);
      if (!sub) return null;
      sub.marksAwarded = marks;
      sub.facultyComments = comments;
      sub.status = "VERIFIED";
      sub.verifiedBy = faculty;

      db.audit_logs.create({
        action: "JOURNAL_EVALUATION",
        actor: faculty,
        details: `Graded Prg ${sub.programNumber} for ${sub.studentName} (${marks}/10)`,
        ip: "127.0.0.1"
      });

      return sub;
    }
  },

  audit_logs: {
    find: () => [...audit_logs].reverse().slice(0, 50),
    create: (entry) => {
      const log = {
        _id: `log_${generateId().slice(0, 8)}`,
        timestamp: new Date().toISOString(),
        ...entry
      };
      audit_logs.push(log);
      return log;
    }
  },

  getAnalytics: () => {
    const totalPCs = lab_assets.length;
    const occupiedPCs = lab_assets.filter(a => a.status === "occupied").length;
    const availablePCs = lab_assets.filter(a => a.status === "available").length;
    const maintenancePCs = lab_assets.filter(a => a.status === "maintenance").length;
    const offlinePCs = lab_assets.filter(a => a.status === "offline").length;

    const totalTickets = grievances.length;
    const pendingTickets = grievances.filter(g => g.status === "PENDING").length;
    const inReviewTickets = grievances.filter(g => g.status === "IN_REVIEW").length;
    const resolvedTickets = grievances.filter(g => g.status === "RESOLVED").length;

    const totalSubmissions = journal_submissions.length;
    const verifiedSubmissions = journal_submissions.filter(j => j.status === "VERIFIED").length;
    const plagiarismScores = journal_submissions
      .map(j => Number(j.plagiarismScore))
      .filter(score => Number.isFinite(score));
    const averagePlagiarism = plagiarismScores.length
      ? `${(plagiarismScores.reduce((sum, score) => sum + score, 0) / plagiarismScores.length).toFixed(1)}%`
      : "0.0%";
    const completionVelocity = totalSubmissions
      ? `${Math.round((verifiedSubmissions / totalSubmissions) * 100)}%`
      : "0%";

    const categoryCounts = {};
    grievances.forEach(g => {
      categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;
    });

    return {
      workstations: {
        total: totalPCs,
        occupied: occupiedPCs,
        available: availablePCs,
        maintenance: maintenancePCs,
        offline: offlinePCs,
        utilizationRate: Math.round((occupiedPCs / totalPCs) * 100)
      },
      grievances: {
        total: totalTickets,
        pending: pendingTickets,
        inReview: inReviewTickets,
        resolved: resolvedTickets,
        categories: categoryCounts
      },
      journals: {
        totalSubmissions,
        verifiedSubmissions,
        averagePlagiarism,
        completionVelocity
      },
      curriculum: {
        subject: "Server Side Web Development (SSWD)",
        semester: "BCA Semester 3",
        university: "KLE Technological University, Hubballi",
        lab: "Lab 302 (Networked Computing Centre)",
        totalPrograms: 39,
        facultyGuide: "Prof. Aruna Mam",
        teamMembers: users.filter(u => u.role === "student")
      }
    };
  }
};

module.exports = db;
