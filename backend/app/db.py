from collections.abc import Generator
import logging
from pathlib import Path
import sqlite3
from typing import Annotated
from fastapi import HTTPException, Depends
from .config import Config, get_config


logger = logging.getLogger(__name__)


def get_connection(db_path: str | Path | None = None) -> sqlite3.Connection:
    """Open and configure a SQLite connection.

    When ``db_path`` is omitted, the path configured through ``EXAM_DB_PATH``
    is used. Each caller owns the returned connection and must close it.
    """

    database_path = str(db_path)
    db_path = Path(database_path).expanduser()

    if not db_path.exists():
        raise FileNotFoundError(f"Database does not exist: {db_path}")
    
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys = ON')
    return connection


def get_db(config: Annotated[Config, Depends(get_config)]) -> Generator[sqlite3.Connection, None, None]:
    try:
        connection = get_connection(config.db_path)
    except FileNotFoundError:
        logger.exception('Database file is missing: %s', config.db_path)
        raise HTTPException(
            status_code=503,
            detail='The database is unavailable.',
        )

    try:
        yield connection
    finally:
        connection.close()





