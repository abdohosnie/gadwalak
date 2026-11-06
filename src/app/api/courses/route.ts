import { NextResponse } from "next/server";
import { fetchAllCourses } from "@/lib/db";

export async function GET() {
  const courses = fetchAllCourses();
  return NextResponse.json(courses);
}
