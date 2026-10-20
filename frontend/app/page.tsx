import Link from "next/link";
import { 
  Dumbbell, 
  Flame, 
  ChevronRight, 
  Trophy, 
  Zap, 
  Activity, 
  ShieldCheck, 
  History,
  Sparkles
} from "lucide-react";
import { getCategories, getWorkoutHistory } from "@/lib/api";
import { Category } from "@/types/workout";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, history] = await Promise.all([
    getCategories(),
    getWorkoutHistory(),
  ]);

  const muscleMeta: Record<string, { label: string; badge: string; color: string; desc: string }> = {
    Push: {
      label: "Push Split",
      badge: "Dada • Bahu • Trisep",
      color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
      desc: "Menargetkan otot pendorong: Pectoralis major, anterior/lateral deltoid, dan triceps brachii.",
    },
    Pull: {
      label: "Pull Split",
      badge: "Punggung • Bisep • Rear Delt",
      color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400",
      desc: "Menargetkan otot penarik: Latissimus dorsi, rhomboids, trapezius, dan biceps brachii.",
    },
    Legs: {
      label: "Legs Split",
      badge: "Quads • Hamstrings • Calves",
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
      desc: "Fondasi tubuh bawah: Quadriceps, glutes, hamstrings, dan calves untuk produksi kekuatan maksimal.",
    },
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white antialiased selection:bg-amber-500 selection:text-black">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(245,158,11,0.09),rgba(255,255,255,0))]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative">
        {/* HERO SECTION */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest mb-4 backdrop-blur-md shadow-lg shadow-amber-500/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Gym Hypertrophy System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4">
            TRAIN<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">SMART</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Catat beban, repetisi, dan <strong className="text-zinc-200">RIR (Reps In Reserve)</strong> secara terstruktur untuk memastikan progressive overload dan hipertrofi otot maksimal.
          </p>

          {/* Hypertrophy Key Principles Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <span className="px-3 py-1 bg-zinc-900/90 border border-zinc-800 rounded-full text-[11px] text-zinc-300 flex items-center space-x-1.5 font-medium">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>1-2 RIR (Near Failure)</span>
            </span>
            <span className="px-3 py-1 bg-zinc-900/90 border border-zinc-800 rounded-full text-[11px] text-zinc-300 flex items-center space-x-1.5 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Full Range of Motion</span>
            </span>
            <span className="px-3 py-1 bg-zinc-900/90 border border-zinc-800 rounded-full text-[11px] text-zinc-300 flex items-center space-x-1.5 font-medium">
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Progressive Overload Log</span>
            </span>
          </div>
        </div>

        {/* WORKOUT CATEGORIES SPLITS */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Dumbbell className="w-5 h-5 text-amber-400" />
                <span>Pilih Jadwal Latihan Hari Ini</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pilih menu latihan untuk mengatur target beban, set, dan mulai sesi aktif di gym.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {categories.map((category: Category) => {
              const meta = muscleMeta[category.name] || {
                label: `${category.name} Split`,
                badge: "Otot Target",
                color: "from-zinc-800/40 to-zinc-900/40 border-zinc-700 text-zinc-300",
                desc: "Jadwal dan gerakan latihan.",
              };

              return (
                <Link
                  href={`/workout/${category.id}`}
                  key={category.id}
                  className="group relative flex flex-col justify-between p-6 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800/90 hover:border-amber-500/50 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border bg-zinc-950/80 ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        {category.exercises.length} Gerakan
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-1 group-hover:text-amber-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4 line-clamp-2">
                      {meta.desc}
                    </p>

                    {/* Exercise items list pill preview */}
                    <div className="space-y-1.5 pt-3 border-t border-zinc-800/80">
                      {category.exercises.slice(0, 4).map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex items-center space-x-2 text-xs text-zinc-300"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span className="truncate">{exercise.name}</span>
                        </div>
                      ))}
                      {category.exercises.length > 4 && (
                        <span className="text-[11px] text-zinc-500 block pt-1">
                          +{category.exercises.length - 4} gerakan lainnya...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                    <span>Mulai Latihan</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* RECENT HYPERTROPHY LOGS SECTION */}
        {history.length > 0 && (
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Riwayat Catatan Hipertrofi Terakhir</span>
              </h3>
              <span className="text-xs text-zinc-500 font-mono">
                {history.length} Catatan Masuk
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {history.slice(0, 6).map((log: any) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800/80 text-xs"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-white truncate max-w-[150px]">
                      {log.exercise?.name || `Gerakan #${log.exercise_id}`}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                      Set {log.set_number}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400 mt-2">
                    <span>
                      <strong className="text-white text-sm">{log.weight}</strong> kg × <strong className="text-white text-sm">{log.reps}</strong> reps
                    </span>
                    {log.rir !== null && (
                      <span className="text-[11px] font-mono text-zinc-300">
                        RIR: <strong>{log.rir}</strong>
                      </span>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-[11px] text-zinc-400 italic mt-1.5 truncate">
                      "{log.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}