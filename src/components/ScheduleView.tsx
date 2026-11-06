"use client";

import React, { useState } from "react";
import {
  Calendar,
  List,
  Download,
  CalendarPlus,
  ArrowLeft,
  ArrowRight,
  User,
  GraduationCap,
  Building2,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import {
  ScheduleItem,
  Course,
  StudentInfo,
  Language,
  ViewMode,
} from "../lib/types";
import { downloadIcsSchedule, parseScheduledTime } from "../lib/calendar";
import { getTranslation } from "../lib/i18n";
import { ExamCard } from "./ExamCard";
import { CalendarMonthView } from "./CalendarMonthView";

interface ScheduleViewProps {
  lang: Language;
  student?: StudentInfo;
  departmentName?: string;
  departmentLevel?: string;
  courseDetails?: Course;
  courses: Course[];
  schedule: ScheduleItem[];
  onBackToSearch: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  lang,
  student,
  departmentName,
  departmentLevel,
  courseDetails,
  courses,
  schedule,
  onBackToSearch,
}) => {
  const t = getTranslation(lang);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Check for exam day collisions
  const dayCollisions = React.useMemo(() => {
    const dates: Record<string, string[]> = {};
    for (const exam of schedule) {
      const parsed = parseScheduledTime(exam.scheduled_time);
      if (parsed) {
        dates[parsed.dateKey] = dates[parsed.dateKey] || [];
        dates[parsed.dateKey].push(exam.course_code);
      }
    }
    return Object.entries(dates).filter(([, codes]) => codes.length > 1);
  }, [schedule]);

  const handleDownloadIcs = () => {
    const name = student
      ? `schedule-${student.id}.ics`
      : departmentName
      ? `schedule-${departmentName}.ics`
      : "exam-schedule.ics";
    downloadIcsSchedule(schedule, name);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToSearch}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-amber-600"
        >
          {lang === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          <span>{t.backToSearch}</span>
        </button>
      </div>

      {/* Profile / Details Banner */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-xl shadow-slate-900/10">
        <div className="border-b border-slate-800 bg-slate-800/50 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md">
                {student ? <User className="h-6 w-6" /> : departmentName ? <Building2 className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
              </div>
              <div>
                <h2 dir="auto" className="text-xl font-bold text-white sm:text-2xl">
                  {student
                    ? student.full_name
                    : departmentName
                    ? `${departmentName} • ${departmentLevel}`
                    : courseDetails?.course_name}
                </h2>
                <p className="text-xs text-slate-300">
                  {student
                    ? `${t.seatNumber}: ${student.id} • ${student.department} • ${student.level}`
                    : departmentName
                    ? `${t.department}: ${departmentName}`
                    : `${t.tabCourse}: ${courseDetails?.course_code}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-amber-500/20 px-3 py-1 font-mono text-xs font-bold text-amber-300 border border-amber-500/30">
                {t.examCount(schedule.length)}
              </span>
              {courses.length > 0 && (
                <span className="rounded-xl bg-slate-800 px-3 py-1 font-mono text-xs font-semibold text-slate-300 border border-slate-700">
                  {t.courseCount(courses.length)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Student metadata bar */}
        {student && (
          <div className="grid grid-cols-2 gap-4 px-6 py-3 text-xs sm:grid-cols-4 bg-slate-900/60">
            <div>
              <span className="text-slate-400 block">{t.seatNumber}</span>
              <strong className="text-white text-sm font-mono">{student.id}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">{t.level}</span>
              <strong className="text-white text-sm">{student.level}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block">{t.department}</span>
              <strong className="text-white text-sm">{student.department}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Collision Alert if applicable */}
      {dayCollisions.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <strong>Notice:</strong> Multiple exams are scheduled on the same date ({dayCollisions.map(([date, codes]) => `${date}: ${codes.join(", ")}`).join("; ")}). Please review your schedule carefully.
          </div>
        </div>
      )}

      {/* Controls & Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* View Switcher (List / Calendar) */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="h-4 w-4 text-amber-500" />
            <span>{t.viewList}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              viewMode === "calendar"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="h-4 w-4 text-amber-500" />
            <span>{t.viewCalendar}</span>
          </button>
        </div>

        {/* Sync & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {schedule.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-amber-500"
              title="Download iCalendar file"
            >
              <Download className="h-3.5 w-3.5 text-amber-500" />
              <span>{t.downloadIcs}</span>
            </button>
          )}
        </div>
      </div>

      {/* Exams View */}
      {schedule.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          <p>{t.noExams}</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">
              {t.assignedExams}
            </h3>
            <span className="text-xs text-slate-500">
              {t.examCount(schedule.length)}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {schedule.map((exam, idx) => (
              <ExamCard key={`${exam.course_code}-${idx}`} exam={exam} lang={lang} />
            ))}
          </div>
        </div>
      ) : (
        <CalendarMonthView exams={schedule} lang={lang} />
      )}

      {/* Enrolled Courses Section */}
      {courses.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-amber-500" />
            <span>{t.registeredCourses}</span>
            <span className="text-xs font-semibold text-slate-500">
              ({courses.length})
            </span>
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.course_code}
                className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
              >
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {course.course_code}
                </span>
                <span dir="auto" className="font-medium text-slate-700 truncate">
                  {course.course_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
