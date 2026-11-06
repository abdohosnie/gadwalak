import { NextRequest, NextResponse } from "next/server";
import { fetchCourseByCode, fetchCourseSchedule } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseCode: string }> }
) {
  const { courseCode } = await params;
  const decodedCode = decodeURIComponent(courseCode);

  const course = fetchCourseByCode(decodedCode);
  if (!course) {
    return NextResponse.json(
      { detail: `Course with code "${decodedCode}" was not found.` },
      { status: 404 }
    );
  }

  const schedule = fetchCourseSchedule(decodedCode);

  return NextResponse.json({
    course,
    schedule,
  });
}
