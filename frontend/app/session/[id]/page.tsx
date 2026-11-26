"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Dumbbell } from "lucide-react";
import { getDailySessionById } from "@/lib/api";
import { Category, DailySession } from "@/types/workout";
import WorkoutPlanner from "@/app/components/WorkoutPlanner";

export default function DailySessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [session, setSession] = useState<DailySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDailySessionById(id)
      .then((res) => {
        if (!active) return;
        setSession(res);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916] p-6">
        <div className="max-w-5xl mx-auto space-y-5 animate-pulse">
          <div className="h-5 w-40 bg-[#ECEFE9] rounded" />
          <div className="h-28 bg-white border border-[#DCE1D8] rounded-2xl" />
          <div className="h-64 bg-white border border-[#DCE1D8] rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#DCE1D8] rounded-2xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#141916] mb-2">
            Sesi Latihan Tidak Ditemukan
          </h1>
          <p className="text-sm text-[#48524C] mb-6">
            Sesi harian tidak tersedia atau Anda belum masuk dengan akun yang sesuai.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white rounded-xl text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </main>
    );
  }

  if (!session.split_session) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#DCE1D8] rounded-2xl p-8 text-center shadow-xs">
          <h1 className="text-xl font-bold text-[#141916] mb-2">
            Hari Ini Adalah Hari Istirahat
          </h1>
          <p className="text-sm text-[#48524C] mb-6">
            Tidak ada sesi latihan yang dijadwalkan untuk tanggal{" "}
            <span className="font-mono tabular-nums">{session.session_date}</span>.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white rounded-xl text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </main>
    );
  }

  const categoryPayload: Category = {
    id: session.split_session.id,
    name: session.split_session.name,
    exercises: session.split_session.exercises || [],
  };

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#48524C] hover:text-[#C84B11] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <span className="text-xs px-3 py-1 rounded-lg bg-white border border-[#DCE1D8] text-[#626E67] font-mono tabular-nums font-medium">
            {session.session_date}
          </span>
        </div>

        <div className="mb-7 p-6 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight">
              {session.split_session.name}
            </h1>
            <p className="text-sm text-[#48524C] mt-1 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#C84B11] shrink-0" />
              <span>
                Program:{" "}
                <strong className="text-[#141916]">
                  {session.user_plan?.split?.name || "Jadwal Pribadi"}
                </strong>
              </span>
            </p>
          </div>

          <div className="bg-[#ECEFE9] border border-[#DCE1D8] px-4 py-2.5 rounded-xl flex items-center gap-4 self-start sm:self-auto">
            <div>
              <span className="block text-xs text-[#626E67]">Gerakan</span>
              <span className="text-lg font-bold font-mono tabular-nums text-[#141916]">
                {categoryPayload.exercises.length}
              </span>
            </div>
            <div className="w-px h-7 bg-[#C5CCC0]" />
            <div>
              <span className="block text-xs text-[#626E67]">Target RIR</span>
              <span className="text-lg font-bold font-mono tabular-nums text-[#C84B11]">
                1–2
              </span>
            </div>
          </div>
        </div>

        <WorkoutPlanner
          initialCategory={categoryPayload}
          dailySessionId={session.id}
          backHref="/"
        />
      </div>
    </main>
  );
}
