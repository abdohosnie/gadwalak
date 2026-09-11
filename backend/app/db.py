from collections.abc import Generator
from pathlib import Path
import sqlite3
from .config import load_config


def get_connection(db_path: str | Path | None = None) -> sqlite3.Connection:
    """Open and configure a SQLite connection.

    When ``db_path`` is omitted, the path configured through ``EXAM_DB_PATH``
    is used. Each caller owns the returned connection and must close it.
    """

    database_path = str(db_path if db_path is not None else load_config().db_path)
    db_path = Path(database_path).expanduser()

    if not db_path.exists():
        raise FileNotFoundError(f"Database does not exist: {db_path}")
    
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys = ON')
    return connection


def get_db() -> Generator[sqlite3.Connection, None, None]:
    connection = get_connection()
    try:
        yield connection
    finally:
        connection.close()





