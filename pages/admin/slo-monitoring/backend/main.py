"""EduData Exchange — SLO Monitoring & Reliability Assurance API.

Run:  uvicorn main:app --reload --port 8000        Docs: http://127.0.0.1:8000/docs

Role boundary: this API only RECORDS measurements, evidence and governance decisions.
It never acknowledges alerts, recovers services, changes configuration or approves maintenance.
"""
import json
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

import pymysql
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from starlette.staticfiles import StaticFiles
from pathlib import Path

from pydantic import BaseModel, Field

from db import transaction

ST_AWAITING = "Awaiting Specialist Evidence"
ST_RETURNED = "Evidence Returned — Review Required"
ST_MORE = "Returned — Additional Specialist Evidence Required"
ST_CLOSED = "Closed — Independently Verified"
ADMIN = os.getenv("ADMIN_NAME", "Platform Admin — Reliability Governance")   # recorded_by on every decision
TABLES = ["portfolio_meta", "services", "incidents", "reviewers", "slo_definitions", "snapshot_batches", "measurement_snapshots",
          "followups", "followup_evidence_returns", "followup_review_rounds", "governance_history"]
VIEWER = Path(__file__).resolve().parent / "static" / "viewer.html"
FUTURE_SKEW = timedelta(minutes=5)

