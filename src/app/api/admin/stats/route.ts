import { NextRequest, NextResponse } from "next/server";
import { getDatabaseStats } from "@/lib/db";

export async function GET(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const authHeader = request.headers.get("x-admin-password");

  if (authHeader !== adminPassword) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const stats = getDatabaseStats();
  return NextResponse.json(stats);
}
