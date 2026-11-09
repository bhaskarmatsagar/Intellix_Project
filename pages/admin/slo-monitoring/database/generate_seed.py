"""
Builds seed.sql from slo-monitoring.json so the database starts with exactly the
demonstration data the page uses.

Usage (from the database folder):  python generate_seed.py ../slo-monitoring.json seed.sql
"""
import json
import re
import sys
from datetime import datetime, timezone


def q(value):
    """Quote a Python value as a SQL literal."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("\\", "\\\\").replace("'", "''") + "'"


def ts(iso):
    """'2026-10-05T14:30:00Z' -> '2026-10-05 14:30:00' (UTC)."""
    if not iso:
        return None
    return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def num(text):
    """'≥ 99.90%' -> 99.9, '2.80x' -> 2.8, 'N/A' -> None."""
    m = re.search(r"-?\d+(\.\d+)?", str(text or ""))
    return float(m.group(0)) if m else None


def insert(table, columns, rows):
    if not rows:
        return ""
    values = ",\n  ".join("(" + ", ".join(q(v) for v in row) + ")" for row in rows)
    return f"INSERT INTO {table} ({', '.join(columns)}) VALUES\n  {values};\n\n"


def main(src, dst):
    data = json.load(open(src, encoding="utf-8"))
    ma = data["monitoring_assurance"]
    out = ["USE edx_slo_monitoring;\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n"]

    out.append(insert("services", ["service_id", "name", "tier", "status", "customer_impact"],
        [[s["id"], s["name"], s["tier"], s["status"], s.get("customer_impact")] for s in data["services"]]))

    out.append(insert("incidents", ["incident_id", "title", "severity", "operational_state"],
        [[i["id"], i["title"], i["severity"], i.get("operational_state")] for i in data["incidents"]]))

    out.append(insert("reviewers", ["display_name"], [[r] for r in ma["reviewers"]]))

    out.append(insert("portfolio_meta", ["meta_key", "meta_value"],
        [[k, json.dumps(v, ensure_ascii=False)] for k, v in data["meta"].items()]))

    out.append(insert("snapshot_batches", ["snapshot_id", "finalized_at", "measurement_source", "business_signoff", "version"],
        [[ma["snapshot_id"], ts(ma["snapshot_finalized_at"]), ma["measurement_source"], ma.get("business_signoff"), ma.get("version", 1)]]))

    out.append(insert("slo_definitions",
        ["slo_id", "service_id", "name", "version", "service_tier", "sli_definition", "target_display", "target_pct",
         "window_label", "current_pct", "status", "error_budget_remaining_pct", "burn_1h", "burn_6h", "burn_24h",
         "breach_forecast", "specialist_owner", "business_owner"],
        [[s["id"], s["service_id"], s["name"], s["version"], s["service_tier"], s["sli"], s["target"], num(s["target"]),
          s["window"], num(s["current"]), s["status"], num(s["error_budget_remaining"]),
          num(s["burn_1h"]), num(s["burn_6h"]), num(s["burn_24h"]),
          s.get("breach_forecast"), s["specialist_owner"], s.get("business_owner")] for s in data["slo_definitions"]]))

    out.append(insert("measurement_snapshots",
        ["snapshot_id", "slo_id", "service_id", "source_reference", "source_owner", "observed_at", "window_label",
         "population", "eligible_count", "successful_count", "excluded_count", "exclusion_basis", "exclusion_evidence",
         "quality", "quality_note", "incident_id", "measurement_treatment", "expected_rate_pct"],
        [[ma["snapshot_id"], s["slo_id"], s["service_id"], s["source_reference"], s["source_owner"], ts(s["observed_at"]),
          s["window"], s["population"], s["eligible_count"], s["successful_count"], s["excluded_count"],
          s.get("exclusion_basis"), s.get("exclusion_evidence"), s["quality"], s.get("quality_note"),
          s.get("incident_id"), s.get("measurement_treatment"), num(s.get("expected_rate"))] for s in ma["snapshots"]]))

    fus = ma["followups"]
    out.append(insert("followups",
        ["followup_id", "slo_id", "title", "priority", "status", "requested_by", "requested_at", "specialist_owner",
         "due_at", "rationale", "independent_reviewer", "review_evidence", "reviewed_at", "review_rationale"],
        [[f["id"], f["slo_id"], f["title"], f["priority"], f["status"], f["requested_by"], ts(f["requested_at"]),
          f["specialist_owner"], ts(f["due_at"]), f["rationale"], f.get("independent_reviewer"),
          f.get("review_evidence"), ts(f.get("reviewed_at")), f.get("review_rationale")] for f in fus]))

    # Evidence returns: the current return plus every source reference a review round looked at.
    returns = []
    for f in fus:
        seen = set()
        if f.get("source_returned_evidence"):
            returns.append([f["id"], f["source_returned_evidence"], f.get("source_returned_by"), ts(f.get("source_returned_at"))])
            seen.add(f["source_returned_evidence"])
        for r in f.get("review_rounds", []):
            if r["source_evidence"] not in seen:
                returns.append([f["id"], r["source_evidence"], f["specialist_owner"], None])   # return time not in the sample data
                seen.add(r["source_evidence"])
    out.append(insert("followup_evidence_returns", ["followup_id", "evidence_ref", "returned_by", "returned_at"], returns))

    rounds = [[f["id"], n, r["outcome"], r["reviewer"], r["review_evidence"], r["source_evidence"], ts(r["at"]), r["rationale"]]
              for f in fus for n, r in enumerate(f.get("review_rounds", []), start=1)]
    out.append(insert("followup_review_rounds",
        ["followup_id", "round_no", "outcome", "reviewer", "review_evidence", "source_evidence", "reviewed_at", "rationale"], rounds))

    out.append(insert("governance_history",
        ["history_id", "domain", "subject", "subject_id", "decision", "assurance", "specialist_owner", "source_evidence",
         "decision_evidence", "verification_evidence", "checkpoint", "recorded_by", "recorded_at", "status"],
        [[h["id"], h["domain"], h["subject"], h["subject_id"], h["decision"], h.get("assurance"), h.get("specialist_owner"),
          h.get("source_evidence"), h.get("decision_evidence"), h.get("verification_evidence"), ts(h.get("checkpoint")),
          h["recorded_by"], ts(h["recorded_at"]), h["status"]] for h in data["governance_history"]]))

    out.append("SET FOREIGN_KEY_CHECKS = 1;\n")
    open(dst, "w", encoding="utf-8").write("".join(out))
    print(f"Wrote {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
