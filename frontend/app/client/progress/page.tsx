"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Dumbbell, 
  Flame, 
  Award, 
  Clock, 
  ArrowLeft, 
  Sparkles,
  Zap 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getClientMyProgress } from "@/lib/api";
import { WorkoutLogEntry, User } from "@/types/workout";

export default function ClientProgressPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    summary: { total_sets: number; total_volume_kg: number; average_rir: number | null };
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
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs uppercase tracking-widest mb-1 font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>Hypertrophy Analytics</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Progres Latihan & Beban Anda
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Catatan progresif untuk memastikan stimulus mekanis otot bertambah setiap pekannya.
            </p>
          </div>

          <Link
            href="/"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Flame className="w-4 h-4" />
            <span>Latihan Sekarang</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 text-xs">Memuat data progres...</div>
        ) : !data || data.logs.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-3xl">
            <Dumbbell className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Belum Ada Sesi yang Disimpan</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-5">
              Selesaikan set latihan Anda di dashboard dan klik "Simpan Sesi ke Database" untuk mulai merekam grafik progres hipertrofi Anda.
            </p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
            >
              Mulai Sesi Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                  <span>Total Set Terekam</span>
                  <Dumbbell className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-3xl font-black text-white font-mono">
                  {data.summary.total_sets}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">Set latihan tereksekusi</span>
              </div>

              <div className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                  <span>Total Tonase Diangkat</span>
                  <Flame className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  {data.summary.total_volume_kg.toLocaleString()} <span className="text-sm">kg</span>
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">Volume beban terakumulasi</span>
              </div>

              <div className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                  <span>Rata-rata Proksimitas RIR</span>
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-3xl font-black text-blue-400 font-mono">
                  {data.summary.average_rir ?? "-"}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Target optimal: 1-2 RIR sebelum failure
                </span>
              </div>
            </div>

            {/* Coach Banner */}
            {data.trainer && (
              <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    PT
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">
                      Personal Trainer Anda
                    </span>
                    <span className="text-sm font-bold text-white">{data.trainer.name}</span>
                    <span className="text-xs text-zinc-400 ml-2">• {data.trainer.specialization}</span>
                  </div>
                </div>

                <Link
                  href="/client/trainer"
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Ganti Trainer
                </Link>
              </div>
            )}

            {/* Complete Log Feed */}
            <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-3xl">
              <h3 className="text-base font-bold text-white mb-4">
                Catatan Set & Beban Latihan ({data.logs.length} Set)
              </h3>

              <div className="space-y-2.5">
                {data.logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-2xl text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-white text-sm">
                          {log.exercise?.name || `Gerakan #${log.exercise_id}`}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                          Set {log.set_number}
                        </span>
                        {log.exercise?.category && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            • {log.exercise.category.name}
                          </span>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-zinc-400 italic text-[11px]">
                          📝 "{log.notes}"
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-emerald-400 font-mono font-bold text-sm block">
                        {log.weight} kg × {log.reps} reps
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        RIR {log.rir ?? "-"} {log.rpe ? `• RPE ${log.rpe}` : ""}
                      </span>
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
