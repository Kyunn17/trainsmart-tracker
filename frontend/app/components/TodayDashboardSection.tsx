"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  BarChart3,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  HelpCircle,
  History,
  LogIn,
  MessageSquareWarning,
  ShieldAlert,
  SkipForward,
  Sparkles,
  StickyNote,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getClientMyProgress,
  getExerciseDetail,
  getTodaySession,
  rescheduleDailySession,
  updateDailySessionStatus,
} from "@/lib/api";
import {
  DailySessionStatus,
  Exercise,
  TodaySessionResponse,
  WorkoutLogEntry,
} from "@/types/workout";
import { MUSCLE_LABELS } from "@/lib/scheduleValidation";
import {
  SESSION_STATUS_META,
  getRirZone,
  formatIndonesianDateString,
} from "@/lib/sessionStatus";
import ExerciseThumbnail from "@/app/components/ExerciseThumbnail";
import ExerciseDetailModal from "@/app/components/ExerciseDetailModal";

export default function TodayDashboardSection() {
  const { user, isLoading: authLoading } = useAuth();
  const [todayData, setTodayData] = useState<TodaySessionResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<WorkoutLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  // Reschedule ("Geser Jadwal") modal state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const QUICK_RESCHEDULE_REASONS = [
    "Sakit / kurang fit",
    "Sibuk kerja / kuliah",
    "Otot masih pegal (butuh recovery)",
    "Urusan keluarga / mendadak",
  ];

  useEffect(() => {
    if (!user || user.role !== "client") return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) setIsLoading(true);
    });
    Promise.all([getTodaySession(), getClientMyProgress()])
      .then(([todayRes, progressRes]) => {
        if (!active) return;
        setTodayData(todayRes);
        setRecentLogs(progressRes?.logs || []);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!isRescheduleOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsRescheduleOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRescheduleOpen]);

  const handleStatusChange = async (nextStatus: DailySessionStatus) => {
    if (!todayData?.data) return;
    setIsUpdatingStatus(true);
    setStatusError(null);
    setStatusSuccess(null);
    const res = await updateDailySessionStatus(todayData.data.id, nextStatus);
    setIsUpdatingStatus(false);

    if (!res.success) {
      setStatusError(res.message);
      return;
    }

    const successLabels: Record<DailySessionStatus, string> = {
      done: "Sesi hari ini ditandai selesai.",
      skipped: "Sesi hari ini ditandai dilewati.",
      pending: "Status sesi dikembalikan ke belum selesai.",
      rest: "Status sesi diperbarui menjadi hari istirahat.",
    };
    setStatusSuccess(successLabels[nextStatus]);

    const refreshed = await getTodaySession();
    if (refreshed) setTodayData(refreshed);
  };

  const openRescheduleModal = () => {
    const firstAvailable =
      todayData?.upcoming_options?.find((opt) => !opt.is_locked && opt.is_rest) ||
      todayData?.upcoming_options?.find((opt) => !opt.is_locked);
    setRescheduleDate(firstAvailable?.date || "");
    setRescheduleReason("");
    setRescheduleError(null);
    setIsRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayData?.data || !rescheduleDate) return;
    setIsRescheduling(true);
    setRescheduleError(null);
    setStatusError(null);
    setStatusSuccess(null);

    const res = await rescheduleDailySession(
      todayData.data.id,
      rescheduleDate,
      rescheduleReason.trim()
    );
    setIsRescheduling(false);

    if (!res.success) {
      setRescheduleError(res.message);
      return;
    }

    setIsRescheduleOpen(false);
    setStatusSuccess(res.message);
    const refreshed = await getTodaySession();
    if (refreshed) setTodayData(refreshed);
  };

  const openHowTo = async (exercise: Exercise) => {
    setDetailExercise(exercise);
    if (!exercise.instructions?.length && exercise.slug) {
      const full = await getExerciseDetail(exercise.slug);
      if (full) setDetailExercise(full);
    }
  };

  if (authLoading) {
    return (
      <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 animate-pulse space-y-3">
        <div className="h-5 w-48 bg-[#ECEFE9] rounded" />
        <div className="h-20 bg-[#ECEFE9] rounded-xl" />
      </div>
    );
  }

  // Guest Welcome Card (no private logs, no old PPL routine)
  if (!user) {
    return (
      <section className="bg-white border border-[#DCE1D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-[#141916] flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#C84B11] shrink-0" />
            <span>Bingung Mulai Gym dari Mana? Kami Bantu Susun Jadwalnya</span>
          </h2>
          <p className="text-sm sm:text-base text-[#48524C] leading-relaxed">
            Masuk atau daftar akun gratis untuk menentukan frekuensi latihan (2–6 hari/minggu), mendapatkan rekomendasi split yang sesuai, melihat foto panduan tiap gerakan, dan memantau evaluasi mingguan Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl">
            <span className="text-xs font-mono tabular-nums font-bold text-[#C84B11] block mb-1">
              Langkah 1
            </span>
            <p className="text-sm font-semibold text-[#141916]">
              Pilih Hari & Split Cocok
            </p>
            <p className="text-xs text-[#48524C] mt-1">
              Full Body, Upper/Lower, atau PPL otomatis disesuaikan dengan jadwal Anda.
            </p>
          </div>
          <div className="p-4 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl">
            <span className="text-xs font-mono tabular-nums font-bold text-[#C84B11] block mb-1">
              Langkah 2
            </span>
            <p className="text-sm font-semibold text-[#141916]">
              Belajar Gerakan Bergambar
            </p>
            <p className="text-xs text-[#48524C] mt-1">
              Lihat posisi awal/akhir, instruksi langkah demi langkah, dan tips pemula.
            </p>
          </div>
          <div className="p-4 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl">
            <span className="text-xs font-mono tabular-nums font-bold text-[#C84B11] block mb-1">
              Langkah 3
            </span>
            <p className="text-sm font-semibold text-[#141916]">
              Catat Set & Evaluasi Mingguan
            </p>
            <p className="text-xs text-[#48524C] mt-1">
              Pantau progres tonase, RIR, dan saran perbaikan setiap minggu.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/register"
            className="h-11 px-6 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-colors"
          >
            <span>Daftar & Mulai Panduan</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="h-11 px-5 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl text-sm flex items-center gap-2 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk ke Akun</span>
          </Link>
        </div>
      </section>
    );
  }

  // Trainer Home Card
  if (user.role === "trainer") {
    return (
      <section className="bg-white border border-[#DCE1D8] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-[#141916] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1D4ED8]" />
            <span>Halo, {user.name} (Personal Trainer)</span>
          </h2>
          <p className="text-sm text-[#48524C] max-w-xl">
            Kelola permintaan bimbingan masuk, pantau jadwal hari ini dari klien Anda, dan evaluasi progres beban mereka melalui Portal Trainer.
          </p>
        </div>
        <Link
          href="/trainer"
          className="h-11 px-6 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shrink-0"
        >
          <span>Buka Portal Trainer</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </section>
    );
  }

  // Admin Home Card
  if (user.role === "admin") {
    return (
      <section className="bg-white border border-[#DCE1D8] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-[#141916] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#BE123C]" />
            <span>Halo, {user.name} (Administrator)</span>
          </h2>
          <p className="text-sm text-[#48524C] max-w-xl">
            Kelola pengguna, katalog gerakan beserta foto demonstrasi, dan program split rekomendasi dari Admin Master Panel.
          </p>
        </div>
        <Link
          href="/admin"
          className="h-11 px-6 bg-[#BE123C] hover:bg-[#9F1239] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shrink-0"
        >
          <span>Buka Admin Panel</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </section>
    );
  }

  if (isLoading && !todayData) {
    return (
      <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-6 w-56 bg-[#ECEFE9] rounded" />
        <div className="h-24 bg-[#ECEFE9] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Action Bar (Schedule, Progress, Personal Trainer) */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          href="/onboarding"
          className="h-11 px-4 bg-white hover:bg-[#ECEFE9] border border-[#DCE1D8] hover:border-[#8E9891] text-[#141916] rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-xs"
        >
          <CalendarRange className="w-4 h-4 text-[#A83D0B]" />
          <span>Atur Jadwal</span>
        </Link>
        <Link
          href="/client/progress"
          className="h-11 px-4 bg-white hover:bg-[#ECEFE9] border border-[#DCE1D8] hover:border-[#8E9891] text-[#141916] rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-xs"
        >
          <TrendingUp className="w-4 h-4 text-[#047857]" />
          <span>Progres & Riwayat</span>
        </Link>
        <Link
          href="/client/trainer"
          className="h-11 px-4 bg-white hover:bg-[#ECEFE9] border border-[#DCE1D8] hover:border-[#8E9891] text-[#141916] rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-xs"
        >
          <Award className="w-4 h-4 text-[#1D4ED8]" />
          <span>Personal Trainer</span>
        </Link>
      </div>

      {/* Client without onboarding plan */}
      {!todayData || !todayData.has_plan || !todayData.data ? (
        <section className="bg-white border border-[#DCE1D8] rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#141916] flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-[#C84B11]" />
              <span>Anda Belum Mengatur Jadwal Latihan Mingguan</span>
            </h2>
            <p className="text-sm text-[#48524C] max-w-2xl">
              Ikuti 4 langkah singkat untuk menentukan frekuensi hari latihan, memilih split rekomendasi, dan menyusun jadwal Senin–Minggu Anda.
            </p>
          </div>

          <Link
            href="/onboarding"
            className="h-11 px-6 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shrink-0"
          >
            <span>Mulai Panduan Jadwal</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
      ) : (
        (() => {
          const daily = todayData.data;
          const splitSession = daily.split_session;
          const badge =
            SESSION_STATUS_META[daily.status] || SESSION_STATUS_META.pending;
          const isTrainerOverride = daily.changed_by_role === "trainer";
          const exercises = splitSession?.exercises || [];

          return (
            <section
              aria-labelledby="today-plan-heading"
              className="bg-white border border-[#DCE1D8] rounded-2xl p-6 shadow-xs space-y-6"
            >
              {/* Top Header + Status */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#DCE1D8]">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2
                      id="today-plan-heading"
                      className="text-2xl font-bold text-[#141916] tracking-tight"
                    >
                      Sesi Hari Ini:{" "}
                      {splitSession ? splitSession.name : "Hari Istirahat"}
                    </h2>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-lg border ${badge.badgeClass}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#48524C]">
                    <span className="font-semibold text-[#141916]">
                      {formatIndonesianDateString(daily.session_date)}
                    </span>
                    {daily.user_plan?.split?.name && (
                      <span>• Program {daily.user_plan.split.name}</span>
                    )}
                    {splitSession?.muscle_groups &&
                      splitSession.muscle_groups.length > 0 && (
                        <span>
                          • Target:{" "}
                          {splitSession.muscle_groups
                            .map((m) => MUSCLE_LABELS[m] || m)
                            .join(", ")}
                        </span>
                      )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {splitSession && daily.status !== "rest" && (
                    <Link
                      href={`/session/${daily.id}`}
                      className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Flame className="w-4 h-4" />
                      <span>
                        {daily.status === "done"
                          ? "Lihat / Tambah Set"
                          : "Mulai Latihan"}
                      </span>
                    </Link>
                  )}

                  {daily.status === "pending" && !isTrainerOverride && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange("done")}
                        disabled={isUpdatingStatus}
                        className="h-11 px-4 bg-[#047857] hover:bg-[#065F46] disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tandai Selesai</span>
                      </button>
                      {splitSession && (
                        <button
                          type="button"
                          onClick={openRescheduleModal}
                          disabled={isUpdatingStatus}
                          className="h-11 px-4 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] disabled:opacity-50 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CalendarClock className="w-4 h-4" />
                          <span>Geser Jadwal</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStatusChange("skipped")}
                        disabled={isUpdatingStatus}
                        className="h-11 px-4 bg-[#ECEFE9] hover:bg-[#FFF1F2] hover:text-[#BE123C] border border-[#DCE1D8] hover:border-[#FECDD3] disabled:opacity-50 text-[#48524C] font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <SkipForward className="w-4 h-4" />
                        <span>Lewati Hari Ini</span>
                      </button>
                    </>
                  )}

                  {(daily.status === "done" || daily.status === "skipped") &&
                    !isTrainerOverride && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange("pending")}
                        disabled={isUpdatingStatus}
                        className="h-11 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] disabled:opacity-50 text-[#141916] font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Kembalikan ke Belum Selesai</span>
                      </button>
                    )}
                </div>
              </div>

              {/* Trainer Override Note Banner */}
              {(isTrainerOverride || daily.trainer_note) && (
                <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-start gap-3">
                  <MessageSquareWarning className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-bold text-[#1D4ED8] block">
                      Catatan dari Personal Trainer
                      {daily.changedBy?.name ? ` (${daily.changedBy.name})` : ""}
                    </span>
                    <p className="text-[#141916] mt-0.5">
                      {daily.trainer_note ||
                        "Status latihan hari ini telah disesuaikan oleh pelatih Anda."}
                    </p>
                  </div>
                </div>
              )}

              {/* Reschedule Info Banner */}
              {(daily.rescheduled_to_date || daily.rescheduled_from_date) && (
                <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-start gap-3">
                  <CalendarClock className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-bold text-[#B45309] block">
                      {daily.rescheduled_to_date
                        ? `Jadwal Hari Ini Digeser ke ${daily.rescheduled_to_date}`
                        : `Sesi Pindahan dari ${daily.rescheduled_from_date}`}
                    </span>
                    {daily.reschedule_reason && (
                      <p className="text-[#141916] mt-0.5">
                        Alasan: {daily.reschedule_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {statusSuccess && (
                <div
                  role="status"
                  className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs sm:text-sm text-[#047857] font-medium flex flex-wrap items-center justify-between gap-2"
                >
                  <span>{statusSuccess}</span>
                  {(daily.status === "done" || daily.status === "skipped") &&
                    !isTrainerOverride && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange("pending")}
                        disabled={isUpdatingStatus}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#A7F3D0] text-[#047857] hover:bg-[#ECFDF5] text-xs font-bold cursor-pointer"
                      >
                        Batalkan (Undo)
                      </button>
                    )}
                </div>
              )}

              {statusError && (
                <div
                  role="alert"
                  className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-xs sm:text-sm text-[#BE123C] font-medium"
                >
                  {statusError}
                </div>
              )}

              {/* Today's Exercises Preview Strip */}
              {splitSession && exercises.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[#141916] flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-[#C84B11]" />
                    <span>Daftar Gerakan Sesi Hari Ini ({exercises.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {exercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="p-3 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ExerciseThumbnail
                            src={ex.images?.[0]?.url}
                            alt={ex.name}
                            className="w-12 h-12 rounded-lg shrink-0"
                            sizes="48px"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#141916] truncate">
                              {ex.name}
                            </p>
                            {ex.pivot && (
                              <p className="text-xs font-mono tabular-nums text-[#626E67]">
                                {ex.pivot.default_sets} Set ×{" "}
                                {ex.pivot.default_rep_range}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openHowTo(ex)}
                          className="min-h-[44px] px-3 bg-white hover:bg-[#FFF1EA] border border-[#DCE1D8] hover:border-[#F4C4AC] text-[#A83D0B] rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                          aria-label={`Lihat cara melakukan ${ex.name}`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Cara</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Week Strip */}
              {todayData.week_overview.length > 0 && (
                <div className="pt-4 border-t border-[#DCE1D8] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#48524C]">
                      Jadwal Minggu Ini
                    </span>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <Link
                        href="/onboarding"
                        className="text-[#48524C] hover:text-[#A83D0B] inline-flex items-center gap-1 min-h-[36px]"
                      >
                        <CalendarRange className="w-3.5 h-3.5" />
                        <span>Ubah Jadwal</span>
                      </Link>
                      <Link
                        href="/evaluation"
                        className="text-[#A83D0B] hover:underline inline-flex items-center gap-1 min-h-[36px]"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Evaluasi Mingguan</span>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                    {todayData.week_overview.map((day) => {
                      const dayBadge =
                        SESSION_STATUS_META[day.status] ||
                        SESSION_STATUS_META.pending;
                      return (
                        <div
                          key={day.date}
                          className={`p-2.5 rounded-xl border text-xs ${
                            day.is_today
                              ? "bg-[#FFF1EA] border-[#C84B11]"
                              : "bg-[#F5F6F3] border-[#DCE1D8]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#141916]">
                              {day.day_short}
                            </span>
                            {day.is_today && (
                              <span className="text-xs font-bold text-[#A83D0B]">
                                Hari Ini
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-[#141916] truncate">
                            {day.session_name}
                          </p>
                          <span
                            className={`inline-block mt-1.5 px-1.5 py-0.5 rounded border text-[11px] font-semibold ${dayBadge.badgeClass}`}
                          >
                            {dayBadge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })()
      )}

      {/* Client's Own Recent Logs */}
      <section aria-labelledby="personal-recent-logs">
        <div className="bg-white border border-[#DCE1D8] rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-[#ECEFE9]/60 border-b border-[#DCE1D8] flex flex-wrap items-center justify-between gap-2">
            <h2
              id="personal-recent-logs"
              className="text-base font-bold text-[#141916] flex items-center gap-2"
            >
              <History className="w-4 h-4 text-[#C84B11]" />
              <span>Riwayat Latihan Terakhir Anda</span>
            </h2>
            <Link
              href="/client/progress"
              className="text-xs font-semibold text-[#A83D0B] hover:underline min-h-[36px] inline-flex items-center"
            >
              Lihat Semua Progres →
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#48524C]">
              Belum ada catatan set yang masuk. Mulai sesi latihan hari ini untuk merekam progres Anda.
            </div>
          ) : (
            <div className="divide-y divide-[#DCE1D8]">
              {recentLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="px-6 py-3.5 hover:bg-[#F5F6F3]/70 transition-colors grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start sm:items-center"
                >
                  <div className="sm:col-span-5 min-w-0">
                    <p className="text-sm font-semibold text-[#141916] truncate">
                      {log.exercise?.name || `Gerakan #${log.exercise_id}`}
                    </p>
                    {log.notes && (
                      <p className="text-xs text-[#626E67] mt-0.5 flex items-center gap-1.5 truncate">
                        <StickyNote className="w-3.5 h-3.5 text-[#C84B11] shrink-0" />
                        <span className="truncate">{log.notes}</span>
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs font-mono tabular-nums font-semibold px-2.5 py-1 rounded-lg bg-[#ECEFE9] text-[#48524C] border border-[#DCE1D8]">
                      Set {log.set_number}
                    </span>
                  </div>
                  <div className="sm:col-span-3 text-sm font-mono tabular-nums font-semibold text-[#141916]">
                    {log.weight} kg × {log.reps} reps
                  </div>
                  <div className="sm:col-span-2 flex sm:justify-end">
                    {log.rir !== null && log.rir !== undefined ? (
                      <span
                        className={`text-xs font-mono tabular-nums font-semibold px-2.5 py-1 rounded-lg border ${
                          getRirZone(log.rir).badgeClass
                        }`}
                      >
                        RIR {log.rir}
                      </span>
                    ) : (
                      <span className="text-xs text-[#626E67]">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reschedule ("Geser Jadwal") Modal */}
      {isRescheduleOpen && todayData?.data && (
        <div
          className="fixed inset-0 bg-[#141916]/65 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRescheduleOpen(false);
          }}
        >
          <div className="bg-white border border-[#DCE1D8] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl relative space-y-4">
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(false)}
              className="absolute top-4 right-4 h-10 w-10 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#48524C] rounded-xl flex items-center justify-center cursor-pointer"
              aria-label="Tutup modal geser jadwal"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h2
                id="reschedule-modal-title"
                className="text-xl font-bold text-[#141916] pr-10 flex items-center gap-2"
              >
                <CalendarClock className="w-5 h-5 text-[#B45309]" />
                <span>Geser Jadwal Latihan</span>
              </h2>
              <p className="text-xs text-[#48524C] mt-1">
                Pindahkan sesi{" "}
                <strong className="text-[#141916]">
                  {todayData.data.split_session?.name}
                </strong>{" "}
                ke hari lain tanpa menandainya sebagai dilewati (skip). Hari ini akan menjadi hari istirahat.
              </p>
            </div>

            {rescheduleError && (
              <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-xs text-[#BE123C]">
                {rescheduleError}
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <p className="block text-xs font-semibold text-[#141916] mb-2">
                  Pilih Tanggal Tujuan <span className="text-[#BE123C]">*</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(todayData.upcoming_options || []).map((opt) => {
                    const selected = rescheduleDate === opt.date;
                    return (
                      <button
                        key={opt.date}
                        type="button"
                        aria-pressed={selected}
                        disabled={opt.is_locked}
                        onClick={() => setRescheduleDate(opt.date)}
                        className={`p-3 min-h-[56px] rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          selected
                            ? "bg-[#FFF1EA] border-[#C84B11]"
                            : "bg-[#F5F6F3] border-[#DCE1D8] hover:border-[#8E9891]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#141916]">
                            {opt.day_name}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-[#48524C]">
                            {opt.date}
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-[#48524C]">
                          {opt.is_rest
                            ? "Hari Istirahat (Slot kosong)"
                            : `Terisi: ${opt.session_name} (akan ikut bergeser)`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="reschedule-reason"
                  className="block text-xs font-semibold text-[#141916] mb-1.5"
                >
                  Alasan Geser Jadwal <span className="text-[#BE123C]">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QUICK_RESCHEDULE_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRescheduleReason(preset)}
                      className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                        rescheduleReason === preset
                          ? "bg-[#141916] text-white border-[#141916]"
                          : "bg-[#F5F6F3] text-[#48524C] border-[#DCE1D8] hover:text-[#141916]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  id="reschedule-reason"
                  type="text"
                  required
                  minLength={3}
                  maxLength={255}
                  placeholder="Tulis alasan Anda (misal: sedang demam / lembur kantor)..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#8E9891] focus:border-[#C84B11] rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="h-11 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl text-sm cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    isRescheduling ||
                    !rescheduleDate ||
                    rescheduleReason.trim().length < 3
                  }
                  className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] disabled:opacity-50 text-white font-semibold rounded-xl text-sm cursor-pointer"
                >
                  {isRescheduling ? "Menggeser..." : "Konfirmasi Geser Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ExerciseDetailModal
        exercise={detailExercise}
        onClose={() => setDetailExercise(null)}
      />
    </div>
  );
}
