# EduData Exchange (EDX) — Project 125: SLO Monitoring & Reliability Governance

This repository contains the complete implementation for **Assignment 125: SLO Monitoring and Reliability Governance** under the Platform Admin module of the EduData Exchange (EDX) platform.

The dashboard provides platform administrators with real-time tracking of service-level objectives (SLOs), error budgets, measurement evidence, active incidents, and structured follow-up verification workflows across six core services.

> [!NOTE]
> The primary page module is located in `pages/admin/slo-monitoring/` and includes its own module documentation: [`pages/admin/slo-monitoring/README.md`](pages/admin/slo-monitoring/README.md).

---

## Architecture at a Glance

```text
Browser (HTML / ES Modules) ---> FastAPI Backend (Port 8000) ---> MySQL 8 Database (Port 3306, edx_slo_monitoring)
```

| Layer | Technology | Location | Port |
|---|---|---|---|
| Frontend | Plain HTML5, CSS3, ES-module JavaScript, Bootstrap 5 CDN | `pages/admin/slo-monitoring/` | 5500 (VS Code Live Server) or 8000 (`/site`) |
| Backend API | Python 3, FastAPI, PyMySQL, Uvicorn | `pages/admin/slo-monitoring/backend/` | 8000 |
| Database | MySQL 8.0, InnoDB engine | `pages/admin/slo-monitoring/database/` | 3306 (`edx_slo_monitoring`) |

---

## How the Data Flows

1. `seed.sql` populates the baseline demonstration dataset into the MySQL database tables.
2. The FastAPI backend queries MySQL dynamically on every HTTP request; no data is hard-coded or cached in application memory.
3. The frontend API client in `pages/admin/slo-monitoring/js/api.js` issues HTTP calls to the backend `/api/*` endpoints.
4. The central state store in `pages/admin/slo-monitoring/js/store.js` manages state and polls eight backend endpoints concurrently every 5 seconds.
5. Modular view components in `pages/admin/slo-monitoring/js/views/` receive store change notifications and render updated DOM and SVG elements.

### Write Operations

All mutations are handled through three dedicated `POST` endpoints wrapped in database transactions:
- `POST /api/followups`: Creates a new follow-up requesting specialist evidence for a specific SLO.
- `POST /api/followups/{followup_id}/specialist-evidence`: Records evidence artifacts returned by an engineering team and requests review.
- `POST /api/followups/{followup_id}/reviews`: Appends an independent review outcome, closing the issue or requesting further evidence.

Every write transaction automatically logs an audit row into the `governance_history` table. Data integrity is enforced at the database tier:
- Evidence returns (`followup_evidence_returns`) and review rounds (`followup_review_rounds`) are strictly append-only, enforced by database triggers that reject `UPDATE` and `DELETE` commands.
- Reviewer independence is enforced by database `CHECK` constraints and API validation; the user who requested a follow-up cannot review it.
- Service Level Indicators (`sli_pct`) are computed directly by MySQL using a stored generated column formula (`successful_count * 100 / eligible_count`).
- Evidence references are constrained by unique database keys to prevent duplicate submissions.

### API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/viewer` | Standalone browser-based inspection viewer for raw database state |
| GET | `/api/health` | Verifies database connectivity and returns table row counts |
| GET | `/api/monitoring` | Returns full monitoring payload structured for frontend consumption |
| GET | `/api/meta` | Retrieves portfolio metadata, governance scope, and role boundary policies |
| GET | `/api/model` | Unified payload containing complete SLO, service, incident, and history data |
| GET | `/api/dashboard` | Joined view of latest snapshot and SLO compliance positions (`v_monitoring_dashboard`) |
| GET | `/api/slos` | Lists all defined SLO standards, current SLI metrics, and burn rates |
| GET | `/api/slos/{slo_id}` | Detailed SLO view with measurement concerns and linked follow-ups |
| GET | `/api/services` | Lists registered platform services, tiers, and operational health |
| GET | `/api/services/{service_id}` | Service details alongside associated SLO records |
| GET | `/api/incidents` | Lists active and resolved incidents |
| GET | `/api/incidents/{incident_id}` | Retrieves details for an individual incident |
| GET | `/api/reviewers` | Lists authorized platform assurance reviewers |
| GET | `/api/snapshot-batches` | Lists finalized observation snapshot batches |
| GET | `/api/snapshots` | Retrieves measurement evidence records (supports optional `slo_id` filter) |
| GET | `/api/followups` | Lists all follow-ups with nested returns and review rounds |
| GET | `/api/followups/{followup_id}` | Detailed follow-up record with chronological review history |
| GET | `/api/governance-history` | Decision audit trail (supports `subject_id` filter and `limit` 1-1000) |
| GET | `/site/{path:path}` | Serves frontend static files against a strict extension allowlist |
| POST | `/api/followups` | Opens a new follow-up in "Awaiting Specialist Evidence" state |
| POST | `/api/followups/{followup_id}/specialist-evidence` | Records submitted specialist evidence, setting status to review required |
| POST | `/api/followups/{followup_id}/reviews` | Appends an independent review round to verify or reject evidence |

---

## Project Structure

