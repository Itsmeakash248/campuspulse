# ⚡ CampusPulse — Smart Campus Lab Resource, Grievance Resolution & Digital Journal Verification Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express Framework](https://img.shields.io/badge/Express.js-v4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![REST API](https://img.shields.io/badge/API-RESTful%20JSON-0284c7)](http://localhost:3000/api/health)
[![AI Triage](https://img.shields.io/badge/AI-Gemini%20Triage-4285F4?logo=google&logoColor=white)](#)
[![Test Suite](https://img.shields.io/badge/Tests-12%2F12%20Passing-10b981)](http://localhost:3000)
[![Institution](https://img.shields.io/badge/KLE%20Tech-BCA%20Sem--3%20SSWD-blue)](https://kletech.ac.in)

> **Course:** Server Side Web Development (SSWD) — Course Code: `24BCA304`  
> **Program:** Bachelor of Computer Applications (BCA), Semester 3  
> **Institution:** School of Computer Science & Applications, KLE Technological University, Hubballi  
> **Laboratory:** BCA Lab 302 (Networked Computing Centre)  
> **Faculty Guide & Evaluator:** **Prof. Aruna Mam** (Assistant Professor & Course Instructor)  
> **Academic Year:** 2024–2025  

---

## 👥 Student Project Team

| Roll No. | Student Name | University Seat Number (USN) | Institutional Email | Technical Role in Project |
| :---: | :--- | :--- | :--- | :--- |
| **209** | **Akash** | `01FE25BCA209` | `01fe25bca209@kletech.ac.in` | Full-Stack Architect & Core Engine Developer |

---

## 📖 Executive Summary & Motivation

In modern computer science education, laboratory environments are the proving grounds where theoretical server concepts become working systems. However, managing 40 physical workstation terminals across 60 students in **BCA Lab 302** during Server Side Web Development practicals has historically suffered from manual paper register sign-ins, unmonitored equipment downtime, and protracted grading times across the **39 required course lab programs**.

**CampusPulse** is an asynchronous, production-grade web platform engineered specifically for the KLE Tech BCA Sem-3 SSWD curriculum. Built on Node.js and Express.js with a Supabase Postgres data store, CampusPulse delivers:
1. **Real-Time Workstation Telemetry:** Interactive 40-node floor map showing terminal hardware specs, IP addresses, seat occupants, and operational status.
2. **SLA-Driven Grievance Escalation:** Incident ticketing with automated SLA timers (60/120/240 mins) and maintenance status locks.
3. **Digital Lab Journal Verification Desk:** End-to-end evaluation desk for all 39 lab programs with syntax checks, plagiarism similarity scoring, and faculty viva grading.
4. **Gemini AI Incident Triage:** Server-side Gemini classification of incoming incidents into the fixed category and priority domain, with a one-line summary and three first-response steps before dispatch.
5. **Strict A4 Academic Report Engine:** Browser print engine rendering a 10-page official project report with faculty sign-off and university credentials for immediate attachment to the student laboratory journal.

---

## 🏛️ System Architecture

CampusPulse follows a decoupled, three-tier Server-Side Web Development architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CLIENT TIER (Single-Page App)                      │
│   • Dark Cyber Hackathon Dashboard (Tailwind-like Glassmorphism)       │
│   • 40-PC Live Floor Grid Visualizer & Seat Allocation Modals          │
│   • Chart.js Operational Telemetry Engine (Occupancy & SLA Velocity)   │
│   • Strict 10-Page A4 Print Engine (@media print, ISO 216 Portrait)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / RESTful JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SERVER-SIDE TIER (Node.js & Express)                  │
│   • Express Application Gateway (Port 3000)                            │
│   • Middleware Pipeline: CORS, JSON Body Parser, Latency Logger        │
│   • Centralized Asynchronous Error Handler Middleware                  │
│   • Modular Router (/api): Workstations, Grievances, Journals, Telemetry│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ supabase-js (service role, server only)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DATABASE TIER (Supabase Postgres)                     │
│   • tables: users, lab_assets, asset_allocations,                       │
│             grievances, journal_submissions, audit_logs                │
│   • CHECK constraints, unique keys, indexes, JSONB hardware specs       │
│   • Row Level Security enabled; Express is the only database writer     │
│   • In-memory seed store remains as an offline fallback                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. 40-Terminal BCA Lab 302 Visualizer
- Dynamic grid representation of all 40 physical computer stations in Lab 302.
- Color-coded status states: `Available` (Green), `Occupied` (Blue), `Maintenance` (Amber), `Offline` (Rose).
- One-click seat allocation modal linking student USN, department Roll Number, and active lab program.
- One-click seat check-out and workstation release.

### 2. SLA-Enforced Grievance Incident Desk
- Auto-generates human-readable ticket keys (e.g., `TKT-302-01`).
- Enforces strict Service Level Agreement (SLA) countdowns based on incident priority:
  - **Critical:** 60 Minutes (SMPS power loss, kernel panics)
  - **High:** 120 Minutes (Gigabit LAN dropouts, hardware keyboard failures)
  - **Medium / Low:** 240 Minutes (Software package permissions, local cache resets)
- Automatic terminal status escalation: Flagging a critical grievance automatically switches the workstation to `maintenance` mode.

### 3. Digital Lab Journal Verification Desk (Programs 1 to 39)
- Tracks student progress across all 39 prescribed SSWD laboratory programs.
- Automated code syntax validation and similarity indexing.
- Faculty evaluation portal where **Prof. Aruna Mam** can assign viva marks (0 to 10), add feedback remarks, and sign off submissions.

### 4. Telemetry & Analytics Dashboard
- Interactive Chart.js visualizations:
  - **Doughnut Chart:** Real-time workstation occupancy distribution.
  - **Bar Chart:** Grievance incident frequency categorized by Hardware, Software, Network, Peripheral, and Power.

### 5. Live Code Inspector & Schema Explorer
- In-browser syntax viewer allowing instructors and students to inspect `server.js`, `models/supabase-db.js`, `models/mappers.js`, `models/gemini.js`, and `routes/api.js`.
- Entity-Relationship schema documentation showing Postgres data types and constraints.

### 6. Official 10-Page A4 Academic Project Report
- Full academic project report integrated directly into the web application.
- Formatted with `@page { size: A4 portrait; margin: 10mm 12mm; }`.
- Solo student declaration and submitted-by block for **Akash (01FE25BCA209)**.
- Ready for 1-click PDF export to attach at the end of the student laboratory journal.

### 7. Gemini AI Incident Triage
- A **Run AI triage** action inside the grievance logger sends the reported symptoms to Gemini through a server-only endpoint.
- Gemini returns a category from the database `CHECK` domain (`Hardware`, `Software`, `Network`, `Peripheral`, `Power`), a priority from the SLA domain, a one-line summary, and three technician steps.
- The form automatically applies the suggested category and priority; the SLA is derived server-side from the priority constants, not trusted from the model.
- The API key is read from `.env` or Vercel environment variables and never reaches the browser. A per-IP limiter protects the quota.

---

## 🗄️ Database Design & Tables

The persistence layer uses **Supabase Postgres** when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present. Without credentials it falls back to the original in-memory seed, so the demo remains runnable offline. The REST API always returns camelCase objects; `models/mappers.js` translates them to the snake_case columns below.

All six tables enable Row Level Security with no public policies. Only the Express server, authenticated with the service-role key, can read or write them.

### 1. `users`
| Column | Postgres Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | Primary Key | Unique user record identifier |
| `name` | `text` | `not null` | Full student or faculty name |
| `usn` | `text` | `unique` | University Seat Number (e.g. `01FE25BCA209`) |
| `roll_no` | `text` | Optional | Department Roll Number (e.g. `209`) |
| `email` | `text` | Optional | Institutional KLE Tech email |
| `role` | `text` | `CHECK (role IN ('student','faculty','admin'))` | Authorization access level |
| `specialization` | `text` | Optional | Student technical domain or faculty title |
| `avatar` | `text` | Optional | Profile image reference |
| `created_at` | `timestamptz` | `default now()` | Record creation time |

### 2. `lab_assets` (40 Workstations)
| Column | Postgres Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | Primary Key | Unique hardware asset identifier |
| `tag` | `text` | `not null`, `unique` (`PC-01`..`PC-40`) | Workstation label tag |
| `seat_no` | `integer` | `not null` | Physical seat number in Lab 302 |
| `row_no` | `integer` | `not null` | Physical grid row (1 to 4) |
| `column_no` | `integer` | `not null` | Position within the row (1 to 10) |
| `status` | `text` | `CHECK (status IN ('available','occupied','maintenance','offline'))` | Operational status |
| `assigned_to` | `text` | Nullable | USN of the active student |
| `student_name` | `text` | Nullable | Display name of the occupant |
| `current_program` | `text` | `default 'Idle (Ready for Session)'` | Active lab exercise |
| `specs` | `jsonb` | `default '{}'::jsonb` | CPU, RAM, storage, OS, installed software |
| `ip_address` | `text` | Optional | Laboratory subnet IP (`192.168.302.xxx`) |
| `mac_address` | `text` | Optional | Physical network address |
| `last_heartbeat` | `timestamptz` | `default now()` | Telemetry timestamp |
| `issue_count` | `integer` | `default 0` | Incidents linked to the terminal |

### 3. `asset_allocations`
| Column | Postgres Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | Primary Key | Allocation transaction identifier |
| `workstation_tag` | `text` | `not null`, indexed | Assigned computer station |
| `seat_no` | `integer` | Optional | Seat number at allocation time |
| `usn` | `text` | `not null` | Student USN |
| `student_name` | `text` | Optional | Student display name |
| `check_in_time` | `timestamptz` | `default now()` | Session start |
| `check_out_time` | `timestamptz` | Nullable | Session end |
| `session_purpose` | `text` | Optional | Lab program or task |
| `session_status` | `text` | `CHECK (session_status IN ('active','completed'))` | Session lifecycle state |

### 4. `grievances`
| Column | Postgres Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | Primary Key | Internal ticket identifier |
| `ticket_id` | `text` | `not null`, `unique` (`TKT-302-xx`) | Human-readable ticket ID |
| `workstation_tag` | `text` | `not null`, indexed | Affected terminal |
| `seat_no` | `integer` | `default 0` | Seat number for reporting |
| `student_usn` | `text` | `not null` | Student reporting the issue |
| `student_name` | `text` | Optional | Reporter display name |
| `category` | `text` | `CHECK (category IN ('Hardware','Software','Network','Peripheral','Power'))` | Incident classification |
| `priority` | `text` | `CHECK (priority IN ('Low','Medium','High','Critical'))` | Priority level |
| `title` | `text` | `not null` | Short incident summary |
| `description` | `text` | `not null` | Detailed symptoms |
| `status` | `text` | `CHECK (status IN ('PENDING','IN_REVIEW','RESOLVED','CLOSED'))` | Ticket lifecycle |
| `assigned_to` | `text` | `default 'Admin 302'` | Handling technician |
| `sla_minutes` | `integer` | `default 240` | Resolution window (60/120/240) |
| `elapsed_minutes` | `integer` | `default 0` | Elapsed SLA time |
| `resolution_notes` | `text` | `default ''` | Technician remarks |
| `created_at` | `timestamptz` | `default now()` | Ticket creation time |
| `updated_at` | `timestamptz` | `default now()` | Last status update |

### 5. `journal_submissions`
| Column | Postgres Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | Primary Key | Submission record identifier |
| `program_number` | `integer` | `not null` (1 to 39) | Syllabus lab exercise number |
| `program_title` | `text` | `not null` | Name of the lab program |
| `student_usn` | `text` | `not null`, indexed | Submitting student USN |
| `student_name` | `text` | Optional | Student display name |
| `submitted_at` | `timestamptz` | `default now()` | Upload timestamp |
| `status` | `text` | `CHECK (status IN ('DRAFT','SUBMITTED','VERIFIED','REVISION_REQUIRED'))` | Evaluation state |
| `plagiarism_score` | `numeric(4,1)` | `default 0` | Similarity percentage |
| `syntax_validation_passed` | `boolean` | `default true` | Lint result |
| `marks_awarded` | `numeric(4,1)` | Nullable, 0 to 10 | Viva score |
| `max_marks` | `numeric(4,1)` | `default 10` | Maximum score |
| `faculty_comments` | `text` | `default ''` | Evaluator feedback |
| `verified_by` | `text` | Nullable | Faculty sign-off |

### 6. `audit_logs`
| Column | Postgres Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | Primary Key | Log event identifier |
| `timestamp` | `timestamptz` | `default now()`, indexed | Event time |
| `action` | `text` | `not null` | Audit action key (`WORKSTATION_ALLOCATED`, etc.) |
| `actor` | `text` | Optional | USN or administrator |
| `details` | `text` | Optional | Full event description |
| `ip` | `text` | Optional | Origin client IP address |

---

## 🔌 RESTful API Reference

All endpoints return standard JSON responses with HTTP status codes conforming to REST architectural constraints:

| Method | Endpoint | Description | Request Body / Query | Success Status |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | System health, uptime & Node version | None | `200 OK` |
| `GET` | `/api/team` | Team profile, USNs & faculty guide info | None | `200 OK` |
| `POST` | `/api/ai/triage` | Gemini incident category, priority, summary & next steps | `{ workstationTag, title, description, category, priority }` | `200 OK` |
| `GET` | `/api/lab-assets` | List all 40 workstations | `?status=available&row=1` | `200 OK` |
| `GET` | `/api/lab-assets/:tag` | Retrieve specific workstation details | Param: `tag` (e.g. `PC-01`) | `200 OK` |
| `POST` | `/api/lab-assets/:tag/allocate` | Allocate seat to student | `{ usn, studentName, purpose }` | `200 OK` |
| `POST` | `/api/lab-assets/:tag/release` | Check out and release seat | Param: `tag` (e.g. `PC-01`) | `200 OK` |
| `GET` | `/api/grievances` | List grievance tickets | `?status=PENDING&category=Network` | `200 OK` |
| `POST` | `/api/grievances` | Submit new grievance ticket | `{ workstationTag, studentUsn, category, priority, title, description }` | `201 Created` |
| `PATCH`| `/api/grievances/:id/status` | Update ticket status & SLA notes | `{ status: "RESOLVED", resolutionNotes: "..." }` | `200 OK` |
| `GET` | `/api/journals` | List digital lab journal submissions | `?usn=01FE25BCA209` | `200 OK` |
| `POST` | `/api/journals` | Submit lab program for review | `{ programNumber, programTitle, studentUsn, studentName }` | `201 Created` |
| `PATCH`| `/api/journals/:id/grade` | Faculty viva grading & signoff | `{ marks: 10, comments: "...", faculty: "Prof. Aruna Mam" }` | `200 OK` |
| `GET` | `/api/analytics/dashboard`| Consolidated telemetry metrics | None | `200 OK` |
| `GET` | `/api/audit-logs` | Immutable audit log trail | None | `200 OK` |
| `GET` | `/api/code-inspector` | Source code files for inspector | None | `200 OK` |

---

## 📑 Faculty Syllabus Alignment (8 Mandatory Topics)

This project strictly satisfies all 8 topics required by faculty instructions:

```
[1] Introduction to the Project
    └── Detailed background of BCA Lab 302, SSWD course code 24BCA304, and operational motivation.
[2] Problem Statement
    └── Concurrency contention across 40 PCs for 60 students, latent incident triage, and 2,340 journal grading events.
[3] Objectives of the Project
    └── Real-time terminal telemetry, SLA escalation engine, digital journal verification, and strict A4 compliance.
[4] Scope of the Project
    └── Functional role-based workflows, sub-50ms API latency, and ISO 216 paper formatting.
[5] Technologies Used
    └── Node.js v20+, Express.js v4.x, Supabase Postgres & supabase-js, CSS3 Paged Media, Chart.js.
[6] Database Design / Tables / Collections
    └── Comprehensive documentation of 6 Postgres tables with data types, indexes, and constraints.
[7] Screenshots of the Source Code
    └── Formatted listings of server.js, models/supabase-db.js, models/mappers.js, and grading controllers.
[8] Screenshots of the User Interface (UI)
    └── Floor map grid, grievance desk, journal viva portal, and telemetry charts.
```

---

## 🚀 Installation & Setup Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher (`node -v`)
- **npm:** v9.0.0 or higher (`npm -v`)
- **Web Browser:** Google Chrome, Chromium, or Mozilla Firefox

### Step 1: Clone or Navigate to Directory
```bash
cd campuspulse
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Supabase
Copy the environment template and fill in your project values:
```bash
cp .env.example .env
```
Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from **Supabase → Project Settings → API**. The service-role key is server-only; never place it in `public/`.

If `.env` is missing, the server automatically uses the in-memory seed store, so the UI and tests still run.

### Step 3b: Configure Gemini AI Triage
Add the Gemini key to the same `.env`:
```env
GEMINI_API_KEY=your-google-ai-studio-key
GEMINI_MODEL=gemini-3.5-flash
```
The key is used only by `POST /api/ai/triage` and is never sent to `public/`. Without it, the rest of the app works normally and the triage button returns a clear configuration message.

### Step 4: Create the Tables
Open the **Supabase SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it once. This creates the six tables, indexes, RLS policies, and service-role grants.

### Step 5: Verify and Seed
```bash
npm run check:supabase
npm run seed:supabase -- --reset
```
The check prints row counts per table; the seed loads the original demo records into Postgres.

### Step 6: Run Automated Test Suite
To verify that all 12 REST API endpoints are functioning properly:
```bash
npm test
```
*Expected Output:* `Test Summary: 12 Passed, 0 Failed`

### Step 7: Start the Server
```bash
node server.js
```
The startup log reports `Data store: Supabase Postgres` when credentials are active, or `Data store: in-memory fallback` otherwise.

### Step 8: Open in Browser
Open your browser and navigate to:
```
http://localhost:3000
```

---

## ☁️ Deploy to Vercel

The repository ships with a Vercel configuration that splits the project into a static frontend and serverless API functions:

- `public/` is copied to `dist/` by `npm run build` and served as the static site.
- `api/index.js` and `api/[...path].js` run the existing Express app, so every `/api/*` route keeps the same response shape.
- Supabase credentials stay in Vercel environment variables and are only read by the serverless function.

### 1. Push the Project to GitHub
```bash
git init
git add .
git commit -m "CampusPulse with Supabase and Vercel deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/campuspulse.git
git push -u origin main
```
`.env` is already ignored and must never be committed.

### 2. Import the Repository in Vercel
1. Open [vercel.com/new](https://vercel.com/new) and import the GitHub repository.
2. Keep **Framework Preset: Other**. The build command and output directory are read from `vercel.json`.
3. Before deploying, open **Environment Variables** and add:
   - `SUPABASE_URL` — your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — the service-role key (server-side only)
   - `GEMINI_API_KEY` — your Google AI Studio key (server-side only)
   - `GEMINI_MODEL` — optional, defaults to `gemini-3.5-flash`
4. Apply the variables to **Production**, **Preview**, and **Development**, then click **Deploy**.

### 3. Seed the Database Once
The deployed API reads from Supabase, so create the tables and load the demo rows before opening the site:
```bash
# locally, with the same .env values
npm run check:supabase
npm run seed:supabase -- --reset
```
If the tables are empty, the console will load with zero records.

### 4. Verify the Deployment
```bash
curl https://<your-project>.vercel.app/api/health
```
The response should include:
```json
{ "status": "ONLINE", "database": "supabase" }
```
Then open `https://<your-project>.vercel.app` and confirm the console, modals, grievance desk, journal grading, and A4 report all load.

> **Fallback behaviour:** if the Supabase variables are missing in Vercel, the deployed API starts with the in-memory seed. Reads work, but writes are lost when the serverless instance recycles. If `GEMINI_API_KEY` is missing, only the AI triage action is disabled; the console, report, and all other REST endpoints keep working.

### Optional: Deploy from the CLI
```bash
npm i -g vercel
vercel
vercel --prod
```
The CLI prompts for the same environment variables on the first deployment.

---

## 🖨️ How to Print the 10-Page Official A4 Report

1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. Click the **"Academic A4 Report (10 Pages)"** button on the top navigation bar (or the blue **"Print / PDF Export"** button).
3. The browser print preview dialog (`Ctrl + P`) will open:
   - **Destination:** Save as PDF / Select Physical Printer
   - **Pages:** All (10 Pages)
   - **Layout:** Portrait
   - **Paper Size:** A4
   - **Margins:** Default / None (Margins are managed by CSS `@page`)
   - **Options:** Check **"Background graphics"** (Required for badge tints, signatures, and headers)
4. Print the document and bind it at the end of your SSWD laboratory journal.

---

## 📂 Project Directory Structure

```
Course-Project/
├── api/
│   ├── index.js                 # Vercel function for /api
│   └── [...path].js             # Vercel catch-all function for /api/*
├── config/
│   └── env.js                   # .env loader and Supabase configuration flags
├── lib/
│   └── vercel-handler.js        # Restores the /api prefix for serverless requests
├── models/
│   ├── db.js                    # In-memory fallback data store & seed records
│   ├── gemini.js                # Server-only Gemini AI triage client
│   ├── mappers.js               # camelCase app objects ↔ snake_case Postgres rows
│   ├── store.js                 # Chooses Supabase or the in-memory store
│   ├── supabase-client.js       # Server-only supabase-js client
│   └── supabase-db.js           # Supabase persistence adapter
├── routes/
│   └── api.js                   # RESTful API route controllers & validation
├── scripts/
│   ├── build-static.js          # Copies public/ to dist/ for Vercel
│   ├── check-supabase.js        # Connection and row-count check
│   └── seed-supabase.js         # Seeds Postgres from the demo data
├── supabase/
│   └── schema.sql               # Tables, indexes, RLS and grants
├── public/
│   ├── app.js                   # Frontend state controller, modals & Chart.js engine
│   ├── index.html               # Dual-mode Single Page App (Interactive + 10 A4 sheets)
│   └── styles.css               # App theme + strict A4 print media rules
├── server.js                    # Express entry point & middleware pipeline
├── test.js                      # Automated 12-point REST API integration tests
├── vercel.json                  # Static build, output directory and function settings
├── .env.example                 # Required Supabase environment variables
├── package.json                 # Project manifest & dependencies
└── README.md                    # Comprehensive project documentation
```

---

## 🧪 Verification & Test Results

```
🚀 Starting CampusPulse REST API Test Suite...
  ✅ PASS: GET /api/health returns 200 ONLINE
  ✅ PASS: GET /api/team contains Akash and guide Prof. Aruna Mam
  ✅ PASS: GET /api/lab-assets returns 40 workstations
  ✅ PASS: GET /api/lab-assets/PC-01 details match
  ✅ PASS: POST /api/lab-assets/PC-05/allocate succeeds
  ✅ PASS: POST /api/lab-assets/PC-05/release succeeds
  ✅ PASS: POST /api/grievances logs new ticket with SLA
  ✅ PASS: PATCH /api/grievances/:id/status updates to IN_REVIEW
  ✅ PASS: GET /api/journals returns submissions
  ✅ PASS: PATCH /api/journals/:id/grade assigns marks and sets VERIFIED
  ✅ PASS: GET /api/analytics/dashboard returns full telemetry
  ✅ PASS: GET /api/code-inspector returns source files

========================================
Test Summary: 12 Passed, 0 Failed
========================================
```

---

## 📜 Academic Declaration & Acknowledgements

This project was developed by **Akash (01FE25BCA209)** under the esteemed guidance of **Prof. Aruna Mam**, Assistant Professor, School of Computer Science & Applications, KLE Technological University, Hubballi.

I express my sincere gratitude to the faculty and lab administration of the Department of Bachelor of Computer Applications for their continuous mentorship during the Server Side Web Development course.
