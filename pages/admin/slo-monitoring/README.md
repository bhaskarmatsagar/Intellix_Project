# SLO Monitoring and Reliability Governance

The SLO Monitoring and Reliability Governance dashboard is a Platform Admin console that tracks service-level objectives (SLOs), error budgets, measurement evidence, active incidents, and structured follow-up verification workflows. The data presented is a governed demonstration snapshot rather than live production telemetry. The application is built across three distinct layers: a client-side web frontend, a Python FastAPI backend API, and a persistent MySQL database.

## Architecture at a Glance

```text
Browser (HTML / ES Modules) ---> FastAPI Backend (Port 8000) ---> MySQL 8 Database (Port 3306, edx_slo_monitoring)
```

| Layer | Technology | Location | Port |
|---|---|---|---|
| Frontend | Plain HTML5, CSS3, ES-module JavaScript, Bootstrap 5 CDN | `pages/admin/slo-monitoring/` | 5500 (VS Code Live Server) or 8000 (`/site`) |
| Backend API | Python 3, FastAPI, PyMySQL, Uvicorn | `pages/admin/slo-monitoring/backend/` | 8000 |
| Database | MySQL 8.0, InnoDB engine | `pages/admin/slo-monitoring/database/` | 3306 (`edx_slo_monitoring`) |

## How the Data Flows

1. `seed.sql` populates the baseline demonstration dataset into the MySQL database tables.
2. The FastAPI backend queries MySQL dynamically on every HTTP request; no data is hard-coded or cached in application memory.
3. The frontend API client in `js/api.js` issues HTTP calls to the backend `/api/*` endpoints.
4. The central state store in `js/store.js` manages state and polls eight backend endpoints concurrently every 5 seconds.
5. Modular view components in `js/views/` receive store change notifications and render updated DOM and SVG elements.

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

## Project Structure

```text
pages/admin/
├── landing.html
├── _shared/ (page-kit.css, page-kit.js, demo-data/, HANDOFF_PAGES.md)
├── access-role-governance/, audit-logs/, billing-usage/, change-requests/, classification-tagging/, connector-catalog/, cross-domain-evidence/, data-protection-retention/, evidence-packages/, masking-rls/, network-security/, platform-admin-home/, platform-notifications/, purpose-access-policies/, secrets-credentials/, tenant-directory/ (Separate demo pages that reuse the SLO UI code)
└── slo-monitoring/
```

| Path | What it contains |
|---|---|
| `slo-monitoring.html` | Primary HTML entry point hosting layout containers and partial anchors |
| `slo-app.css` | Design system stylesheet providing layout rules, design tokens, and chart styles |
| `slo-monitoring.json` | Baseline demo snapshot dataset used for seeding and standalone reference |
| `HANDOFF.md` | Developer handoff document detailing architectural fixes and refactoring history |
| `FRONTEND_REPORT.md` | Detailed frontend implementation report covering design systems and UI status |
| `.gitignore` | Ignores local environment files, caches, and Python virtual environment directories |
| `js/config.js` | Configuration module resolving API base URLs, polling timing, and defaults |
| `js/api.js` | HTTP client wrapper for all backend REST endpoints with typed error handling |
| `js/store.js` | Central state management with 5-second polling, deep diffing, and listeners |
| `js/router.js` | Client-side hash router managing view mounts and URL hash navigation |
| `js/util.js` | Utility functions for HTML escaping, date formatting, CSV export, and debouncing |
| `js/ui.js` | Reusable UI components including KPI cards, tables, drawers, pills, and dialogs |
| `js/charts.js` | Lightweight SVG chart generators for donut, bar, grouped, and gauge charts |
| `js/chrome.js` | Asynchronously loads shared header, sidebar, and footer partials |
| `js/slo-app.js` | Application bootstrapper initializing theme settings, routing, and polling loops |
| `js/views/monitoring.js` | Main overview dashboard view displaying KPI summary cards and open follow-ups |
| `js/views/slos.js` | SLO standards catalog view with search filters and error budget tracking |
| `js/views/slo-detail.js` | Deep-dive SLO view rendering gauge metrics, evidence quality, and linked issues |
| `js/views/services.js` | Service posture view mapping platform services to tiers and operational health |
| `js/views/incidents.js` | Incident assurance view tracking operational states and severity levels |
| `js/views/history.js` | Governance decision history view displaying audit checkpoints and verification status |
| `js/views/empty.js` | Generic placeholder view for pending governance modules (Exceptions, Maintenance) |
| `backend/.venv/` | Python virtual environment directory containing installed package binaries (ignored in git) |
| `backend/main.py` | FastAPI application defining routes, CORS policy, validation schemas, and static server |
| `backend/db.py` | Database helper establishing MySQL connections and transactional contexts |
| `backend/load_sql.py` | Standalone Python script executing database DDL and seed scripts without MySQL CLI |
| `backend/requirements.txt` | Production Python package dependencies (FastAPI, PyMySQL, Uvicorn, python-dotenv) |
| `backend/requirements-dev.txt` | Development and testing dependencies (pytest, httpx) |
| `backend/.env` | Local configuration file holding database credentials and host parameters |
| `backend/.env.example` | Template environment configuration file |
| `backend/README.md` | Backend developer documentation and setup guide ([backend/README.md](backend/README.md)) |
| `backend/test_api.py` | Automated test suite containing 23 API tests executed against an isolated test database |
| `backend/static/viewer.html` | Browser page providing live inspection of raw API and database payloads |
| `database/schema.sql` | MySQL DDL defining schema tables, keys, triggers, constraints, and views |
| `database/seed.sql` | Demo dataset SQL statements populating all initial records |
| `database/generate_seed.py` | Python utility script converting `slo-monitoring.json` into SQL seed statements |
| `..\..\..\partials\` | Shared layout templates (`header.html`, `sidebar-admin.html`, `footer.html`) |
| `..\..\..\assets\css\edx-global.css` | Platform-wide global CSS styling rules |

### Main Files to Know

1. `slo-monitoring.html`: Main HTML entry point loaded by the browser.
2. `js/slo-app.js`: Root application script orchestrating initialization and rendering.
3. `js/store.js`: Manages application state, polling every 5s, and notifying views of changes.
4. `js/api.js`: All frontend communication with the FastAPI backend.
5. `backend/main.py`: Complete backend REST API, validation rules, and transaction boundaries.
6. `database/schema.sql`: Source of truth for data models, integrity rules, and database triggers.
7. `backend/load_sql.py`: Command to initialize and reset the database to a clean demo seed.

WARNING: Other admin pages import `js/ui.js`, `js/util.js`, `js/charts.js`, `js/config.js` and `slo-app.css` from this folder; do not delete, move, or rename them.

## How to Run It

### Prerequisites
- Python 3.10+ installed
- MySQL 8.0 running on `127.0.0.1:3306`
- VS Code with the Live Server extension installed

### Setup and Execution (Windows PowerShell)

1. Set up the backend Python virtual environment:
   ```powershell
   cd pages\admin\slo-monitoring\backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```
2. Create and configure the environment file:
   ```powershell
   copy .env.example .env
   # Edit .env and set DB_PASSWORD=<your MySQL password>
   ```
3. Initialize the database (WARNING: Drops and recreates all tables, resetting to the demo snapshot):
   ```powershell
   python load_sql.py
   ```
4. Start the FastAPI backend server:
   ```powershell
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
5. Open the frontend using either method:
   - **Method A (VS Code Live Server):** Right-click `pages\admin\landing.html` and choose "Open with Live Server" (opens on port 5500), then click "SLO and Platform Operations" in the left sidebar.
   - **Method B (Backend Static Server):** Open `http://127.0.0.1:8000/site/pages/admin/slo-monitoring/slo-monitoring.html` in your browser.

