"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Dumbbell,
} from "lucide-react";
import { getExercises, getExerciseDetail } from "@/lib/api";
import { Exercise } from "@/types/workout";
import ExerciseThumbnail from "@/app/components/ExerciseThumbnail";
import ExerciseDetailModal from "@/app/components/ExerciseDetailModal";

const MUSCLE_OPTIONS = [
  { value: "", label: "Semua Otot" },
  { value: "chest", label: "Dada (Chest)" },
  { value: "back", label: "Punggung (Back)" },
  { value: "shoulders", label: "Bahu (Shoulders)" },
  { value: "biceps", label: "Bisep (Biceps)" },
  { value: "triceps", label: "Trisep (Triceps)" },
  { value: "quads", label: "Paha Depan (Quads)" },
  { value: "hamstrings", label: "Hamstring" },
  { value: "glutes", label: "Glutes" },
  { value: "calves", label: "Betis (Calves)" },
  { value: "core", label: "Perut / Core" },
];

const EQUIPMENT_OPTIONS = [
  { value: "", label: "Semua Alat" },
  { value: "bodyweight", label: "Berat Badan" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "barbell", label: "Barbell" },
  { value: "machine", label: "Mesin Gym" },
  { value: "cable", label: "Cable" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "bands", label: "Resistance Band" },
];

