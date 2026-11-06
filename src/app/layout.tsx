import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gadwalak | جدولك - Ain Shams University Exam Timetables",
  description: "Official exam schedule portal for Ain Shams University students. Search by seat number, department, or course.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
