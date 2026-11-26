import Link from "next/link";
import {
  Dumbbell,
  Flame,
  ChevronRight,
  Zap,
  ShieldCheck,
  History,
  StickyNote,
} from "lucide-react";
import { getCategories, getWorkoutHistory } from "@/lib/api";
import { Category, WorkoutLogEntry } from "@/types/workout";
import TodayDashboardSection from "@/app/components/TodayDashboardSection";

export const dynamic = "force-dynamic";

function getRirBadgeStyle(rir: number | null | undefined) {
  if (rir === 0) {
    return "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]";
  }
  if (rir === 1 || rir === 2) {
    return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
  }
  return "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]";
}

export default async function Home() {
  const [categories, history] = await Promise.all([
    getCategories(),
    getWorkoutHistory(),
  ]);

  const muscleMeta: Record<
    string,
    {
      label: string;
      badge: string;
      pillClass: string;
      dotClass: string;
      desc: string;
    }
  > = {
    Push: {
      label: "Push Split",
      badge: "Dada • Bahu • Trisep",
      pillClass: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
      dotClass: "bg-[#C84B11]",
      desc: "Otot pendorong: Pectoralis major, anterior & lateral deltoid, serta triceps brachii.",
    },
    Pull: {
      label: "Pull Split",
      badge: "Punggung • Bisep • Rear Delt",
      pillClass: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
      dotClass: "bg-[#1D4ED8]",
      desc: "Otot penarik: Latissimus dorsi, rhomboids, trapezius, dan biceps brachii.",
    },
    Legs: {
      label: "Legs Split",
      badge: "Quads • Hamstrings • Calves",
      pillClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
      dotClass: "bg-[#047857]",
      desc: "Fondasi tubuh bawah: Quadriceps, glutes, hamstrings, dan calves.",
    },
  };

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        {/* Operational Page Header */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#DCE1D8]">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#141916]">
              Jadwal Latihan Hari Ini
            </h1>
            <p className="text-sm sm:text-base text-[#48524C] mt-2 leading-relaxed">
              Catat beban, repetisi, dan <strong className="font-semibold text-[#141916]">RIR (Reps In Reserve)</strong> secara terstruktur untuk memastikan progressive overload dan hipertrofi otot maksimal.
            </p>
          </div>

          {/* Compact Operational Principles & Summary Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3.5 py-2 bg-white border border-[#DCE1D8] rounded-xl text-xs font-semibold text-[#141916] flex items-center gap-2 shadow-xs">
              <Zap className="w-4 h-4 text-[#C84B11]" />
              <span>Target 1–2 RIR</span>
            </span>
            <span className="px-3.5 py-2 bg-white border border-[#DCE1D8] rounded-xl text-xs font-semibold text-[#141916] flex items-center gap-2 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span>Full Range of Motion</span>
            </span>
            <span className="px-3.5 py-2 bg-[#ECEFE9] border border-[#DCE1D8] rounded-xl text-xs font-semibold text-[#48524C] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#C84B11]" />
              <span className="font-mono tabular-nums">{categories.length}</span> Split •{" "}
              <span className="font-mono tabular-nums">{history.length}</span> Log
            </span>
          </div>
        </section>

        {/* TODAY'S SCHEDULED SESSION & QUICK STATUS */}
        <TodayDashboardSection />

        {/* WORKOUT CATEGORIES SPLITS */}
        <section aria-labelledby="splits-heading">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 id="splits-heading" className="text-xl font-bold text-[#141916] flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-[#C84B11]" />
                <span>Pilih Menu Split Latihan</span>
              </h2>
              <p className="text-sm text-[#48524C] mt-1">
                Pilih jadwal untuk mengatur target set, catatan teknik, dan mulai mencatat sesi aktif di gym.
              </p>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-10 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#ECEFE9] text-[#48524C] flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#141916]">
                Belum Ada Jadwal Latihan Tersedia
              </h3>
              <p className="text-sm text-[#48524C] mt-1.5 max-w-md mx-auto">
                Data kategori latihan belum ditemukan. Pastikan server backend aktif atau tambahkan kategori split terlebih dahulu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {categories.map((category: Category) => {
                const meta = muscleMeta[category.name] || {
                  label: `${category.name} Split`,
                  badge: "Otot Target",
                  pillClass: "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]",
                  dotClass: "bg-[#C84B11]",
                  desc: "Jadwal dan daftar gerakan latihan terstruktur.",
                };

                return (
                  <Link
                    href={`/workout/${category.id}`}
                    key={category.id}
                    className="group flex flex-col justify-between p-6 bg-white border border-[#DCE1D8] hover:border-[#C5CCC0] rounded-2xl shadow-xs hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-lg border ${meta.pillClass}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs font-mono tabular-nums font-semibold text-[#626E67] bg-[#ECEFE9] px-2.5 py-1 rounded-lg">
                          {category.exercises.length} Gerakan
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-[#141916] group-hover:text-[#C84B11] transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs font-medium text-[#626E67] mt-0.5">
                        {meta.badge}
                      </p>
                      <p className="text-sm text-[#48524C] mt-3 mb-5 leading-relaxed">
                        {meta.desc}
                      </p>

                      {/* Exercise items preview */}
                      <div className="space-y-2 pt-4 border-t border-[#DCE1D8]">
                        {category.exercises.slice(0, 4).map((exercise) => (
                          <div
                            key={exercise.id}
                            className="flex items-center gap-2.5 text-sm text-[#141916]"
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`} />
                            <span className="truncate">{exercise.name}</span>
                          </div>
                        ))}
                        {category.exercises.length > 4 && (
                          <span className="text-xs font-medium text-[#626E67] block pt-1">
                            +{category.exercises.length - 4} gerakan lainnya
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#DCE1D8] flex items-center justify-between text-sm font-semibold text-[#C84B11] group-hover:text-[#A83D0B]">
                      <span>Mulai Latihan</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* RECENT HYPERTROPHY LOGS SECTION */}
        <section aria-labelledby="recent-logs-heading">
          <div className="bg-white border border-[#DCE1D8] rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 bg-[#ECEFE9]/60 border-b border-[#DCE1D8] flex flex-wrap items-center justify-between gap-2">
              <h2
                id="recent-logs-heading"
                className="text-base font-bold text-[#141916] flex items-center gap-2"
              >
                <History className="w-4 h-4 text-[#C84B11]" />
                <span>Riwayat Catatan Hipertrofi Terakhir</span>
              </h2>
              <span className="text-xs font-mono tabular-nums font-semibold text-[#48524C] bg-white border border-[#DCE1D8] px-3 py-1 rounded-lg">
                {history.length} Catatan Masuk
              </span>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#48524C]">
                Belum ada catatan set yang masuk. Pilih salah satu split latihan di atas untuk memulai sesi pertama Anda.
              </div>
            ) : (
              <div className="divide-y divide-[#DCE1D8]">
                {/* Desktop table header */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-[#F5F6F3] text-xs font-semibold text-[#626E67] uppercase tracking-wider">
                  <div className="col-span-5">Gerakan</div>
                  <div className="col-span-2">Set</div>
                  <div className="col-span-3">Beban & Repetisi</div>
                  <div className="col-span-2 text-right">RIR</div>
                </div>

                {history.slice(0, 8).map((log: WorkoutLogEntry) => (
                  <div
                    key={log.id}
                    className="px-6 py-4 hover:bg-[#F5F6F3]/70 transition-colors"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start sm:items-center">
                      {/* Exercise name + note */}
                      <div className="sm:col-span-5 min-w-0">
                        <p className="text-sm font-semibold text-[#141916] truncate">
                          {log.exercise?.name || `Gerakan #${log.exercise_id}`}
                        </p>
                        {log.notes && (
                          <p className="text-xs text-[#626E67] mt-1 flex items-center gap-1.5 truncate">
                            <StickyNote className="w-3.5 h-3.5 text-[#C84B11] shrink-0" />
                            <span className="truncate">{log.notes}</span>
                          </p>
                        )}
                      </div>

                      {/* Set badge */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-start">
                        <span className="text-xs font-mono tabular-nums font-semibold px-2.5 py-1 rounded-lg bg-[#ECEFE9] text-[#48524C] border border-[#DCE1D8]">
                          Set {log.set_number}
                        </span>
                        <span className="sm:hidden text-sm font-mono tabular-nums font-bold text-[#141916]">
                          {log.weight} kg × {log.reps} reps
                        </span>
                      </div>

                      {/* Weight x Reps (desktop) */}
                      <div className="hidden sm:block sm:col-span-3 text-sm font-mono tabular-nums font-semibold text-[#141916]">
                        {log.weight} kg × {log.reps} reps
                      </div>

                      {/* RIR Pill */}
                      <div className="sm:col-span-2 flex sm:justify-end">
                        {log.rir !== null && log.rir !== undefined ? (
                          <span
                            className={`text-xs font-mono tabular-nums font-semibold px-2.5 py-1 rounded-lg border ${getRirBadgeStyle(
                              log.rir
                            )}`}
                          >
                            RIR {log.rir}
                          </span>
                        ) : (
                          <span className="text-xs text-[#626E67]">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
