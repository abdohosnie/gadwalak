"""HTTP API for student exam schedules."""

from typing import Annotated
import logging
import sqlite3

from fastapi import Depends, FastAPI, HTTPException, Path, status
from fastapi.middleware.cors import CORSMiddleware

from .config import load_config, get_config
from .db import get_db
from .queries import fetch_courses, fetch_schedule, fetch_student
from .schemas import StudentScheduleResponse


config = get_config()

logging.basicConfig(
    level=config.log_level.upper(),
    format='%(asctime)s %(levelname)s %(name)s: %(message)s',
)
logger = logging.getLogger(__name__)

app = FastAPI(title='Gadwalak API', debug=config.debug)

if config.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origins,
        allow_methods=['GET'],
        allow_headers=['*'],
    )

StudentId = Annotated[
    int,
    Path(
        gt=0,
        le=999_999_999_999,
        description='The positive student seat number.',
    ),
]
DatabaseConnection = Annotated[sqlite3.Connection, Depends(get_db)]


@app.get(
    '/api/get/{student_id}',
    response_model=StudentScheduleResponse,
    summary='Get a student and their exam schedule',
)
def get_student_info(
    student_id: StudentId,
    connection: DatabaseConnection,
) -> StudentScheduleResponse:
    """Fetch a student's profile, enrolled courses, and scheduled exams."""
    student_row = fetch_student(connection, student_id)
    if student_row is None:
        logger.warning('No student found for seat number %s.', student_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='No student was found for this seat number.',
        )

    courses = [dict(course) for course in fetch_courses(connection, student_id)]
    schedule = [dict(item) for item in fetch_schedule(connection, student_id)]
    logger.info(
        'Fetched schedule for seat number %s: %d courses, %d exams',
        student_id,
        len(courses),
        len(schedule),
    )

    return StudentScheduleResponse(
        student=dict(student_row),
        courses=courses,
        schedule=schedule,
    )


@app.get("/health")
def health():
    return {"status": "ok"}
