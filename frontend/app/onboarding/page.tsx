"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  CheckCircle2,
  Dumbbell,
  Info,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getSplitById,
  getSplitRecommendations,
  getUserPlan,
} from "@/lib/api";
import {
  Exercise,
  ScheduleWarning,
  Split,
  UserPlan,
} from "@/types/workout";
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

export default function OnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);

  const [existingPlan, setExistingPlan] = useState<UserPlan | null>(null);
  const [recommendations, setRecommendations] = useState<Split[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  const [selectedSplit, setSelectedSplit] = useState<Split | null>(null);
  const [isLoadingSplitDetail, setIsLoadingSplitDetail] = useState(false);
  const [splitDetailError, setSplitDetailError] = useState<string | null>(null);
  const [activeSessionTab, setActiveSessionTab] = useState(0);

  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedWarnings, setSavedWarnings] = useState<ScheduleWarning[]>([]);

  // Check if logged-in user already has an active plan
  useEffect(() => {
    if (!user) return;
    getUserPlan().then((res) => {
      if (res.success && res.data) {
        setExistingPlan(res.data);
      }
    });
  }, [user]);

  const loadRecommendations = async (days: number) => {
    setIsLoadingRecs(true);
    setRecsError(null);
    const res = await getSplitRecommendations(days);
    setIsLoadingRecs(false);

    if (!res.success) {
      setRecsError(res.message || "Gagal memuat rekomendasi split.");
      return;
    }

    setRecommendations(res.data);
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
            Pilih berapa hari Anda ingin latihan, lihat rekomendasi split yang cocok, dan simpan jadwal mingguan ke akun Anda.
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
              Ikuti 4 langkah singkat untuk memilih program split dan menyusun jadwal mingguan Anda.
            </p>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-[#48524C] hover:text-[#C84B11] inline-flex items-center gap-1.5 self-start sm:self-auto"
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
                  Anda dapat melanjutkan di sini untuk mengganti split, atau langsung ubah susunan hari latihan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEditExistingPlan}
              className="h-10 px-4 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold rounded-xl text-xs whitespace-nowrap cursor-pointer self-start sm:self-auto"
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
                Program <strong className="text-[#141916]">{selectedSplit?.name}</strong>{" "}
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
                Pilih frekuensi yang realistis untuk jadwal Anda agar konsisten dalam jangka panjang.
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
                className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-sm text-[#BE123C] flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{recsError}</span>
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
                    : "Lihat Rekomendasi Split"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        ) : step === 2 ? (
          /* ================================================================= */
          /* STEP 2: PILIH REKOMENDASI SPLIT (PROS, CONS, SUITABLE_FOR)        */
          /* ================================================================= */
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#141916]">
                  Rekomendasi Split untuk {daysPerWeek} Hari / Minggu
                </h2>
                <p className="text-sm text-[#48524C] mt-0.5">
                  Pelajari kelebihan dan kekurangan setiap program sebelum memilih.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-10 px-4 bg-white border border-[#DCE1D8] hover:border-[#C5CCC0] text-[#141916] font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ganti Jumlah Hari</span>
              </button>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-8 bg-white border border-[#DCE1D8] rounded-2xl text-center">
                <p className="text-sm text-[#48524C]">
                  Belum ada rekomendasi split untuk {daysPerWeek} hari.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {recommendations.map((split) => (
                  <div
                    key={split.id}
                    className="bg-white border border-[#DCE1D8] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h3 className="text-xl font-bold text-[#141916]">
                            {split.name}
                          </h3>
                          <span className="text-xs font-mono tabular-nums font-semibold px-2.5 py-1 rounded-lg bg-[#FFF1EA] text-[#C84B11] border border-[#F4C4AC] shrink-0">
                            {split.sessions?.length || daysPerWeek} Sesi
                          </span>
                        </div>
                        <p className="text-sm text-[#48524C] leading-relaxed">
                          {split.description}
                        </p>
                      </div>

                      {/* Session pills */}
                      {split.sessions && split.sessions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {split.sessions.map((s) => (
                            <span
                              key={s.id}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#ECEFE9] text-[#141916] border border-[#DCE1D8]"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Pros */}
                      <div className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl space-y-1.5">
                        <span className="text-xs font-bold text-[#047857] flex items-center gap-1.5">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Mengapa Program Ini Bagus</span>
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
                          <span>Hal yang Perlu Diperhatikan</span>
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

                    <button
                      type="button"
                      onClick={() => handleChooseSplit(split)}
                      className="w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Pilih Program Ini</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
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
                  Tinjau gerakan utama di setiap sesi beserta foto posisinya. Klik gerakan untuk melihat langkah lengkap.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-10 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
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
              <div className="p-6 bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl text-center text-sm text-[#BE123C]">
                {splitDetailError}
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
                        {session.name} (
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
