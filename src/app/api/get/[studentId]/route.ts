import { NextRequest, NextResponse } from "next/server";
import { fetchStudent, fetchCourses, fetchSchedule } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const idNum = parseInt(studentId, 10);

  if (isNaN(idNum) || idNum <= 0 || idNum > 999_999_999_999) {
    return NextResponse.json(
      { detail: "Invalid student seat number. Must be a positive integer up to 12 digits." },
      { status: 422 }
    );
  }

  const student = fetchStudent(idNum);
  if (!student) {
    return NextResponse.json(
      { detail: "No student was found for this seat number." },
      { status: 404 }
    );
  }

  const courses = fetchCourses(idNum);
  const schedule = fetchSchedule(idNum);

  return NextResponse.json({
    student,
    courses,
    schedule,
  });
}
