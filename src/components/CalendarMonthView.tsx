"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { ScheduleItem, Language } from "../lib/types";
import { parseScheduledTime } from "../lib/calendar";
import { getTranslation } from "../lib/i18n";
import { ExamCard } from "./ExamCard";

interface CalendarMonthViewProps {
  exams: ScheduleItem[];
  lang: Language;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ exams, lang }) => {
  const t = getTranslation(lang);

  // Group exams by dateKey "YYYY-MM-DD"
  const examsByDate = React.useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const exam of exams) {
      const parsed = parseScheduledTime(exam.scheduled_time);
      if (parsed) {
        const list = map.get(parsed.dateKey) || [];
        list.push(exam);
        map.set(parsed.dateKey, list);
      }
    }
    return map;
  }, [exams]);

  // Initial month based on first exam or current date
  const initialDate = React.useMemo(() => {
    if (exams.length > 0) {
      const first = parseScheduledTime(exams[0].scheduled_time);
      if (first) return new Date(first.year, first.month - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [exams]);

  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(() => {
    if (exams.length > 0) {
      const first = parseScheduledTime(exams[0].scheduled_time);
      return first ? first.dateKey : null;
    }
    return null;
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Month label
  const monthLabel = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  // Calendar cells
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const selectedDayExams = selectedDateKey ? examsByDate.get(selectedDateKey) || [] : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {/* Navigation header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={lang === "ar" ? handleNextMonth : handlePrevMonth}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="font-bold text-base text-slate-900 sm:text-lg">
            {monthLabel}
          </span>

          <button
            type="button"
            onClick={lang === "ar" ? handlePrevMonth : handleNextMonth}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center font-bold text-xs text-slate-500 py-2 border-b border-slate-100">
          <div>{t.sun}</div>
          <div>{t.mon}</div>
          <div>{t.tue}</div>
          <div>{t.wed}</div>
          <div>{t.thu}</div>
          <div>{t.fri}</div>
          <div>{t.sat}</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 pt-2">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-14 sm:h-16" />;
            }

            const monthStr = String(month + 1).padStart(2, "0");
            const dayStr = String(day).padStart(2, "0");
            const key = `${year}-${monthStr}-${dayStr}`;
            const dayExams = examsByDate.get(key) || [];
            const hasExams = dayExams.length > 0;
            const isSelected = selectedDateKey === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDateKey(key)}
                className={`relative flex flex-col items-center justify-between h-14 sm:h-16 p-1.5 rounded-xl border transition text-xs font-semibold ${
                  isSelected
                    ? "border-amber-500 bg-amber-50 text-slate-900 ring-2 ring-amber-500/20"
                    : hasExams
                    ? "border-slate-200 bg-white hover:border-amber-400 hover:bg-slate-50 text-slate-800"
                    : "border-transparent bg-transparent hover:bg-slate-50 text-slate-500"
                }`}
              >
                <span className="text-sm font-bold">{day}</span>
                {hasExams && (
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                    {dayExams.length} {t.examCount(dayExams.length)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Exams Details */}
      {selectedDateKey && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <CalendarIcon className="h-4 w-4 text-amber-500" />
            <span>
              {selectedDateKey} • {selectedDayExams.length > 0 ? t.examsOnDay(selectedDayExams.length) : t.noExamsOnDay}
            </span>
          </div>

          {selectedDayExams.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {selectedDayExams.map((exam, i) => (
                <ExamCard key={`${exam.course_code}-${i}`} exam={exam} lang={lang} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">{t.noExamsOnDay}</p>
          )}
        </div>
      )}
    </div>
  );
};
