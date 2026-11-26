"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  Flame,
  Info,
  SkipForward,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getWeeklyEvaluation } from "@/lib/api";
import {
  DailySessionStatus,
  WeeklyEvaluationResponse,
} from "@/types/workout";

const STATUS_BADGE: Record<
  DailySessionStatus,
  { label: string; badgeClass: string }
> = {
  done: {
    label: "Selesai",
    badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  },
  skipped: {
    label: "Dilewati",
    badgeClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
  },
  pending: {
    label: "Terjadwal",
    badgeClass: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  },
  rest: {
    label: "Istirahat",
    badgeClass: "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]",
  },
};

export default function WeeklyEvaluationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [period, setPeriod] = useState<"last_week" | "current_week">(
    "last_week"
  );
  const [data, setData] = useState<WeeklyEvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }

    let active = true;
    getWeeklyEvaluation(period)
      .then((res) => {
        if (!active) return;
        if (!res.success || !res.data) {
          setError(res.message || "Gagal memuat evaluasi mingguan.");
          return;
        }
        setData(res.data);
        setError(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading, period, reloadTick, router]);

  if (!authLoading && !user) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#DCE1D8] rounded-2xl p-8 text-center shadow-xs space-y-4">
          <h1 className="text-xl font-bold text-[#141916]">
            Masuk untuk Melihat Evaluasi Mingguan
          </h1>
          <p className="text-sm text-[#48524C]">
            Ringkasan kepatuhan jadwal, total tonase, rata-rata RIR, dan saran mingguan tersedia untuk akun Member.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white rounded-xl text-sm font-semibold"
          >
            Masuk
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#48524C] hover:text-[#C84B11] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>

        {/* Header + Period Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#DCE1D8]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-[#C84B11]" />
              <span>Evaluasi Mingguan</span>
            </h1>
            <p className="text-sm text-[#48524C] mt-1">
              {data
                ? `Periode ${data.period_start} s/d ${data.period_end}${
                    data.split_name ? ` • ${data.split_name}` : ""
                  }`
                : "Pantau konsistensi jadwal, tonase angkatan, dan rata-rata RIR Anda."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Link
              href="/client/progress"
              className="h-11 px-4 bg-white hover:bg-[#ECEFE9] border border-[#C5CCC0] text-[#141916] rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-[#047857]" />
              <span>Progres Detail</span>
            </Link>

            <div
              className="flex items-center gap-1 p-1 bg-white border border-[#DCE1D8] rounded-xl"
              role="tablist"
              aria-label="Pilih periode evaluasi"
            >
            <button
              type="button"
              role="tab"
              aria-selected={period === "last_week"}
              onClick={() => {
                setIsLoading(true);
                setPeriod("last_week");
              }}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                period === "last_week"
                  ? "bg-[#141916] text-white"
                  : "text-[#48524C] hover:text-[#141916]"
              }`}
            >
              Minggu Lalu
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={period === "current_week"}
              onClick={() => {
                setIsLoading(true);
                setPeriod("current_week");
              }}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                period === "current_week"
                  ? "bg-[#141916] text-white"
                  : "text-[#48524C] hover:text-[#141916]"
              }`}
            >
              Minggu Ini
            </button>
          </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-pulse" aria-busy="true">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white border border-[#DCE1D8] rounded-2xl"
                />
              ))}
            </div>
            <div className="h-44 bg-white border border-[#DCE1D8] rounded-2xl" />
          </div>
        ) : error ? (
          <div className="p-8 bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#BE123C] mx-auto" />
            <p className="text-sm text-[#141916] font-medium">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : data ? (
          <>
            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-[#48524C] mb-2">
                  <span>Kepatuhan Jadwal</span>
                  <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                </div>
                <span className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                  {data.completion_percentage}%
                </span>
                <span className="text-xs text-[#626E67] font-mono tabular-nums block mt-1">
                  {data.completed_sessions} dari {data.scheduled_sessions} sesi selesai
                </span>
              </div>

              <div className="p-5 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-[#48524C] mb-2">
                  <span>Total Tonase</span>
                  <Flame className="w-4 h-4 text-[#C84B11]" />
                </div>
                <span className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                  {data.total_tonnage_kg.toLocaleString()}{" "}
                  <span className="text-base font-semibold">kg</span>
                </span>
                <div className="text-xs font-mono tabular-nums mt-1 flex items-center gap-1">
                  {data.tonnage_change_percentage !== null ? (
                    <>
                      {data.tonnage_change_kg >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-[#047857]" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-[#BE123C]" />
                      )}
                      <span
                        className={
                          data.tonnage_change_kg >= 0
                            ? "text-[#047857] font-semibold"
                            : "text-[#BE123C] font-semibold"
                        }
                      >
                        {data.tonnage_change_kg >= 0 ? "+" : ""}
                        {data.tonnage_change_percentage}% vs minggu lalu
                      </span>
                    </>
                  ) : (
                    <span className="text-[#626E67]">
                      {data.total_sets} set tercatat
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-[#48524C] mb-2">
                  <span>Rata-rata RIR</span>
                  <Zap className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <span className="text-3xl font-bold font-mono tabular-nums text-[#1D4ED8]">
                  {data.average_rir ?? "-"}
                </span>
                <span className="text-xs text-[#626E67] block mt-1">
                  Target optimal hipertrofi: 1–2
                </span>
              </div>

              <div className="p-5 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-[#48524C] mb-2">
                  <span>Sesi Dilewati</span>
                  <SkipForward className="w-4 h-4 text-[#BE123C]" />
                </div>
                <span className="text-3xl font-bold font-mono tabular-nums text-[#BE123C]">
                  {data.skipped_sessions}
                </span>
                <span className="text-xs text-[#626E67] font-mono tabular-nums block mt-1">
                  Total set: {data.total_sets}
                </span>
              </div>
            </div>

            {/* Rule-based Suggestions */}
            {data.suggestions.length > 0 && (
              <section className="space-y-3" aria-labelledby="suggestions-heading">
                <h2
                  id="suggestions-heading"
                  className="text-base font-bold text-[#141916]"
                >
                  Saran Evaluasi
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.suggestions.map((sug, idx) => {
                    const styleMap = {
                      success:
                        "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]",
                      warning:
                        "bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]",
                      info: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]",
                    };
                    const IconComp =
                      sug.type === "success"
                        ? CheckCircle2
                        : sug.type === "warning"
                        ? AlertTriangle
                        : Info;

                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border space-y-2.5 ${styleMap[sug.type]}`}
                      >
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <IconComp className="w-4 h-4 shrink-0" />
                          <span>{sug.title}</span>
                        </div>
                        <p className="text-sm text-[#141916] leading-relaxed">
                          {sug.message}
                        </p>
                        {sug.action_href && sug.action_label && (
                          <Link
                            href={sug.action_href}
                            className="inline-block text-xs font-bold underline pt-1"
                          >
                            {sug.action_label} →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 7-Day Breakdown */}
            <section className="bg-white border border-[#DCE1D8] rounded-2xl overflow-hidden shadow-xs">
              <div className="px-6 py-4 bg-[#ECEFE9]/60 border-b border-[#DCE1D8] flex items-center justify-between">
                <h2 className="text-base font-bold text-[#141916] flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#C84B11]" />
                  <span>Rincian Harian (Senin – Minggu)</span>
                </h2>
              </div>

              <div className="divide-y divide-[#DCE1D8]">
                {data.daily_breakdown.map((day) => {
                  const badge =
                    STATUS_BADGE[day.status] || STATUS_BADGE.pending;
                  return (
                    <div
                      key={day.date}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="min-w-[72px]">
                          <span className="font-bold text-sm text-[#141916] block">
                            {day.day_name}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-[#626E67]">
                            {day.date}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#141916] block">
                            {day.session_name}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-[#626E67]">
                            {day.sets_logged} Set •{" "}
                            {day.tonnage_kg.toLocaleString()} kg
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border self-start sm:self-auto ${badge.badgeClass}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
