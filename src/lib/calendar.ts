import { ScheduleItem, Language } from "./types";

export interface ParsedTime {
  date: Date;
  dateKey: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  isoString: string;
}

export function parseScheduledTime(value: string): ParsedTime | null {
  if (!value) return null;
  const cleaned = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(cleaned);
  if (!match) return null;

  const [, yearStr, monthStr, dayStr, hourStr, minStr] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = hourStr ? parseInt(hourStr, 10) : 9;
  const minute = minStr ? parseInt(minStr, 10) : 0;

  const date = new Date(year, month - 1, day, hour, minute);
  const dateKey = `${yearStr}-${monthStr.padStart(2, "0")}-${dayStr.padStart(2, "0")}`;

  return {
    date,
    dateKey,
    year,
    month,
    day,
    hour,
    minute,
    isoString: date.toISOString(),
  };
}

export function formatExamDate(value: string, lang: Language): string {
  const parsed = parseScheduledTime(value);
  if (!parsed) return value;

  const locale = lang === "ar" ? "ar-EG" : "en-GB";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateFormatter.format(parsed.date)} • ${timeFormatter.format(parsed.date)}`;
}

export function getExamCountdown(scheduledTime: string, lang: Language): { label: string; badgeColor: string; isPast: boolean } {
  const parsed = parseScheduledTime(scheduledTime);
  if (!parsed) return { label: "", badgeColor: "bg-slate-100 text-slate-700", isPast: false };

  const now = new Date();
  const diffMs = parsed.date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0 && Math.abs(diffDays) > 1) {
    return {
      label: lang === "ar" ? "انتهى الامتحان" : "Completed",
      badgeColor: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
      isPast: true,
    };
  }

  if (diffDays === 0) {
    return {
      label: lang === "ar" ? "اليوم!" : "Today!",
      badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold animate-pulse",
      isPast: false,
    };
  }

  if (diffDays === 1) {
    return {
      label: lang === "ar" ? "غداً!" : "Tomorrow!",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold",
      isPast: false,
    };
  }

  if (diffDays > 1 && diffDays <= 7) {
    return {
      label: lang === "ar" ? `بعد ${diffDays} أيام` : `In ${diffDays} days`,
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium",
      isPast: false,
    };
  }

  return {
    label: lang === "ar" ? `بعد ${diffDays} يوم` : `In ${diffDays} days`,
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    isPast: false,
  };
}

export function generateGoogleCalendarUrl(exam: ScheduleItem): string {
  const parsed = parseScheduledTime(exam.scheduled_time);
  if (!parsed) return "#";

  const start = parsed.date;
  const end = new Date(start.getTime() + exam.duration * 60 * 1000);

  const formatUtc = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d+/g, "");

  const title = encodeURIComponent(`Final Exam: ${exam.course_name} (${exam.course_code})`);
  const details = encodeURIComponent(
    `Ain Shams University Examination\nCourse: ${exam.course_name} (${exam.course_code})\nDuration: ${exam.duration} minutes\nLocation: ${exam.location}`
  );
  const location = encodeURIComponent(exam.location);
  const dates = `${formatUtc(start)}/${formatUtc(end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function downloadIcsSchedule(exams: ScheduleItem[], filename = "exam-schedule.ics"): void {
  if (typeof window === "undefined" || !exams.length) return;

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatIcsDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gadwalak//Ain Shams University Exam Timetable//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const exam of exams) {
    const parsed = parseScheduledTime(exam.scheduled_time);
    if (!parsed) continue;

    const start = parsed.date;
    const end = new Date(start.getTime() + exam.duration * 60 * 1000);
    const now = new Date();

    icsContent.push(
      "BEGIN:VEVENT",
      `UID:${exam.course_code}-${start.getTime()}@gadwalak.asu.edu.eg`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:Final Exam: ${exam.course_name} (${exam.course_code})`,
      `DESCRIPTION:Ain Shams University Exam\\nCourse: ${exam.course_name} (${exam.course_code})\\nDuration: ${exam.duration} minutes\\nLocation: ${exam.location}`,
      `LOCATION:${exam.location}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  icsContent.push("END:VCALENDAR");

  const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
