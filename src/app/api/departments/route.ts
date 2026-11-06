import { NextResponse } from "next/server";
import { fetchDepartments } from "@/lib/db";

export async function GET() {
  const departments = fetchDepartments();
  return NextResponse.json(departments);
}
