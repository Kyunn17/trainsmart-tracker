"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Info,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getAdminStats,
  getClientMyProgress,
  getTodaySession,
  getTrainerClients,
  getTrainerCoachingRequests,
  getWeeklyEvaluation,
} from "@/lib/api";
import {
  CoachingRequest,
  TodaySessionResponse,
  User,
  WeeklyEvaluationResponse,
  WorkoutLogEntry,
} from "@/types/workout";
import { MUSCLE_LABELS } from "@/lib/scheduleValidation";
import { SESSION_STATUS_META, getRirZone } from "@/lib/sessionStatus";

interface AdminStats {
  total_users: number;
  total_trainers: number;
  total_clients: number;
  total_logs: number;
  total_exercises: number;
  total_tonnage_kg: number;
}

function getGreetingByHour(hour: number): string {
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 19) return "Selamat sore";
  return "Selamat malam";
}

function formatIndonesianDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function formatWeight(value: number | string): string {
  const numeric = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function MemberHomeDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Client state
  const [todayData, setTodayData] = useState<TodaySessionResponse | null>(null);
  const [weeklyEval, setWeeklyEval] = useState<WeeklyEvaluationResponse | null>(
    null
  );
  const [progressSummary, setProgressSummary] = useState<{
    total_sets: number;
    total_volume_kg: number;
    average_rir: number | null;
  } | null>(null);
  const [assignedTrainer, setAssignedTrainer] = useState<User | null>(null);
  const [recentLogs, setRecentLogs] = useState<WorkoutLogEntry[]>([]);

  // Trainer state
  const [trainerClients, setTrainerClients] = useState<User[]>([]);
  const [trainerRequests, setTrainerRequests] = useState<CoachingRequest[]>([]);

  // Admin state
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadDashboard = async () => {
      try {
        if (user.role === "client") {
          const [todayRes, evalRes, progressRes] = await Promise.all([
            getTodaySession(),
            getWeeklyEvaluation("current_week"),
            getClientMyProgress(),
          ]);
          if (!active) return;

          if (!todayRes && !evalRes.success && !progressRes) {
            setFetchError(
              "Gagal memuat ringkasan latihan Anda. Pastikan koneksi ke server berjalan lalu coba lagi."
            );
            return;
          }

          setFetchError(null);
          setTodayData(todayRes);
          setWeeklyEval(evalRes.success && evalRes.data ? evalRes.data : null);
          if (progressRes) {
            setProgressSummary(progressRes.summary);
            setAssignedTrainer(progressRes.trainer);
            setRecentLogs(progressRes.logs || []);
          }
        } else if (user.role === "trainer") {
          const [clientsRes, requestsRes] = await Promise.all([
            getTrainerClients(),
            getTrainerCoachingRequests(),
          ]);
          if (!active) return;
          setFetchError(null);
          setTrainerClients(clientsRes);
          setTrainerRequests(requestsRes);
        } else if (user.role === "admin") {
          const statsRes = await getAdminStats();
          if (!active) return;
          if (!statsRes) {
            setFetchError(
              "Gagal memuat statistik platform. Periksa koneksi server lalu coba lagi."
            );
            return;
          }
          setFetchError(null);
          setAdminStats(statsRes);
        }
      } catch {
        if (active) {
          setFetchError(
            "Terjadi gangguan saat memuat dashboard. Silakan coba lagi."
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  const handleRetry = () => {
    setFetchError(null);
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  };

  if (!user) return null;

  const now = new Date();
  const greeting = getGreetingByHour(now.getHours());
  const firstName = user.name.split(" ")[0] || user.name;
  const formattedDate = formatIndonesianDate(now);

  const roleMeta = {
    client: {
      label: "Member Gym",
      pillClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    },
    trainer: {
      label: "Personal Trainer",
      pillClass: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    },
    admin: {
      label: "Administrator",
      pillClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
    },
  }[user.role];

  if (isLoading) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 animate-pulse">
          <div className="pb-6 border-b border-[#DCE1D8] flex flex-col lg:flex-row justify-between gap-4">
            <div className="space-y-3">
              <div className="h-5 w-48 rounded-full bg-[#ECEFE9]" />
              <div className="h-9 w-72 rounded-xl bg-[#ECEFE9]" />
              <div className="h-4 w-96 max-w-full rounded bg-[#ECEFE9]" />
            </div>
            <div className="h-11 w-48 rounded-xl bg-[#ECEFE9]" />
          </div>
          <div className="h-32 rounded-2xl bg-white border border-[#DCE1D8]" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="h-52 rounded-2xl bg-white border border-[#DCE1D8]" />
              <div className="h-44 rounded-2xl bg-white border border-[#DCE1D8]" />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <div className="h-40 rounded-2xl bg-white border border-[#DCE1D8]" />
              <div className="h-52 rounded-2xl bg-white border border-[#DCE1D8]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div
            role="alert"
            className="bg-white border border-[#FECDD3] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
          >
            <div className="flex items-start gap-3.5">
              <AlertCircle className="w-6 h-6 text-[#BE123C] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h1 className="text-lg font-bold text-[#141916]">
                  Tidak Dapat Memuat Beranda
                </h1>
                <p className="text-sm text-[#48524C] leading-relaxed">
                  {fetchError}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="min-h-[44px] px-5 rounded-xl bg-[#C84B11] hover:bg-[#A83D0B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  const todaySession = todayData?.data ?? null;
  const hasPlan = Boolean(todayData?.has_plan);
  const weekOverview = todayData?.week_overview ?? [];
  const pendingRequests = trainerRequests.filter((r) => r.status === "pending");

  let heroSummary =
    "Ringkasan performa mingguan, jadwal sesi, dan aktivitas latihan Anda.";
  if (user.role === "client") {
    if (!hasPlan) {
      heroSummary =
        "Anda belum memiliki jadwal latihan aktif. Susun jadwal mingguan dalam 1 menit sesuai waktu luang Anda.";
    } else if (todaySession?.status === "done") {
      heroSummary = `Sesi ${todaySession.split_session?.name || "hari ini"} telah selesai. Fokus pada hidrasi, asupan protein, dan pemulihan.`;
    } else if (todaySession?.status === "rest") {
      heroSummary =
        "Hari ini dijadwalkan sebagai Hari Istirahat untuk pemulihan otot agar performa sesi berikutnya optimal.";
    } else if (todaySession?.status === "skipped") {
      heroSummary =
        "Jadwal hari ini ditandai dilewati. Anda dapat membuka halaman Latihan untuk meninjau atau mengembalikan status sesi.";
    } else if (todaySession) {
      heroSummary = `Jadwal hari ini: ${todaySession.split_session?.name || "Sesi Latihan"} — target 1–2 RIR (sisakan 1–2 repetisi sebelum gagal).`;
    }
  } else if (user.role === "trainer") {
    heroSummary =
      pendingRequests.length > 0
        ? `Anda membimbing ${trainerClients.length} klien aktif dan memiliki ${pendingRequests.length} permintaan bimbingan baru.`
        : `Anda saat ini membimbing ${trainerClients.length} klien aktif. Pantau konsistensi jadwal dan volume latihan mereka.`;
  } else if (user.role === "admin") {
    heroSummary = adminStats
      ? `${adminStats.total_users} pengguna terdaftar dengan ${adminStats.total_exercises} gerakan aktif di platform TrainSmart.`
      : "Kelola pengguna, moderasi gerakan custom, dan pantau aktivitas platform TrainSmart.";
  }

  const completionPct = weeklyEval?.completion_percentage ?? 0;
  const completedSessions = weeklyEval?.completed_sessions ?? 0;
  const scheduledSessions = weeklyEval?.scheduled_sessions ?? 0;
  const weeklyTonnage = weeklyEval?.total_tonnage_kg ?? 0;
  const tonnageDeltaPct = weeklyEval?.tonnage_change_percentage ?? null;
  const avgRir =
    weeklyEval?.average_rir ?? progressSummary?.average_rir ?? null;
  const rirZone = getRirZone(avgRir);
  const totalSets = progressSummary?.total_sets ?? 0;
  const lifetimeVolume = progressSummary?.total_volume_kg ?? 0;

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* ================================================================= */}
        {/* 1. ATHLETIC EDITORIAL HEADER + SINGLE PRIMARY CTA                 */}
        {/* ================================================================= */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#DCE1D8]">
          <div className="max-w-2xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[#48524C] font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#A83D0B]" />
                <span>{formattedDate}</span>
              </span>
              <span className="text-[#8E9891]" aria-hidden="true">
                ·
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full border font-semibold ${roleMeta.pillClass}`}
              >
                {roleMeta.label}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#141916]">
              {greeting}, {firstName}
            </h1>

            <p className="text-sm sm:text-base text-[#48524C] leading-relaxed">
              {heroSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {user.role === "client" && (
              <>
                {!hasPlan ? (
                  <Link
                    href="/onboarding"
                    className="min-h-[44px] px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <CalendarRange className="w-4 h-4" />
                    <span>Susun Jadwal Latihan</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : todaySession && todaySession.status === "pending" ? (
                  <>
                    <Link
                      href={`/session/${todaySession.id}`}
                      className="min-h-[44px] px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors shadow-xs"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>
                        Mulai Sesi:{" "}
                        {todaySession.split_session?.name || "Hari Ini"}
                      </span>
                    </Link>
                    <Link
                      href="/training"
                      className="min-h-[44px] px-4 bg-white hover:bg-[#ECEFE9] border border-[#8E9891] text-[#141916] font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors"
                    >
                      <span>Kelola Latihan</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/training"
                      className="min-h-[44px] px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors shadow-xs"
                    >
                      <span>Kelola Latihan</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/evaluation"
                      className="min-h-[44px] px-4 bg-white hover:bg-[#ECEFE9] border border-[#8E9891] text-[#141916] font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors"
                    >
                      <span>Evaluasi Mingguan</span>
                    </Link>
                  </>
                )}
              </>
            )}

            {user.role === "trainer" && (
              <>
                <Link
                  href="/trainer"
                  className="min-h-[44px] px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Users className="w-4 h-4" />
                  <span>Kelola Klien Saya</span>
                </Link>
                <Link
                  href="/training"
                  className="min-h-[44px] px-4 bg-white hover:bg-[#ECEFE9] border border-[#8E9891] text-[#141916] font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors"
                >
                  <span>Latihan Pribadi</span>
                </Link>
              </>
            )}

            {user.role === "admin" && (
              <>
                <Link
                  href="/admin"
                  className="min-h-[44px] px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors shadow-xs"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Buka Admin Panel</span>
                </Link>
                <Link
                  href="/exercises"
                  className="min-h-[44px] px-4 bg-white hover:bg-[#ECEFE9] border border-[#8E9891] text-[#141916] font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors"
                >
                  <span>Katalog Gerakan</span>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. UNIFIED EDITORIAL 4-COLUMN KPI STRIP                           */}
        {/* ================================================================= */}
        {user.role === "client" && (
          <section
            aria-label="Ringkasan performa minggu ini"
            className="bg-white border border-[#DCE1D8] rounded-2xl grid grid-cols-2 lg:grid-cols-4 overflow-hidden"
          >
            {/* Kepatuhan Minggu Ini */}
            <div className="p-5 border-b lg:border-b-0 border-r border-[#DCE1D8] flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#48524C]">
                  Kepatuhan Minggu Ini
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#141916]">
                    {completionPct}%
                  </span>
                  <span className="text-xs text-[#48524C] font-mono tabular-nums">
                    {completedSessions}/{scheduledSessions} sesi
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Persentase kepatuhan jadwal minggu ini"
                  aria-valuenow={completionPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-2.5 h-1.5 w-full rounded-full bg-[#ECEFE9] overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      completionPct >= 80 ? "bg-[#047857]" : "bg-[#C84B11]"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, completionPct))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Tonase Minggu Ini */}
            <div className="p-5 border-b lg:border-b-0 lg:border-r border-[#DCE1D8] flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#48524C]">
                  Tonase Minggu Ini
                </span>
                <Flame className="w-4 h-4 text-[#A83D0B] shrink-0" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#141916]">
                    {formatWeight(weeklyTonnage)}
                  </span>
                  <span className="text-xs font-semibold text-[#626E67]">
                    kg
                  </span>
                </div>
                <div className="mt-2 text-xs">
                  {tonnageDeltaPct !== null ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono tabular-nums font-semibold ${
                        tonnageDeltaPct >= 0
                          ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                          : "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]"
                      }`}
                    >
                      {tonnageDeltaPct >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {tonnageDeltaPct >= 0 ? "+" : ""}
                      {tonnageDeltaPct}% vs minggu lalu
                    </span>
                  ) : (
                    <span className="text-[#48524C]">
                      Tonase = total beban × repetisi
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Rata-rata RIR */}
            <div className="p-5 border-r border-[#DCE1D8] flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#48524C]">
                  Rata-rata RIR
                </span>
                <Zap className="w-4 h-4 text-[#B45309] shrink-0" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#141916]">
                    {avgRir !== null ? avgRir : "—"}
                  </span>
                  {avgRir !== null && (
                    <span className="text-xs font-semibold text-[#626E67]">
                      RIR
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${rirZone.badgeClass}`}
                  >
                    {rirZone.label}
                  </span>
                  <p className="text-xs text-[#626E67]">
                    RIR = sisa rep sebelum gagal
                  </p>
                </div>
              </div>
            </div>

            {/* Total Set Tercatat */}
            <div className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#48524C]">
                  Total Set Tercatat
                </span>
                <Dumbbell className="w-4 h-4 text-[#48524C] shrink-0" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#141916]">
                    {totalSets}
                  </span>
                  <span className="text-xs font-semibold text-[#626E67]">
                    set
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#48524C] font-mono tabular-nums">
                  {formatWeight(lifetimeVolume)} kg total sepanjang waktu
                </p>
              </div>
            </div>
          </section>
        )}

        {user.role === "trainer" && (
          <section
            aria-label="Ringkasan trainer"
            className="bg-white border border-[#DCE1D8] rounded-2xl grid grid-cols-2 lg:grid-cols-4 overflow-hidden"
          >
            <div className="p-5 border-b lg:border-b-0 border-r border-[#DCE1D8] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Klien Aktif</span>
                <Users className="w-4 h-4 text-[#1D4ED8]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {trainerClients.length}
              </p>
              <p className="text-xs text-[#626E67]">Member dalam bimbingan</p>
            </div>

            <div className="p-5 border-b lg:border-b-0 lg:border-r border-[#DCE1D8] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Permintaan Pending</span>
                <Clock className="w-4 h-4 text-[#B45309]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {pendingRequests.length}
              </p>
              <p className="text-xs text-[#626E67]">Menunggu persetujuan</p>
            </div>

            <div className="p-5 border-r border-[#DCE1D8] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Katalog Gerakan</span>
                <Dumbbell className="w-4 h-4 text-[#047857]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                53+
              </p>
              <p className="text-xs text-[#626E67]">15 sub-bagian otot</p>
            </div>

            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Spesialisasi</span>
                <Award className="w-4 h-4 text-[#A83D0B]" />
              </div>
              <p className="text-base font-bold text-[#141916] truncate pt-1">
                {user.specialization || "Coach Hipertrofi"}
              </p>
              <p className="text-xs text-[#626E67]">Status: Aktif</p>
            </div>
          </section>
        )}

        {user.role === "admin" && (
          <section
            aria-label="Statistik platform"
            className="bg-white border border-[#DCE1D8] rounded-2xl grid grid-cols-2 lg:grid-cols-4 overflow-hidden"
          >
            <div className="p-5 border-b lg:border-b-0 border-r border-[#DCE1D8] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Total Pengguna</span>
                <Users className="w-4 h-4 text-[#141916]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {adminStats?.total_users ?? 0}
              </p>
              <p className="text-xs text-[#626E67]">Semua akun aktif</p>
            </div>

            <div className="p-5 border-b lg:border-b-0 lg:border-r border-[#DCE1D8] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Total Member</span>
                <Award className="w-4 h-4 text-[#047857]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {adminStats?.total_clients ?? 0}
              </p>
              <p className="text-xs text-[#626E67]">Peserta program latihan</p>
            </div>

            <div className="p-5 border-r border-[#DCE1D8] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Total Trainer</span>
                <UserCheck className="w-4 h-4 text-[#1D4ED8]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {adminStats?.total_trainers ?? 0}
              </p>
              <p className="text-xs text-[#626E67]">Personal trainer terdaftar</p>
            </div>

            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Total Log Latihan</span>
                <Activity className="w-4 h-4 text-[#A83D0B]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {adminStats?.total_logs ?? 0}
              </p>
              <p className="text-xs text-[#626E67]">Set tercatat di sistem</p>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* 3. FOCUSED 12-COLUMN EDITORIAL BENTO                              */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN (7 cols): Weekly Rhythm + Insights */}
          <div className="lg:col-span-7 space-y-6">
            {user.role === "client" && (
              <>
                {/* Ritme Minggu Ini */}
                <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-[#141916]">
                        Ritme Minggu Ini
                      </h2>
                      <p className="text-xs text-[#48524C] mt-0.5">
                        {hasPlan && todaySession?.user_plan?.split?.name
                          ? `Split aktif: ${todaySession.user_plan.split.name}`
                          : "Ringkasan jadwal latihan Senin hingga Minggu"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/onboarding"
                        className="min-h-[40px] px-3.5 rounded-xl border border-[#8E9891] bg-[#F5F6F3] hover:bg-[#ECEFE9] text-xs font-semibold text-[#141916] transition-colors inline-flex items-center"
                      >
                        Atur Jadwal
                      </Link>
                      <Link
                        href="/training"
                        className="min-h-[40px] px-3.5 rounded-xl bg-[#FFF1EA] hover:bg-[#F4C4AC]/40 border border-[#F4C4AC] text-xs font-semibold text-[#A83D0B] transition-colors inline-flex items-center gap-1"
                      >
                        <span>Kelola Sesi</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {!hasPlan || weekOverview.length === 0 ? (
                    <div className="p-6 rounded-xl bg-[#F5F6F3] border border-[#DCE1D8] text-center space-y-3">
                      <CalendarRange className="w-8 h-8 text-[#A83D0B] mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#141916]">
                          Belum ada jadwal mingguan aktif
                        </p>
                        <p className="text-xs text-[#48524C] max-w-sm mx-auto">
                          Pilih jumlah hari latihan per minggu (2–6 hari) dan
                          biarkan TrainSmart menyusun split pemulihan optimal.
                        </p>
                      </div>
                      <Link
                        href="/onboarding"
                        className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-[#C84B11] hover:bg-[#A83D0B] text-white text-xs font-semibold transition-colors"
                      >
                        <span>Susun Jadwal Sekarang</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto snap-x gap-2.5 pb-1 sm:grid sm:grid-cols-7 sm:gap-2 sm:overflow-visible sm:pb-0">
                      {weekOverview.map((day) => {
                        const statusMeta =
                          SESSION_STATUS_META[day.status] ||
                          SESSION_STATUS_META.pending;
                        const isToday = day.is_today;

                        let boxStyle =
                          "bg-[#F5F6F3] border-[#DCE1D8] text-[#141916]";
                        if (isToday) {
                          boxStyle =
                            "bg-[#FFF1EA] border-[#C84B11] text-[#141916] ring-1 ring-[#C84B11]/20";
                        } else if (day.status === "done") {
                          boxStyle =
                            "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]";
                        } else if (day.status === "skipped") {
                          boxStyle =
                            "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]";
                        }

                        return (
                          <Link
                            key={day.day_of_week}
                            href="/training"
                            className={`min-w-[112px] sm:min-w-0 snap-start rounded-xl border p-3 flex flex-col justify-between gap-2 transition-colors hover:border-[#C84B11] min-h-[96px] ${boxStyle}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold uppercase tracking-wide">
                                {day.day_short}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dotClass}`}
                              />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold leading-snug line-clamp-2">
                                {day.session_name}
                              </p>
                              <p className="text-xs opacity-85 truncate">
                                {isToday ? "Hari Ini" : statusMeta.label}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sorotan & Saran Minggu Ini */}
                <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-[#141916]">
                      Saran & Evaluasi Progres
                    </h2>
                    <Link
                      href="/evaluation"
                      className="min-h-[40px] px-2 text-xs font-semibold text-[#A83D0B] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Detail Evaluasi</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {hasPlan && todaySession?.split_session?.muscle_groups && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#ECEFE9]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${
                              SESSION_STATUS_META[todaySession.status]
                                .badgeClass
                            }`}
                          >
                            {SESSION_STATUS_META[todaySession.status].label}
                          </span>
                          <span className="text-xs font-semibold text-[#141916]">
                            {todaySession.split_session.name}
                          </span>
                        </div>
                        <p className="text-xs text-[#48524C]">
                          Fokus otot:{" "}
                          {todaySession.split_session.muscle_groups
                            .map((m) => MUSCLE_LABELS[m] || m)
                            .join(", ")}
                        </p>
                      </div>
                      <Link
                        href="/training"
                        className="min-h-[40px] px-3.5 rounded-xl border border-[#8E9891] bg-[#F5F6F3] hover:bg-[#ECEFE9] text-xs font-semibold text-[#141916] inline-flex items-center gap-1"
                      >
                        <span>Atur / Geser</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {weeklyEval?.suggestions &&
                  weeklyEval.suggestions.length > 0 ? (
                    <div className="space-y-2.5">
                      {weeklyEval.suggestions.slice(0, 2).map((item, idx) => {
                        const styleMap = {
                          success: {
                            wrap: "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]",
                            icon: (
                              <Sparkles className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                            ),
                          },
                          warning: {
                            wrap: "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]",
                            icon: (
                              <Zap className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                            ),
                          },
                          info: {
                            wrap: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]",
                            icon: (
                              <Info className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                            ),
                          },
                        }[item.type];

                        return (
                          <div
                            key={`${item.title}-${idx}`}
                            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${styleMap.wrap}`}
                          >
                            <div className="flex items-start gap-2.5">
                              {styleMap.icon}
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold">
                                  {item.title}
                                </p>
                                <p className="text-xs opacity-90 leading-relaxed">
                                  {item.message}
                                </p>
                              </div>
                            </div>
                            {item.action_href && item.action_label && (
                              <Link
                                href={item.action_href}
                                className="text-xs font-semibold underline shrink-0 mt-0.5"
                              >
                                {item.action_label}
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#48524C] leading-relaxed">
                      Catat minimal satu sesi latihan minggu ini untuk menerima
                      analisis beban dan rekomendasi progres otomatis.
                    </p>
                  )}
                </div>
              </>
            )}

            {user.role === "trainer" && (
              <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#141916]">
                      Daftar Klien Aktif
                    </h2>
                    <p className="text-xs text-[#48524C] mt-0.5">
                      Member yang terhubung dengan program bimbingan Anda
                    </p>
                  </div>
                  <Link
                    href="/trainer"
                    className="min-h-[40px] px-3.5 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-xs font-semibold text-[#1D4ED8] transition-colors inline-flex items-center gap-1"
                  >
                    <span>Kelola Semua</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {pendingRequests.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs font-medium">
                      <Clock className="w-4 h-4 text-[#B45309] shrink-0" />
                      <span>
                        Ada <strong>{pendingRequests.length}</strong> permintaan
                        bimbingan baru menunggu konfirmasi.
                      </span>
                    </div>
                    <Link
                      href="/trainer"
                      className="text-xs font-semibold underline shrink-0"
                    >
                      Tinjau
                    </Link>
                  </div>
                )}

                {trainerClients.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#F5F6F3] border border-[#DCE1D8] text-center space-y-2">
                    <Users className="w-8 h-8 text-[#626E67] mx-auto" />
                    <p className="text-sm font-semibold text-[#141916]">
                      Belum ada klien terhubung
                    </p>
                    <p className="text-xs text-[#48524C]">
                      Tambahkan member melalui email di halaman Klien Saya atau
                      terima permintaan bimbingan masuk.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#ECEFE9] border border-[#DCE1D8] rounded-xl overflow-hidden">
                    {trainerClients.slice(0, 5).map((client) => (
                      <Link
                        key={client.id}
                        href="/trainer"
                        className="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-[#F5F6F3] transition-colors min-h-[56px]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(client.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#141916] truncate">
                              {client.name}
                            </p>
                            <p className="text-xs text-[#48524C] truncate">
                              {client.email}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#626E67] shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {user.role === "admin" && (
              <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#141916]">
                      Ringkasan Platform
                    </h2>
                    <p className="text-xs text-[#48524C] mt-0.5">
                      Status master data gerakan dan aktivitas keseluruhan
                    </p>
                  </div>
                  <Link
                    href="/admin"
                    className="min-h-[40px] px-3.5 rounded-xl bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-xs font-semibold text-[#BE123C] transition-colors inline-flex items-center gap-1"
                  >
                    <span>Buka Moderasi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F5F6F3] border border-[#DCE1D8] space-y-1">
                    <span className="text-xs font-semibold text-[#48524C]">
                      Gerakan Terdaftar
                    </span>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[#141916]">
                      {adminStats?.total_exercises ?? 0}
                    </p>
                    <p className="text-xs text-[#626E67]">
                      Gerakan resmi & pengajuan custom
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F5F6F3] border border-[#DCE1D8] space-y-1">
                    <span className="text-xs font-semibold text-[#48524C]">
                      Akumulasi Tonase Global
                    </span>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[#141916]">
                      {formatWeight(adminStats?.total_tonnage_kg ?? 0)} kg
                    </p>
                    <p className="text-xs text-[#626E67]">
                      Total beban yang diangkat member
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (5 cols): Personal Trainer + Recent Set Feed + Custom Exercises */}
          <div className="lg:col-span-5 space-y-6">
            {user.role === "client" && (
              <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#141916]">
                    Personal Trainer
                  </h2>
                  <Link
                    href="/client/trainer"
                    className="min-h-[40px] px-2 text-xs font-semibold text-[#A83D0B] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{assignedTrainer ? "Kelola" : "Cari Trainer"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {assignedTrainer ? (
                  <div className="p-4 rounded-xl bg-[#F5F6F3] border border-[#DCE1D8] flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-[#141916] text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {getInitials(assignedTrainer.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#141916] truncate">
                        {assignedTrainer.name}
                      </p>
                      <p className="text-xs text-[#48524C] truncate">
                        {assignedTrainer.specialization || "Personal Trainer"}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-semibold shrink-0">
                      Aktif
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#F5F6F3] border border-[#DCE1D8] space-y-3">
                    <p className="text-xs text-[#48524C] leading-relaxed">
                      Anda berlatih secara mandiri. Hubungkan akun dengan
                      Personal Trainer jika ingin jadwal dan teknik dipantau
                      langsung.
                    </p>
                    <Link
                      href="/client/trainer"
                      className="inline-flex items-center gap-1.5 min-h-[40px] text-xs font-semibold text-[#A83D0B] hover:underline"
                    >
                      <span>Pilih Personal Trainer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {user.role === "client" && (
              <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#141916]">
                    Aktivitas Set Terbaru
                  </h2>
                  <Link
                    href="/client/progress"
                    className="min-h-[40px] px-2 text-xs font-semibold text-[#A83D0B] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Semua Riwayat</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {recentLogs.length === 0 ? (
                  <p className="text-xs text-[#48524C] py-2">
                    Belum ada catatan set. Mulai sesi latihan untuk merekam
                    beban, repetisi, dan RIR Anda.
                  </p>
                ) : (
                  <div className="divide-y divide-[#ECEFE9]">
                    {recentLogs.slice(0, 4).map((log) => {
                      const zone = getRirZone(log.rir);
                      return (
                        <div
                          key={
                            log.id ??
                            `${log.exercise_id}-${log.set_number}-${log.created_at || ""}`
                          }
                          className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#141916] truncate">
                              {log.exercise?.name || "Gerakan Latihan"}
                            </p>
                            <p className="text-xs text-[#48524C] font-mono tabular-nums">
                              {formatWeight(log.weight)} kg × {log.reps} rep
                              {log.created_at
                                ? ` · ${formatShortDate(log.created_at)}`
                                : ""}
                            </p>
                          </div>
                          {log.rir !== null && log.rir !== undefined && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full border text-xs font-mono tabular-nums font-semibold shrink-0 ${zone.badgeClass}`}
                            >
                              {log.rir} RIR
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Editorial Resource Strip (non-duplicative links) */}
            <div className="border-t border-[#DCE1D8] pt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <Link
                href="/exercises"
                className="font-semibold text-[#141916] hover:text-[#A83D0B] inline-flex items-center gap-1.5 min-h-[40px]"
              >
                <span>Jelajahi 53 Gerakan & Ilustrasi Otot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/my-exercises"
                className="font-semibold text-[#A83D0B] hover:underline inline-flex items-center gap-1 min-h-[40px]"
              >
                <span>Gerakan Custom Saya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
