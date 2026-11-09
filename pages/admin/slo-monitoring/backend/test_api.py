"""API tests. They RESET the database to the demo seed before every test (schema.sql + seed.sql).
Run from the backend folder:  python -m pytest -v
"""
import os
import tempfile
from datetime import datetime
from pathlib import Path

# A throw-away copy of the project's folder layout, so the /site mount can be tested safely.
_SITE = Path(tempfile.mkdtemp())
for _d in ("pages/admin/slo-monitoring/backend", "pages/admin/slo-monitoring/database", "assets/css"):
    (_SITE / _d).mkdir(parents=True)
(_SITE / "pages/admin/slo-monitoring/slo-monitoring.html").write_text("<h1>the page</h1>")
(_SITE / "pages/admin/slo-monitoring/backend/.env").write_text("DB_PASSWORD=top-secret")
(_SITE / "pages/admin/slo-monitoring/backend/main.py").write_text("print('source')")
(_SITE / "pages/admin/slo-monitoring/database/schema.sql").write_text("-- sql")
(_SITE / "assets/css/edx.css").write_text("body{}")
os.environ["SITE_ROOT"] = str(_SITE)

import json
import re

import pymysql
import pytest
from fastapi.testclient import TestClient

os.environ["DB_NAME"] = "edx_slo_monitoring_test"
if os.environ.get("DB_NAME") == "edx_slo_monitoring":
    raise RuntimeError("Running tests against live database edx_slo_monitoring is forbidden")

import main
from db import connect
from load_sql import load

NEEL = "Neel Shah — Platform Reliability Governance"
MAYA = "Maya Sen — Platform Assurance Reviewer"
CLOSED = main.ST_CLOSED
MORE = main.ST_MORE
NOW = datetime(2026, 11, 5, 10, 0, 0)


@pytest.fixture(autouse=True)
def fresh_db(monkeypatch):
    if os.environ.get("DB_NAME") == "edx_slo_monitoring":
        raise RuntimeError("Running tests against live database edx_slo_monitoring is forbidden")
    monkeypatch.setattr(main, "utcnow", lambda: NOW)
    load(db_name="edx_slo_monitoring_test")


@pytest.fixture
def api():
    return TestClient(main.app)


def evidence(api, fid, ref, **extra):
    return api.post(f"/api/followups/{fid}/specialist-evidence", json={"evidence_ref": ref, **extra})


def review(api, fid, **kw):
    body = {"reviewer": MAYA, "outcome": CLOSED, "review_evidence": "EVD-REV-1", "rationale": "Evidence is complete and consistent."}
    body.update(kw)
    return api.post(f"/api/followups/{fid}/reviews", json=body)