const DIFFICULTY_OPTIONS = [
  { value: "", label: "Semua Level" },
  { value: "beginner", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Lanjutan" },
];

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 24,
    total: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setIsLoading(true);
        setSearch(searchInput);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const [refreshTick, setRefreshTick] = useState(0);

  const triggerReload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let active = true;
    getExercises({
      search,
      muscle,
      equipment,
      difficulty,
      beginner_only: beginnerOnly,
      page,
      per_page: 24,
    })
      .then((res) => {
        if (!active) return;
        setExercises(res.data);
        setMeta(res.meta);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError(
          "Gagal memuat perpustakaan gerakan. Pastikan server backend Laravel sedang berjalan."
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, muscle, equipment, difficulty, beginnerOnly, page, refreshTick]);

  const handleResetFilters = () => {
    setIsLoading(true);
    setSearchInput("");
    setSearch("");
    setMuscle("");
    setEquipment("");
    setDifficulty("");
    setBeginnerOnly(false);
    setPage(1);
  };

  const handleOpenDetail = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    const full = await getExerciseDetail(exercise.slug || exercise.id);
    if (full) {
      setSelectedExercise(full);
    }
  };

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-[#DCE1D8]">
          <div>
            <h1 className="text-3xl font-bold text-[#141916] tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-[#C84B11]" />
              <span>Perpustakaan Gerakan</span>
            </h1>
            <p className="text-sm text-[#48524C] mt-1.5">
              Pelajari teknik gerakan gym lengkap dengan foto posisi awal & akhir, langkah eksekusi, dan tips pemula.
            </p>
          </div>

          <span className="px-3.5 py-2 bg-white border border-[#DCE1D8] rounded-xl text-xs font-mono tabular-nums font-semibold text-[#48524C] self-start md:self-auto">
            {meta.total} Gerakan Tersedia
          </span>
        </div>

        {/* Search & Filter Bar */}
        <section
          aria-label="Filter gerakan latihan"
          className="bg-white border border-[#DCE1D8] rounded-2xl p-4 sm:p-5 mb-6 shadow-xs space-y-3.5"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-[#626E67] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Cari nama gerakan"
                placeholder="Cari gerakan (misal: Bench Press, Squat)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-[#F5F6F3] border border-[#DCE1D8] focus:bg-white focus:border-[#C84B11] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none"
              />
            </div>

            {/* Muscle Select */}
            <div className="md:col-span-3">
              <select
                aria-label="Filter kelompok otot"
                value={muscle}
                onChange={(e) => {
                  setIsLoading(true);
                  setMuscle(e.target.value);
                  setPage(1);
                }}
                className="w-full h-11 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] outline-none focus:border-[#C84B11]"
              >
                {MUSCLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipment Select */}
            <div className="md:col-span-3">
              <select
                aria-label="Filter alat latihan"
                value={equipment}
                onChange={(e) => {
                  setIsLoading(true);
                  setEquipment(e.target.value);
                  setPage(1);
                }}
                className="w-full h-11 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] outline-none focus:border-[#C84B11]"
              >
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="md:col-span-2">
              <select
                aria-label="Filter tingkat kesulitan"
                value={difficulty}
                onChange={(e) => {
                  setIsLoading(true);
                  setDifficulty(e.target.value);
                  setPage(1);
                }}
                className="w-full h-11 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] outline-none focus:border-[#C84B11]"
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setBeginnerOnly((prev) => !prev);
                setPage(1);
              }}
              aria-pressed={beginnerOnly}
              className={`h-11 px-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                beginnerOnly
                  ? "bg-[#ECFDF5] border-[#047857] text-[#047857]"
                  : "bg-[#F5F6F3] border-[#DCE1D8] text-[#48524C] hover:text-[#141916]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Hanya Gerakan Ramah Pemula</span>
            </button>

            {(search || muscle || equipment || difficulty || beginnerOnly) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-11 px-4 rounded-xl bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </section>

        {/* Content States */}
        {error ? (
          <div className="p-8 bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl text-center">
            <AlertCircle className="w-8 h-8 text-[#BE123C] mx-auto mb-2.5" />
            <h2 className="text-base font-bold text-[#141916] mb-1">
              Gagal Memuat Gerakan
            </h2>
            <p className="text-sm text-[#48524C] mb-4">{error}</p>
            <button
              type="button"
              onClick={triggerReload}
              className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            aria-busy="true"
            aria-label="Memuat daftar gerakan"
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#DCE1D8] rounded-2xl p-4 animate-pulse space-y-3"
              >
                <div className="h-44 bg-[#ECEFE9] rounded-xl" />
                <div className="h-5 w-3/4 bg-[#ECEFE9] rounded" />
                <div className="h-4 w-1/2 bg-[#ECEFE9] rounded" />
              </div>
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="p-10 bg-white border border-[#DCE1D8] rounded-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#ECEFE9] text-[#48524C] flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#141916] mb-1">
              Tidak Ada Gerakan yang Cocok
            </h2>
            <p className="text-sm text-[#48524C] mb-5">
              Coba ubah kata kunci pencarian atau reset filter otot dan alat.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm cursor-pointer"
            >
              Tampilkan Semua Gerakan
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {exercises.map((exercise) => {
                const thumb = exercise.images?.[0];
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => handleOpenDetail(exercise)}
                    className="text-left bg-white border border-[#DCE1D8] hover:border-[#C5CCC0] rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      <ExerciseThumbnail
                        src={thumb?.url}
                        alt={
                          thumb?.alt_text || `${exercise.name} demonstrasi`
                        }
                        className="w-full h-44 rounded-xl mb-3.5"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                      />

                      <h2 className="text-base font-bold text-[#141916] group-hover:text-[#C84B11] transition-colors line-clamp-1">
                        {exercise.name}
                      </h2>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {exercise.primary_muscle && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FFF1EA] text-[#C84B11] border border-[#F4C4AC] text-xs font-semibold capitalize">
                            {exercise.primary_muscle}
                          </span>
                        )}
                        {exercise.equipment && (
                          <span className="px-2 py-0.5 rounded-md bg-[#ECEFE9] text-[#48524C] text-xs font-medium capitalize">
                            {exercise.equipment}
                          </span>
                        )}
                        {exercise.is_beginner_friendly && (
                          <span className="px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-xs font-semibold">
                            Ramah Pemula
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#DCE1D8] flex items-center justify-between text-xs font-semibold text-[#C84B11]">
                      <span>Lihat Panduan & Foto</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="mt-8 flex items-center justify-between bg-white border border-[#DCE1D8] rounded-2xl p-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={meta.current_page <= 1}
                  className="h-11 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] disabled:opacity-40 text-[#141916] font-semibold rounded-xl text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <span className="text-xs sm:text-sm font-mono tabular-nums font-semibold text-[#48524C]">
                  Halaman {meta.current_page} / {meta.last_page}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    setPage((p) => Math.min(meta.last_page, p + 1));
                  }}
                  disabled={meta.current_page >= meta.last_page}
                  className="h-11 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] disabled:opacity-40 text-[#141916] font-semibold rounded-xl text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Attribution footer link */}
        <footer className="mt-10 pt-5 border-t border-[#DCE1D8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#626E67]">
          <span>
            Data dan ilustrasi gerakan disediakan dari dataset terbuka Public Domain.
          </span>
          <Link
            href="/credits"
            className="font-semibold text-[#C84B11] hover:underline"
          >
            Lisensi & Atribusi Data →
          </Link>
        </footer>
      </div>

      <ExerciseDetailModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </main>
  );
}
