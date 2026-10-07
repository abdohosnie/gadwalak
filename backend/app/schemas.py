"""Pydantic models used by the HTTP API."""

from pydantic import BaseModel, Field


class StudentInfo(BaseModel):
    """Student details returned with an exam schedule."""

    id: int
    full_name: str = Field(min_length=1)
    level: str
    department: str = Field(min_length=1)


class Course(BaseModel):
    """A course in which the student is enrolled."""

    course_name: str = Field(min_length=1)
    course_code: str = Field(min_length=1)


class ScheduleItem(Course):
    """An exam session assigned to the student."""

    scheduled_time: str = Field(min_length=1)
    duration: int 
    location: str = Field(min_length=1)


class StudentScheduleResponse(BaseModel):
    """All schedule data needed to render a student's exam timetable."""

    student: StudentInfo
    courses: list[Course]
    schedule: list[ScheduleItem]
