"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Lock,
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface DatabaseStats {
  students: number;
  courses: number;
  exams: number;
  enrollments: number;
}

interface ImportSummary {
  totalRows: number;
  importedStudents: number;
  importedCourses: number;
  importedExams: number;
  errors: string[];
  validationWarnings?: string[];
}

export const AdminUploader: React.FC = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // Check saved password
  useEffect(() => {
    const saved = sessionStorage.getItem("gadwalak_admin_pass");
    if (saved) {
      setPassword(saved);
      verifyAndLoadStats(saved);
    }
  }, []);

  const verifyAndLoadStats = async (pass: string) => {
    setIsLoadingStats(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-password": pass },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setIsAuthenticated(true);
        sessionStorage.setItem("gadwalak_admin_pass", pass);
      } else {
        setAuthError("Incorrect admin password.");
        setIsAuthenticated(false);
        sessionStorage.removeItem("gadwalak_admin_pass");
      }
    } catch {
      setAuthError("Could not connect to admin service.");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    verifyAndLoadStats(password.trim());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportSummary(null);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setImportSummary(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("password", password);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.detail || "Failed to import spreadsheet.");
      } else {
        setImportSummary(data.result);
        setSelectedFile(null);
        // Refresh database statistics
        verifyAndLoadStats(password);
      }
    } catch {
      setUploadError("Network error while uploading file.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-amber-400 shadow-md">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Admin Portal</h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter your admin password to upload or update exam schedules.
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition"
              required
            />
          </div>

          {authError && (
            <p className="rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-700 border border-rose-200">
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoadingStats || !password.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
          >
            {isLoadingStats ? "Verifying..." : "Unlock Dashboard"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Database Statistics */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold sm:text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" />
            <span>Database Status</span>
          </h3>
          <button
            type="button"
            onClick={() => verifyAndLoadStats(password)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
            title="Refresh statistics"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Users className="h-4 w-4 text-amber-400" />
              <span>Students</span>
            </span>
            <strong className="mt-1 block text-2xl font-bold text-white">
              {stats?.students ?? 0}
            </strong>
          </div>

          <div className="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <span>Courses</span>
            </span>
            <strong className="mt-1 block text-2xl font-bold text-white">
              {stats?.courses ?? 0}
            </strong>
          </div>

          <div className="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Calendar className="h-4 w-4 text-amber-400" />
              <span>Exam Sessions</span>
            </span>
            <strong className="mt-1 block text-2xl font-bold text-white">
              {stats?.exams ?? 0}
            </strong>
          </div>

          <div className="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Layers className="h-4 w-4 text-amber-400" />
              <span>Enrollments</span>
            </span>
            <strong className="mt-1 block text-2xl font-bold text-white">
              {stats?.enrollments ?? 0}
            </strong>
          </div>
        </div>
      </div>

      {/* Upload & Template Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Upload Schedule Spreadsheet
            </h2>
            <p className="text-xs text-slate-600 sm:text-sm mt-1">
              Upload Excel (.xlsx) or CSV files containing student enrollments and exam schedules.
            </p>
          </div>

          {/* Download Template Button */}
          <a
            href="/api/admin/template"
            download="gadwalak-schedule-template.csv"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-100 hover:border-amber-500"
          >
            <Download className="h-4 w-4 text-amber-500" />
            <span>Download CSV Template</span>
          </a>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition hover:border-amber-500 hover:bg-amber-50/30">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {selectedFile ? selectedFile.name : "Choose an Excel or CSV file or drag and drop"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports .xlsx, .xls, and .csv with Arabic or English column headers
              </p>
            </div>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 border border-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4 text-amber-400" />
            <span>{isUploading ? "Importing Records..." : "Import into Database"}</span>
          </button>
        </form>

        {/* Import Results Card */}
        {importSummary && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-xs text-emerald-900">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <strong className="text-sm font-bold text-emerald-950">
                Spreadsheet Successfully Imported!
              </strong>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-medium mb-3">
              <div className="rounded-lg bg-white/80 p-2.5 border border-emerald-200">
                <span className="text-slate-500 block">Total Rows</span>
                <strong className="text-base text-slate-900">{importSummary.totalRows}</strong>
              </div>
              <div className="rounded-lg bg-white/80 p-2.5 border border-emerald-200">
                <span className="text-slate-500 block">Students Updated</span>
                <strong className="text-base text-slate-900">{importSummary.importedStudents}</strong>
              </div>
              <div className="rounded-lg bg-white/80 p-2.5 border border-emerald-200">
                <span className="text-slate-500 block">Courses Updated</span>
                <strong className="text-base text-slate-900">{importSummary.importedCourses}</strong>
              </div>
              <div className="rounded-lg bg-white/80 p-2.5 border border-emerald-200">
                <span className="text-slate-500 block">Exams Scheduled</span>
                <strong className="text-base text-slate-900">{importSummary.importedExams}</strong>
              </div>
            </div>

            {importSummary.validationWarnings && importSummary.validationWarnings.length > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 border border-amber-200 text-amber-900">
                <span className="font-bold block mb-1">Row Warnings ({importSummary.validationWarnings.length}):</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {importSummary.validationWarnings.slice(0, 5).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                  {importSummary.validationWarnings.length > 5 && (
                    <li>...and {importSummary.validationWarnings.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
