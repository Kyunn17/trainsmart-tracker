"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  Flame,
  Layers,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
} from "lucide-react";
import { getAllSplits } from "@/lib/api";
import { RecommendationLevel, Split } from "@/types/workout";
import {
  MAJOR_MUSCLE_KEYS,
  MUSCLE_LABELS,
  WEEKDAYS,
  computeMuscleFrequencyFromSessions,
} from "@/lib/scheduleValidation";
import SplitAnatomyDiagram from "@/app/components/SplitAnatomyDiagram";

const DAY_FILTERS: Array<{ value: number | "all"; label: string }> = [
  { value: "all", label: "Semua Hari" },
  { value: 2, label: "2 Hari" },
  { value: 3, label: "3 Hari" },
  { value: 4, label: "4 Hari" },
  { value: 5, label: "5 Hari" },
  { value: 6, label: "6 Hari" },
];

const LEVEL_FILTERS: Array<{ value: RecommendationLevel | "all"; label: string }> = [
  { value: "all", label: "Semua Level" },
  { value: "recommended", label: "Direkomendasikan" },
  { value: "alternative", label: "Alternatif" },
  { value: "not_recommended", label: "Kurang Direkomendasikan" },
];

const LEVEL_META: Record<
  RecommendationLevel,
  { label: string; badgeClass: string; dotClass: string }
