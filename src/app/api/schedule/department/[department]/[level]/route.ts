import { NextRequest, NextResponse } from "next/server";
import { fetchDepartmentCourses, fetchDepartmentSchedule } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ department: string; level: string }> }
) {
  const { department, level } = await params;
  const decodedDept = decodeURIComponent(department);
  const decodedLevel = decodeURIComponent(level);

  const courses = fetchDepartmentCourses(decodedDept, decodedLevel);
  const schedule = fetchDepartmentSchedule(decodedDept, decodedLevel);

  if (courses.length === 0 && schedule.length === 0) {
    return NextResponse.json(
      { detail: `No schedule found for ${decodedDept} (${decodedLevel}).` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    department: decodedDept,
    level: decodedLevel,
    courses,
    schedule,
  });
}
