"""Read-only database queries for student schedules."""

import sqlite3


def fetch_student(
    connection: sqlite3.Connection,
    student_id: int,
) -> sqlite3.Row | None:
    """Return the student associated with a seat number, if present."""
    return connection.execute(
        '''
        SELECT id, full_name, level, department
        FROM Students
        WHERE seat_number = ?
        ''',
        (student_id,),
    ).fetchone()


def fetch_courses(
    connection: sqlite3.Connection,
    student_id: int,
) -> list[sqlite3.Row]:
    """Return courses in which the student is enrolled."""
    return connection.execute(
        '''
        SELECT course_name, course_code
        FROM Course AS course
        JOIN Enrollment AS enrollment
            ON course.course_id = enrollment.course_id
        WHERE enrollment.seat_number = ?
        ''',
        (student_id,),
    ).fetchall()


def fetch_schedule(
    connection: sqlite3.Connection,
    student_id: int,
) -> list[sqlite3.Row]:
    """Return exam sessions assigned to the student in chronological order."""
    return connection.execute(
        '''
        SELECT
            course.course_name,
            course.course_code,
            exam_session.scheduled_time,
            exam_session.duration,
            exam_location.location
        FROM Enrollment AS enrollment
        JOIN student_exam_assignment AS assignment
            ON enrollment.enrollment_id = assignment.enrollment_id
        JOIN exam_location
            ON exam_location.exam_location_id = assignment.exam_location_id
        JOIN exam_session
            ON exam_session.session_id = exam_location.session_id
        JOIN Course AS course
            ON course.course_id = exam_session.course_id
        WHERE enrollment.seat_number = ?
        ORDER BY exam_session.scheduled_time
        ''',
        (student_id,),
    ).fetchall()
