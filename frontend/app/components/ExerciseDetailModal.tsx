"use client";

import { useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, Lightbulb, Layers } from "lucide-react";
import { Exercise } from "@/types/workout";
import ExerciseThumbnail from "./ExerciseThumbnail";

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Dada",
  back: "Punggung",
  shoulders: "Bahu",
  biceps: "Bisep",
  triceps: "Trisep",
  quads: "Paha Depan",
  hamstrings: "Hamstring",
  glutes: "Glutes",
  calves: "Betis",
  core: "Perut / Core",
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  machine: "Mesin Gym",
  cable: "Cable",
  bodyweight: "Berat Badan",
  kettlebell: "Kettlebell",
  bands: "Resistance Band",
  other: "Lainnya",
};

const DIFFICULTY_LABELS: Record<string, { label: string; badgeClass: string }> = {
  beginner: {
    label: "Pemula",
    badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  },
  intermediate: {
    label: "Menengah",
    badgeClass: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  },
  advanced: {
    label: "Lanjutan",
    badgeClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
  },
};

export default function ExerciseDetailModal({
  exercise,
  onClose,
}: ExerciseDetailModalProps) {
  useEffect(() => {
    if (!exercise) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [exercise, onClose]);

  if (!exercise) return null;

  const images = exercise.images || [];
  const startImage = images.find((img) => img.position === 0) || images[0];
  const endImage = images.find((img) => img.position === 1) || images[1];

  const diffInfo = DIFFICULTY_LABELS[exercise.difficulty || "beginner"] || {
    label: exercise.difficulty || "Pemula",
    badgeClass: "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]",
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#141916]/65 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-[#DCE1D8] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 rounded-xl bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Tutup detail gerakan"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pr-14 mb-5">
          <h2
            id="exercise-detail-title"
            className="text-2xl font-bold text-[#141916] tracking-tight"
          >
            {exercise.name}
          </h2>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {exercise.primary_muscle && (
              <span className="px-2.5 py-1 rounded-lg bg-[#FFF1EA] text-[#C84B11] border border-[#F4C4AC] text-xs font-semibold">
                Utama:{" "}
                {MUSCLE_LABELS[exercise.primary_muscle] ||
                  exercise.primary_muscle}
              </span>
            )}
            {exercise.equipment && (
              <span className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-xs font-semibold">
                {EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}
              </span>
            )}
            <span
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${diffInfo.badgeClass}`}
            >
              {diffInfo.label}
            </span>
            {exercise.is_beginner_friendly && (
              <span className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ramah Pemula</span>
              </span>
            )}
          </div>
        </div>

        {/* Demonstration Images (Start & End) */}
        <div
          className={`grid gap-4 mb-6 ${
            endImage ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-md"
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-[#48524C] block mb-1.5">
              Posisi Awal (Start)
            </span>
            <ExerciseThumbnail
              src={startImage?.url}
              alt={startImage?.alt_text || `${exercise.name} posisi awal`}
              className="w-full h-56 rounded-xl"
              sizes="(max-width: 640px) 100vw, 360px"
            />
          </div>

          {endImage && (
            <div>
              <span className="text-xs font-semibold text-[#48524C] block mb-1.5">
                Posisi Akhir (End)
              </span>
              <ExerciseThumbnail
                src={endImage.url}
                alt={endImage.alt_text || `${exercise.name} posisi akhir`}
                className="w-full h-56 rounded-xl"
                sizes="(max-width: 640px) 100vw, 360px"
              />
            </div>
          )}
        </div>

        {/* Secondary Muscles & Split Sessions */}
        {(exercise.secondary_muscles?.length ||
          exercise.split_sessions?.length) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {exercise.secondary_muscles &&
              exercise.secondary_muscles.length > 0 && (
                <div className="p-3.5 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl">
                  <span className="text-xs font-semibold text-[#626E67] block mb-1">
                    Otot Pendukung
                  </span>
                  <p className="text-sm text-[#141916] font-medium capitalize">
                    {exercise.secondary_muscles.join(", ")}
                  </p>
                </div>
              )}

            {exercise.split_sessions && exercise.split_sessions.length > 0 && (
              <div className="p-3.5 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl">
                <span className="text-xs font-semibold text-[#626E67] flex items-center gap-1.5 mb-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Cocok untuk Sesi Split</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.split_sessions.slice(0, 6).map((s) => (
                    <span
                      key={s.id}
                      className="text-xs px-2 py-0.5 rounded-md bg-white border border-[#DCE1D8] text-[#48524C] font-medium"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Step-by-step Instructions */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <section className="mb-6">
            <h3 className="text-base font-bold text-[#141916] mb-3">
              Langkah Eksekusi
            </h3>
            <ol className="space-y-2.5">
              {exercise.instructions.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl text-sm text-[#141916]"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#C84B11] text-white text-xs font-bold font-mono tabular-nums flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Common Mistakes & Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
            <div className="p-4 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl">
              <h3 className="text-sm font-bold text-[#BE123C] flex items-center gap-1.5 mb-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Kesalahan Umum</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-[#141916] leading-relaxed list-disc list-inside">
                {exercise.common_mistakes.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {exercise.tips && exercise.tips.length > 0 && (
            <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
              <h3 className="text-sm font-bold text-[#047857] flex items-center gap-1.5 mb-2.5">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>Tips Pemula</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-[#141916] leading-relaxed list-disc list-inside">
                {exercise.tips.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
