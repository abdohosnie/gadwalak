import { NextResponse } from "next/server";
import { generateCsvTemplate } from "@/lib/importer";

export async function GET() {
  const csv = generateCsvTemplate();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gadwalak-schedule-template.csv"',
    },
  });
}
