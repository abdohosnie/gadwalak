import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { StudentInfo, Course, ScheduleItem, DepartmentInfo } from "./types";

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  const custom = process.env.EXAM_DB_PATH;
  if (custom) return path.resolve(custom);
  return path.join(process.cwd(), "data", "scheduler.db");
}

export function initDatabase(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbPath = getDatabasePath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");

  // Create schema if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS Students (
      seat_number INTEGER PRIMARY KEY,
      full_name TEXT NOT NULL,
      level TEXT NOT NULL,
      department TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Course (
      course_id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_name TEXT NOT NULL,
      course_code TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS Enrollment (
      enrollment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      seat_number INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      FOREIGN KEY(seat_number) REFERENCES Students(seat_number) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
      UNIQUE(seat_number, course_id)
    );

    CREATE TABLE IF NOT EXISTS exam_session (
      session_id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      scheduled_time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      FOREIGN KEY(course_id) REFERENCES Course(course_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exam_location (
      exam_location_id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      location TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES exam_session(session_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_exam_assignment (
      assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      enrollment_id INTEGER NOT NULL,
      exam_location_id INTEGER NOT NULL,
      FOREIGN KEY(enrollment_id) REFERENCES Enrollment(enrollment_id) ON DELETE CASCADE,
      FOREIGN KEY(exam_location_id) REFERENCES exam_location(exam_location_id) ON DELETE CASCADE,
      UNIQUE(enrollment_id, exam_location_id)
    );
  `);

  dbInstance = db;
  return dbInstance;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

// Queries

export function fetchStudent(studentId: number): StudentInfo | null {
  const db = getDb();
  const row = db
    .prepare("SELECT seat_number AS id, full_name, level, department FROM Students WHERE seat_number = ?")
    .get(studentId) as StudentInfo | undefined;
  return row || null;
}

export function fetchCourses(studentId: number): Course[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT course.course_name, course.course_code
       FROM Course AS course
       JOIN Enrollment AS enrollment ON course.course_id = enrollment.course_id
       WHERE enrollment.seat_number = ?
       ORDER BY course.course_code`
    )
    .all(studentId) as Course[];
}

export function fetchSchedule(studentId: number): ScheduleItem[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         course.course_name,
         course.course_code,
         exam_session.scheduled_time,
         exam_session.duration,
         exam_location.location
       FROM Enrollment AS enrollment
       JOIN student_exam_assignment AS assignment ON enrollment.enrollment_id = assignment.enrollment_id
       JOIN exam_location ON exam_location.exam_location_id = assignment.exam_location_id
       JOIN exam_session ON exam_session.session_id = exam_location.session_id
       JOIN Course AS course ON course.course_id = exam_session.course_id
       WHERE enrollment.seat_number = ?
       ORDER BY exam_session.scheduled_time`
    )
    .all(studentId) as ScheduleItem[];
}

export function fetchDepartments(): DepartmentInfo[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT DISTINCT department, level FROM Students ORDER BY department, level")
    .all() as { department: string; level: string }[];

  const map = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!map.has(r.department)) {
      map.set(r.department, new Set());
    }
    map.get(r.department)!.add(r.level);
  }

  const result: DepartmentInfo[] = [];
  for (const [name, levels] of map.entries()) {
    result.push({
      name,
      levels: Array.from(levels).sort(),
    });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export function fetchDepartmentCourses(department: string, level: string): Course[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT DISTINCT course.course_name, course.course_code
       FROM Students AS student
       JOIN Enrollment AS enrollment ON student.seat_number = enrollment.seat_number
       JOIN Course AS course ON course.course_id = enrollment.course_id
       WHERE student.department = ? AND student.level = ?
       ORDER BY course.course_code`
    )
    .all(department, level) as Course[];
}

export function fetchDepartmentSchedule(department: string, level: string): ScheduleItem[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT DISTINCT
         course.course_name,
         course.course_code,
         exam_session.scheduled_time,
         exam_session.duration,
         exam_location.location
       FROM Students AS student
       JOIN Enrollment AS enrollment ON student.seat_number = enrollment.seat_number
       JOIN Course AS course ON course.course_id = enrollment.course_id
       JOIN exam_session ON exam_session.course_id = course.course_id
       JOIN exam_location ON exam_location.session_id = exam_session.session_id
       WHERE student.department = ? AND student.level = ?
       ORDER BY exam_session.scheduled_time`
    )
    .all(department, level) as ScheduleItem[];
}

export function fetchAllCourses(): Course[] {
  const db = getDb();
  return db.prepare("SELECT course_name, course_code FROM Course ORDER BY course_code").all() as Course[];
}

export function fetchCourseByCode(courseCode: string): Course | null {
  const db = getDb();
  const row = db
    .prepare("SELECT course_name, course_code FROM Course WHERE UPPER(course_code) = UPPER(?)")
    .get(courseCode.trim()) as Course | undefined;
  return row || null;
}

export function fetchCourseSchedule(courseCode: string): ScheduleItem[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         course.course_name,
         course.course_code,
         exam_session.scheduled_time,
         exam_session.duration,
         exam_location.location
       FROM Course AS course
       JOIN exam_session ON exam_session.course_id = course.course_id
       JOIN exam_location ON exam_location.session_id = exam_session.session_id
       WHERE UPPER(course.course_code) = UPPER(?)
       ORDER BY exam_session.scheduled_time`
    )
    .all(courseCode.trim()) as ScheduleItem[];
}

export function getDatabaseStats() {
  const db = getDb();
  const students = (db.prepare("SELECT COUNT(*) as count FROM Students").get() as { count: number }).count;
  const courses = (db.prepare("SELECT COUNT(*) as count FROM Course").get() as { count: number }).count;
  const exams = (db.prepare("SELECT COUNT(*) as count FROM exam_session").get() as { count: number }).count;
  const enrollments = (db.prepare("SELECT COUNT(*) as count FROM Enrollment").get() as { count: number }).count;

  return { students, courses, exams, enrollments };
}
