"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  CheckCircle2,
  Dumbbell,
  GitCompare,
  Info,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getSplitById,
  getSplitRecommendations,
  getUserPlan,
} from "@/lib/api";
import {
  Exercise,
  RecommendationLevel,
  ScheduleWarning,
  Split,
  UserPlan,
} from "@/types/workout";
import {
  MAJOR_MUSCLE_KEYS,
  MUSCLE_LABELS,
  computeMuscleFrequencyFromSessions,
} from "@/lib/scheduleValidation";
import ExerciseThumbnail from "@/app/components/ExerciseThumbnail";
import ExerciseDetailModal from "@/app/components/ExerciseDetailModal";
import ScheduleBuilder from "@/app/components/ScheduleBuilder";

const DAY_OPTIONS = [
  {
    days: 2,
    title: "2 Hari / Minggu",
    desc: "Cocok untuk jadwal sangat padat atau baru mulai berolahraga.",
  },
  {
    days: 3,
    title: "3 Hari / Minggu",
    desc: "Frekuensi klasik pemula dengan hari istirahat melimpah.",
  },
  {
    days: 4,
    title: "4 Hari / Minggu",
    desc: "Seimbang antara volume hipertrofi dan waktu pemulihan.",
  },
  {
    days: 5,
    title: "5 Hari / Minggu",
    desc: "Fokus pembentukan otot lebih spesifik dengan variasi hybrid.",
  },
  {
    days: 6,
    title: "6 Hari / Minggu",
    desc: "Frekuensi dan volume maksimal untuk hasil progresif cepat.",
  },
];

const STEPS = [
  { num: 1, label: "Hari Latihan" },
  { num: 2, label: "Pilih Split" },
  { num: 3, label: "Daftar Gerakan" },
  { num: 4, label: "Atur Jadwal" },
];

const LEVEL_META: Record<
  RecommendationLevel,
  {
    badgeLabel: string;
    sectionTitle: string;
    sectionDesc: string;
    badgeClass: string;
    cardHighlightClass: string;
  }
> = {
  recommended: {
    badgeLabel: "Direkomendasikan",
    sectionTitle: "Rekomendasi Terbaik untuk Pemula",
    sectionDesc:
      "Memberikan frekuensi stimulasi dan waktu pemulihan paling efisien untuk jumlah hari pilihan Anda.",
    badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    cardHighlightClass: "border-[#047857]/40 ring-1 ring-[#047857]/10",
  },
  alternative: {
    badgeLabel: "Alternatif",
    sectionTitle: "Opsi Alternatif yang Valid",
    sectionDesc:
      "Pilihan struktur latihan lain yang tetap efektif sesuai preferensi pembagian otot atau jadwal Anda.",
    badgeClass: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    cardHighlightClass: "border-[#DCE1D8]",
  },
  not_recommended: {
    badgeLabel: "Kurang Direkomendasikan",
    sectionTitle: "Opsi Lainnya (Kurang Direkomendasikan untuk Pemula)",
    sectionDesc:
      "Tetap tersedia dan boleh Anda pilih kapan saja, dengan catatan efisiensi hipertrofi lebih rendah bagi pemula.",
    badgeClass: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    cardHighlightClass: "border-[#FDE68A]",
  },
};

const LEVEL_ORDER: RecommendationLevel[] = [
  "recommended",
  "alternative",
  "not_recommended",
];

