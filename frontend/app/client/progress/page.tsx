"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Flame,
  ArrowLeft,
  Zap,
  StickyNote,
  TrendingUp,
} from "lucide-react";
import { getClientMyProgress } from "@/lib/api";
import { WorkoutLogEntry, User } from "@/types/workout";

function getRirBadgeStyle(rir: number | null | undefined) {
  if (rir === 0) {
    return "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]";
  }
  if (rir === 1 || rir === 2) {
    return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
  }
  return "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]";
}

export default function ClientProgressPage() {
  const [data, setData] = useState<{
    summary: {
      total_sets: number;
      total_volume_kg: number;
      average_rir: number | null;
    };
    trainer: User | null;
    logs: WorkoutLogEntry[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getClientMyProgress().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, []);

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#48524C] hover:text-[#C84B11] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#DCE1D8]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-[#047857]" />
              <span>Progres Latihan & Beban Anda</span>
            </h1>
            <p className="text-sm text-[#48524C] mt-1.5">
              Catatan progresif untuk memastikan stimulus mekanis otot bertambah setiap pekannya.
            </p>
          </div>

          <Link
            href="/"
            className="h-10 px-4 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Flame className="w-4 h-4" />
            <span>Latihan Sekarang</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Memuat data progres">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="p-5 bg-white border border-[#DCE1D8] rounded-2xl animate-pulse space-y-3"
                >
                  <div className="h-4 w-28 bg-[#ECEFE9] rounded" />
                  <div className="h-8 w-20 bg-[#ECEFE9] rounded" />
                  <div className="h-3 w-36 bg-[#ECEFE9] rounded" />
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border border-[#DCE1D8] rounded-2xl animate-pulse space-y-3">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="h-12 bg-[#ECEFE9] rounded-xl" />
              ))}
            </div>
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="p-10 sm:p-12 text-center bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#ECEFE9] text-[#48524C] flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#141916] mb-1.5">
              Belum Ada Sesi yang Disimpan
            </h2>
            <p className="text-sm text-[#48524C] max-w-md mx-auto mb-6">
              Selesaikan set latihan Anda dari dashboard dan simpan sesi untuk mulai merekam riwayat progres hipertrofi Anda.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-11 px-6 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Mulai Sesi Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-[#48524C] text-xs font-semibold mb-2">
                  <span>Total Set Terekam</span>
                  <Dumbbell className="w-4 h-4 text-[#C84B11]" />
                </div>
                <span className="text-3xl font-bold text-[#141916] font-mono tabular-nums">
                  {data.summary.total_sets}
                </span>
                <span className="text-xs text-[#626E67] block mt-1">
                  Set latihan tereksekusi
                </span>
              </div>

              <div className="p-5 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-[#48524C] text-xs font-semibold mb-2">
                  <span>Total Tonase Diangkat</span>
                  <Flame className="w-4 h-4 text-[#047857]" />
                </div>
                <span className="text-3xl font-bold text-[#047857] font-mono tabular-nums">
                  {data.summary.total_volume_kg.toLocaleString()}{" "}
                  <span className="text-base font-semibold">kg</span>
                </span>
                <span className="text-xs text-[#626E67] block mt-1">
                  Volume beban terakumulasi
                </span>
              </div>

              <div className="p-5 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-[#48524C] text-xs font-semibold mb-2">
                  <span>Rata-rata Proksimitas RIR</span>
                  <Zap className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <span className="text-3xl font-bold text-[#1D4ED8] font-mono tabular-nums">
                  {data.summary.average_rir ?? "-"}
                </span>
                <span className="text-xs text-[#626E67] block mt-1">
                  Target optimal: 1–2 RIR sebelum failure
                </span>
              </div>
            </div>

            {/* Coach Banner */}
            {data.trainer && (
              <div className="p-4 sm:p-5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    PT
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#1D4ED8] block">
                      Personal Trainer Anda
                    </span>
                    <span className="text-base font-bold text-[#141916]">
                      {data.trainer.name}
                    </span>
                    {data.trainer.specialization && (
                      <span className="text-xs text-[#48524C] block sm:inline sm:ml-2">
                        • {data.trainer.specialization}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href="/client/trainer"
                  className="text-xs font-semibold text-[#1D4ED8] hover:underline self-start sm:self-auto"
                >
                  Kelola / Ganti Trainer
                </Link>
              </div>
            )}

            {/* Complete Log Feed */}
            <div className="bg-white border border-[#DCE1D8] rounded-2xl overflow-hidden shadow-xs">
              <div className="px-6 py-4 bg-[#ECEFE9]/60 border-b border-[#DCE1D8] flex items-center justify-between">
                <h2 className="text-base font-bold text-[#141916]">
                  Catatan Set & Beban Latihan
                </h2>
                <span className="text-xs font-mono tabular-nums font-semibold text-[#48524C] bg-white border border-[#DCE1D8] px-3 py-1 rounded-lg">
                  {data.logs.length} Set
                </span>
              </div>

              <div className="divide-y divide-[#DCE1D8]">
                <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-[#F5F6F3] text-xs font-semibold text-[#626E67] uppercase tracking-wider">
                  <div className="col-span-5">Gerakan & Kategori</div>
                  <div className="col-span-2">Set</div>
                  <div className="col-span-3">Beban & Repetisi</div>
                  <div className="col-span-2 text-right">Intensitas</div>
                </div>

                {data.logs.map((log: WorkoutLogEntry) => (
                  <div
                    key={log.id}
                    className="px-6 py-4 hover:bg-[#F5F6F3]/70 transition-colors"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start sm:items-center">
                      <div className="sm:col-span-5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#141916] text-sm">
                            {log.exercise?.name ||
                              `Gerakan #${log.exercise_id}`}
                          </span>
                          {(log.exercise as { category?: { name?: string } })
                            ?.category?.name && (
                            <span className="text-xs text-[#626E67] bg-[#ECEFE9] px-2 py-0.5 rounded-md">
                              {
                                (
                                  log.exercise as {
                                    category?: { name?: string };
                                  }
                                ).category?.name
                              }
                            </span>
                          )}
                        </div>
                        {log.notes && (
                          <p className="text-xs text-[#48524C] mt-1 flex items-center gap-1.5">
                            <StickyNote className="w-3.5 h-3.5 text-[#C84B11] shrink-0" />
                            <span>{log.notes}</span>
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-start">
                        <span className="text-xs font-mono tabular-nums font-semibold text-[#48524C] bg-[#ECEFE9] border border-[#DCE1D8] px-2.5 py-1 rounded-lg">
                          Set {log.set_number}
                        </span>
                        <span className="sm:hidden font-mono tabular-nums font-bold text-[#047857] text-sm">
                          {log.weight} kg × {log.reps} reps
                        </span>
                      </div>

                      <div className="hidden sm:block sm:col-span-3 font-mono tabular-nums font-semibold text-[#047857] text-sm">
                        {log.weight} kg × {log.reps} reps
                      </div>

                      <div className="sm:col-span-2 flex items-center sm:justify-end gap-2">
                        <span
                          className={`text-xs font-mono tabular-nums font-semibold px-2.5 py-1 rounded-lg border ${getRirBadgeStyle(
                            log.rir
                          )}`}
                        >
                          RIR {log.rir ?? "-"}
                        </span>
                        {log.rpe && (
                          <span className="text-xs font-mono tabular-nums text-[#626E67]">
                            RPE {log.rpe}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