```text
Assignment_125/
├── index.html                                        (Root platform portal)
├── signin.html                                       (Authentication mockup screen)
├── ASSIGNMENT_INFO.txt                               (Assignment identification file)
├── assets/                                           (Global stylesheets, branding, fonts)
├── partials/                                         (Shared header, sidebar, footer templates)
├── support/                                          (Support and utility assets)
└── pages/
    └── admin/
        ├── landing.html                              (Platform admin navigation landing page)
        ├── _shared/                                  (Shared page kit and demo datasets)
        └── slo-monitoring/                           (Assignment 125 Module)
            ├── slo-monitoring.html                   (Main HTML entry point)
            ├── slo-app.css                           (Module stylesheet & design tokens)
            ├── slo-monitoring.json                   (Demo snapshot JSON)
            ├── README.md                             (Detailed module README)
            ├── HANDOFF.md                            (Technical handoff notes)
            ├── FRONTEND_REPORT.md                    (Frontend report)
            ├── js/                                   (Modular ES-module frontend)
            │   ├── slo-app.js                        (Application bootstrapper)
            │   ├── store.js                          (Reactive state store & polling)
            │   ├── api.js                            (REST API fetch wrapper)
            │   ├── router.js                         (Hash-based client router)
            │   ├── ui.js                             (Reusable UI components)
            │   ├── charts.js                         (Custom SVG charts)
            │   ├── util.js                           (Formatting and security helpers)
            │   ├── chrome.js                         (Partial loader for shell)
            │   ├── config.js                         (Environment & polling config)
            │   └── views/                            (Sub-views: monitoring, slos, detail, etc.)
            ├── backend/                              (FastAPI REST backend)
            │   ├── main.py                           (FastAPI application & endpoints)
            │   ├── db.py                             (MySQL transaction manager)
            │   ├── load_sql.py                       (Python SQL loader utility)
            │   ├── test_api.py                       (Pytest suite - 23 automated tests)
            │   ├── requirements.txt                  (Production Python packages)
            │   ├── requirements-dev.txt              (Development & test packages)
            │   ├── .env.example                      (Template environment configuration)
            │   ├── README.md                         (Backend developer documentation)
            │   └── static/viewer.html                (Live database inspector)
            └── database/                             (Database scripts)
                ├── schema.sql                        (MySQL DDL schema, triggers & views)
                ├── seed.sql                          (Governed demonstration dataset)
                └── generate_seed.py                  (Seed generation script)
```

> [!WARNING]
> Other admin pages import `js/ui.js`, `js/util.js`, `js/charts.js`, `js/config.js` and `slo-app.css` from `pages/admin/slo-monitoring/`; do not delete, move, or rename them.

---

## How to Run It

### Prerequisites
- Python 3.10+ installed
- MySQL 8.0 running on `127.0.0.1:3306`
- VS Code with the Live Server extension installed

### Setup and Execution (Windows PowerShell)

1. **Set up the backend virtual environment:**
   ```powershell
   cd pages\admin\slo-monitoring\backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

2. **Configure environment settings:**
   ```powershell
   copy .env.example .env
   # Edit .env and set DB_PASSWORD=<your MySQL password>
   ```

3. **Initialize and seed MySQL:**
   ```powershell
   python load_sql.py
   ```
   *(Note: This drops and recreates all tables, resetting the state to the clean demo snapshot).*

4. **Start the FastAPI backend server:**
   ```powershell
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

5. **Open the frontend:**
   - **Method A (Live Server):** In VS Code, right-click `pages\admin\landing.html` and choose "Open with Live Server" (runs on port 5500), then click "SLO and Platform Operations" in the left sidebar.
   - **Method B (Backend Static Server):** Open `http://127.0.0.1:8000/site/pages/admin/slo-monitoring/slo-monitoring.html` in your browser.

**Useful Endpoints:**
- Swagger API Docs: `http://127.0.0.1:8000/docs`
- Live Data Viewer: `http://127.0.0.1:8000/viewer`
- Health Check: `http://127.0.0.1:8000/api/health`

---

## Verification Checklist

1. **Health Verification:** `GET http://127.0.0.1:8000/api/health` returns status `"ok"` with exact seed row counts:
   - `portfolio_meta: 10`, `services: 6`, `incidents: 4`, `reviewers: 3`, `slo_definitions: 6`, `snapshot_batches: 1`, `measurement_snapshots: 6`, `followups: 6`, `followup_evidence_returns: 5`, `followup_review_rounds: 2`, `governance_history: 13`.
2. **Interactive Docs:** `http://127.0.0.1:8000/docs` opens and lists all 20+ endpoints.
3. **UI Rendering:** Dashboard loads with KPI summary cards, SVG charts, and icons without console errors.
4. **Navigation:** Clicking tabs (Monitoring, SLO Standards, Services, Incidents, History) navigates without reloading.
5. **Live Mutation:** Submitting specialist evidence on follow-up `FUP-SLO-2602` updates status and appends a row in `governance_history`.
6. **Backend Resilience:** Stopping Uvicorn displays a red alert banner; restarting Uvicorn automatically reconnects within 5 seconds.
7. **Automated Tests:** Running `python -m pytest -v` inside `backend\` passes all 23 tests against `edx_slo_monitoring_test`.
8. **Security Boundary:** Navigating to `/site/pages/admin/slo-monitoring/HANDOFF.md` returns HTTP 404.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Red banner: "Unable to load SLO monitoring data" | Backend service is stopped or wrong port | Run `uvicorn main:app --host 127.0.0.1 --port 8000` in `backend\` and check terminal logs. |
| HTTP 503 "Database unavailable" | MySQL 8 service is stopped or bad `.env` credentials | Ensure MySQL is running on 3306 and verify `DB_PASSWORD` in `backend\.env`. |
| Missing or blank navigation icons | Bootstrap Icons CDN blocked or offline | Verify internet access to `cdn.jsdelivr.net`. |
| Startup error: Port 8000 already in use | Existing process binding port 8000 | Kill existing process with PowerShell or specify another port. |
| CORS error in browser developer console | Frontend accessed via non-whitelisted host | Access via `http://127.0.0.1:5500` or `http://127.0.0.1:8000/site/...`. |
