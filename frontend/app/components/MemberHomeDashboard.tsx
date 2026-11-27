"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Info,
  LayoutGrid,
  Play,
  PlusCircle,
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
  DailySessionStatus,
  TodaySessionResponse,
  User,
  WeeklyEvaluationResponse,
  WorkoutLogEntry,
} from "@/types/workout";
import { MUSCLE_LABELS } from "@/lib/scheduleValidation";

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

function getRirZone(rir: number | null | undefined): {
  label: string;
  badgeClass: string;
} {
  if (rir === null || rir === undefined) {
    return {
      label: "Belum ada data",
      badgeClass: "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]",
    };
  }
  if (rir >= 1 && rir <= 2) {
    return {
      label: "Optimal 1–2",
      badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    };
  }
  if (rir < 1) {
    return {
      label: "Mendekati Gagal",
      badgeClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
    };
  }
  return {
    label: "Terlalu Ringan",
    badgeClass: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  };
}

const SESSION_STATUS_META: Record<
  DailySessionStatus,
  { label: string; pillClass: string }
> = {
  pending: {
    label: "Siap Dijalankan",
    pillClass: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
  },
  done: {
    label: "Selesai",
    pillClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  },
  skipped: {
    label: "Dilewati",
    pillClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
  },
  rest: {
    label: "Pemulihan",
    pillClass: "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]",
  },
};

