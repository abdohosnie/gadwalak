import Papa from "papaparse";
import * as XLSX from "xlsx";
import { getDb } from "./db";

export interface UnifiedRow {
  seat_number: number;
  full_name: string;
  department: string;
  level: string;
  course_code: string;
  course_name: string;
  scheduled_time: string;
  duration: number;
  location: string;
}

export interface ImportResult {
  totalRows: number;
  importedStudents: number;
  importedCourses: number;
  importedExams: number;
  errors: string[];
}

function normalizeHeader(header: string): string {
  const h = header.trim().toLowerCase();
  if (/رقم.*جلوس|رقم.*قيد|seat.*num|student.*id|seat/i.test(h)) return "seat_number";
  if (/كود.*مادة|كود.*مقرر|رمز.*مقرر|course.*code|code/i.test(h)) return "course_code";
  if (/اسم.*مادة|اسم.*مقرر|المقرر|course.*name|course.*title|course/i.test(h)) return "course_name";
  if (/اسم.*طالب|طالب|full.*name|student.*name|student/i.test(h)) return "full_name";
  if (/القسم|التخصص|الشعبة|department|dept/i.test(h)) return "department";
  if (/الفرقة|المستوى|level|academic.*level|grade/i.test(h)) return "level";
  if (/موعد.*امتحان|تاريخ.*امتحان|تاريخ|موعد|scheduled.*time|exam.*date|exam.*time|date|time/i.test(h)) return "scheduled_time";
  if (/مدة.*امتحان|المدة|الفترة|duration.*min|duration/i.test(h)) return "duration";
  if (/مدرج|قاعة|مكان|لجنة|location|hall|room/i.test(h)) return "location";
  if (/الاسم|^name$/i.test(h)) return "full_name";
  return h;
}

export function parseRawSpreadsheet(buffer: Buffer, filename: string): Record<string, any>[] {
  const isExcel = /\.xlsx?$/i.test(filename);
  if (isExcel) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
  }

  // Otherwise assume CSV
  const text = buffer.toString("utf-8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsed.data as Record<string, any>[];
}

export function normalizeRows(rawRows: Record<string, any>[]): { rows: UnifiedRow[]; errors: string[] } {
  const rows: UnifiedRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((raw, index) => {
    const rowNum = index + 2; // spreadsheet 1-indexed header + data
    const normalized: Record<string, any> = {};

    for (const [key, val] of Object.entries(raw)) {
      const standardKey = normalizeHeader(key);
      normalized[standardKey] = typeof val === "string" ? val.trim() : val;
    }

    const seatNum = parseInt(String(normalized.seat_number || "").replace(/\D/g, ""), 10);
    if (!seatNum || isNaN(seatNum)) {
      errors.push(`Row ${rowNum}: Missing or invalid seat number (${normalized.seat_number})`);
      return;
    }

    const fullName = String(normalized.full_name || "").trim();
    if (!fullName) {
      errors.push(`Row ${rowNum}: Missing student full name`);
      return;
    }

    const department = String(normalized.department || "General").trim();
    const level = String(normalized.level || "Level 1").trim();
    const courseCode = String(normalized.course_code || "").trim().toUpperCase();
    if (!courseCode) {
      errors.push(`Row ${rowNum}: Missing course code`);
      return;
    }

    const courseName = String(normalized.course_name || courseCode).trim();
    const scheduledTime = String(normalized.scheduled_time || "").trim();
    const duration = parseInt(String(normalized.duration || "120"), 10) || 120;
    const location = String(normalized.location || "TBA").trim();

    rows.push({
      seat_number: seatNum,
      full_name: fullName,
      department,
      level,
      course_code: courseCode,
      course_name: courseName,
      scheduled_time: scheduledTime,
      duration,
      location,
    });
  });

  return { rows, errors };
}

