# SLO Monitoring — Backend (Python / FastAPI / MySQL)

## Where every file goes
```
pages/admin/slo-monitoring/
├── slo-monitoring.html / .css / .js / .json / -portfolio.js / -policy.js   (existing page files, unchanged)
├── database/
│   ├── schema.sql          tables, rules, triggers, views
│   ├── seed.sql            demo data
│   └── generate_seed.py    rebuilds seed.sql from ../slo-monitoring.json
├── backend/
│   ├── main.py             the API (all endpoints)
│   ├── db.py               MySQL connection
│   ├── load_sql.py         loads schema.sql + seed.sql from Python
│   ├── static/viewer.html  live data viewer page (served at /viewer)
│   ├── test_api.py         23 automated tests
│   ├── requirements.txt
│   ├── .env.example        copy to .env and add your MySQL password
│   └── README.md
└── .gitignore
```
Do NOT submit: `.venv/`, `.env` (has your password), `__pycache__/`, `.pytest_cache/`.
Create the virtual environment inside `backend`, not inside `database`.

## Run (PowerShell, from the backend folder)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env           # edit .env and set DB_PASSWORD
python load_sql.py               # creates the database + demo data (re-run any time to reset)
uvicorn main:app --host 127.0.0.1 --port 8000
```

## Security note
The API has no authentication and must only run on a trusted machine with `--host 127.0.0.1`. Reviewer identity is client-supplied in request payloads.

## Open the page through the API (same origin)
`http://127.0.0.1:8000/site/pages/admin/slo-monitoring/slo-monitoring.html` (or use VS Code Live Server; the API allows localhost on any port).

## See it with your own eyes (no terminal needed)
1. Open http://127.0.0.1:8000/viewer. The badge at the top must say "connected to MySQL 8.0.xx". The SLO, follow-up, history and service tables are all fetched from the API.
2. Open http://127.0.0.1:8000/docs. Click an endpoint, then "Try it out" and "Execute" to see the raw JSON.
3. Prove nothing is hard-coded. Leave /viewer open (auto-refresh every 3 s). In MySQL Workbench (or the `mysql` prompt) run:
   ```sql
   USE edx_slo_monitoring;
   UPDATE slo_definitions SET current_pct = 99.50, status = 'Breached' WHERE slo_id = 'SLO-API-SUCCESS-001';
   ```
   Within 3 seconds the changed cells flash yellow and "SLI reconciled" becomes NO. Also try:
   ```sql
   UPDATE measurement_snapshots SET successful_count = 999500 WHERE slo_id = 'SLO-API-SUCCESS-001';
   INSERT INTO reviewers (display_name) VALUES ('Test Reviewer');
   ```
   The SLI becomes 99.9500% (MySQL calculates it) and the reviewers row count goes up.
4. Write path: in /docs run `POST /api/followups/FUP-SLO-2602/specialist-evidence` with `{"evidence_ref": "EVD-DEMO-1"}`. The follow-up status changes in /viewer and a new line appears in the history table. Confirm in MySQL: `SELECT * FROM followup_evidence_returns;`
5. Reset the demo data afterwards: `python load_sql.py`.

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | /viewer | Live data viewer page |
| GET | /api/health | Connection proof + live row count per table |
| GET | /api/monitoring | Whole page model (same shape as `monitoring_assurance` in the JSON) |
| GET | /api/dashboard | Latest snapshot joined to each SLO (view) |
| GET | /api/meta | Page-level facts (product, role boundary, data_as_of) from the `portfolio_meta` table |
| GET | /api/model | Everything the legacy page model needs in one call (same shape as the demo JSON) |
| GET | /site/... | The project's pages served by the API (same origin). `.env`, `.py`, `.sql`, `backend/`, `database/` are blocked |
| GET | /api/slos, /api/slos/{id} | SLO definition + latest measurement; detail adds measurement concerns and follow-ups |
| GET | /api/services, /api/services/{id} | Services (detail lists their SLOs) |
| GET | /api/incidents, /api/incidents/{id} | Incidents |
| GET | /api/reviewers | People allowed to review |
| GET | /api/snapshot-batches | Published measurement batches |
| GET | /api/snapshots?snapshot_id=&slo_id= | Measurement evidence rows (SLI computed by MySQL) |
| GET | /api/followups, /api/followups/{id} | Follow-up register with review rounds |
| GET | /api/governance-history?subject_id=&limit= | Decision log |
| POST | /api/followups | Request specialist evidence (opens a follow-up) |
| POST | /api/followups/{id}/specialist-evidence | Record specialist evidence |
| POST | /api/followups/{id}/reviews | Independent review: close or return for more evidence |

Role boundary: the API only records measurements, evidence and governance decisions. It has no endpoint to acknowledge alerts, recover services, change configuration or approve maintenance. Measurement data (SLOs, snapshots, services, incidents) is read-only through the API because it is sourced externally; you change it in MySQL as in step 3.

## Tests
`python -m pytest -v` runs 23 tests. They reset the database to the demo seed first, so use only on this demo database. Run `python load_sql.py` afterwards for a clean state.
