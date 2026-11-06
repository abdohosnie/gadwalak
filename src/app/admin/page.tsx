import React from "react";
import Link from "next/link";
import { AdminUploader } from "@/components/AdminUploader";
import { GraduationCap, ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard • Gadwalak (جدولك)",
  description: "Upload and update Ain Shams University exam schedules from Excel/CSV files.",
};

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-slate-900 text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">Gadwalak Admin</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Management
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Schedule & Enrollment Administration
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Student Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 py-8 sm:px-6 md:py-12">
        <AdminUploader />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>Ain Shams University • Gadwalak Admin Management Service</p>
      </footer>
    </div>
  );
}
