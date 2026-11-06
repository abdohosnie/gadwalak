"use client";

import React from "react";
import Link from "next/link";
import { Globe, GraduationCap, Shield } from "lucide-react";
import { Language } from "../lib/types";
import { getTranslation } from "../lib/i18n";

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  onResetSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ lang, onToggleLang, onResetSearch }) => {
  const t = getTranslation(lang);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-slate-900 text-white shadow-md backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <button
          onClick={onResetSearch}
          className="group flex items-center gap-3 text-left transition hover:opacity-90"
          type="button"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-inner">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-xl text-white">
                {t.appTitle}
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-500/30">
                {t.badge}
              </span>
            </div>
            <p className="text-xs text-slate-300 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            title="Admin Portal / لوحة الإدارة"
          >
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">{lang === "ar" ? "لوحة الإدارة" : "Admin"}</span>
          </Link>

          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            type="button"
            title="Toggle language / تغيير اللغة"
          >
            <Globe className="h-3.5 w-3.5 text-amber-400" />
            <span>{lang === "en" ? "العربية" : "English"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
