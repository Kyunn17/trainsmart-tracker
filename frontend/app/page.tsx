import { Zap, ShieldCheck } from "lucide-react";
import TodayDashboardSection from "@/app/components/TodayDashboardSection";

export default function Home() {
  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Operational Page Header */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#DCE1D8]">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#141916]">
              Dashboard Latihan
            </h1>
            <p className="text-sm sm:text-base text-[#48524C] mt-2 leading-relaxed">
              Ikuti panduan jadwal mingguan Anda, pelajari teknik setiap gerakan secara visual, dan catat beban serta{" "}
              <strong className="font-semibold text-[#141916]">RIR (Reps In Reserve)</strong>{" "}
              untuk menjaga progressive overload.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <span className="px-3.5 py-2 bg-white border border-[#DCE1D8] rounded-xl text-xs font-semibold text-[#141916] flex items-center gap-2 shadow-xs">
              <Zap className="w-4 h-4 text-[#C84B11]" />
              <span>Target 1–2 RIR</span>
            </span>
            <span className="px-3.5 py-2 bg-white border border-[#DCE1D8] rounded-xl text-xs font-semibold text-[#141916] flex items-center gap-2 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span>Full Range of Motion</span>
            </span>
          </div>
        </section>

        {/* Role-Aware Today Session, Guide & Personal History */}
        <TodayDashboardSection />
      </div>
    </main>
  );
}