> = {
  recommended: {
    label: "Direkomendasikan",
    badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    dotClass: "bg-[#047857]",
  },
  alternative: {
    label: "Alternatif",
    badgeClass: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    dotClass: "bg-[#1D4ED8]",
  },
  not_recommended: {
    label: "Kurang Direkomendasikan",
    badgeClass: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    dotClass: "bg-[#B45309]",
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

export default function SplitsDashboardPage() {
  const [splits, setSplits] = useState<Split[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [dayFilter, setDayFilter] = useState<number | "all">("all");
  const [levelFilter, setLevelFilter] = useState<RecommendationLevel | "all">(
    "all"
  );
  const [selectedSplitId, setSelectedSplitId] = useState<number | null>(null);
  // "all" shows combined muscle regions for the full week; numeric index inspects a specific session
  const [activeSessionKey, setActiveSessionKey] = useState<number | "all">(0);

  const fetchCatalog = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await getAllSplits();
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || "Gagal memuat katalog program split.");
      return;
    }

    setSplits(res.data);
    if (res.data.length > 0) {
      const defaultPick =
        res.data.find((s) => s.slug === "upper-lower") ||
        res.data.find((s) => s.recommendation_level === "recommended") ||
        res.data[0];
      setSelectedSplitId(defaultPick.id);
      setActiveSessionKey(0);
    }
  };

  useEffect(() => {
    let active = true;
    getAllSplits().then((res) => {
      if (!active) return;
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message || "Gagal memuat katalog program split.");
        return;
      }
      setSplits(res.data);
      if (res.data.length > 0) {
        const defaultPick =
          res.data.find((s) => s.slug === "upper-lower") ||
          res.data.find((s) => s.recommendation_level === "recommended") ||
          res.data[0];
        setSelectedSplitId(defaultPick.id);
        setActiveSessionKey(0);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredSplits = useMemo(() => {
    return splits.filter((split) => {
      const days = split.days_per_week ?? split.max_days;
      const level = split.recommendation_level || "recommended";
      if (dayFilter !== "all" && days !== dayFilter) return false;
      if (levelFilter !== "all" && level !== levelFilter) return false;
      return true;
    });
  }, [splits, dayFilter, levelFilter]);

  const activeSplit = useMemo(() => {
    if (filteredSplits.length === 0) return null;
    return (
      filteredSplits.find((s) => s.id === selectedSplitId) || filteredSplits[0]
    );
  }, [filteredSplits, selectedSplitId]);

  const orderedSessions = useMemo(() => {
    if (!activeSplit?.sessions) return [];
    return [...activeSplit.sessions].sort((a, b) => a.sort_order - b.sort_order);
  }, [activeSplit]);

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

  const handleSelectSplit = (split: Split) => {
    setSelectedSplitId(split.id);
    setActiveSessionKey(0);
  };

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Editorial Header */}
        <header className="pb-5 border-b border-[#DCE1D8] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight">
              Panduan & Peta Otot Program Split
            </h1>
            <p className="text-sm sm:text-base text-[#48524C] mt-1.5 leading-relaxed">
              Pelajari struktur setiap split latihan, urutan sesinya, serta
              visualisasi anatomi otot yang dilatih pada tiap hari sebelum
              memasukkannya ke jadwal mingguan Anda.
            </p>
          </div>

          <Link
            href="/onboarding"
            className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center justify-center gap-2 transition-colors self-start lg:self-auto shrink-0 shadow-xs"
          >
            <CalendarRange className="w-4 h-4" />
            <span>Susun Jadwal di Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </header>

        {/* Filter Bar */}
        <section
          aria-label="Filter katalog split"
          className="bg-white border border-[#DCE1D8] rounded-2xl p-4 shadow-xs space-y-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            {DAY_FILTERS.map((f) => {
              const isActive = dayFilter === f.value;
              return (
                <button
                  key={String(f.value)}
                  type="button"
                  onClick={() => setDayFilter(f.value)}
                  className={`h-11 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#141916] text-white border-[#141916]"
                      : "bg-[#F5F6F3] text-[#48524C] border-[#DCE1D8] hover:text-[#141916]"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DCE1D8]">
            <div className="flex flex-wrap items-center gap-2">
              {LEVEL_FILTERS.map((lf) => {
                const isActive = levelFilter === lf.value;
                return (
                  <button
                    key={lf.value}
                    type="button"
                    onClick={() => setLevelFilter(lf.value)}
                    className={`h-11 px-3.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#FFF1EA] text-[#A83D0B] border-[#F4C4AC]"
                        : "bg-white text-[#48524C] border-[#DCE1D8] hover:text-[#141916]"
                    }`}
                  >
                    {lf.label}
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-mono tabular-nums text-[#626E67]">
              Menampilkan {filteredSplits.length} dari {splits.length} program
            </span>
          </div>
        </section>

        {/* Loading / Error / Empty / Main Master-Detail */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white border border-[#DCE1D8] rounded-2xl p-4 animate-pulse"
                />
              ))}
            </div>
            <div className="lg:col-span-7 h-[560px] bg-white border border-[#DCE1D8] rounded-2xl p-6 animate-pulse" />
          </div>
        ) : errorMsg ? (
          <div
            role="alert"
            className="bg-white border border-[#FECDD3] rounded-2xl p-8 text-center space-y-4"
          >
            <AlertCircle className="w-8 h-8 text-[#BE123C] mx-auto" />
            <p className="text-sm font-medium text-[#BE123C]">{errorMsg}</p>
            <button
              type="button"
              onClick={fetchCatalog}
              className="h-11 px-5 rounded-xl bg-[#141916] hover:bg-[#48524C] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Coba Muat Ulang</span>
            </button>
          </div>
        ) : filteredSplits.length === 0 || !activeSplit ? (
          <div className="bg-white border border-[#DCE1D8] rounded-2xl p-10 text-center space-y-3">
            <Layers className="w-8 h-8 text-[#626E67] mx-auto" />
            <h2 className="text-base font-bold text-[#141916]">
              Tidak ada split yang cocok dengan filter
            </h2>
            <p className="text-xs sm:text-sm text-[#48524C]">
              Coba ubah filter jumlah hari atau tingkat rekomendasi untuk
              melihat seluruh katalog.
            </p>
            <button
              type="button"
              onClick={() => {
                setDayFilter("all");
                setLevelFilter("all");
              }}
              className="h-11 px-5 rounded-xl bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] text-xs font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: SPLIT CATALOG LIST */}
            <aside
              aria-label="Daftar program split"
              className="lg:col-span-5 space-y-2.5"
            >
              {filteredSplits.map((split) => {
                const isSelected = split.id === activeSplit.id;
                const lvl = split.recommendation_level || "recommended";
                const meta = LEVEL_META[lvl];
                const days = split.days_per_week ?? split.max_days;
                const sessions = [...(split.sessions || [])].sort(
                  (a, b) => a.sort_order - b.sort_order
                );

                return (
                  <button
                    key={split.id}
                    type="button"
                    onClick={() => handleSelectSplit(split)}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? "bg-white border-[#C84B11] ring-2 ring-[#C84B11]/15 shadow-xs"
                        : "bg-white border-[#DCE1D8] hover:border-[#C5CCC0]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs font-mono tabular-nums font-bold text-[#141916] bg-[#ECEFE9] px-2.5 py-0.5 rounded-md border border-[#DCE1D8]">
                        {days} Hari/Mgg
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-[#141916] leading-snug">
                        {split.name}
                      </h2>
                      <p className="text-xs text-[#48524C] line-clamp-2 mt-0.5 leading-relaxed">
                        {split.description}
                      </p>
                    </div>

                    {sessions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {sessions.map((s) => (
                          <span
                            key={s.id}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F5F6F3] text-[#48524C] border border-[#DCE1D8]"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </aside>

            {/* RIGHT COLUMN: INTERACTIVE SPLIT DETAIL + SVG ANATOMY VISUAL */}
            <section
              aria-label={`Detail split ${activeSplit.name}`}
              className="lg:col-span-7 bg-white border border-[#DCE1D8] rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 lg:sticky lg:top-6"
            >
              {/* Split Title & Meta */}
              <div className="space-y-2.5 pb-5 border-b border-[#DCE1D8]">
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const lvl =
                      activeSplit.recommendation_level || "recommended";
                    return (
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${LEVEL_META[lvl].badgeClass}`}
                      >
                        {LEVEL_META[lvl].label}
                      </span>
                    );
                  })()}
                  <span className="text-xs font-mono tabular-nums font-semibold px-2.5 py-0.5 rounded-md bg-[#ECEFE9] text-[#141916] border border-[#DCE1D8]">
                    {activeSplit.days_per_week ?? activeSplit.max_days} Hari /
                    Minggu
                  </span>
                  {activeSplit.recommendation_level === "recommended" && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#FFF1EA] text-[#A83D0B] border border-[#F4C4AC] inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Rekomendasi Utama
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-[#141916] tracking-tight">
                  {activeSplit.name}
                </h2>
                <p className="text-sm text-[#48524C] leading-relaxed">
                  {activeSplit.description}
                </p>

                {activeSplit.recommendation_level === "not_recommended" && (
                  <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#141916] space-y-1">
                    <span className="font-bold text-[#B45309] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Catatan Jujur untuk Pemula</span>
                    </span>
                    <p className="text-[#48524C] leading-relaxed">
                      {activeSplit.not_recommended_reason ||
                        "Setiap kelompok otot hanya dilatih 1× per minggu sehingga progres bagi pemula biasanya lebih lambat."}
                    </p>
                  </div>
                )}
              </div>

              {/* Interactive Session Tabs + Dual SVG Anatomy Map */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#141916]">
                      Peta Otot Target per Sesi
                    </h3>
                    <p className="text-xs text-[#48524C]">
                      Klik sesi di bawah untuk melihat otot depan & belakang
                      yang aktif pada hari tersebut.
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
                      ? `${activeSplit.name} - ${inspectedSession.name}`
                      : `${activeSplit.name} - Total 1 Minggu`
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
                    const freq = getSplitFrequency(activeSplit)[muscle] || 0;
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

              {/* Pros, Cons & Suitable For */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-[#047857] flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Kelebihan</span>
                  </span>
                  <ul className="space-y-1 text-xs text-[#141916] list-disc list-inside leading-relaxed">
                    {activeSplit.pros.map((pro, i) => (
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
                    {activeSplit.cons.map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#48524C] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    <span>Cocok Untuk</span>
                  </span>
                  <p className="text-xs sm:text-sm text-[#141916] leading-relaxed">
                    {activeSplit.suitable_for}
                  </p>
                </div>

                <Link
                  href="/onboarding"
                  className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                  <span>Terapkan Split Ini</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
