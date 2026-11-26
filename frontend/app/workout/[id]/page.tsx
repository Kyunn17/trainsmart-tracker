import Link from "next/link";
import { ArrowLeft, Dumbbell, Activity } from "lucide-react";
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
      <main className="flex-1 bg-[#F5F6F3] text-[#141916] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-white border border-[#DCE1D8] rounded-2xl text-center shadow-xs">
          <div className="w-14 h-14 bg-[#FFF1F2] text-[#BE123C] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#FECDD3]">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-[#141916] mb-2">
            Kategori Latihan Tidak Ditemukan
          </h1>
          <p className="text-[#48524C] text-sm mb-6 leading-relaxed">
            Kategori #{id} tidak ditemukan di database atau server backend sedang tidak aktif.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </main>
    );
  }

  const muscleGroups: Record<string, string> = {
    Push: "Dada (Pectoralis), Bahu Depan & Samping (Deltoids), Trisep",
    Pull: "Punggung (Latissimus Dorsi, Rhomboids), Bisep, Bahu Belakang",
    Legs: "Paha Depan (Quadriceps), Hamstrings, Glutes, Betis",
  };

  const splitBadgeClass: Record<string, string> = {
    Push: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
    Pull: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    Legs: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  };

  const targetMuscles = muscleGroups[category.name] || "Kelompok Otot Target";
  const badgeClass =
    splitBadgeClass[category.name] ||
    "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]";

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#48524C] hover:text-[#C84B11] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <span className="text-xs px-3 py-1 rounded-lg bg-white border border-[#DCE1D8] text-[#626E67] font-mono tabular-nums font-medium">
            Split ID #{category.id}
          </span>
        </div>

        {/* Category Header Card */}
        <div className="mb-8 p-6 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight">
                  {category.name} Workout
                </h1>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${badgeClass}`}
                >
                  Program Hipertrofi
                </span>
              </div>
              <p className="text-sm text-[#48524C] flex items-start sm:items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#C84B11] shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  Target Otot:{" "}
                  <strong className="font-semibold text-[#141916]">
                    {targetMuscles}
                  </strong>
                </span>
              </p>
            </div>

            <div className="bg-[#ECEFE9] border border-[#DCE1D8] px-4 py-3 rounded-xl flex items-center gap-5 self-start md:self-auto shrink-0">
              <div>
                <span className="block text-xs font-medium text-[#626E67]">
                  Gerakan
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-[#141916]">
                  {category.exercises.length}
                </span>
              </div>
              <div className="w-px h-8 bg-[#C5CCC0]" />
              <div>
                <span className="block text-xs font-medium text-[#626E67]">
                  Target RIR
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-[#C84B11]">
                  1–2
                </span>
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
