"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { SearchTabs } from "../components/SearchTabs";
import { ScheduleView } from "../components/ScheduleView";
import {
  DepartmentInfo,
  Course,
  StudentScheduleResponse,
  DepartmentScheduleResponse,
  CourseScheduleResponse,
  Language,
  SearchMode,
  ScheduleItem,
  StudentInfo,
} from "../lib/types";
import { getTranslation } from "../lib/i18n";
import { AlertCircle } from "lucide-react";

interface ActiveScheduleResult {
  type: "student" | "department" | "course";
  student?: StudentInfo;
  departmentName?: string;
  departmentLevel?: string;
  courseDetails?: Course;
  courses: Course[];
  schedule: ScheduleItem[];
}

export default function HomePage() {
  const [lang, setLang] = useState<Language>("ar");
  const [mode, setMode] = useState<SearchMode>("student");
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<ActiveScheduleResult | null>(null);

  const t = getTranslation(lang);

  // Initialize lang and recents from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("gadwalak_lang") as Language;
      if (savedLang === "en" || savedLang === "ar") {
        setLang(savedLang);
      }
      const savedRecents = localStorage.getItem("gadwalak_recents");
      if (savedRecents) {
        setRecentSearches(JSON.parse(savedRecents));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Sync document dir/lang when language changes
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("gadwalak_lang", lang);
    } catch {
      // Ignore
    }
  }, [lang]);

  // Load catalogs on mount
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [deptRes, courseRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/courses"),
        ]);
        if (deptRes.ok) {
          const depts = await deptRes.json();
          setDepartments(depts);
        }
        if (courseRes.ok) {
          const crs = await courseRes.json();
          setCourses(crs);
        }
      } catch {
        // Silently continue; search by ID remains available
      }
    }
    loadCatalogs();
  }, []);

  const saveRecentSearch = (seatNumber: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== seatNumber);
      const updated = [seatNumber, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("gadwalak_recents", JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleClearRecents = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("gadwalak_recents");
    } catch {
      // Ignore
    }
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "ar" : "en"));
  };

  const handleSearchStudent = async (seatNumber: string) => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      const res = await fetch(`/api/get/${seatNumber}`);
      if (res.status === 404) {
        setGlobalError(t.errorNotFound);
        return;
      }
      if (!res.ok) {
        setGlobalError(t.errorGeneric);
        return;
      }
      const data: StudentScheduleResponse = await res.json();
      saveRecentSearch(seatNumber);
      setActiveResult({
        type: "student",
        student: data.student,
        courses: data.courses,
        schedule: data.schedule,
      });
    } catch {
      setGlobalError(t.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchDepartment = async (department: string, level: string) => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      const res = await fetch(
        `/api/schedule/department/${encodeURIComponent(department)}/${encodeURIComponent(level)}`
      );
      if (res.status === 404) {
        setGlobalError(t.errorNotFound);
        return;
      }
      if (!res.ok) {
        setGlobalError(t.errorGeneric);
        return;
      }
      const data: DepartmentScheduleResponse = await res.json();
      setActiveResult({
        type: "department",
        departmentName: data.department,
        departmentLevel: data.level,
        courses: data.courses,
        schedule: data.schedule,
      });
    } catch {
      setGlobalError(t.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchCourse = async (courseCode: string) => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      const res = await fetch(`/api/schedule/course/${encodeURIComponent(courseCode)}`);
      if (res.status === 404) {
        setGlobalError(t.errorNotFound);
        return;
      }
      if (!res.ok) {
        setGlobalError(t.errorGeneric);
        return;
      }
      const data: CourseScheduleResponse = await res.json();
      setActiveResult({
        type: "course",
        courseDetails: data.course,
        courses: [data.course],
        schedule: data.schedule,
      });
    } catch {
      setGlobalError(t.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSearch = () => {
    setActiveResult(null);
    setGlobalError(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar
        lang={lang}
        onToggleLang={toggleLanguage}
        onResetSearch={handleBackToSearch}
      />

      <main className="flex-1 px-4 py-8 sm:px-6 md:py-12">
        {globalError && (
          <div className="mx-auto mb-6 flex max-w-2xl items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-sm sm:text-sm">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        {!activeResult ? (
          <SearchTabs
            lang={lang}
            mode={mode}
            onSelectMode={setMode}
            departments={departments}
            courses={courses}
            onSearchStudent={handleSearchStudent}
            onSearchDepartment={handleSearchDepartment}
            onSearchCourse={handleSearchCourse}
            isLoading={isLoading}
            recentSearches={recentSearches}
            onClearRecentSearches={handleClearRecents}
          />
        ) : (
          <ScheduleView
            lang={lang}
            student={activeResult.student}
            departmentName={activeResult.departmentName}
            departmentLevel={activeResult.departmentLevel}
            courseDetails={activeResult.courseDetails}
            courses={activeResult.courses}
            schedule={activeResult.schedule}
            onBackToSearch={handleBackToSearch}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>{t.footerText}</p>
      </footer>
    </div>
  );
}
