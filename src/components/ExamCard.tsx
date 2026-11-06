"use client";

import React from "react";
import { Clock, MapPin, CalendarPlus, Timer } from "lucide-react";
import { ScheduleItem, Language } from "../lib/types";
import { formatExamDate, getExamCountdown, generateGoogleCalendarUrl } from "../lib/calendar";
import { getTranslation } from "../lib/i18n";

interface ExamCardProps {
  exam: ScheduleItem;
  lang: Language;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam, lang }) => {
  const t = getTranslation(lang);
  const countdown = getExamCountdown(exam.scheduled_time, lang);
  const formattedDate = formatExamDate(exam.scheduled_time, lang);
  const googleCalUrl = generateGoogleCalendarUrl(exam);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md sm:p-6">
      {/* Accent strip */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-800 via-amber-500 to-amber-600 opacity-90" />

      {/* Header with Course Code & Countdown Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1 font-mono text-xs font-bold text-amber-400">
          {exam.course_code}
        </span>

        {countdown.label && (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${countdown.badgeColor}`}>
            <Timer className="h-3.5 w-3.5" />
            <span>{countdown.label}</span>
          </span>
        )}
      </div>

      {/* Course Title */}
      <h3
        dir="auto"
        className="text-base font-bold text-slate-900 transition group-hover:text-amber-600 sm:text-lg mb-4"
      >
        {exam.course_name}
      </h3>

      {/* Exam Details Grid */}
      <div className="grid gap-3 text-xs sm:text-sm text-slate-600">
        {/* Date & Time */}
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-slate-800">{formattedDate}</span>
        </div>

        {/* Location / Room */}
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
          <span dir="auto" className="font-medium text-slate-700">
            {exam.location}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-2 w-2 rounded-full bg-slate-400 shrink-0 ms-1" />
          <span className="text-slate-500">
            {t.durationMinutes}: <strong className="text-slate-800">{exam.duration}</strong> {t.durationMinutes}
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-amber-600 transition"
          title="Add to Google Calendar"
        >
          <CalendarPlus className="h-3.5 w-3.5 text-amber-500" />
          <span>{lang === "ar" ? "إضافة لـ Google Calendar" : "Add to Google Calendar"}</span>
        </a>
      </div>
    </article>
  );
};
