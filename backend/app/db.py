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

def fetch_student(conn: sqlite3.Connection, student_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT id, full_name, level, department FROM Students WHERE seat_number = ?", (student_id,)).fetchone()

def fetch_courses(conn: sqlite3.Connection, student_id: int) -> list[sqlite3.Row]:
    return conn.execute("""
    SELECT course_name, course_code
    FROM Course AS c
    JOIN Enrollment AS e
    ON c.course_id = e.course_id 
    WHERE e.seat_number = ?
    """, (student_id,)).fetchall()

def fetch_schedule(conn: sqlite3.Connection, student_id: int) -> list[sqlite3.Row]:
    return conn.execute("""
    SELECT c.course_name, c.course_code, es.scheduled_time, es.duration, el.location
    FROM Enrollment e
    JOIN student_exam_assignment sea
        ON e.enrollment_id = sea.enrollment_id
    JOIN exam_location el
        ON el.exam_location_id = sea.exam_location_id
    JOIN exam_session es 
        ON es.session_id = el.session_id
    JOIN Course c
        ON c.course_id = es.course_id

    WHERE e.seat_number = ?
    ORDER BY es.scheduled_time
    """, (student_id,)).fetchall()






