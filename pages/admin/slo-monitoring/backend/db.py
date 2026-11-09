"""Database connection helpers (PyMySQL). All timestamps are stored and returned in UTC."""
import os
from contextlib import contextmanager

import pymysql
from dotenv import load_dotenv

load_dotenv()


def connect(with_database=True):
    return pymysql.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "edx_slo_monitoring") if with_database else None,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


@contextmanager
def transaction():
    """Yields a cursor. Commits on success, rolls everything back on any error."""
    conn = connect()
    try:
        yield conn.cursor()
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
