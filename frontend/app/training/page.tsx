"use client";

import { Zap, ShieldCheck } from "lucide-react";
import TodayDashboardSection from "@/app/components/TodayDashboardSection";

export default function TrainingDashboardPage() {
  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#DCE1D8]">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#141916]">
              Dashboard Latihan
            </h1>
            <p className="text-sm sm:text-base text-[#48524C] mt-2 leading-relaxed">
              Ikuti panduan jadwal mingguan Anda, pelajari teknik setiap gerakan
              secara visual, dan catat beban serta{" "}
              <strong className="font-semibold text-[#141916]">
                RIR (Reps In Reserve)
              </strong>{" "}
              untuk menjaga progressive overload.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#48524C] shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#A83D0B]" />
              <span>Target 1–2 RIR (sisa 1–2 rep)</span>
            </span>
            <span className="text-[#8E9891]" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span>Gerakan Penuh (Full ROM)</span>
            </span>
          </div>
        </section>

        <TodayDashboardSection />
      </div>
    </main>
  );
}
