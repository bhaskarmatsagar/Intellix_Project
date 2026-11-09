"""Loads database/schema.sql and database/seed.sql using Python (no mysql command needed).

Usage (from the backend folder):   python load_sql.py
WARNING: schema.sql drops and recreates every table, so all data is reset to the demo seed.
"""
import sys
from pathlib import Path

from db import connect


def split_sql(text):
    """Splits a script on ';' while respecting quotes and skipping '--' comments."""
    statements, buf, quote, i, n = [], [], None, 0, len(text)
    while i < n:
        c = text[i]
        if quote:
            buf.append(c)
            if c == "\\" and i + 1 < n:
                buf.append(text[i + 1])
                i += 2
                continue
            if c == quote:
                quote = None
        elif text.startswith("--", i):
            while i < n and text[i] != "\n":
                i += 1
            continue
        elif c in ("'", '"', "`"):
            quote = c
            buf.append(c)
        elif c == ";":
            stmt = "".join(buf).strip()
            if stmt:
                statements.append(stmt)
            buf = []
        else:
            buf.append(c)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        statements.append(tail)
    return statements


def load(db_dir=None, db_name=None):
    db_dir = Path(db_dir) if db_dir else Path(__file__).resolve().parent.parent / "database"
    conn = connect(with_database=False)
    try:
        cur = conn.cursor()
        for name in ("schema.sql", "seed.sql"):
            raw = (db_dir / name).read_text(encoding="utf-8")
            if db_name:
                raw = raw.replace("edx_slo_monitoring", db_name)
            statements = split_sql(raw)
            for stmt in statements:
                cur.execute(stmt)
            conn.commit()
            print(f"{name}: {len(statements)} statements OK")
    finally:
        conn.close()


if __name__ == "__main__":
    load(sys.argv[1] if len(sys.argv) > 1 else None)
