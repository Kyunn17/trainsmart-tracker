"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  HelpCircle,
  MessageSquareWarning,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getExerciseDetail,
  getTodaySession,
  updateDailySessionStatus,
} from "@/lib/api";
import {
  DailySessionStatus,
  Exercise,
  TodaySessionResponse,
} from "@/types/workout";
import { MUSCLE_LABELS } from "@/lib/scheduleValidation";
import ExerciseThumbnail from "@/app/components/ExerciseThumbnail";
import ExerciseDetailModal from "@/app/components/ExerciseDetailModal";

const STATUS_BADGE: Record<
  DailySessionStatus,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "Belum Selesai",
    badgeClass: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  },
  done: {
    label: "Selesai",
    badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  },
  skipped: {
    label: "Dilewati",
    badgeClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
  },
  rest: {
    label: "Hari Istirahat",
    badgeClass: "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]",
  },
};

export default function TodayDashboardSection() {
  const { user, isLoading: authLoading } = useAuth();
  const [todayData, setTodayData] = useState<TodaySessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (!user || user.role !== "client") return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) setIsLoading(true);
    });
    getTodaySession()
      .then((res) => {
        if (!active) return;
        setTodayData(res);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleStatusChange = async (nextStatus: DailySessionStatus) => {
    if (!todayData?.data) return;
    setIsUpdatingStatus(true);
    setStatusError(null);
    const res = await updateDailySessionStatus(todayData.data.id, nextStatus);
    setIsUpdatingStatus(false);

    if (!res.success) {
      setStatusError(res.message);
      return;
    }

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
        <div className="h-16 bg-[#ECEFE9] rounded-xl" />
      </div>
    );
  }

  // Guest CTA
  if (!user) {
    return (
      <section className="bg-white border border-[#DCE1D8] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#141916] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C84B11]" />
            <span>Baru Mulai di Gym? Buat Jadwal Latihan Pribadi</span>
          </h2>
          <p className="text-sm text-[#48524C]">
            Pilih berapa hari Anda bisa latihan, dapatkan rekomendasi split yang pas, dan ikuti panduan gerakan bergambar setiap hari.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/register"
            className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm flex items-center gap-2"
          >
            <span>Daftar & Mulai Panduan</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/exercises"
            className="h-11 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl text-sm flex items-center"
          >
            Lihat Gerakan
          </Link>
        </div>
      </section>
    );
  }

  // Non-client roles (trainer/admin) have their own portals in Navbar
  if (user.role !== "client") {
    return null;
  }

  if (isLoading && !todayData) {
    return (
      <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-6 w-56 bg-[#ECEFE9] rounded" />
        <div className="h-24 bg-[#ECEFE9] rounded-xl" />
      </div>
    );
  }

  // Client without onboarding plan
  if (!todayData || !todayData.has_plan || !todayData.data) {
    return (
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
    );
  }

  const daily = todayData.data;
  const splitSession = daily.split_session;
  const badge = STATUS_BADGE[daily.status] || STATUS_BADGE.pending;
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
            <span className="font-mono tabular-nums font-semibold text-[#141916]">
              {daily.session_date}
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
                {daily.status === "done" ? "Lihat / Tambah Set" : "Mulai Latihan"}
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#141916] flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#C84B11]" />
              <span>Daftar Gerakan Sesi Hari Ini ({exercises.length})</span>
            </h3>
          </div>

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
                  className="h-9 px-2.5 bg-white hover:bg-[#FFF1EA] border border-[#DCE1D8] hover:border-[#F4C4AC] text-[#C84B11] rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
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
            <span className="text-xs font-semibold uppercase tracking-wider text-[#626E67]">
              Jadwal Minggu Ini
            </span>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <Link
                href="/onboarding"
                className="text-[#48524C] hover:text-[#C84B11] inline-flex items-center gap-1"
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Ubah Jadwal</span>
              </Link>
              <Link
                href="/evaluation"
                className="text-[#C84B11] hover:underline inline-flex items-center gap-1"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Evaluasi Mingguan</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
            {todayData.week_overview.map((day) => {
              const dayBadge = STATUS_BADGE[day.status] || STATUS_BADGE.pending;
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
                      <span className="text-[11px] font-bold text-[#C84B11]">
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

      <ExerciseDetailModal
        exercise={detailExercise}
        onClose={() => setDetailExercise(null)}
      />
    </section>
  );
}