function getSplitMuscleFrequency(split: Split): Record<string, number> {
  if (
    split.muscle_frequency &&
    Object.keys(split.muscle_frequency).length > 0
  ) {
    return split.muscle_frequency;
  }
  return computeMuscleFrequencyFromSessions(split.sessions || []);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);

  const [existingPlan, setExistingPlan] = useState<UserPlan | null>(null);
  const [recommendations, setRecommendations] = useState<Split[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  const [defaultSplitId, setDefaultSplitId] = useState<number | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  const [selectedSplit, setSelectedSplit] = useState<Split | null>(null);
  const [isLoadingSplitDetail, setIsLoadingSplitDetail] = useState(false);
  const [splitDetailError, setSplitDetailError] = useState<string | null>(null);
  const [activeSessionTab, setActiveSessionTab] = useState(0);

  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedWarnings, setSavedWarnings] = useState<ScheduleWarning[]>([]);

  // Redirect unauthenticated users to login; fetch active plan when signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!user) return;
    getUserPlan().then((res) => {
      if (res.success && res.data) {
        setExistingPlan(res.data);
      }
    });
  }, [user, authLoading, router]);

  const loadRecommendations = async (days: number) => {
    setIsLoadingRecs(true);
    setRecsError(null);
    const res = await getSplitRecommendations(days);
    setIsLoadingRecs(false);

    if (!res.success) {
      setRecsError(res.message || "Gagal memuat rekomendasi split.");
      return;
    }

    const fetched = res.data || [];
    const defaultRec =
      fetched.find((s) => s.recommendation_level === "recommended") ||
      fetched[0] ||
      null;

    setRecommendations(fetched);
    setDefaultSplitId(defaultRec ? defaultRec.id : null);
    setCompareIds([]);
    setStep(2);
  };

  const handleChooseSplit = async (split: Split) => {
    setSelectedSplit(split);
    setIsLoadingSplitDetail(true);
    setSplitDetailError(null);
    setActiveSessionTab(0);
    setStep(3);

    const detail = await getSplitById(split.id);
    setIsLoadingSplitDetail(false);

    if (!detail) {
      setSplitDetailError("Gagal memuat daftar gerakan untuk split ini.");
      return;
    }

    setSelectedSplit(detail);
  };

  const handleEditExistingPlan = async () => {
    if (!existingPlan?.split) return;
    setDaysPerWeek(existingPlan.days_per_week);
    const detail = await getSplitById(existingPlan.split.id);
    setSelectedSplit(detail || existingPlan.split);
    setStep(4);
  };

  const toggleCompareSplit = (splitId: number) => {
    setCompareIds((prev) => {
      if (prev.includes(splitId)) {
        return prev.filter((id) => id !== splitId);
      }
      if (prev.length >= 2) {
        return [prev[1], splitId];
      }
      return [...prev, splitId];
    });
  };

  const groupedRecommendations = useMemo(() => {
    return LEVEL_ORDER.map((level) => ({
      level,
      meta: LEVEL_META[level],
      items: recommendations.filter(
        (split) => (split.recommendation_level || "recommended") === level
      ),
    })).filter((group) => group.items.length > 0);
  }, [recommendations]);

  const comparedSplits = useMemo(() => {
    if (compareIds.length !== 2) return [];
    return compareIds
      .map((id) => recommendations.find((s) => s.id === id))
      .filter((s): s is Split => Boolean(s));
  }, [compareIds, recommendations]);

  const existingScheduleMap = existingPlan?.schedules
    ? existingPlan.schedules.reduce<Record<number, number | null>>(
        (acc, item) => {
          acc[item.day_of_week] = item.split_session_id;
          return acc;
        },
        {}
      )
    : undefined;

  if (authLoading) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916] p-6">
        <div className="max-w-4xl mx-auto bg-white border border-[#DCE1D8] rounded-2xl p-8 animate-pulse space-y-4">
          <div className="h-7 w-64 bg-[#ECEFE9] rounded" />
          <div className="h-4 w-96 bg-[#ECEFE9] rounded" />
          <div className="h-40 bg-[#ECEFE9] rounded-xl" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#DCE1D8] rounded-2xl p-8 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF1EA] border border-[#F4C4AC] text-[#C84B11] flex items-center justify-center mx-auto">
            <CalendarRange className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#141916]">
            Masuk untuk Menyusun Jadwal Latihan
          </h1>
          <p className="text-sm text-[#48524C] leading-relaxed">
            Pilih berapa hari Anda ingin latihan, lihat rekomendasi split yang
            cocok, dan simpan jadwal mingguan ke akun Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              href="/login"
              className="flex-1 h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm flex items-center justify-center"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="flex-1 h-11 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl text-sm flex items-center justify-center"
            >
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="pb-5 border-b border-[#DCE1D8] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight">
              Panduan & Jadwal Latihan Pribadi
            </h1>
            <p className="text-sm text-[#48524C] mt-1">
              Ikuti 4 langkah singkat untuk memilih program split dan menyusun
              jadwal mingguan Anda.
            </p>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-[#48524C] hover:text-[#C84B11] inline-flex items-center gap-1.5 min-h-[44px] self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Existing Plan Banner */}
        {existingPlan && !savedSuccess && step !== 4 && (
          <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-[#141916]">
                  Anda sudah memiliki program aktif:{" "}
                  <span className="text-[#1D4ED8]">
                    {existingPlan.split?.name} ({existingPlan.days_per_week}{" "}
                    hari/minggu)
                  </span>
                </p>
                <p className="text-xs text-[#48524C] mt-0.5">
                  Anda dapat melanjutkan di sini untuk mengganti split, atau
                  langsung ubah susunan hari latihan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEditExistingPlan}
              className="h-11 px-4 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold rounded-xl text-xs whitespace-nowrap cursor-pointer self-start sm:self-auto"
            >
              Edit Jadwal Saat Ini
            </button>
          </div>
        )}

        {/* 4-Step Progress Bar */}
        {!savedSuccess && (
          <nav
            aria-label="Tahapan onboarding"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
          >
            {STEPS.map((s) => {
              const isCurrent = step === s.num;
              const isDone = step > s.num;
              return (
                <div
                  key={s.num}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    isCurrent
                      ? "bg-white border-[#C84B11] text-[#141916] shadow-xs"
                      : isDone
                      ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]"
                      : "bg-[#ECEFE9]/70 border-[#DCE1D8] text-[#626E67]"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg font-mono tabular-nums text-xs font-bold flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? "bg-[#C84B11] text-white"
                        : isDone
                        ? "bg-[#047857] text-white"
                        : "bg-white text-[#626E67] border border-[#DCE1D8]"
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : s.num}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold truncate">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </nav>
        )}

        {/* SAVED CONFIRMATION STATE */}
        {savedSuccess ? (
          <section className="bg-white border border-[#DCE1D8] rounded-2xl p-8 text-center shadow-xs space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#141916]">
                Jadwal Latihan Anda Siap!
              </h2>
              <p className="text-sm text-[#48524C] mt-1.5 max-w-md mx-auto">
                Program{" "}
                <strong className="text-[#141916]">
                  {selectedSplit?.name}
                </strong>{" "}
                ({daysPerWeek} hari/minggu) telah tersimpan ke akun Anda.
              </p>
            </div>

            {savedWarnings.length > 0 && (
              <div className="max-w-lg mx-auto p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-left text-xs text-[#141916] space-y-1.5">
                <span className="font-bold text-[#B45309] block">
                  Catatan jadwal yang tersimpan:
                </span>
                {savedWarnings.map((w, i) => (
                  <p key={i}>• {w.message}</p>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/"
                className="w-full sm:w-auto h-11 px-6 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSavedSuccess(false);
                  setStep(4);
                }}
                className="w-full sm:w-auto h-11 px-5 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl text-sm cursor-pointer"
              >
                Ubah Jadwal Lagi
              </button>
            </div>
          </section>
        ) : step === 1 ? (
          /* ================================================================= */
          /* STEP 1: PILIH BERAPA HARI PER MINGGU (2–6 HARI)                   */
          /* ================================================================= */
          <section className="bg-white border border-[#DCE1D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#141916]">
                Berapa hari per minggu Anda bisa berlatih?
              </h2>
              <p className="text-sm text-[#48524C] mt-1">
                Pilih frekuensi yang realistis untuk jadwal Anda agar konsisten
                dalam jangka panjang.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {DAY_OPTIONS.map((opt) => {
                const isSelected = daysPerWeek === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setDaysPerWeek(opt.days)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[130px] ${
                      isSelected
                        ? "bg-[#FFF1EA] border-[#C84B11] ring-2 ring-[#C84B11]/20"
                        : "bg-[#F5F6F3] border-[#DCE1D8] hover:border-[#C5CCC0] hover:bg-white"
                    }`}
                  >
                    <div>
                      <span
                        className={`text-2xl font-bold font-mono tabular-nums block ${
                          isSelected ? "text-[#C84B11]" : "text-[#141916]"
                        }`}
                      >
                        {opt.days} Hari
                      </span>
                      <span className="text-xs font-semibold text-[#48524C] block mt-0.5">
                        per minggu
                      </span>
                    </div>
                    <p className="text-xs text-[#48524C] mt-3 leading-relaxed">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {recsError && (
              <div
                role="alert"
                className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-sm text-[#BE123C] flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recsError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => loadRecommendations(daysPerWeek)}
                  className="h-11 px-4 rounded-xl bg-white border border-[#FECDD3] text-[#BE123C] font-semibold text-xs hover:bg-[#FFF1F2] cursor-pointer"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => loadRecommendations(daysPerWeek)}
                disabled={isLoadingRecs}
                className="w-full sm:w-auto h-12 px-7 bg-[#C84B11] hover:bg-[#A83D0B] disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {isLoadingRecs
                    ? "Mencari Rekomendasi..."
                    : "Lihat Katalog & Rekomendasi Split"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        ) : step === 2 ? (
          /* ================================================================= */
          /* STEP 2: KATALOG SPLIT TERKELOMPOK & PERBANDINGAN                  */
          /* ================================================================= */
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#DCE1D8] rounded-2xl p-5 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-[#141916]">
                  Pilihan Split untuk {daysPerWeek} Hari / Minggu
                </h2>
                <p className="text-sm text-[#48524C] mt-0.5">
                  Semua opsi ditampilkan terbuka dengan tingkat rekomendasi dan
                  frekuensi otot mingguan. Anda bebas memilih program mana pun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-11 px-4 bg-[#F5F6F3] border border-[#DCE1D8] hover:border-[#C5CCC0] text-[#141916] font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ganti Jumlah Hari</span>
              </button>
            </div>

            {/* Comparison Banner / Side-by-Side Table */}
            {compareIds.length === 1 && (
              <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs sm:text-sm text-[#1D4ED8] flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium flex items-center gap-2">
                  <GitCompare className="w-4 h-4 shrink-0" />
                  Pilih 1 split lagi untuk membandingkan keduanya secara
                  berdampingan.
                </span>
                <button
                  type="button"
                  onClick={() => setCompareIds([])}
                  className="h-11 px-3 rounded-lg bg-white border border-[#BFDBFE] text-xs font-semibold text-[#1D4ED8] cursor-pointer"
                >
                  Batal Bandingkan
                </button>
              </div>
            )}

            {comparedSplits.length === 2 && (
              <div className="bg-white border border-[#1D4ED8]/40 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-[#1D4ED8]" />
                    <h3 className="text-base sm:text-lg font-bold text-[#141916]">
                      Perbandingan Split Berdampingan
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompareIds([])}
                    className="h-11 px-3.5 rounded-xl bg-[#ECEFE9] hover:bg-[#DCE1D8] text-xs font-semibold text-[#141916] flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Tutup Perbandingan</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[#DCE1D8]">
                        <th className="py-2.5 pr-4 font-semibold text-[#48524C] w-40">
                          Aspek
                        </th>
                        {comparedSplits.map((sp) => (
                          <th
                            key={sp.id}
                            className="py-2.5 px-3 font-bold text-[#141916] min-w-[210px]"
                          >
                            {sp.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE1D8]">
                      <tr>
                        <td className="py-2.5 pr-4 font-medium text-[#48524C]">
                          Tingkat Rekomendasi
                        </td>
                        {comparedSplits.map((sp) => {
                          const lvl = sp.recommendation_level || "recommended";
                          return (
                            <td key={sp.id} className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-md border text-xs font-semibold ${LEVEL_META[lvl].badgeClass}`}
                              >
                                {LEVEL_META[lvl].badgeLabel}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-medium text-[#48524C]">
                          Urutan Sesi
                        </td>
                        {comparedSplits.map((sp) => (
                          <td
                            key={sp.id}
                            className="py-2.5 px-3 text-xs text-[#141916]"
                          >
                            {(sp.sessions || [])
                              .map((s, idx) => `${idx + 1}. ${s.name}`)
                              .join(" → ")}
                          </td>
                        ))}
                      </tr>
                      {MAJOR_MUSCLE_KEYS.map((muscle) => (
                        <tr key={muscle}>
                          <td className="py-2 pr-4 text-xs text-[#48524C]">
                            {MUSCLE_LABELS[muscle] || muscle}
                          </td>
                          {comparedSplits.map((sp) => {
                            const freq = getSplitMuscleFrequency(sp)[muscle] || 0;
                            return (
                              <td
                                key={sp.id}
                                className="py-2 px-3 font-mono tabular-nums text-xs font-bold"
                              >
                                <span
                                  className={
                                    freq >= 2
                                      ? "text-[#047857]"
                                      : freq === 1
                                      ? "text-[#B45309]"
                                      : "text-[#626E67]"
                                  }
                                >
                                  {freq}× / minggu
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td className="py-3 pr-4" />
                        {comparedSplits.map((sp) => (
                          <td key={sp.id} className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleChooseSplit(sp)}
                              className="w-full h-11 px-4 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-xs cursor-pointer"
                            >
                              Pilih {sp.name}
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {recommendations.length === 0 ? (
              <div className="p-8 bg-white border border-[#DCE1D8] rounded-2xl text-center space-y-3">
                <p className="text-sm text-[#48524C]">
                  Belum ada pilihan split untuk {daysPerWeek} hari / minggu.
                </p>
                <button
                  type="button"
                  onClick={() => loadRecommendations(daysPerWeek)}
                  className="h-11 px-5 rounded-xl bg-[#ECEFE9] hover:bg-[#DCE1D8] text-xs font-semibold text-[#141916] cursor-pointer"
                >
                  Muat Ulang
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedRecommendations.map((group) => (
                  <div key={group.level} className="space-y-4">
                    <div className="border-l-4 border-[#C84B11] pl-3.5">
                      <h3 className="text-base sm:text-lg font-bold text-[#141916]">
                        {group.meta.sectionTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#48524C]">
                        {group.meta.sectionDesc}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {group.items.map((split) => {
                        const lvl: RecommendationLevel =
                          split.recommendation_level || "recommended";
                        const meta = LEVEL_META[lvl];
                        const isDefault = split.id === defaultSplitId;
                        const isCompared = compareIds.includes(split.id);
                        const orderedSessions = [...(split.sessions || [])].sort(
                          (a, b) => a.sort_order - b.sort_order
                        );
                        const muscleFrequency = getSplitMuscleFrequency(split);
                        const trainedMuscles = MAJOR_MUSCLE_KEYS.filter(
                          (m) => (muscleFrequency[m] || 0) > 0
                        );

                        return (
                          <article
                            key={split.id}
                            className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 ${meta.cardHighlightClass}`}
                          >
                            <div className="space-y-4">
                              {/* Badges & Title */}
                              <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span
                                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${meta.badgeClass}`}
                                    >
                                      {meta.badgeLabel}
                                    </span>
                                    {isDefault && (
                                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#FFF1EA] text-[#C84B11] border border-[#F4C4AC] inline-flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Pilihan Utama
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs font-mono tabular-nums font-semibold px-2.5 py-0.5 rounded-md bg-[#ECEFE9] text-[#141916] border border-[#DCE1D8]">
                                    {orderedSessions.length || daysPerWeek} Sesi
                                  </span>
                                </div>

                                <h4 className="text-xl font-bold text-[#141916]">
                                  {split.name}
                                </h4>
                                <p className="text-sm text-[#48524C] leading-relaxed mt-1">
                                  {split.description}
                                </p>
                              </div>

                              {/* Not Recommended Honest Note (never blocks selection) */}
                              {lvl === "not_recommended" && (
                                <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#141916] space-y-1">
                                  <span className="font-bold text-[#B45309] flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Mengapa Kurang Direkomendasikan</span>
                                  </span>
                                  <p className="leading-relaxed text-[#48524C]">
                                    {split.not_recommended_reason ||
                                      "Setiap otot hanya mendapat stimulus 1× seminggu, sehingga perkembangan biasanya lebih lambat bagi pemula. Tetap boleh dipilih sesuai preferensi Anda."}
                                  </p>
                                </div>
                              )}

                              {/* Ordered Session Sequence */}
                              {orderedSessions.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-xs font-bold text-[#48524C] block">
                                    Urutan Sesi Mingguan:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {orderedSessions.map((s, idx) => (
                                      <span
                                        key={s.id}
                                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#ECEFE9] text-[#141916] border border-[#DCE1D8]"
                                      >
                                        <span className="font-mono tabular-nums text-[#626E67] mr-1">
                                          {idx + 1}.
                                        </span>
                                        {s.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Derived Per-Muscle Weekly Frequency */}
                              {trainedMuscles.length > 0 && (
                                <div className="p-3.5 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl space-y-2">
                                  <span className="text-xs font-bold text-[#48524C] block">
                                    Estimasi Frekuensi Latihan per Otot:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {trainedMuscles.map((muscle) => {
                                      const count = muscleFrequency[muscle] || 0;
                                      return (
                                        <span
                                          key={muscle}
                                          className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                                            count >= 2
                                              ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                                              : "bg-white text-[#48524C] border-[#DCE1D8]"
                                          }`}
                                        >
                                          {MUSCLE_LABELS[muscle] || muscle}{" "}
                                          <strong className="font-mono tabular-nums">
                                            {count}×/mgg
                                          </strong>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Pros */}
                              <div className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl space-y-1.5">
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

                              {/* Cons */}
                              <div className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl space-y-1.5">
                                <span className="text-xs font-bold text-[#BE123C] flex items-center gap-1.5">
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  <span>Catatan & Kekurangan</span>
                                </span>
                                <ul className="space-y-1 text-xs text-[#141916] list-disc list-inside leading-relaxed">
                                  {split.cons.map((con, i) => (
                                    <li key={i}>{con}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Suitable For */}
                              <div className="p-3.5 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl">
                                <span className="text-xs font-bold text-[#48524C] flex items-center gap-1.5 mb-1">
                                  <UserCheck className="w-3.5 h-3.5 text-[#1D4ED8]" />
                                  <span>Cocok Untuk</span>
                                </span>
                                <p className="text-xs text-[#141916] leading-relaxed">
                                  {split.suitable_for}
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons (min-h 44px touch targets) */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleChooseSplit(split)}
                                className={`flex-1 h-11 px-4 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                                  isDefault
                                    ? "bg-[#C84B11] hover:bg-[#A83D0B] text-white"
                                    : "bg-[#141916] hover:bg-[#48524C] text-white"
                                }`}
                              >
                                <span>Pilih Program Ini</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleCompareSplit(split.id)}
                                className={`h-11 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                  isCompared
                                    ? "bg-[#EFF6FF] border-[#1D4ED8] text-[#1D4ED8]"
                                    : "bg-[#F5F6F3] border-[#DCE1D8] text-[#48524C] hover:text-[#141916]"
                                }`}
                              >
                                <GitCompare className="w-4 h-4 shrink-0" />
                                <span>
                                  {isCompared ? "Dibandingkan" : "Bandingkan"}
                                </span>
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : step === 3 && selectedSplit ? (
          /* ================================================================= */
          /* STEP 3: PRATINJAU GERAKAN PER SESI DENGAN FOTO DEMONSTRASI        */
          /* ================================================================= */
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#DCE1D8] rounded-2xl p-5 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-[#141916]">
                  Daftar Gerakan: {selectedSplit.name}
                </h2>
                <p className="text-sm text-[#48524C] mt-0.5">
                  Tinjau gerakan utama di setiap sesi beserta foto posisinya.
                  Klik gerakan untuk melihat langkah lengkap.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-11 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Pilih Split Lain</span>
              </button>
            </div>

            {isLoadingSplitDetail ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#DCE1D8] rounded-2xl p-4 animate-pulse space-y-3"
                  >
                    <div className="h-40 bg-[#ECEFE9] rounded-xl" />
                    <div className="h-5 w-2/3 bg-[#ECEFE9] rounded" />
                  </div>
                ))}
              </div>
            ) : splitDetailError ? (
              <div className="p-6 bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl text-center space-y-3 text-sm text-[#BE123C]">
                <p>{splitDetailError}</p>
                <button
                  type="button"
                  onClick={() => handleChooseSplit(selectedSplit)}
                  className="h-11 px-4 rounded-xl bg-white border border-[#FECDD3] text-xs font-semibold text-[#BE123C] cursor-pointer"
                >
                  Coba Muat Ulang
                </button>
              </div>
            ) : (
              <>
                {/* Session Tabs */}
                <div
                  className="flex items-center gap-2 overflow-x-auto pb-1"
                  role="tablist"
                  aria-label="Pilih sesi latihan"
                >
                  {(selectedSplit.sessions || []).map((session, idx) => {
                    const isActive = idx === activeSessionTab;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveSessionTab(idx)}
                        className={`h-11 px-4 rounded-xl border text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[#141916] text-white border-[#141916]"
                            : "bg-white text-[#48524C] border-[#DCE1D8] hover:text-[#141916]"
                        }`}
                      >
                        {idx + 1}. {session.name} (
                        {session.exercises?.length || 0})
                      </button>
                    );
                  })}
                </div>

                {/* Active Session Exercises */}
                {(() => {
                  const currentSession =
                    selectedSplit.sessions?.[activeSessionTab];
                  const exercises = currentSession?.exercises || [];

                  if (!currentSession || exercises.length === 0) {
                    return (
                      <div className="p-8 bg-white border border-[#DCE1D8] rounded-2xl text-center text-sm text-[#48524C]">
                        <Dumbbell className="w-8 h-8 text-[#626E67] mx-auto mb-2" />
                        Belum ada gerakan yang terhubung ke sesi ini.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exercises.map((ex) => {
                        const thumb = ex.images?.[0];
                        return (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => setPreviewExercise(ex)}
                            className="text-left bg-white border border-[#DCE1D8] hover:border-[#C84B11] rounded-2xl p-4 shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                          >
                            <div>
                              <ExerciseThumbnail
                                src={thumb?.url}
                                alt={
                                  thumb?.alt_text || `${ex.name} demonstrasi`
                                }
                                className="w-full h-40 rounded-xl mb-3"
                                sizes="(max-width: 640px) 100vw, 320px"
                              />
                              <h3 className="text-base font-bold text-[#141916] group-hover:text-[#C84B11] transition-colors">
                                {ex.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                {ex.pivot && (
                                  <span className="px-2 py-0.5 rounded-md bg-[#FFF1EA] text-[#C84B11] border border-[#F4C4AC] text-xs font-mono tabular-nums font-semibold">
                                    {ex.pivot.default_sets} Set ×{" "}
                                    {ex.pivot.default_rep_range}
                                  </span>
                                )}
                                {ex.equipment && (
                                  <span className="px-2 py-0.5 rounded-md bg-[#ECEFE9] text-[#48524C] text-xs font-medium capitalize">
                                    {ex.equipment}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="mt-3 pt-2.5 border-t border-[#DCE1D8] text-xs font-semibold text-[#C84B11] block">
                              Lihat Cara Melakukan →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full sm:w-auto h-12 px-7 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>OK, Lanjut Atur Jadwal Mingguan</span>
              </button>
            </div>
          </section>
        ) : step === 4 && selectedSplit ? (
          /* ================================================================= */
          /* STEP 4: DRAG-AND-DROP WEEKLY SCHEDULE BUILDER                     */
          /* ================================================================= */
          <ScheduleBuilder
            split={selectedSplit}
            daysPerWeek={daysPerWeek}
            initialSchedule={
              existingPlan?.split_id === selectedSplit.id
                ? existingScheduleMap
                : undefined
            }
            onBack={() => setStep(3)}
            onSaved={(warnings) => {
              setSavedWarnings(warnings);
              setSavedSuccess(true);
            }}
          />
        ) : null}
      </div>

      <ExerciseDetailModal
        exercise={previewExercise}
        onClose={() => setPreviewExercise(null)}
      />
    </main>
  );
}
