"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarRange,
  Eye,
  Layers,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { getAllSplits } from "@/lib/api";
import { RecommendationLevel, Split } from "@/types/workout";
import SplitDetailModal from "@/app/components/SplitDetailModal";

const DAY_FILTERS: Array<{ value: number | "all"; label: string }> = [
  { value: "all", label: "Semua Hari" },
  { value: 2, label: "2 Hari" },
  { value: 3, label: "3 Hari" },
  { value: 4, label: "4 Hari" },
  { value: 5, label: "5 Hari" },
  { value: 6, label: "6 Hari" },
];

const LEVEL_FILTERS: Array<{
  value: RecommendationLevel | "all";
  label: string;
}> = [
  { value: "all", label: "Semua Level" },
  { value: "recommended", label: "Direkomendasikan" },
  { value: "alternative", label: "Alternatif" },
  { value: "not_recommended", label: "Kurang Direkomendasikan" },
];

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

export default function SplitsDashboardPage() {
  const [splits, setSplits] = useState<Split[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [dayFilter, setDayFilter] = useState<number | "all">("all");
  const [levelFilter, setLevelFilter] = useState<RecommendationLevel | "all">(
    "all"
  );
  const [modalSplit, setModalSplit] = useState<Split | null>(null);

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

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Editorial Header */}
        <header className="pb-5 border-b border-[#DCE1D8] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight">
              Panduan & Katalog Program Split
            </h1>
            <p className="text-sm sm:text-base text-[#48524C] mt-1.5 leading-relaxed">
              Pilih kartu split di bawah untuk membuka pop-up penjelasan lengkap
              beserta peta otot SVG interaktif untuk setiap sesinya.
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

        {/* Loading / Error / Empty / Clean Card Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-52 bg-white border border-[#DCE1D8] rounded-2xl p-5 animate-pulse space-y-3"
              >
                <div className="h-5 w-28 bg-[#ECEFE9] rounded" />
                <div className="h-6 w-44 bg-[#ECEFE9] rounded" />
                <div className="h-12 bg-[#ECEFE9] rounded" />
              </div>
            ))}
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
        ) : filteredSplits.length === 0 ? (
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
          <section
            aria-label="Katalog program split"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredSplits.map((split) => {
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
                  onClick={() => setModalSplit(split)}
                  className="text-left bg-white border border-[#DCE1D8] hover:border-[#C84B11] rounded-2xl p-5 shadow-xs transition-all cursor-pointer group flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1 ${meta.badgeClass}`}
                      >
                        {lvl === "recommended" && (
                          <Sparkles className="w-3 h-3 shrink-0" />
                        )}
                        {meta.label}
                      </span>
                      <span className="text-xs font-mono tabular-nums font-bold text-[#141916] bg-[#ECEFE9] px-2.5 py-0.5 rounded-md border border-[#DCE1D8]">
                        {days} Hari/Mgg
                      </span>
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-[#141916] group-hover:text-[#C84B11] transition-colors leading-snug">
                        {split.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#48524C] line-clamp-2 mt-1 leading-relaxed">
                        {split.description}
                      </p>
                    </div>

                    {sessions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {sessions.map((s, idx) => (
                          <span
                            key={s.id}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F5F6F3] text-[#48524C] border border-[#DCE1D8]"
                          >
                            <span className="font-mono tabular-nums text-[#626E67] mr-1">
                              {idx + 1}.
                            </span>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#DCE1D8] flex items-center justify-between text-xs font-semibold text-[#C84B11]">
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      Lihat Penjelasan & Peta Otot
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </section>
        )}
      </div>

      {/* Dedicated Split Explanation & SVG Anatomy Pop-Up Modal */}
      <SplitDetailModal
        split={modalSplit}
        onClose={() => setModalSplit(null)}
      />
    </main>
  );
}