app = FastAPI(title="EduData Exchange — SLO Monitoring API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.exception_handler(pymysql.err.OperationalError)
async def db_unavailable(_: Request, exc: Exception):
    return JSONResponse(status_code=503, content={"detail": "Database unavailable. Check MySQL is running and backend/.env."})


@app.exception_handler(pymysql.err.IntegrityError)
async def db_rule(_: Request, exc: Exception):
    return JSONResponse(status_code=409, content={"detail": f"A database rule rejected this change: {exc.args[-1]}"})


# ---------------------------------------------------------------- helpers

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ") if dt else None


def parse_ts(text):
    try:
        d = datetime.fromisoformat(text.strip().replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(422, "Time must be an ISO 8601 timestamp, e.g. 2026-10-05T14:30:00Z.")
    if d.tzinfo:
        d = d.astimezone(timezone.utc).replace(tzinfo=None)
    return d.replace(microsecond=0)


def minute_floor(dt):
    return dt.replace(second=0, microsecond=0)


def plain(row):
    """Makes a DB row JSON-friendly: Decimal -> float, datetime -> ISO UTC string."""
    out = {}
    for k, v in row.items():
        out[k] = float(v) if isinstance(v, Decimal) else iso(v) if isinstance(v, datetime) else v
    return out


# ---------------------------------------------------------------- read models

def snapshot_json(r):
    rate = r["expected_rate_pct"]
    return {
        "slo_id": r["slo_id"], "service_id": r["service_id"], "source_reference": r["source_reference"],
        "source_owner": r["source_owner"], "observed_at": iso(r["observed_at"]), "window": r["window_label"],
        "population": r["population"], "eligible_count": r["eligible_count"], "successful_count": r["successful_count"],
        "excluded_count": r["excluded_count"], "exclusion_basis": r["exclusion_basis"],
        "exclusion_evidence": r["exclusion_evidence"], "quality": r["quality"], "quality_note": r["quality_note"],
        "incident_id": r["incident_id"], "measurement_treatment": r["measurement_treatment"],
        "expected_rate": None if rate is None else f"{float(rate):.2f}%",
    }


def load_followups(cur, followup_id=None):
    """Follow-ups in the same shape as monitoring_assurance.followups in slo-monitoring.json."""
    cur.execute("SELECT * FROM followups" + (" WHERE followup_id=%s" if followup_id else "") + " ORDER BY followup_id",
                (followup_id,) if followup_id else ())
    rows = cur.fetchall()
    if not rows:
        return []
    ids = [r["followup_id"] for r in rows]
    marks = ",".join(["%s"] * len(ids))
    cur.execute(f"SELECT * FROM followup_evidence_returns WHERE followup_id IN ({marks}) ORDER BY return_id", ids)
    returns = {}
    for r in cur.fetchall():
        returns.setdefault(r["followup_id"], []).append(r)
    cur.execute(f"SELECT * FROM followup_review_rounds WHERE followup_id IN ({marks}) ORDER BY followup_id, round_no", ids)
    rounds = {}
    for r in cur.fetchall():
        rounds.setdefault(r["followup_id"], []).append(r)

    result = []
    for f in rows:
        rets = returns.get(f["followup_id"], [])
        # Convention in the data: while evidence is being re-requested there is no "current" return.
        cur_ret = rets[-1] if rets and f["status"] in (ST_RETURNED, ST_CLOSED) else None
        result.append({
            "id": f["followup_id"], "slo_id": f["slo_id"], "title": f["title"], "priority": f["priority"],
            "status": f["status"], "requested_by": f["requested_by"], "requested_at": iso(f["requested_at"]),
            "specialist_owner": f["specialist_owner"], "due_at": iso(f["due_at"]),
            "source_returned_evidence": cur_ret["evidence_ref"] if cur_ret else None,
            "source_returned_by": cur_ret["returned_by"] if cur_ret else None,
            "source_returned_at": iso(cur_ret["returned_at"]) if cur_ret else None,
            "rationale": f["rationale"], "independent_reviewer": f["independent_reviewer"],
            "review_evidence": f["review_evidence"], "reviewed_at": iso(f["reviewed_at"]),
            "review_rationale": f["review_rationale"],
            "review_rounds": [{"outcome": r["outcome"], "reviewer": r["reviewer"], "review_evidence": r["review_evidence"],
                               "source_evidence": r["source_evidence"], "at": iso(r["reviewed_at"]),
                               "rationale": r["rationale"]} for r in rounds.get(f["followup_id"], [])],
        })
    return result


def used_refs(fu):
    refs = {fu["source_returned_evidence"], fu["review_evidence"]}
    for r in fu["review_rounds"]:
        refs.update((r["source_evidence"], r["review_evidence"]))
    return {x.strip().lower() for x in refs if x}


def locked_followup(cur, followup_id):
    """Locks the follow-up row for this transaction (prevents two people acting at once)."""
    cur.execute("SELECT * FROM followups WHERE followup_id=%s FOR UPDATE", (followup_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(404, f"Follow-up {followup_id} not found.")
    return row


def measurement_concerns(cur, slo_id):
    cur.execute("SELECT * FROM v_monitoring_dashboard WHERE slo_id=%s", (slo_id,))
    v = cur.fetchone()
    if not v:
        return []
    issues = []
    if not v["sli_reconciled"]:
        issues.append("The reported SLI does not reconcile to the eligible/successful sample counts.")
    if v["exclusion_evidence_missing"]:
        issues.append(f"{v['excluded_count']} excluded samples have no recorded exclusion evidence.")
    if v["quality"] != "Validated":
        issues.append(f'Evidence quality is "{v["quality"]}".')
    return issues


def add_history(cur, *, subject, subject_id, decision, assurance, specialist_owner,
                source_evidence=None, decision_evidence=None, verification_evidence=None, status="Open"):
    now = utcnow()
    cur.execute(
        "INSERT INTO governance_history (history_id, domain, subject, subject_id, decision, assurance, specialist_owner,"
        " source_evidence, decision_evidence, verification_evidence, checkpoint, recorded_by, recorded_at, status)"
        " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s)",
        (f"GOV-{now:%Y%m%d-%H%M%S}-{secrets.token_hex(2).upper()}", "Monitoring Follow-up", subject, subject_id,
         decision, assurance, specialist_owner, source_evidence, decision_evidence, verification_evidence,
         ADMIN, now, status))


# ---------------------------------------------------------------- GET endpoints

@app.get("/", include_in_schema=False)
def home():
    return RedirectResponse("/viewer")


@app.get("/viewer", include_in_schema=False)
def viewer():
    """Live data viewer: a page that reads everything from this API (and so from MySQL)."""
    return FileResponse(VIEWER)


@app.get("/api/health")
def health():
    """Proves the API is connected to MySQL, and shows live row counts for every table."""
    with transaction() as cur:
        cur.execute("SELECT VERSION() AS v, DATABASE() AS db")
        info = cur.fetchone()
        counts = {}
        for table in TABLES:
            cur.execute(f"SELECT COUNT(*) AS n FROM {table}")
            counts[table] = cur.fetchone()["n"]
        return {"status": "ok", "database": info["db"],
                "server_time_utc": iso(utcnow()), "row_counts": counts}


def monitoring_payload(cur):
    cur.execute("SELECT * FROM snapshot_batches ORDER BY finalized_at DESC LIMIT 1")
    batch = cur.fetchone()
    if not batch:
        raise HTTPException(404, "No measurement snapshot has been loaded.")
    cur.execute("SELECT * FROM measurement_snapshots WHERE snapshot_id=%s ORDER BY slo_id", (batch["snapshot_id"],))
    snaps = [snapshot_json(r) for r in cur.fetchall()]
    cur.execute("SELECT display_name FROM reviewers ORDER BY display_name")
    return {
        "version": batch["version"], "snapshot_id": batch["snapshot_id"],
        "measurement_source": batch["measurement_source"], "snapshot_finalized_at": iso(batch["finalized_at"]),
        "reviewers": [r["display_name"] for r in cur.fetchall()], "snapshots": snaps,
        "followups": load_followups(cur), "business_signoff": batch["business_signoff"],
    }


@app.get("/api/monitoring")
def monitoring():
    """Same shape as monitoring_assurance in slo-monitoring.json, so the page can swap its data source."""
    with transaction() as cur:
        return monitoring_payload(cur)


def read_meta(cur):
    cur.execute("SELECT meta_key, meta_value FROM portfolio_meta ORDER BY meta_key")
    return {r["meta_key"]: json.loads(r["meta_value"]) for r in cur.fetchall()}


@app.get("/api/meta")
def meta():
    """Page-level facts: product, role boundary, data classification, snapshot time (data_as_of)."""
    with transaction() as cur:
        return read_meta(cur)


def pct(value, places):
    return None if value is None else f"{float(value):.{places}f}%"


def times(value):
    return "N/A" if value is None else f"{float(value):.2f}x"


@app.get("/api/model")
def model():
    """Everything the Monitoring page needs in ONE call, in the same shape the page already understands
    (the shape of slo-monitoring.json). Every value is read from MySQL on each request."""
    with transaction() as cur:
        meta_ = read_meta(cur)
        cur.execute("SELECT * FROM slo_definitions ORDER BY slo_id")
        slos_ = [{
            "id": r["slo_id"], "service_id": r["service_id"], "name": r["name"], "version": r["version"],
            "service_tier": r["service_tier"], "sli": r["sli_definition"], "target": r["target_display"],
            "window": r["window_label"], "current": pct(r["current_pct"], 2), "status": r["status"],
            "error_budget_remaining": pct(r["error_budget_remaining_pct"], 1),
            "burn_1h": times(r["burn_1h"]), "burn_6h": times(r["burn_6h"]), "burn_24h": times(r["burn_24h"]),
            "breach_forecast": r["breach_forecast"], "specialist_owner": r["specialist_owner"],
            "business_owner": r["business_owner"]} for r in cur.fetchall()]
        cur.execute("SELECT service_id AS id, name, tier, status, customer_impact FROM services ORDER BY service_id")
        services_ = cur.fetchall()
        cur.execute("SELECT incident_id AS id, title, severity, operational_state FROM incidents ORDER BY incident_id")
        incidents_ = cur.fetchall()
        cur.execute("SELECT * FROM governance_history ORDER BY recorded_at, history_id")
        history_ = [{
            "id": r["history_id"], "domain": r["domain"], "subject": r["subject"], "subject_id": r["subject_id"],
            "decision": r["decision"], "assurance": r["assurance"], "specialist_owner": r["specialist_owner"],
            "source_evidence": r["source_evidence"], "decision_evidence": r["decision_evidence"],
            "verification_evidence": r["verification_evidence"], "checkpoint": iso(r["checkpoint"]),
            "recorded_by": r["recorded_by"], "recorded_at": iso(r["recorded_at"]), "status": r["status"]}
            for r in cur.fetchall()]
        return {"meta": meta_, "slo_definitions": slos_, "services": services_, "incidents": incidents_,
                "governance_history": history_, "monitoring_assurance": monitoring_payload(cur),
                "server_time_utc": iso(utcnow())}


@app.get("/api/dashboard")
def dashboard():
    """Latest snapshot joined with each SLO position (v_monitoring_dashboard)."""
    with transaction() as cur:
        cur.execute("SELECT * FROM v_monitoring_dashboard ORDER BY slo_id")
        return [plain(r) for r in cur.fetchall()]


@app.get("/api/followups")
def followups():
    with transaction() as cur:
        return load_followups(cur)


@app.get("/api/followups/{followup_id}")
def followup(followup_id: str):
    with transaction() as cur:
        found = load_followups(cur, followup_id)
        if not found:
            raise HTTPException(404, f"Follow-up {followup_id} not found.")
        return found[0]


@app.get("/api/governance-history")
def governance_history(subject_id: Optional[str] = None, limit: int = Query(200, ge=1, le=1000)):
    with transaction() as cur:
        cur.execute("SELECT * FROM governance_history" + (" WHERE subject_id=%s" if subject_id else "")
                    + " ORDER BY recorded_at DESC, history_id DESC LIMIT %s",
                    ((subject_id, limit) if subject_id else (limit,)))
        return [plain(r) for r in cur.fetchall()]


@app.get("/api/services")
def services():
    with transaction() as cur:
        cur.execute("SELECT service_id, name, tier, status, customer_impact FROM services ORDER BY service_id")
        return [plain(r) for r in cur.fetchall()]


@app.get("/api/services/{service_id}")
def service(service_id: str):
    with transaction() as cur:
        cur.execute("SELECT service_id, name, tier, status, customer_impact FROM services WHERE service_id=%s", (service_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, f"Service {service_id} not found.")
        cur.execute("SELECT slo_id, name, status, target_display, current_pct FROM slo_definitions WHERE service_id=%s ORDER BY slo_id", (service_id,))
        return {**plain(row), "slos": [plain(r) for r in cur.fetchall()]}


@app.get("/api/incidents")
def incidents():
    with transaction() as cur:
        cur.execute("SELECT * FROM incidents ORDER BY incident_id DESC")
        return [plain(r) for r in cur.fetchall()]


@app.get("/api/incidents/{incident_id}")
def incident(incident_id: str):
    with transaction() as cur:
        cur.execute("SELECT * FROM incidents WHERE incident_id=%s", (incident_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, f"Incident {incident_id} not found.")
        return plain(row)


@app.get("/api/reviewers")
def reviewers():
    with transaction() as cur:
        cur.execute("SELECT display_name FROM reviewers ORDER BY display_name")
        return [r["display_name"] for r in cur.fetchall()]


@app.get("/api/snapshot-batches")
def snapshot_batches():
    with transaction() as cur:
        cur.execute("SELECT * FROM snapshot_batches ORDER BY finalized_at DESC")
        return [plain(r) for r in cur.fetchall()]


@app.get("/api/snapshots")
def snapshots(snapshot_id: Optional[str] = None, slo_id: Optional[str] = None):
    """Measurement evidence rows. Defaults to the latest batch. sli_pct is computed by MySQL from the counts."""
    with transaction() as cur:
        if not snapshot_id:
            cur.execute("SELECT snapshot_id FROM snapshot_batches ORDER BY finalized_at DESC LIMIT 1")
            latest = cur.fetchone()
            snapshot_id = latest["snapshot_id"] if latest else None
        sql, args = "SELECT * FROM measurement_snapshots WHERE snapshot_id=%s", [snapshot_id]
        if slo_id:
            sql, args = sql + " AND slo_id=%s", args + [slo_id]
        cur.execute(sql + " ORDER BY slo_id", args)
        return [{**snapshot_json(r), "snapshot_id": r["snapshot_id"], "sli_pct": None if r["sli_pct"] is None else float(r["sli_pct"])}
                for r in cur.fetchall()]


SLO_LIST_SQL = """
SELECT s.slo_id, s.name, s.version, s.service_id, sv.name AS service_name, sv.status AS service_status, s.service_tier,
       s.sli_definition, s.target_display, s.target_pct, s.window_label, s.current_pct, s.status,
       s.error_budget_remaining_pct, s.burn_1h, s.burn_6h, s.burn_24h, s.breach_forecast,
       s.specialist_owner, s.business_owner,
       d.snapshot_id, d.sli_pct, d.sli_reconciled, d.exclusion_evidence_missing, d.quality,
       d.eligible_count, d.successful_count, d.excluded_count
FROM slo_definitions s
JOIN services sv ON sv.service_id = s.service_id
LEFT JOIN v_monitoring_dashboard d ON d.slo_id = s.slo_id
"""


@app.get("/api/slos")
def slos():
    with transaction() as cur:
        cur.execute(SLO_LIST_SQL + " ORDER BY s.slo_id")
        return [plain(r) for r in cur.fetchall()]


@app.get("/api/slos/{slo_id}")
def slo(slo_id: str):
    """One SLO with its latest measurement, any measurement concerns, and related follow-ups."""
    with transaction() as cur:
        cur.execute(SLO_LIST_SQL + " WHERE s.slo_id=%s", (slo_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, f"SLO {slo_id} not found.")
        cur.execute("SELECT followup_id FROM followups WHERE slo_id=%s", (slo_id,))
        related = [load_followups(cur, r["followup_id"])[0] for r in cur.fetchall()]
        return {**plain(row), "measurement_concerns": measurement_concerns(cur, slo_id), "followups": related}


# ---------------------------------------------------------------- POST endpoints

class EvidenceIn(BaseModel):
    evidence_ref: str = Field(max_length=80)
    returned_by: Optional[str] = Field(default=None, max_length=120)
    returned_at: Optional[str] = None            # ISO 8601; defaults to now (UTC)


class ReviewIn(BaseModel):
    reviewer: str = Field(max_length=120)
    outcome: str
    review_evidence: str = Field(max_length=80)
    rationale: str
    confirmed: bool = False                      # confirms evidence resolves open measurement concerns


@app.post("/api/followups/{followup_id}/specialist-evidence", status_code=201)
def record_specialist_evidence(followup_id: str, body: EvidenceIn):
    """Step 3: a specialist team returned evidence (first time, or after a 'returned' review)."""
    ref = body.evidence_ref.strip()
    if not ref:
        raise HTTPException(422, "Evidence reference is required.")
    with transaction() as cur:
        row = locked_followup(cur, followup_id)
        fu = load_followups(cur, followup_id)[0]
        if fu["status"] not in (ST_AWAITING, ST_MORE):
            raise HTTPException(409, "Evidence can only be recorded while the follow-up is waiting for specialist evidence.")
        if ref.lower() in used_refs(fu):
            raise HTTPException(409, "This reference was already used on this follow-up. Enter the new specialist evidence reference.")
        at = parse_ts(body.returned_at) if body.returned_at else utcnow()
        if at < row["requested_at"]:
            raise HTTPException(422, f"Returned time cannot be before the request time ({iso(row['requested_at'])}).")
        if fu["review_rounds"] and at < minute_floor(parse_ts(fu["review_rounds"][-1]["at"])):
            raise HTTPException(422, f"Returned time must be after the previous review ({fu['review_rounds'][-1]['at']}).")
        if at > utcnow() + FUTURE_SKEW:
            raise HTTPException(422, "Returned time cannot be in the future.")
        by = (body.returned_by or "").strip() or row["specialist_owner"]

        cur.execute("INSERT INTO followup_evidence_returns (followup_id, evidence_ref, returned_by, returned_at) VALUES (%s,%s,%s,%s)",
                    (followup_id, ref, by, at))
        # The earlier review decision is NOT lost: it stays in followup_review_rounds.
        cur.execute("UPDATE followups SET status=%s, independent_reviewer=NULL, review_evidence=NULL, reviewed_at=NULL,"
                    " review_rationale=NULL WHERE followup_id=%s", (ST_RETURNED, followup_id))
        add_history(cur, subject=row["title"], subject_id=followup_id,
                    decision=f"Specialist evidence returned (review round {len(fu['review_rounds']) + 1})",
                    assurance="Independent review required", specialist_owner=row["specialist_owner"], source_evidence=ref)
        return load_followups(cur, followup_id)[0]


@app.post("/api/followups/{followup_id}/reviews", status_code=201)
def record_review(followup_id: str, body: ReviewIn):
    """Steps 4-5: independent review of returned evidence; appends a review round."""
    ref, why = body.review_evidence.strip(), body.rationale.strip()
    with transaction() as cur:
        row = locked_followup(cur, followup_id)
        fu = load_followups(cur, followup_id)[0]
        if fu["status"] != ST_RETURNED or not fu["source_returned_evidence"]:
            raise HTTPException(409, "This follow-up has no returned evidence waiting for review.")
        if body.outcome not in (ST_CLOSED, ST_MORE):
            raise HTTPException(422, "Outcome must be a closed or returned-for-more-evidence status.")
        cur.execute("SELECT 1 FROM reviewers WHERE display_name=%s", (body.reviewer,))
        if not cur.fetchone():
            raise HTTPException(422, "Choose a reviewer from the reviewers list.")
        if body.reviewer == row["requested_by"]:
            raise HTTPException(422, "The reviewer must be independent: the person who requested this follow-up cannot review it.")
        if not ref:
            raise HTTPException(422, "A review evidence reference is required.")
        if ref.lower() in used_refs(fu):
            raise HTTPException(409, "Review evidence must be separate from the specialist evidence and from any earlier reference on this follow-up.")
        if len(why) < 10:
            raise HTTPException(422, "Enter a rationale (at least 10 characters) explaining what was sufficient or what is missing.")
        closed = body.outcome == ST_CLOSED
        if closed and measurement_concerns(cur, row["slo_id"]) and not body.confirmed:
            raise HTTPException(422, "Confirm that the evidence resolves the measurement concerns, or return it for more evidence.")

        source, now = fu["source_returned_evidence"], utcnow()
        cur.execute("INSERT INTO followup_review_rounds (followup_id, round_no, outcome, reviewer, review_evidence, source_evidence,"
                    " reviewed_at, rationale) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                    (followup_id, len(fu["review_rounds"]) + 1, body.outcome, body.reviewer, ref, source, now, why))
        cur.execute("UPDATE followups SET status=%s, independent_reviewer=%s, review_evidence=%s, reviewed_at=%s,"
                    " review_rationale=%s WHERE followup_id=%s", (body.outcome, body.reviewer, ref, now, why, followup_id))
        add_history(cur, subject=row["title"], subject_id=followup_id, decision=body.outcome,
                    assurance="Assurance Current" if closed else "Follow-up Required",
                    specialist_owner=row["specialist_owner"], source_evidence=source, decision_evidence=ref,
                    verification_evidence=ref if closed else None, status="Closed" if closed else "Open")
        return load_followups(cur, followup_id)[0]


class FollowupIn(BaseModel):
    slo_id: str
    title: str = Field(max_length=200)
    priority: str
    requested_by: str = Field(max_length=120)
    due_at: str                                   # ISO 8601
    rationale: str
    specialist_owner: Optional[str] = Field(default=None, max_length=120)   # defaults to the SLO's specialist owner


@app.post("/api/followups", status_code=201)
def request_specialist_evidence(body: FollowupIn):
    """Step 2: the Platform Admin requests specialist evidence for an SLO (opens a follow-up)."""
    title, why = body.title.strip(), body.rationale.strip()
    if not title:
        raise HTTPException(422, "A follow-up title is required.")
    if body.priority not in ("P0", "P1", "P2"):
        raise HTTPException(422, "Priority must be P0, P1 or P2.")
    if len(why) < 10:
        raise HTTPException(422, "Enter a rationale (at least 10 characters) saying what evidence is required.")
    due, now = parse_ts(body.due_at), utcnow()
    if due <= now:
        raise HTTPException(422, "The due time must be in the future.")
    with transaction() as cur:
        cur.execute("SELECT specialist_owner FROM slo_definitions WHERE slo_id=%s", (body.slo_id,))
        slo_row = cur.fetchone()
        if not slo_row:
            raise HTTPException(404, f"SLO {body.slo_id} not found.")
        cur.execute("SELECT 1 FROM reviewers WHERE display_name=%s", (body.requested_by,))
        if not cur.fetchone():
            raise HTTPException(422, "Choose the requester from the reviewers list.")
        owner = (body.specialist_owner or "").strip() or slo_row["specialist_owner"]
        cur.execute("SELECT followup_id FROM followups ORDER BY followup_id DESC LIMIT 1 FOR UPDATE")
        last = cur.fetchone()
        match = re.fullmatch(r"(FUP-SLO-)(\d+)", last["followup_id"]) if last else None
        new_id = f"{match.group(1)}{int(match.group(2)) + 1}" if match else "FUP-SLO-2601"
        cur.execute("INSERT INTO followups (followup_id, slo_id, title, priority, status, requested_by, requested_at,"
                    " specialist_owner, due_at, rationale) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (new_id, body.slo_id, title, body.priority, ST_AWAITING, body.requested_by, now, owner, due, why))
        add_history(cur, subject=title, subject_id=new_id, decision="Specialist evidence requested",
                    assurance="Specialist evidence required", specialist_owner=owner)
        return load_followups(cur, new_id)[0]


# ---------------------------------------------------------------- the web page itself (same origin as the API)
class SiteFiles(StaticFiles):
    """Serves the project's HTML/CSS/JS but never source code, SQL, hidden files or secrets (.env)."""
    BLOCKED_DIRS = {"backend", "database", "__pycache__", "_audit", "node_modules", "_review_dump", "_backup_before_fix"}
    ALLOWED_SUFFIXES = {".html", ".css", ".js", ".mjs", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2", ".ttf"}

    async def get_response(self, path, scope):
        parts = [p for p in path.replace("\\", "/").split("/") if p]
        if (any(p.startswith(".") or p.lower() in self.BLOCKED_DIRS for p in parts)
                or Path(path).suffix.lower() not in self.ALLOWED_SUFFIXES):
            raise HTTPException(404, "Not found")
        return await super().get_response(path, scope)


def find_site_root():
    """The project root that holds pages/, assets/, partials/. Never guesses a folder that does not match."""
    if os.getenv("SITE_ROOT"):
        return Path(os.getenv("SITE_ROOT"))
    here = Path(__file__).resolve()
    root = here.parents[4] if len(here.parents) > 4 else None
    return root if root and (root / "pages" / "admin" / "slo-monitoring").is_dir() else None


SITE_ROOT = find_site_root()
if SITE_ROOT and SITE_ROOT.is_dir():
    # Open: http://127.0.0.1:8000/site/pages/admin/slo-monitoring/slo-monitoring.html
    app.mount("/site", SiteFiles(directory=SITE_ROOT, html=True), name="site")