Handy URLs:
- Interactive API Documentation: `http://127.0.0.1:8000/docs`
- Raw Data State Viewer: `http://127.0.0.1:8000/viewer`
- Health Check Endpoint: `http://127.0.0.1:8000/api/health`

## How to Verify Everything Works

1. **Health Verification:** Send a `GET` request to `http://127.0.0.1:8000/api/health`. Expected result: Status returns `"ok"` with exact fresh seed counts: `portfolio_meta: 10`, `services: 6`, `incidents: 4`, `reviewers: 3`, `slo_definitions: 6`, `snapshot_batches: 1`, `measurement_snapshots: 6`, `followups: 6`, `followup_evidence_returns: 5`, `followup_review_rounds: 2`, and `governance_history: 13`.
2. **API Documentation:** Navigate to `http://127.0.0.1:8000/docs`. Expected result: The Swagger UI renders cleanly and lists all endpoints.
3. **Frontend Initial Load:** Open the dashboard in your browser. Expected result: KPI cards, charts, and header/sidebar icons render without red error banners or browser console errors.
4. **Navigation Check:** Click through Monitoring, SLO Standards, Services, Incidents, and History & Evidence tabs. Expected result: Views switch immediately via client-side routing without full page reloads.
5. **Live Mutation Workflow:** Open the follow-up drawer for `FUP-SLO-2602`, submit new specialist evidence reference (e.g. `EVD-MANUAL-VERIFY`), and confirm the status advances to "Evidence Returned — Review Required" while a new row appears in History & Evidence. (Note: Run `python load_sql.py` in `backend\` afterwards to restore baseline seed data).
6. **Resilience Check:** Stop the backend Uvicorn process in PowerShell. Expected result: Frontend shows a red "Unable to load SLO monitoring data" warning banner. Restart Uvicorn; the banner clears automatically within 5 seconds.
7. **Automated Testing:** Run `python -m pytest -v` inside `backend\`. Expected result: All 23 tests pass against the isolated `edx_slo_monitoring_test` database.
8. **Security Boundary Check:** Navigate to `http://127.0.0.1:8000/site/pages/admin/slo-monitoring/HANDOFF.md`. Expected result: Server returns HTTP 404 Not Found because non-web file extensions are blocked.

## What Was Changed in This Cleanup and Fix Round

### Removed Files and Folders
- Legacy prototype files (`slo-monitoring.js`, `slo-monitoring-portfolio.js`, `slo-monitoring-policy.js`, `slo-monitoring.css`, `slo-view.ipynb`)
- Outdated audit directories and reports (`_audit/`)
- Redundant phase test scripts
- Pre-refactoring backup folders (`_backup_before_fix/`)
- Review artifacts directory (`_review_dump/`)
- Incomplete download artifacts (`.crdownload`)
- Python bytecode and execution caches (`__pycache__/`)
- Outdated template backups (`partials/sidebar-admin.html.bak`)

### Fixed Issues
1. `slo-monitoring.html`: Missing Bootstrap Icons CDN caused blank navigation and header icons; added Bootstrap Icons 1.11.3 stylesheet.
2. `js/router.js`: Unrecognized hash URLs left the view indefinitely on "Loading" and view errors failed silently; added automatic redirect to `#monitoring` and visible UI error alerts.
3. `backend/main.py`: Static file handler exposed internal markdown, source files, and environment configs; replaced with strict extension allowlist.
4. `backend/test_api.py` and `backend/load_sql.py`: Running automated tests wiped the development database; redirected tests to `edx_slo_monitoring_test` with safety guard assertion.
5. `backend/main.py`: The `/api/governance-history` endpoint accepted unbounded limits; enforced query parameter validation restricting `limit` to 1-1000.
6. `database/schema.sql`: Contained deprecated view definition; removed redundant `v_followup_register` view.
7. `requirements.txt` and `requirements-dev.txt`: Unpinned packages and mixed testing tools; pinned runtime packages and moved pytest and httpx to `requirements-dev.txt`.
8. `backend/main.py`: Health check leaked internal server and database engine details; sanitized `/api/health` output.
9. `backend/README.md`: Omitted host binding and network boundary constraints; added explicit security notes and `--host 127.0.0.1` instructions.
10. Database reset: Lingering test mutations corrupted baseline values; reseeded database to establish clean reference counts.
11. `js/api.js`: Accessing the dashboard via `http://127.0.0.1:8000/site/...` caused API errors due to empty base URL; resolved by adding fallback to `location.origin` in `buildUrl()` (verified implemented).

## Known Limitations

- Write endpoints lack authentication; user and reviewer identities are supplied in request payloads by the client.
- Database access uses MySQL `root` account credentials configured in `.env` (acceptable for local development demo only).
- The frontend store polls eight separate API endpoints concurrently every 5 seconds, and the backend instantiates a new database connection per request without connection pooling.
- SLO compliance metrics and current percentages are static demonstration snapshot values rather than metrics calculated dynamically from a live telemetry stream.
- In the sample dataset, the Query Latency snapshot (`SLO-QUERY-LAT-001`) is linked to notification incident `INC-260928-04` (sample-data quirk).
- Other Platform Admin modules in `pages/admin/*` read static demo JSON files from `_shared/demo-data/` rather than reading from MySQL.

## How to Explain This to My Manager (2-Minute Talking Points)

- "I developed and hardened the Platform Admin SLO Monitoring and Reliability Governance console, providing unified visibility into SLO compliance, error budget burn rates, and assurance evidence across 6 platform services."
- "The solution follows a clean 3-tier architecture comprising a vanilla ES-module frontend, a Python FastAPI REST API, and a MySQL 8 database storing governed demonstration snapshots."
- "The backend never hard-codes or caches state; every request queries MySQL directly, and the frontend refreshes automatically using 5-second polling."
- "I implemented a complete 4-step governance workflow for reliability follow-ups: admin requests evidence, specialists submit documentation, independent reviewers verify artifacts, and records are closed or returned."
- "The database layer actively protects governance integrity: evidence returns and review rounds are strictly append-only via triggers, self-review is prevented by constraints, and SLI percentages are computed directly by the database."
- "During this cleanup round, I eliminated deprecated legacy scripts, resolved asset exposure risks via static file filtering, isolated test databases, and fixed frontend routing failures."
- "For production readiness, our next roadmap priorities should be adding corporate SSO/OAuth authentication, establishing a database connection pool, and connecting live Prometheus/OpenTelemetry metric feeds."

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Red banner: "Unable to load SLO monitoring data" | Backend service is stopped, crashed, or listening on an incorrect port | Run `uvicorn main:app --host 127.0.0.1 --port 8000` in `backend\` and check terminal logs. |
| HTTP 503 "Database unavailable" | MySQL 8 service is not running or credentials in `.env` are invalid | Start the MySQL 8 service on port 3306 and verify `DB_PASSWORD` in `backend\.env`. |
| Missing or blank navigation icons | Bootstrap Icons CDN request blocked, offline, or network unreachable | Confirm connectivity to `cdn.jsdelivr.net` or check browser dev tools for blocked stylesheet requests. |
| Startup error: Port 8000 already in use | Another application or orphaned Uvicorn instance is binding port 8000 | Stop the existing process (`Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process`) or run Uvicorn on another port. |
| CORS error in browser developer console | Frontend accessed via non-whitelisted host or custom IP address | Access the dashboard strictly via `http://127.0.0.1:5500` (Live Server) or `http://127.0.0.1:8000/site/...`. |