export function importUnifiedRows(rows: UnifiedRow[]): ImportResult {
  const db = getDb();

  const insertStudent = db.prepare(`
    INSERT INTO Students (seat_number, full_name, level, department)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(seat_number) DO UPDATE SET
      full_name = excluded.full_name,
      level = excluded.level,
      department = excluded.department
  `);

  const insertCourse = db.prepare(`
    INSERT INTO Course (course_code, course_name)
    VALUES (?, ?)
    ON CONFLICT(course_code) DO UPDATE SET
      course_name = excluded.course_name
  `);

  const getCourseId = db.prepare("SELECT course_id FROM Course WHERE UPPER(course_code) = UPPER(?)");

  const insertEnrollment = db.prepare(`
    INSERT OR IGNORE INTO Enrollment (seat_number, course_id)
    VALUES (?, ?)
  `);

  const getEnrollmentId = db.prepare("SELECT enrollment_id FROM Enrollment WHERE seat_number = ? AND course_id = ?");

  const findSession = db.prepare(`
    SELECT session_id FROM exam_session
    WHERE course_id = ? AND scheduled_time = ?
  `);

  const insertSession = db.prepare(`
    INSERT INTO exam_session (course_id, scheduled_time, duration)
    VALUES (?, ?, ?)
  `);

  const findLocation = db.prepare(`
    SELECT exam_location_id FROM exam_location
    WHERE session_id = ? AND location = ?
  `);

  const insertLocation = db.prepare(`
    INSERT INTO exam_location (session_id, location)
    VALUES (?, ?)
  `);

  const assignStudent = db.prepare(`
    INSERT OR IGNORE INTO student_exam_assignment (enrollment_id, exam_location_id)
    VALUES (?, ?)
  `);

  let importedStudents = 0;
  let importedCourses = 0;
  let importedExams = 0;
  const errors: string[] = [];

  const seenStudents = new Set<number>();
  const seenCourses = new Set<string>();

  const transaction = db.transaction((records: UnifiedRow[]) => {
    for (const record of records) {
      try {
        // 1. Student
        insertStudent.run(record.seat_number, record.full_name, record.level, record.department);
        if (!seenStudents.has(record.seat_number)) {
          seenStudents.add(record.seat_number);
          importedStudents++;
        }

        // 2. Course
        insertCourse.run(record.course_code, record.course_name);
        if (!seenCourses.has(record.course_code)) {
          seenCourses.add(record.course_code);
          importedCourses++;
        }

        const courseRow = getCourseId.get(record.course_code) as { course_id: number };
        const courseId = courseRow.course_id;

        // 3. Enrollment
        insertEnrollment.run(record.seat_number, courseId);
        const enrollmentRow = getEnrollmentId.get(record.seat_number, courseId) as { enrollment_id: number };
        const enrollmentId = enrollmentRow.enrollment_id;

        // 4. Exam Session & Location
        if (record.scheduled_time) {
          let sessionRow = findSession.get(courseId, record.scheduled_time) as { session_id: number } | undefined;
          let sessionId = sessionRow?.session_id;

          if (!sessionId) {
            const res = insertSession.run(courseId, record.scheduled_time, record.duration);
            sessionId = Number(res.lastInsertRowid);
            importedExams++;
          }

          let locRow = findLocation.get(sessionId, record.location) as { exam_location_id: number } | undefined;
          let locationId = locRow?.exam_location_id;

          if (!locationId) {
            const locRes = insertLocation.run(sessionId, record.location);
            locationId = Number(locRes.lastInsertRowid);
          }

          // 5. Assignment
          assignStudent.run(enrollmentId, locationId);
        }
      } catch (err: any) {
        errors.push(`Error on seat ${record.seat_number} - course ${record.course_code}: ${err?.message}`);
      }
    }
  });

  transaction(rows);

  return {
    totalRows: rows.length,
    importedStudents,
    importedCourses,
    importedExams,
    errors,
  };
}

export function generateCsvTemplate(): string {
  const headers = [
    "Seat Number (رقم الجلوس)",
    "Student Name (اسم الطالب)",
    "Department (القسم)",
    "Academic Level (الفرقة)",
    "Course Code (كود المادة)",
    "Course Name (اسم المقرر)",
    "Exam Date & Time (موعد الامتحان)",
    "Duration Minutes (المدة بالدقائق)",
    "Exam Hall / Location (المدرج / القاعة)",
  ];

  const sampleRows = [
    [
      "2023170461",
      "Ahmed Mohamed Ali / أحمد محمد علي",
      "Computer Science",
      "Level 3",
      "CS301",
      "Database Systems / نظم قواعد البيانات",
      "2026-12-15 09:00:00",
      "120",
      "Hall 1 (Main Campus) / قاعة 1",
    ],
    [
      "2023170462",
      "Sara Hassan Ibrahim / سارة حسن إبراهيم",
      "Computer Science",
      "Level 3",
      "CS302",
      "Operating Systems / نظم التشغيل",
      "2026-12-19 12:30:00",
      "120",
      "Hall 3 (Computing Annex) / مدرج 3",
    ],
    [
      "2024100101",
      "Youssef Khaled Omar / يوسف خالد عمر",
      "Artificial Intelligence",
      "Level 2",
      "AI201",
      "Machine Learning / تعلم الآلة",
      "2026-12-16 10:00:00",
      "120",
      "Auditorium B / المسرح الكبير ب",
    ],
  ];

  return Papa.unparse({
    fields: headers,
    data: sampleRows,
  });
}
