import Link from "next/link";
import { ArrowLeft, Dumbbell, Sparkles, Activity } from "lucide-react";
import WorkoutPlanner from "@/app/components/WorkoutPlanner";
import { getCategoryById } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function WorkoutSession({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategoryById(id);

  if (!category) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Kategori Latihan Tidak Ditemukan</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Kategori #{id} tidak ditemukan di database atau server backend sedang nonaktif.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    );
  }

  // Target muscles descriptor
  const muscleGroups: Record<string, string> = {
    Push: "Dada (Pectoralis), Bahu Depan/Samping (Deltoids), Trisep",
    Pull: "Punggung (Latissimus Dorsi, Rhomboids), Bisep, Bahu Belakang",
    Legs: "Paha Depan (Quadriceps), Hamstrings, Glutes, Betis",
  };

  const targetMuscles = muscleGroups[category.name] || "Kelompok Otot Target";

  return (
    <main className="min-h-screen bg-zinc-950 text-white antialiased selection:bg-amber-500 selection:text-black">
      {/* Background radial gradient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))]" />

      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <span className="text-xs px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
            ID: #{category.id}
          </span>
        </div>

        {/* Category Header Hero */}
        <div className="mb-8 p-6 md:p-8 bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 border border-zinc-800/80 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs uppercase tracking-widest mb-2 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Program Hipertrofi Terpandu</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center space-x-3">
                <span>{category.name} Workout</span>
              </h1>
              <p className="text-xs md:text-sm text-zinc-400 mt-2 flex items-center space-x-2">
                <Dumbbell className="w-4 h-4 text-amber-500" />
                <span>Target Otot: <strong>{targetMuscles}</strong></span>
              </p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/80 px-4 py-3 rounded-2xl flex items-center space-x-4 self-start md:self-auto">
              <div className="text-center">
                <span className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500">Gerakan</span>
                <span className="text-lg font-bold text-white">{category.exercises.length}</span>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="text-center">
                <span className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500">Target RIR</span>
                <span className="text-lg font-bold text-amber-400">1-2</span>
              </div>
            </div>
          </div>
        </div>

        {/* WORKOUT PLANNER & TRACKER INTERFACE */}
        <WorkoutPlanner initialCategory={category} />
      </div>
    </main>
  );
}