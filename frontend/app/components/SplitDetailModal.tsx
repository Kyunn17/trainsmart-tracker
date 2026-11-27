"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Flame,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  X,
} from "lucide-react";
import { RecommendationLevel, Split } from "@/types/workout";
import {
  MAJOR_MUSCLE_KEYS,
  MUSCLE_LABELS,
  WEEKDAYS,
  computeMuscleFrequencyFromSessions,
} from "@/lib/scheduleValidation";
import SplitAnatomyDiagram from "@/app/components/SplitAnatomyDiagram";

const LEVEL_META: Record<
  RecommendationLevel,
  { label: string; badgeClass: string }
> = {
  recommended: {
    label: "Direkomendasikan",
    badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  },
  alternative: {
    label: "Alternatif",
    badgeClass: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
  },
  not_recommended: {
    label: "Kurang Direkomendasikan",
    badgeClass: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  },
};

const DAY_SHORT_BY_NUM = Object.fromEntries(
  WEEKDAYS.map((w) => [w.day, w.short])
);

function getSplitFrequency(split: Split): Record<string, number> {
  if (
    split.muscle_frequency &&
    Object.keys(split.muscle_frequency).length > 0
  ) {
    return split.muscle_frequency;
  }
  return computeMuscleFrequencyFromSessions(split.sessions || []);
}

interface SplitDetailModalProps {
  split: Split | null;
  onClose: () => void;
}

export default function SplitDetailModal({
  split,
  onClose,
}: SplitDetailModalProps) {
  if (!split) return null;
  return <SplitDetailModalInner key={split.id} split={split} onClose={onClose} />;
}