def test_health(api):
    r = api.get("/api/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_monitoring_matches_json_shape(api):
    d = api.get("/api/monitoring").json()
    assert d["snapshot_id"] == "OBS-20261005-1430" and d["snapshot_finalized_at"] == "2026-10-05T14:30:00Z"
    assert len(d["snapshots"]) == 6 and len(d["followups"]) == 6 and len(d["reviewers"]) == 3
    pipe = next(s for s in d["snapshots"] if s["slo_id"] == "SLO-PIPE-SUCCESS-001")
    assert pipe["exclusion_evidence"] is None and pipe["expected_rate"] == "98.84%" and pipe["excluded_count"] == 80
    f = {x["id"]: x for x in d["followups"]}
    assert f["FUP-SLO-2601"]["source_returned_evidence"] == "EVD-API-BURN-DRILLDOWN-0510"
    assert f["FUP-SLO-2605"]["source_returned_evidence"] is None            # re-requested: no current return
    assert f["FUP-SLO-2606"]["source_returned_evidence"] == "EVD-RECOVERY-COHORT-0510"
    assert f["FUP-SLO-2606"]["review_rounds"][0]["source_evidence"] == "EVD-RECOVERY-COHORT-0510"


def test_dashboard_reconciles(api):
    rows = {r["slo_id"]: r for r in api.get("/api/dashboard").json()}
    assert all(r["sli_reconciled"] == 1 for r in rows.values())
    assert [k for k, r in rows.items() if r["exclusion_evidence_missing"]] == ["SLO-PIPE-SUCCESS-001"]


def test_unknown_followup_404(api):
    assert api.get("/api/followups/NOPE").status_code == 404
    assert evidence(api, "NOPE", "X").status_code == 404


def test_record_evidence_happy_path(api):
    r = evidence(api, "FUP-SLO-2602", "EVD-PIPE-RECOVERY-1")
    assert r.status_code == 201
    f = r.json()
    assert f["status"] == main.ST_RETURNED and f["source_returned_evidence"] == "EVD-PIPE-RECOVERY-1"
    assert f["source_returned_by"] == "Data Platform Operations" and f["source_returned_at"] == "2026-11-05T10:00:00Z"
    h = api.get("/api/governance-history", params={"subject_id": "FUP-SLO-2602"}).json()
    assert len(h) == 1 and h[0]["status"] == "Open" and h[0]["source_evidence"] == "EVD-PIPE-RECOVERY-1"


def test_record_evidence_rules(api):
    assert evidence(api, "FUP-SLO-2606", "EVD-NEW").status_code == 409                          # closed
    assert evidence(api, "FUP-SLO-2601", "EVD-NEW").status_code == 409                          # already awaiting review
    assert evidence(api, "FUP-SLO-2605", "evd-query-initial-0510").status_code == 409           # reused ref (case-insensitive)
    assert evidence(api, "FUP-SLO-2605", "EVD-QUERY-RETURN-0510").status_code == 409            # reviewer's ref reused
    assert evidence(api, "FUP-SLO-2602", "   ").status_code == 422
    assert evidence(api, "FUP-SLO-2602", "EVD-A", returned_at="2026-10-05T13:00:00Z").status_code == 422   # before request
    assert evidence(api, "FUP-SLO-2602", "EVD-A", returned_at="2026-12-01T00:00:00Z").status_code == 422   # future
    assert evidence(api, "FUP-SLO-2602", "EVD-A", returned_at="not a date").status_code == 422
    assert evidence(api, "FUP-SLO-2605", "EVD-B", returned_at="2026-10-05T12:00:00Z").status_code == 422   # before last review 12:45
    assert evidence(api, "FUP-SLO-2605", "EVD-B", returned_at="2026-10-05T12:45:30Z").status_code == 201   # same minute is allowed


def test_review_rules(api):
    f = "FUP-SLO-2601"
    assert review(api, f, reviewer=NEEL).status_code == 422                       # requester cannot review
    assert review(api, f, reviewer="Nobody").status_code == 422
    assert review(api, f, review_evidence="EVD-API-BURN-DRILLDOWN-0510").status_code == 409   # same as specialist evidence
    assert review(api, f, review_evidence="  ").status_code == 422
    assert review(api, f, rationale="too short").status_code == 422
    assert review(api, f, outcome="Whatever").status_code == 422
    assert review(api, "FUP-SLO-2602").status_code == 409                         # nothing returned yet
    assert review(api, "FUP-SLO-2606").status_code == 409                         # already closed


def test_close_follow_up(api):
    r = review(api, "FUP-SLO-2601")
    assert r.status_code == 201
    f = r.json()
    assert f["status"] == CLOSED and f["independent_reviewer"] == MAYA and len(f["review_rounds"]) == 1
    assert f["review_rounds"][0]["source_evidence"] == "EVD-API-BURN-DRILLDOWN-0510"
    assert f["source_returned_evidence"] == "EVD-API-BURN-DRILLDOWN-0510"      # kept when closed, like FUP-SLO-2606
    h = api.get("/api/governance-history", params={"subject_id": "FUP-SLO-2601"}).json()[0]
    assert h["status"] == "Closed" and h["verification_evidence"] == "EVD-REV-1" and h["assurance"] == "Assurance Current"


def test_measurement_concerns_need_confirmation(api):
    assert evidence(api, "FUP-SLO-2602", "EVD-PIPE-1").status_code == 201        # pipeline: Evidence Limited, no exclusion evidence
    assert review(api, "FUP-SLO-2602").status_code == 422
    assert review(api, "FUP-SLO-2602", outcome=MORE).status_code == 201          # returning needs no confirmation
    assert evidence(api, "FUP-SLO-2602", "EVD-PIPE-2").status_code == 201
    r = review(api, "FUP-SLO-2602", review_evidence="EVD-REV-2", confirmed=True)
    assert r.status_code == 201 and r.json()["status"] == CLOSED and len(r.json()["review_rounds"]) == 2


def test_return_cycle_keeps_history(api):
    r = review(api, "FUP-SLO-2601", outcome=MORE, rationale="Tenant impact by tier is missing.")
    f = r.json()
    assert f["status"] == MORE and f["source_returned_evidence"] is None and f["independent_reviewer"] == MAYA
    f = evidence(api, "FUP-SLO-2601", "EVD-API-BURN-2").json()
    assert f["status"] == main.ST_RETURNED and f["independent_reviewer"] is None and len(f["review_rounds"]) == 1
    f = review(api, "FUP-SLO-2601", review_evidence="EVD-REV-2").json()
    assert f["status"] == CLOSED and [x["source_evidence"] for x in f["review_rounds"]] == ["EVD-API-BURN-DRILLDOWN-0510", "EVD-API-BURN-2"]


def test_failed_request_changes_nothing(api):
    review(api, "FUP-SLO-2601", rationale="short")
    evidence(api, "FUP-SLO-2602", "EVD-A", returned_at="2026-10-05T13:00:00Z")
    assert api.get("/api/followups/FUP-SLO-2601").json()["status"] == main.ST_RETURNED
    assert api.get("/api/followups/FUP-SLO-2602").json()["status"] == main.ST_AWAITING
    assert api.get("/api/governance-history").json().__len__() == 13


def test_database_keeps_history_append_only():
    conn = connect()
    cur = conn.cursor()
    with pytest.raises(pymysql.err.Error):
        cur.execute("UPDATE followup_review_rounds SET rationale='edited'")
    with pytest.raises(pymysql.err.Error):
        cur.execute("DELETE FROM followup_evidence_returns")
    conn.close()


# ------------------------------------------------------------ full-API tests

def test_health_reports_live_row_counts(api):
    h = api.get("/api/health").json()
    assert h["database"] == os.environ.get("DB_NAME", "edx_slo_monitoring")
    assert h["row_counts"] == {"services": 6, "incidents": 4, "reviewers": 3, "slo_definitions": 6, "snapshot_batches": 1, "portfolio_meta": 10,
                               "measurement_snapshots": 6, "followups": 6, "followup_evidence_returns": 5,
                               "followup_review_rounds": 2, "governance_history": 13}


def test_slo_endpoints(api):
    rows = api.get("/api/slos").json()
    assert len(rows) == 6 and all(r["sli_reconciled"] == 1 for r in rows)
    pipe = api.get("/api/slos/SLO-PIPE-SUCCESS-001").json()
    assert pipe["status"] == "Breached" and pipe["sli_pct"] == 98.84 and pipe["service_name"] == "Data Pipeline Orchestration"
    assert len(pipe["measurement_concerns"]) == 2 and [f["id"] for f in pipe["followups"]] == ["FUP-SLO-2602"]
    assert api.get("/api/slos/SLO-NOPE").status_code == 404
    recovery = api.get("/api/slos/SLO-RECOVERY-001").json()
    assert recovery["burn_1h"] is None and recovery["measurement_concerns"] == []      # 'N/A' stays empty, never derived


def test_reference_endpoints(api):
    assert len(api.get("/api/services").json()) == 6
    svc = api.get("/api/services/SVC-PLATFORM").json()
    assert sorted(s["slo_id"] for s in svc["slos"]) == ["SLO-PLAT-AVAIL-001", "SLO-RECOVERY-001"]
    assert len(api.get("/api/incidents").json()) == 4
    assert api.get("/api/incidents/INC-261005-07").json()["severity"] == "P2 High"
    assert api.get("/api/incidents/PLAT-INC-ONCALL").status_code == 404                # referenced, but has no record
    assert len(api.get("/api/reviewers").json()) == 3
    assert api.get("/api/snapshot-batches").json()[0]["snapshot_id"] == "OBS-20261005-1430"
    snaps = api.get("/api/snapshots").json()
    assert len(snaps) == 6 and next(s for s in snaps if s["slo_id"] == "SLO-API-SUCCESS-001")["sli_pct"] == 99.91
    assert len(api.get("/api/snapshots", params={"slo_id": "SLO-ID-AUTH-001"}).json()) == 1


def test_values_come_from_mysql_not_code(api):
    """Change rows directly in MySQL; the API must show the new values immediately."""
    conn = connect()
    cur = conn.cursor()
    cur.execute("UPDATE slo_definitions SET current_pct=99.50, status='Breached' WHERE slo_id='SLO-API-SUCCESS-001'")
    cur.execute("UPDATE measurement_snapshots SET successful_count=999500 WHERE slo_id='SLO-API-SUCCESS-001'")
    cur.execute("UPDATE snapshot_batches SET measurement_source='Changed in MySQL', version=7")
    cur.execute("INSERT INTO reviewers (display_name) VALUES ('Test Reviewer')")
    conn.commit()
    conn.close()
    row = api.get("/api/slos/SLO-API-SUCCESS-001").json()
    assert row["current_pct"] == 99.5 and row["status"] == "Breached" and row["sli_pct"] == 99.95
    assert row["sli_reconciled"] == 0 and len(row["measurement_concerns"]) == 1          # 99.50 reported vs 99.95 counted
    m = api.get("/api/monitoring").json()
    assert m["measurement_source"] == "Changed in MySQL" and m["version"] == 7
    assert "Test Reviewer" in m["reviewers"] and api.get("/api/health").json()["row_counts"]["reviewers"] == 4


def new_followup(api, **kw):
    body = {"slo_id": "SLO-API-SUCCESS-001", "title": "API tenant impact", "priority": "P1", "requested_by": NEEL,
            "due_at": "2026-11-06T10:00:00Z", "rationale": "Need tenant impact by service tier."}
    body.update(kw)
    return api.post("/api/followups", json=body)


def test_create_followup(api):
    r = new_followup(api)
    assert r.status_code == 201
    f = r.json()
    assert f["id"] == "FUP-SLO-2607" and f["status"] == main.ST_AWAITING and f["specialist_owner"] == "API Reliability"
    assert f["requested_at"] == "2026-11-05T10:00:00Z" and f["review_rounds"] == []
    assert new_followup(api).json()["id"] == "FUP-SLO-2608"
    h = api.get("/api/governance-history", params={"subject_id": "FUP-SLO-2607"}).json()
    assert len(h) == 1 and h[0]["decision"] == "Specialist evidence requested"
    assert evidence(api, "FUP-SLO-2607", "EVD-NEW-1").status_code == 201                # new follow-ups flow into the normal workflow


def test_create_followup_rules(api):
    assert new_followup(api, slo_id="SLO-NOPE").status_code == 404
    assert new_followup(api, priority="P9").status_code == 422
    assert new_followup(api, title="  ").status_code == 422
    assert new_followup(api, rationale="short").status_code == 422
    assert new_followup(api, requested_by="Nobody").status_code == 422
    assert new_followup(api, due_at="2026-11-05T09:00:00Z").status_code == 422          # not in the future
    assert new_followup(api, due_at="garbage").status_code == 422
    assert len(api.get("/api/followups").json()) == 6


def test_viewer_page_is_served(api):
    page = api.get("/viewer")
    assert page.status_code == 200 and "Live Backend Viewer" in page.text
    assert api.get("/", follow_redirects=False).headers["location"] == "/viewer"


# ------------------------------------------------------------ /api/model and the web page

def test_model_has_the_shape_the_page_expects(api):
    m = api.get("/api/model").json()
    assert m["meta"]["role_boundary"] and m["meta"]["data_as_of"] == "2026-10-05T14:30:00Z"
    slos = {s["id"]: s for s in m["slo_definitions"]}
    assert len(slos) == 6 and slos["SLO-PIPE-SUCCESS-001"]["current"] == "98.84%"
    assert slos["SLO-API-SUCCESS-001"]["target"] == "\u2265 99.90%" and slos["SLO-API-SUCCESS-001"]["burn_1h"] == "1.62x"
    assert slos["SLO-API-SUCCESS-001"]["error_budget_remaining"] == "11.8%"
    assert slos["SLO-RECOVERY-001"]["burn_1h"] == "N/A"                              # never derived, never 0
    assert (len(m["services"]), len(m["incidents"]), len(m["governance_history"])) == (6, 4, 13)
    ma = m["monitoring_assurance"]
    assert ma["snapshot_id"] == "OBS-20261005-1430" and len(ma["followups"]) == 6 and len(ma["snapshots"]) == 6
    assert set(m["services"][0]) == {"id", "name", "tier", "status", "customer_impact"}


def test_model_matches_the_demo_json_values(api):
    """The database holds the same numbers as slo-monitoring.json (skipped if the file is not next to backend/)."""
    path = Path(__file__).resolve().parent.parent / "slo-monitoring.json"
    if not path.exists():
        pytest.skip("slo-monitoring.json not found")
    want = json.loads(path.read_text(encoding="utf-8"))
    got = api.get("/api/model").json()
    num = lambda t: None if (m := re.search(r"-?\d+(\.\d+)?", str(t or ""))) is None else float(m.group(0))
    by_id = {s["id"]: s for s in got["slo_definitions"]}
    for w in want["slo_definitions"]:
        g = by_id[w["id"]]
        assert g["target"] == w["target"] and g["status"] == w["status"] and g["name"] == w["name"]
        for key in ("current", "error_budget_remaining", "burn_1h", "burn_6h", "burn_24h"):
            assert num(g[key]) == num(w[key]), (w["id"], key)
    assert {s["id"]: s["status"] for s in got["services"]} == {s["id"]: s["status"] for s in want["services"]}
    assert {i["id"]: i["severity"] for i in got["incidents"]} == {i["id"]: i["severity"] for i in want["incidents"]}
    assert got["meta"]["role_boundary"] == want["meta"]["role_boundary"]


def test_model_is_live_not_cached(api):
    conn = connect()
    cur = conn.cursor()
    cur.execute("UPDATE portfolio_meta SET meta_value='\"Changed in MySQL\"' WHERE meta_key='role_boundary'")
    cur.execute("UPDATE slo_definitions SET status='Breached', burn_6h=9.99 WHERE slo_id='SLO-ID-AUTH-001'")
    conn.commit()
    conn.close()
    m = api.get("/api/model").json()
    assert m["meta"]["role_boundary"] == "Changed in MySQL"
    row = next(s for s in m["slo_definitions"] if s["id"] == "SLO-ID-AUTH-001")
    assert row["status"] == "Breached" and row["burn_6h"] == "9.99x"


def test_site_serves_pages_but_never_secrets(api):
    ok = api.get("/site/pages/admin/slo-monitoring/slo-monitoring.html")
    assert ok.status_code == 200 and "the page" in ok.text
    assert api.get("/site/assets/css/edx.css").status_code == 200
    for blocked in ("/site/pages/admin/slo-monitoring/backend/.env",
                    "/site/pages/admin/slo-monitoring/backend/main.py",
                    "/site/pages/admin/slo-monitoring/database/schema.sql",
                    "/site/pages/admin/slo-monitoring/%62ackend/%2eenv",      # URL-encoded tricks
                    "/site/pages/admin/slo-monitoring/../../../../etc/passwd"):
        r = api.get(blocked)
        assert r.status_code == 404 and "top-secret" not in r.text, blocked
