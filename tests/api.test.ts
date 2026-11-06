import assert from "node:assert/strict";
import { initDatabase, fetchStudent, fetchCourses, fetchSchedule, fetchDepartments, fetchDepartmentSchedule, fetchAllCourses, fetchCourseSchedule, getDatabaseStats } from "../src/lib/db";
import { normalizeRows, importUnifiedRows, generateCsvTemplate } from "../src/lib/importer";

console.log("Running Next.js API and Database tests...");

// 1. Initialize & verify stats
initDatabase();
const stats = getDatabaseStats();
assert.ok(stats.students >= 2, "Expected at least 2 students in database");
assert.ok(stats.courses >= 3, "Expected at least 3 courses in database");
console.log("✓ Database stats:", stats);

// 2. Student lookup
const student = fetchStudent(2023170461);
assert.ok(student, "Student 2023170461 should exist");
assert.match(student.full_name, /Ahmed/);
assert.equal(student.level, "Level 3");
assert.equal(student.department, "Computer Science");
console.log("✓ Student lookup passed:", student.full_name);

// 3. Courses & Schedule
const courses = fetchCourses(2023170461);
assert.ok(courses.length > 0, "Student should have courses");
const schedule = fetchSchedule(2023170461);
assert.ok(schedule.length > 0, "Student should have exam sessions");
console.log(`✓ Fetched ${courses.length} courses and ${schedule.length} exams for student`);

// 4. Departments
const depts = fetchDepartments();
assert.ok(depts.length > 0, "Should have departments");
assert.ok(depts.some((d) => d.name === "Computer Science"), "Computer Science department should exist");
console.log("✓ Departments list passed:", depts.map((d) => d.name));

// 5. Department Schedule
const deptSchedule = fetchDepartmentSchedule("Computer Science", "Level 3");
assert.ok(deptSchedule.length > 0, "Computer Science Level 3 should have exams");
console.log(`✓ Department schedule passed: ${deptSchedule.length} exams`);

// 6. Course schedule
const courseExams = fetchCourseSchedule("CS301");
assert.ok(courseExams.length > 0, "CS301 should have exams");
console.log(`✓ Course schedule passed for CS301: ${courseExams.length} sessions`);

// 7. Importer normalization & template
const template = generateCsvTemplate();
assert.ok(template.includes("Seat Number"), "Template should contain Seat Number");
assert.ok(template.includes("CS301"), "Template should contain sample CS301");

const rawTestRows = [
  {
    "رقم الجلوس": "2026999901",
    "اسم الطالب": "Test Student 1 / طالب تجريبي",
    "القسم": "Artificial Intelligence",
    "الفرقة": "Level 1",
    "كود المادة": "TEST101",
    "اسم المقرر": "Intro to Testing / مقدمة في الاختبار",
    "موعد الامتحان": "2026-12-30 10:00:00",
    "المدة": "120",
    "المدرج": "Hall 9",
  },
];

const { rows, errors } = normalizeRows(rawTestRows);
assert.equal(errors.length, 0, "Should normalize without errors");
assert.equal(rows.length, 1);
assert.equal(rows[0].seat_number, 2026999901);
assert.equal(rows[0].course_code, "TEST101");

const importResult = importUnifiedRows(rows);
assert.equal(importResult.importedStudents, 1);
assert.equal(importResult.importedCourses, 1);

const importedStudent = fetchStudent(2026999901);
assert.ok(importedStudent);
assert.equal(importedStudent.department, "Artificial Intelligence");
console.log("✓ Importer pipeline successfully imported new student & course into database!");

console.log("\nAll 7 test suites passed successfully!");