function SplitDetailModalInner({
  split,
  onClose,
}: {
  split: Split;
  onClose: () => void;
}) {
  const [activeSessionKey, setActiveSessionKey] = useState<number | "all">(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const orderedSessions = useMemo(() => {
    return [...(split.sessions || [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }, [split.sessions]);

  const inspectedSession =
    activeSessionKey === "all"
      ? null
      : orderedSessions[activeSessionKey] || orderedSessions[0] || null;

  const diagramRegions = useMemo(() => {
    if (inspectedSession) {
      return inspectedSession.muscle_regions || [];
    }
    const allRegions = new Set<string>();
    orderedSessions.forEach((s) => {
      (s.muscle_regions || []).forEach((r) => allRegions.add(r));
    });
    return Array.from(allRegions);
  }, [inspectedSession, orderedSessions]);

  const diagramGroups = useMemo(() => {
    if (inspectedSession) {
      return inspectedSession.muscle_groups || [];
    }
    const allGroups = new Set<string>();
    orderedSessions.forEach((s) => {
      (s.muscle_groups || []).forEach((g) => allGroups.add(g));
    });
    return Array.from(allGroups);
  }, [inspectedSession, orderedSessions]);

  const lvl: RecommendationLevel = split.recommendation_level || "recommended";
  const frequency = getSplitFrequency(split);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#141916]/65 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="split-detail-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-[#DCE1D8] rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#DCE1D8] bg-white flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${LEVEL_META[lvl].badgeClass}`}
              >
                {LEVEL_META[lvl].label}
              </span>
              <span className="text-xs font-mono tabular-nums font-semibold px-2.5 py-0.5 rounded-md bg-[#ECEFE9] text-[#141916] border border-[#DCE1D8]">
                {split.days_per_week ?? split.max_days} Hari / Minggu
              </span>
              {lvl === "recommended" && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#FFF1EA] text-[#A83D0B] border border-[#F4C4AC] inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Rekomendasi Utama
                </span>
              )}
            </div>
            <h2
              id="split-detail-modal-title"
              className="text-xl sm:text-2xl font-bold text-[#141916] tracking-tight"
            >
              {split.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#48524C] hover:text-[#141916] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            aria-label="Tutup penjelasan split"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          <p className="text-sm text-[#48524C] leading-relaxed">
            {split.description}
          </p>

          {lvl === "not_recommended" && (
            <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#141916] space-y-1">
              <span className="font-bold text-[#B45309] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Catatan Jujur untuk Pemula</span>
              </span>
              <p className="text-[#48524C] leading-relaxed">
                {split.not_recommended_reason ||
                  "Setiap kelompok otot hanya dilatih 1× per minggu sehingga progres bagi pemula biasanya lebih lambat."}
              </p>
            </div>
          )}

          {/* Interactive Session Tabs + Front/Back SVG Anatomy Map */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#141916]">
                  Peta Otot Target per Sesi
                </h3>
                <p className="text-xs text-[#48524C]">
                  Pilih sesi di bawah untuk melihat otot depan & belakang yang
                  bekerja pada hari tersebut.
                </p>
              </div>
              {inspectedSession?.is_heavy && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FFF1EA] text-[#A83D0B] border border-[#F4C4AC] inline-flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  Sesi Beban Sistemik Tinggi
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-2 overflow-x-auto pb-1"
              role="tablist"
              aria-label="Pilih sesi untuk melihat otot target"
            >
              {orderedSessions.map((session, idx) => {
                const isActive = activeSessionKey === idx;
                const dayShort = session.default_day_of_week
                  ? DAY_SHORT_BY_NUM[session.default_day_of_week]
                  : null;
                return (
                  <button
                    key={session.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveSessionKey(idx)}
                    className={`h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-[#141916] text-white border-[#141916]"
                        : "bg-[#F5F6F3] text-[#48524C] border-[#DCE1D8] hover:text-[#141916]"
                    }`}
                  >
                    <span className="font-mono tabular-nums opacity-75">
                      {idx + 1}.
                    </span>
                    <span>{session.name}</span>
                    {dayShort && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-white text-[#626E67] border border-[#DCE1D8]"
                        }`}
                      >
                        {dayShort}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                role="tab"
                aria-selected={activeSessionKey === "all"}
                onClick={() => setActiveSessionKey("all")}
                className={`h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeSessionKey === "all"
                    ? "bg-[#C84B11] text-white border-[#C84B11]"
                    : "bg-white text-[#48524C] border-[#DCE1D8] hover:text-[#141916]"
                }`}
              >
                Total 1 Minggu
              </button>
            </div>

            <SplitAnatomyDiagram
              activeRegions={diagramRegions}
              activeMuscleGroups={diagramGroups}
              sessionLabel={
                inspectedSession
                  ? `${split.name} - ${inspectedSession.name}`
                  : `${split.name} - Total 1 Minggu`
              }
            />
          </div>

          {/* Weekly Muscle Frequency Grid */}
          <div className="space-y-2.5 pt-4 border-t border-[#DCE1D8]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#141916] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#C84B11]" />
                <span>Frekuensi Latihan per Otot (Mingguan)</span>
              </h3>
              <span className="text-xs text-[#626E67]">
                Dihitung otomatis dari sesi
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MAJOR_MUSCLE_KEYS.map((muscle) => {
                const freq = frequency[muscle] || 0;
                const pillClass =
                  freq >= 2
                    ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                    : freq === 1
                    ? "bg-[#F5F6F3] text-[#141916] border-[#DCE1D8]"
                    : "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";

                return (
                  <div
                    key={muscle}
                    className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs ${pillClass}`}
                  >
                    <span className="font-medium truncate">
                      {MUSCLE_LABELS[muscle] || muscle}
                    </span>
                    <span className="font-mono tabular-nums font-bold ml-1">
                      {freq}×
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-[#047857] flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Kelebihan</span>
              </span>
              <ul className="space-y-1 text-xs text-[#141916] list-disc list-inside leading-relaxed">
                {split.pros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-[#BE123C] flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Hal yang Perlu Diperhatikan</span>
              </span>
              <ul className="space-y-1 text-xs text-[#141916] list-disc list-inside leading-relaxed">
                {split.cons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suitable For */}
          <div className="p-4 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl space-y-1">
            <span className="text-xs font-bold text-[#48524C] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Cocok Untuk</span>
            </span>
            <p className="text-xs sm:text-sm text-[#141916] leading-relaxed">
              {split.suitable_for}
            </p>
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#DCE1D8] bg-[#F5F6F3] flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-white border border-[#DCE1D8] hover:border-[#C5CCC0] text-[#141916] font-semibold text-xs sm:text-sm cursor-pointer"
          >
            Tutup
          </button>

          <Link
            href="/onboarding"
            onClick={onClose}
            className="w-full sm:w-auto h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>Terapkan Split Ini di Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
