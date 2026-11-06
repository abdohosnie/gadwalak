import { NextRequest, NextResponse } from "next/server";
import { parseRawSpreadsheet, normalizeRows, importUnifiedRows } from "@/lib/importer";

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  try {
    const formData = await request.formData();
    const password = formData.get("password") as string | null;
    const authHeader = request.headers.get("x-admin-password");

    if (password !== adminPassword && authHeader !== adminPassword) {
      return NextResponse.json({ detail: "Invalid admin password." }, { status: 401 });
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ detail: "No file was uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawRows = parseRawSpreadsheet(buffer, file.name);

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { detail: "The uploaded file contains no data or could not be read." },
        { status: 400 }
      );
    }

    const { rows, errors: validationErrors } = normalizeRows(rawRows);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          detail: "No valid schedule rows could be parsed from this file.",
          validationErrors,
        },
        { status: 422 }
      );
    }

    const result = importUnifiedRows(rows);

    return NextResponse.json({
      success: true,
      filename: file.name,
      result: {
        ...result,
        validationWarnings: validationErrors,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Import failed: ${error?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
