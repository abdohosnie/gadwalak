#!/usr/bin/env tsx
import path from "path";
import fs from "fs";
import { parseRawSpreadsheet, normalizeRows, importUnifiedRows } from "../src/lib/importer";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: npm run import -- <path-to-file.csv-or-xlsx>");
  process.exit(1);
}

const resolvedPath = path.resolve(filePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: File does not exist at ${resolvedPath}`);
  process.exit(1);
}

console.log(`Reading spreadsheet from: ${resolvedPath}...`);
const buffer = fs.readFileSync(resolvedPath);
const filename = path.basename(resolvedPath);

try {
  const rawRows = parseRawSpreadsheet(buffer, filename);
  console.log(`Parsed ${rawRows.length} raw rows.`);

  const { rows, errors: validationErrors } = normalizeRows(rawRows);
  if (validationErrors.length > 0) {
    console.warn(`Encountered ${validationErrors.length} row validation warnings:`);
    validationErrors.slice(0, 5).forEach((w) => console.warn(`  - ${w}`));
    if (validationErrors.length > 5) {
      console.warn(`  ...and ${validationErrors.length - 5} more`);
    }
  }

  if (rows.length === 0) {
    console.error("Error: No valid schedule rows could be normalized from the file.");
    process.exit(1);
  }

  console.log(`Importing ${rows.length} valid schedule rows into SQLite database...`);
  const result = importUnifiedRows(rows);

  console.log("✓ Import successful!");
  console.log(`  - Students imported/updated: ${result.importedStudents}`);
  console.log(`  - Courses imported/updated:  ${result.importedCourses}`);
  console.log(`  - Exams scheduled:           ${result.importedExams}`);

  if (result.errors.length > 0) {
    console.warn(`Encountered ${result.errors.length} database errors:`);
    result.errors.slice(0, 5).forEach((err) => console.warn(`  - ${err}`));
  }
} catch (error: any) {
  console.error("Fatal error during import:", error?.message || error);
  process.exit(1);
}
