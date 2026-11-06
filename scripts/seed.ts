#!/usr/bin/env tsx
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const targetPath = process.argv[2] || process.env.EXAM_DB_PATH || path.join(process.cwd(), "data", "scheduler.db");
const dir = path.dirname(targetPath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

if (fs.existsSync(targetPath)) {
  console.log(`Resetting database at ${targetPath}...`);
  fs.unlinkSync(targetPath);
}

const db = new Database(targetPath);
db.pragma("foreign_keys = ON");

console.log("Creating schema...");
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

console.log("Inserting sample Ain Shams University students and schedules...");

const students = [
  [2023170461, "Ahmed Mohamed Ali / أحمد محمد علي", "Level 3", "Computer Science"],
  [2023170462, "Sara Hassan Ibrahim / سارة حسن إبراهيم", "Level 3", "Computer Science"],
  [2024100101, "Youssef Khaled Omar / يوسف خالد عمر", "Level 2", "Artificial Intelligence"],
  [2024100102, "Nouran Tarek Mahmoud / نوران طارق محمود", "Level 2", "Artificial Intelligence"],
  [2022050301, "Mostafa Gamal El-Din / مصطفى جمال الدين", "Level 4", "Information Systems"],
  [2025010001, "Mariam Hany Zaki / مريم هاني زكي", "Level 1", "General Engineering"],
];

const insertStudent = db.prepare("INSERT INTO Students (seat_number, full_name, level, department) VALUES (?, ?, ?, ?)");
for (const s of students) {
  insertStudent.run(...s);
}

const courses = [
  ["CS301", "Database Systems / نظم قواعد البيانات"],
  ["CS302", "Operating Systems / نظم التشغيل"],
  ["CS303", "Algorithms & Complexity / الخوارزميات والتعقيد"],
  ["AI201", "Machine Learning / تعلم الآلة"],
  ["AI202", "Neural Networks & Deep Learning / الشبكات العصبية"],
  ["IS401", "Enterprise Architecture / بنية النظم المؤسسية"],
  ["GEN101", "Calculus I / التفاضل والتكامل 1"],
  ["GEN102", "Physics for Engineers / الفيزياء للمهندسين"],
];

const insertCourse = db.prepare("INSERT INTO Course (course_code, course_name) VALUES (?, ?)");
const courseIdMap: Record<string, number> = {};
for (const [code, name] of courses) {
  const info = insertCourse.run(code, name);
  courseIdMap[code] = Number(info.lastInsertRowid);
}

const exams: Record<string, [string, number, string][]> = {
  CS301: [["2026-12-15 09:00:00", 120, "Hall 1 (Main Campus) / قاعة 1 (المبنى الرئيسي)"]],
  CS302: [["2026-12-19 12:30:00", 120, "Hall 3 (Computing Annex) / مدرج 3 (ملحق الحاسبات)"]],
  CS303: [["2026-12-24 09:00:00", 150, "Hall 1 (Main Campus) / قاعة 1 (المبنى الرئيسي)"]],
  AI201: [["2026-12-16 10:00:00", 120, "Auditorium B / المسرح الكبير ب"]],
  AI202: [["2026-12-22 13:00:00", 120, "Lab 4C (AI Lab) / معمل 4 ج (معمل الذكاء الاصطناعي)"]],
  IS401: [["2026-12-20 09:00:00", 120, "Hall 2 (IS Building) / مدرج 2 (مبنى نظم المعلومات)"]],
  GEN101: [["2026-12-14 09:00:00", 180, "Main Exam Pavilion / مجمع الامتحانات المركزي"]],
  GEN102: [["2026-12-21 11:30:00", 120, "Physics Hall 1 / قاعة الفيزياء 1"]],
};

const insertSession = db.prepare("INSERT INTO exam_session (course_id, scheduled_time, duration) VALUES (?, ?, ?)");
const insertLocation = db.prepare("INSERT INTO exam_location (session_id, location) VALUES (?, ?)");
const examLocMap: Record<string, number[]> = {};

for (const [code, sessions] of Object.entries(exams)) {
  const courseId = courseIdMap[code];
  examLocMap[code] = [];
  for (const [time, dur, loc] of sessions) {
    const sInfo = insertSession.run(courseId, time, dur);
    const sessionId = Number(sInfo.lastInsertRowid);
    const lInfo = insertLocation.run(sessionId, loc);
    examLocMap[code].push(Number(lInfo.lastInsertRowid));
  }
}

const enrollments: Record<number, string[]> = {
  2023170461: ["CS301", "CS302", "CS303"],
  2023170462: ["CS301", "CS302"],
  2024100101: ["AI201", "AI202", "CS301"],
  2024100102: ["AI201", "AI202"],
  2022050301: ["IS401", "CS301"],
  2025010001: ["GEN101", "GEN102"],
};

const insertEnrollment = db.prepare("INSERT INTO Enrollment (seat_number, course_id) VALUES (?, ?)");
const assignStudent = db.prepare("INSERT INTO student_exam_assignment (enrollment_id, exam_location_id) VALUES (?, ?)");

for (const [seat, codes] of Object.entries(enrollments)) {
  for (const code of codes) {
    const courseId = courseIdMap[code];
    const eInfo = insertEnrollment.run(Number(seat), courseId);
    const enrollmentId = Number(eInfo.lastInsertRowid);
    for (const locId of examLocMap[code] || []) {
      assignStudent.run(enrollmentId, locId);
    }
  }
}

console.log(`✓ Seed complete! Database ready at: ${targetPath}`);
console.log(`  - Students: ${students.length}`);
console.log(`  - Courses: ${courses.length}`);
console.log(`  - Exams: ${Object.keys(exams).length}`);
db.close();
