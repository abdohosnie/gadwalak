"""HTTP API for student exam schedules."""

from typing import Annotated
import sqlite3

from fastapi import Depends, FastAPI, HTTPException, Path, status

from .db import get_db
from .queries import fetch_courses, fetch_schedule, fetch_student
from .schemas import StudentScheduleResponse


app = FastAPI(title='Gadwalak API')


StudentId = Annotated[
    int,
    Path(
        gt=0,
        le=999_999_999,
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='No student was found for this seat number.',
        )

    return StudentScheduleResponse(
        student=dict(student_row),
        courses=[dict(course) for course in fetch_courses(connection, student_id)],
        schedule=[dict(item) for item in fetch_schedule(connection, student_id)],
    )


@app.get("/health")
def health():
    return {"status": "ok"}