export default function MemberHomeDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

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
          setTrainerClients(clientsRes);
          setTrainerRequests(requestsRes);
        } else if (user.role === "admin") {
          const statsRes = await getAdminStats();
          if (!active) return;
          setAdminStats(statsRes);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;

  const now = new Date();
  const greeting = getGreetingByHour(now.getHours());
  const firstName = user.name.split(" ")[0] || user.name;
  const formattedDate = formatIndonesianDate(now);

  const roleMeta = {
    client: {
      label: "Member Gym",
      pillClass: "bg-white/10 text-[#E4E8E1] border-white/20",
    },
    trainer: {
      label: "Personal Trainer",
      pillClass: "bg-[#EFF6FF]/15 text-[#BFDBFE] border-[#93C5FD]/30",
    },
    admin: {
      label: "Administrator",
      pillClass: "bg-[#FFF1F2]/15 text-[#FECDD3] border-[#FDA4AF]/30",
    },
  }[user.role];

  if (isLoading) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 animate-pulse">
          <div className="h-56 sm:h-60 rounded-2xl bg-[#252D28]" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-28 rounded-2xl bg-white border border-[#DCE1D8]" />
            <div className="h-28 rounded-2xl bg-white border border-[#DCE1D8]" />
            <div className="h-28 rounded-2xl bg-white border border-[#DCE1D8]" />
            <div className="h-28 rounded-2xl bg-white border border-[#DCE1D8]" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="h-52 rounded-2xl bg-white border border-[#DCE1D8]" />
              <div className="h-44 rounded-2xl bg-white border border-[#DCE1D8]" />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <div className="h-48 rounded-2xl bg-white border border-[#DCE1D8]" />
              <div className="h-48 rounded-2xl bg-white border border-[#DCE1D8]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const todaySession = todayData?.data ?? null;
  const hasPlan = Boolean(todayData?.has_plan);
  const weekOverview = todayData?.week_overview ?? [];
  const pendingRequests = trainerRequests.filter((r) => r.status === "pending");

  // Contextual 1-line summary for hero
  let heroSummary =
    "Pantau jadwal latihan, target beban, dan catatan progres Anda dari satu tempat.";
  if (user.role === "client") {
    if (!hasPlan) {
      heroSummary =
        "Anda belum memiliki jadwal latihan aktif. Susun jadwal mingguan dalam 1 menit sesuai waktu luang Anda.";
    } else if (todaySession?.status === "done") {
      heroSummary = `Sesi ${todaySession.split_session?.name || "hari ini"} telah selesai. Fokus pada hidrasi, protein, dan istirahat berkualitas.`;
    } else if (todaySession?.status === "rest") {
      heroSummary =
        "Hari ini adalah jadwal pemulihan otot (Rest Day). Pertahankan nutrisi agar performa sesi berikutnya maksimal.";
    } else if (todaySession?.status === "skipped") {
      heroSummary =
        "Jadwal hari ini ditandai dilewati. Anda tetap bisa menggeser atau melanjutkan rutinitas di sesi berikutnya.";
    } else if (todaySession) {
      heroSummary = `Jadwal hari ini: ${todaySession.split_session?.name || "Sesi Latihan"} — target intensitas 1–2 RIR dengan teknik penuh.`;
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

  // Quick actions (uniform 2x2 grid)
  const quickActions = [
    {
      href: "/training",
      title: "Dashboard Latihan",
      subtitle: "Sesi hari ini & jadwal",
      icon: <LayoutGrid className="w-4 h-4 text-[#C84B11]" />,
      iconBg: "bg-[#FFF1EA] border-[#F4C4AC]",
    },
    {
      href: "/exercises",
      title: "Katalog Gerakan",
      subtitle: "53+ teknik & ilustrasi otot",
      icon: <BookOpen className="w-4 h-4 text-[#141916]" />,
      iconBg: "bg-[#ECEFE9] border-[#DCE1D8]",
    },
    user.role === "client"
      ? {
          href: "/evaluation",
          title: "Evaluasi Mingguan",
          subtitle: "Kepatuhan & saran beban",
          icon: <BarChart3 className="w-4 h-4 text-[#047857]" />,
          iconBg: "bg-[#ECFDF5] border-[#A7F3D0]",
        }
      : user.role === "trainer"
      ? {
          href: "/trainer",
          title: "Klien Saya",
          subtitle: `${trainerClients.length} member aktif`,
          icon: <Users className="w-4 h-4 text-[#1D4ED8]" />,
          iconBg: "bg-[#EFF6FF] border-[#BFDBFE]",
        }
      : {
          href: "/admin",
          title: "Admin Panel",
          subtitle: "Moderasi & data master",
          icon: <ShieldAlert className="w-4 h-4 text-[#BE123C]" />,
          iconBg: "bg-[#FFF1F2] border-[#FECDD3]",
        },
    {
      href: "/my-exercises",
      title: "Gerakan Custom",
      subtitle: "Ajukan gerakan pribadi",
      icon: <PlusCircle className="w-4 h-4 text-[#B45309]" />,
      iconBg: "bg-[#FFFBEB] border-[#FDE68A]",
    },
  ];

  // Computed client metrics
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* ================================================================= */}
        {/* 1. ARCHITECTURAL GREETING BANNER                                  */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden rounded-2xl bg-[#141916] border border-[#252D28] text-white shadow-sm">
          <Image
            src="/homebg.png"
            alt="Suasana ruang latihan TrainSmart"
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1152px"
            className="object-cover object-center opacity-55"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#141916] via-[#141916]/90 to-[#141916]/45"
            aria-hidden="true"
          />

          <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3.5">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[#E4E8E1] font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#F4C4AC]" />
                  <span>{formattedDate}</span>
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full border font-semibold ${roleMeta.pillClass}`}
                >
                  {roleMeta.label}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                {greeting}, {firstName}
              </h1>

              <p className="text-sm sm:text-base text-[#D1D7CD] leading-relaxed max-w-xl">
                {heroSummary}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {user.role === "client" && (
                <>
                  <Link
                    href="/training"
                    className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <span>Buka Dashboard Latihan</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  {!hasPlan ? (
                    <Link
                      href="/onboarding"
                      className="h-11 px-5 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors backdrop-blur-xs"
                    >
                      <CalendarRange className="w-4 h-4" />
                      <span>Susun Jadwal</span>
                    </Link>
                  ) : (
                    todaySession &&
                    todaySession.status === "pending" && (
                      <Link
                        href={`/session/${todaySession.id}`}
                        className="h-11 px-5 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors backdrop-blur-xs"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Mulai Sesi Sekarang</span>
                      </Link>
                    )
                  )}
                </>
              )}

              {user.role === "trainer" && (
                <>
                  <Link
                    href="/trainer"
                    className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <Users className="w-4 h-4" />
                    <span>Kelola Klien Saya</span>
                  </Link>
                  <Link
                    href="/training"
                    className="h-11 px-5 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors"
                  >
                    <span>Dashboard Latihan</span>
                  </Link>
                </>
              )}

              {user.role === "admin" && (
                <>
                  <Link
                    href="/admin"
                    className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Buka Admin Panel</span>
                  </Link>
                  <Link
                    href="/exercises"
                    className="h-11 px-5 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors"
                  >
                    <span>Katalog Gerakan</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. 4-COLUMN KPI METRICS STRIP                                     */}
        {/* ================================================================= */}
        {user.role === "client" && (
          <section
            aria-label="Ringkasan performa minggu ini"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Kepatuhan Minggu Ini */}
            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 flex flex-col justify-between gap-3">
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
                  <span className="text-xs text-[#626E67] font-mono tabular-nums">
                    {completedSessions}/{scheduledSessions} sesi
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#ECEFE9] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      completionPct >= 80 ? "bg-[#047857]" : "bg-[#C84B11]"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, completionPct))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tonase Minggu Ini */}
            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#48524C]">
                  Tonase Minggu Ini
                </span>
                <Flame className="w-4 h-4 text-[#C84B11] shrink-0" />
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
                <div className="mt-2 flex items-center gap-1.5 text-xs">
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
                    <span className="text-[#626E67]">
                      Akumulasi beban × repetisi
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Rata-rata RIR */}
            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 flex flex-col justify-between gap-3">
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
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${rirZone.badgeClass}`}
                  >
                    {rirZone.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Set Tercatat */}
            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 flex flex-col justify-between gap-3">
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
                <p className="mt-2 text-xs text-[#626E67] font-mono tabular-nums">
                  {formatWeight(lifetimeVolume)} kg total sepanjang waktu
                </p>
              </div>
            </div>
          </section>
        )}

        {user.role === "trainer" && (
          <section
            aria-label="Ringkasan trainer"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Klien Aktif</span>
                <Users className="w-4 h-4 text-[#1D4ED8]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {trainerClients.length}
              </p>
              <p className="text-xs text-[#626E67]">Member dalam bimbingan</p>
            </div>

            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Permintaan Pending</span>
                <Clock className="w-4 h-4 text-[#B45309]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {pendingRequests.length}
              </p>
              <p className="text-xs text-[#626E67]">Menunggu persetujuan</p>
            </div>

            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Katalog Gerakan</span>
                <BookOpen className="w-4 h-4 text-[#047857]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                53+
              </p>
              <p className="text-xs text-[#626E67]">15 sub-bagian otot</p>
            </div>

            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Spesialisasi</span>
                <Award className="w-4 h-4 text-[#C84B11]" />
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
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Total Pengguna</span>
                <Users className="w-4 h-4 text-[#141916]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {adminStats?.total_users ?? 0}
              </p>
              <p className="text-xs text-[#626E67]">Semua akun aktif</p>
            </div>

            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Total Member</span>
                <Award className="w-4 h-4 text-[#047857]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {adminStats?.total_clients ?? 0}
              </p>
              <p className="text-xs text-[#626E67]">Peserta program latihan</p>
            </div>

            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Total Trainer</span>
                <UserCheck className="w-4 h-4 text-[#1D4ED8]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {adminStats?.total_trainers ?? 0}
              </p>
              <p className="text-xs text-[#626E67]">Personal trainer terdaftar</p>
            </div>

            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#48524C]">
                <span>Total Log Latihan</span>
                <Activity className="w-4 h-4 text-[#C84B11]" />
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#141916]">
                {adminStats?.total_logs ?? 0}
              </p>
              <p className="text-xs text-[#626E67]">Set tercatat di sistem</p>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* 3. ASYMMETRIC 12-COLUMN BENTO GRID                                */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {user.role === "client" && (
              <>
                {/* Ritme Minggu Ini Card */}
                <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-[#141916]">
                        Ritme Minggu Ini
                      </h2>
                      <p className="text-xs text-[#626E67] mt-0.5">
                        {hasPlan && todaySession?.user_plan?.split?.name
                          ? `Split aktif: ${todaySession.user_plan.split.name}`
                          : "Ringkasan jadwal latihan Senin hingga Minggu"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/onboarding"
                        className="px-3 py-1.5 rounded-lg border border-[#DCE1D8] bg-[#F5F6F3] hover:bg-[#ECEFE9] text-xs font-semibold text-[#141916] transition-colors"
                      >
                        Atur Jadwal
                      </Link>
                      <Link
                        href="/training"
                        className="px-3 py-1.5 rounded-lg bg-[#FFF1EA] hover:bg-[#F4C4AC]/50 border border-[#F4C4AC] text-xs font-semibold text-[#C84B11] transition-colors inline-flex items-center gap-1"
                      >
                        <span>Buka Latihan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {!hasPlan || weekOverview.length === 0 ? (
                    <div className="p-6 rounded-xl bg-[#F5F6F3] border border-[#DCE1D8] text-center space-y-3">
                      <CalendarRange className="w-8 h-8 text-[#C84B11] mx-auto" />
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
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#C84B11] hover:bg-[#A83D0B] text-white text-xs font-semibold transition-colors"
                      >
                        <span>Susun Jadwal Sekarang</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-2">
                      {weekOverview.map((day) => {
                        const isToday = day.is_today;
                        const isDone = day.status === "done";
                        const isSkipped = day.status === "skipped";
                        const isRest = day.status === "rest";

                        let boxStyle =
                          "bg-[#F5F6F3] border-[#DCE1D8] text-[#141916]";
                        let statusDot = "bg-[#C5CCC0]";
                        let statusText = "Mendatang";

                        if (isToday) {
                          boxStyle =
                            "bg-[#FFF1EA] border-[#C84B11] text-[#141916] ring-1 ring-[#C84B11]/20";
                          statusDot = "bg-[#C84B11]";
                          statusText = "Hari Ini";
                        } else if (isDone) {
                          boxStyle =
                            "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]";
                          statusDot = "bg-[#047857]";
                          statusText = "Selesai";
                        } else if (isSkipped) {
                          boxStyle =
                            "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]";
                          statusDot = "bg-[#BE123C]";
                          statusText = "Dilewati";
                        } else if (isRest) {
                          boxStyle =
                            "bg-[#F5F6F3] border-[#DCE1D8] text-[#626E67]";
                          statusDot = "bg-[#9CA69F]";
                          statusText = "Istirahat";
                        }

                        return (
                          <Link
                            key={day.day_of_week}
                            href="/training"
                            className={`rounded-xl border p-2.5 flex flex-col justify-between gap-2 transition-colors hover:border-[#C84B11] min-h-[92px] ${boxStyle}`}
                            title={`${day.day_short}: ${day.session_name} (${statusText})`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] font-bold uppercase tracking-wide">
                                {day.day_short}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`}
                              />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-semibold leading-tight line-clamp-2">
                                {day.session_name}
                              </p>
                              <p className="text-[10px] opacity-80 truncate">
                                {statusText}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sorotan & Saran Minggu Ini Card */}
                <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-[#141916]">
                      Sorotan & Saran Minggu Ini
                    </h2>
                    <Link
                      href="/evaluation"
                      className="text-xs font-semibold text-[#C84B11] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Detail Evaluasi</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Today's Session Preview */}
                  {hasPlan && todaySession && (
                    <div className="p-4 rounded-xl bg-[#F5F6F3] border border-[#DCE1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${
                              SESSION_STATUS_META[todaySession.status].pillClass
                            }`}
                          >
                            {SESSION_STATUS_META[todaySession.status].label}
                          </span>
                          <span className="text-xs text-[#626E67]">
                            Jadwal Hari Ini
                          </span>
                        </div>
                        <p className="text-base font-bold text-[#141916] truncate">
                          {todaySession.split_session?.name ||
                            (todaySession.status === "rest"
                              ? "Hari Pemulihan Otot"
                              : "Sesi Latihan")}
                        </p>
                        {todaySession.split_session?.muscle_groups &&
                          todaySession.split_session.muscle_groups.length >
                            0 && (
                            <p className="text-xs text-[#48524C] truncate">
                              Target otot:{" "}
                              {todaySession.split_session.muscle_groups
                                .map((m) => MUSCLE_LABELS[m] || m)
                                .join(", ")}
                            </p>
                          )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {todaySession.status === "pending" ? (
                          <Link
                            href={`/session/${todaySession.id}`}
                            className="h-9 px-4 rounded-xl bg-[#C84B11] hover:bg-[#A83D0B] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Mulai Sesi</span>
                          </Link>
                        ) : (
                          <Link
                            href="/training"
                            className="h-9 px-4 rounded-xl bg-white hover:bg-[#ECEFE9] border border-[#C5CCC0] text-[#141916] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span>Lihat Detail</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Weekly Suggestions */}
                  {weeklyEval?.suggestions && weeklyEval.suggestions.length > 0 ? (
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
                                className="text-[11px] font-semibold underline shrink-0 mt-0.5"
                              >
                                {item.action_label}
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#626E67] leading-relaxed">
                      Catat minimal satu sesi latihan minggu ini untuk menerima
                      analisis progres otomatis dari sistem evaluasi.
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
                    <p className="text-xs text-[#626E67] mt-0.5">
                      Member yang terhubung dengan program bimbingan Anda
                    </p>
                  </div>
                  <Link
                    href="/trainer"
                    className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-xs font-semibold text-[#1D4ED8] transition-colors inline-flex items-center gap-1"
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
                        className="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-[#F5F6F3] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(client.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#141916] truncate">
                              {client.name}
                            </p>
                            <p className="text-xs text-[#626E67] truncate">
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
                    <p className="text-xs text-[#626E67] mt-0.5">
                      Status master data gerakan dan aktivitas keseluruhan
                    </p>
                  </div>
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 rounded-lg bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-xs font-semibold text-[#BE123C] transition-colors inline-flex items-center gap-1"
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

          {/* RIGHT COLUMN (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Akses Cepat 2x2 Grid */}
            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#141916]">Akses Cepat</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="p-3.5 rounded-xl border border-[#DCE1D8] bg-[#F5F6F3] hover:bg-white hover:border-[#C84B11] transition-colors flex flex-col gap-2.5 group"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center ${action.iconBg}`}
                    >
                      {action.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#141916] group-hover:text-[#C84B11] transition-colors leading-tight">
                        {action.title}
                      </p>
                      <p className="text-[11px] text-[#626E67] mt-0.5 leading-snug">
                        {action.subtitle}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Personal Trainer Card (for client) */}
            {user.role === "client" && (
              <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#141916]">
                    Personal Trainer
                  </h2>
                  <Link
                    href="/client/trainer"
                    className="text-xs font-semibold text-[#C84B11] hover:underline inline-flex items-center gap-1"
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
                    <span className="px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[11px] font-semibold shrink-0">
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
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C84B11] hover:underline"
                    >
                      <span>Pilih Personal Trainer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Aktivitas Set Terbaru (for client) */}
            {user.role === "client" && (
              <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#141916]">
                    Aktivitas Set Terbaru
                  </h2>
                  <Link
                    href="/client/progress"
                    className="text-xs font-semibold text-[#C84B11] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Semua Riwayat</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {recentLogs.length === 0 ? (
                  <p className="text-xs text-[#626E67] py-2">
                    Belum ada catatan set. Mulai sesi latihan untuk merekam
                    beban, repetisi, dan RIR Anda.
                  </p>
                ) : (
                  <div className="divide-y divide-[#ECEFE9]">
                    {recentLogs.slice(0, 4).map((log) => {
                      const zone = getRirZone(log.rir);
                      return (
                        <div
                          key={log.id ?? `${log.exercise_id}-${log.set_number}-${log.created_at || ""}`}
                          className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#141916] truncate">
                              {log.exercise?.name || "Gerakan Latihan"}
                            </p>
                            <p className="text-xs text-[#626E67] font-mono tabular-nums">
                              {formatWeight(log.weight)} kg × {log.reps} rep
                              {log.created_at
                                ? ` · ${formatShortDate(log.created_at)}`
                                : ""}
                            </p>
                          </div>
                          {log.rir !== null && log.rir !== undefined && (
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[11px] font-mono tabular-nums font-semibold shrink-0 ${zone.badgeClass}`}
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
          </div>
        </section>
      </div>
    </main>
  );
}
