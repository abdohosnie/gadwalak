"use client";

import React, { useState } from "react";
import { User, Building2, BookOpen, Search, Clock, X } from "lucide-react";
import { DepartmentInfo, Course, Language, SearchMode } from "../lib/types";
import { getTranslation } from "../lib/i18n";

interface SearchTabsProps {
  lang: Language;
  mode: SearchMode;
  onSelectMode: (mode: SearchMode) => void;
  departments: DepartmentInfo[];
  courses: Course[];
  onSearchStudent: (seatNumber: string) => void;
  onSearchDepartment: (dept: string, level: string) => void;
  onSearchCourse: (courseCode: string) => void;
  isLoading: boolean;
  recentSearches: string[];
  onClearRecentSearches: () => void;
}

export const SearchTabs: React.FC<SearchTabsProps> = ({
  lang,
  mode,
  onSelectMode,
  departments,
  courses,
  onSearchStudent,
  onSearchDepartment,
  onSearchCourse,
  isLoading,
  recentSearches,
  onClearRecentSearches,
}) => {
  const t = getTranslation(lang);
  const [seatInput, setSeatInput] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [courseInput, setCourseInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = seatInput.trim();
    if (!/^\d{1,12}$/.test(cleaned) || Number(cleaned) <= 0) {
      setErrorMsg(t.errorInvalidId);
      return;
    }
    setErrorMsg("");
    onSearchStudent(cleaned);
  };

  const handleDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !selectedLevel) return;
    setErrorMsg("");
    onSearchDepartment(selectedDept, selectedLevel);
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseInput.trim()) return;
    setErrorMsg("");
    onSearchCourse(courseInput.trim());
  };

  const currentLevels = departments.find((d) => d.name === selectedDept)?.levels || [];

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 transition sm:p-8">
      {/* Header Info */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t.searchTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          {t.searchSubtitle}
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1.5 text-xs font-semibold sm:text-sm">
        <button
          type="button"
          onClick={() => {
            onSelectMode("student");
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 transition ${
            mode === "student"
              ? "bg-white text-slate-900 shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="h-4 w-4 text-amber-500" />
          <span>{t.tabStudent}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectMode("department");
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 transition ${
            mode === "department"
              ? "bg-white text-slate-900 shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="h-4 w-4 text-amber-500" />
          <span>{t.tabDepartment}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectMode("course");
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 transition ${
            mode === "course"
              ? "bg-white text-slate-900 shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="h-4 w-4 text-amber-500" />
          <span>{t.tabCourse}</span>
        </button>
      </div>

      {/* Mode 1: Student Seat Number */}
      {mode === "student" && (
        <form onSubmit={handleStudentSubmit} className="space-y-4">
          <div>
            <label htmlFor="student-seat" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.seatInputLabel}
            </label>
            <div className="relative">
              <input
                id="student-seat"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{1,12}"
                maxLength={12}
                value={seatInput}
                onChange={(e) => {
                  setSeatInput(e.target.value);
                  setErrorMsg("");
                }}
                placeholder={t.seatInputPlaceholder}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-base font-medium text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition"
                autoComplete="off"
                required
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{t.seatHint}</p>
          </div>

          {errorMsg && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 border border-rose-200">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !seatInput.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search className="h-4 w-4 text-amber-400" />
            <span>{isLoading ? t.searching : t.searchBtn}</span>
          </button>

          {/* Recent Searches Pills */}
          {recentSearches.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  {t.recentSearches}
                </span>
                <button
                  type="button"
                  onClick={onClearRecentSearches}
                  className="hover:text-rose-600 transition"
                >
                  {t.clearRecents}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((seat) => (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => {
                      setSeatInput(seat);
                      onSearchStudent(seat);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900"
                  >
                    <span>{seat}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      )}

      {/* Mode 2: Department & Level */}
      {mode === "department" && (
        <form onSubmit={handleDepartmentSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dept-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.departmentSelectLabel}
              </label>
              <select
                id="dept-select"
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedLevel("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition"
                required
              >
                <option value="">{t.selectDepartmentPlaceholder}</option>
                {departments.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="level-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.levelSelectLabel}
              </label>
              <select
                id="level-select"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                disabled={!selectedDept}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition disabled:opacity-50"
                required
              >
                <option value="">{t.selectLevelPlaceholder}</option>
                {currentLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !selectedDept || !selectedLevel}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Building2 className="h-4 w-4 text-amber-400" />
            <span>{isLoading ? t.searching : t.viewDepartmentBtn}</span>
          </button>
        </form>
      )}

      {/* Mode 3: Course Code Search */}
      {mode === "course" && (
        <form onSubmit={handleCourseSubmit} className="space-y-4">
          <div>
            <label htmlFor="course-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.courseSelectLabel}
            </label>
            <div className="flex gap-2">
              <input
                id="course-input"
                type="text"
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value.toUpperCase())}
                placeholder={t.courseSearchPlaceholder}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-base font-semibold text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition uppercase"
                required
              />
              {courses.length > 0 && (
                <select
                  aria-label="Course list"
                  onChange={(e) => {
                    if (e.target.value) {
                      setCourseInput(e.target.value);
                      onSearchCourse(e.target.value);
                    }
                  }}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500"
                >
                  <option value="">{t.selectCoursePlaceholder}</option>
                  {courses.map((c) => (
                    <option key={c.course_code} value={c.course_code}>
                      {c.course_code} - {c.course_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !courseInput.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span>{isLoading ? t.searching : t.viewCourseBtn}</span>
          </button>
        </form>
      )}
    </div>
  );
};
