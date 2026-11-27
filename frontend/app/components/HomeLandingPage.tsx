"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Dumbbell,
  Flame,
  LogIn,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { getTrainers } from "@/lib/api";
import { User } from "@/types/workout";

const FEATURES = [
  {
    icon: CalendarRange,
    title: "Rekomendasi Split & Jadwal Drag-and-Drop",
    description:
      "Cukup pilih berapa hari Anda sempat ke gym (2–6 hari/minggu). TrainSmart merekomendasikan split terbaik lengkap dengan peringatan pemulihan otot otomatis.",
  },
  {
    icon: BookOpen,
    title: "53 Gerakan Terkurasi + Gerakan Custom",
    description:
      "Pelajari teknik dasar dari 15 sub-bagian otot dengan ilustrasi target otot, langkah eksekusi, dan kesalahan umum. Anda juga bisa mengajukan gerakan pribadi.",
  },
  {
    icon: Flame,
    title: "Pencatat Set Live, RIR & Timer Istirahat",
    description:
      "Catat beban (kg), repetisi, dan RIR (Reps In Reserve) langsung saat latihan dengan penghitung tonase otomatis dan timer istirahat terintegrasi.",
  },
  {
    icon: CalendarClock,
    title: "Geser Jadwal Fleksibel & Evaluasi Mingguan",
    description:
      "Sedang sakit atau lembur? Geser jadwal ke hari lain tanpa dianggap bolos, lalu pantau evaluasi mingguan dan saran progres yang objektif.",
  },
];

const PURPOSES = [
  "Menghilangkan kebingungan pemula saat pertama kali masuk gym tanpa harus menebak jadwal sendiri.",
  "Mendorong progres jangka panjang yang terukur melalui prinsip progressive overload dan panduan 1–2 RIR.",
  "Menghubungkan member dengan Personal Trainer agar evaluasi teknik dan kepatuhan jadwal lebih terarah.",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function HomeLandingPage() {
  const [trainers, setTrainers] = useState<User[]>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(true);

  useEffect(() => {
    let active = true;
    getTrainers()
      .then((list) => {
        if (active) setTrainers(list);
      })
      .finally(() => {
        if (active) setIsLoadingTrainers(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      {/* ================================================================= */}
      {/* 1. FULL-BLEED ARCHITECTURAL HERO WITH /homebg.png                 */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden border-b border-[#DCE1D8] bg-[#141916]">
        <div className="relative min-h-[540px] lg:min-h-[600px] flex items-center">
          <Image
            src="/homebg.png"
            alt="Suasana ruang latihan gym modern TrainSmart"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Directional dark slate scrim for strong legibility */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#141916]/92 via-[#141916]/75 to-[#141916]/30"
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 sm:pt-32 sm:pb-20">
            <div className="max-w-2xl space-y-6">
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12]">
                Latihan Gym Lebih Terarah, Terukur, dan Ramah Pemula.
              </h1>

              <p className="text-base sm:text-lg text-[#E4E8E1] leading-relaxed max-w-xl">
                <strong className="font-semibold text-white">TrainSmart</strong>{" "}
                adalah panduan latihan & pencatat hipertrofi berbahasa Indonesia
                yang membantu Anda menyusun jadwal mingguan, memahami teknik
                gerakan secara visual, dan memantau progres bersama Personal
                Trainer.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="h-12 px-6 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm sm:text-base inline-flex items-center gap-2 transition-colors shadow-sm"
                >
                  <span>Mulai Susun Jadwal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold rounded-xl text-sm sm:text-base inline-flex items-center gap-2 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Akun</span>
                </Link>
              </div>

              {/* Compact Trust Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15 max-w-lg">
                <div>
                  <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white block">
                    53
                  </span>
                  <span className="text-xs text-[#D1D7CD]">
                    Gerakan Terkurasi
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white block">
                    2–6
                  </span>
                  <span className="text-xs text-[#D1D7CD]">
                    Hari Split Fleksibel
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white block">
                    1–2
                  </span>
                  <span className="text-xs text-[#D1D7CD]">
                    Target RIR Hipertrofi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. TENTANG TRAINSMART & TUJUAN WEBSITE                            */}
      {/* ================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 border-b border-[#DCE1D8]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141916] flex items-center gap-2.5">
              <Target className="w-6 h-6 text-[#C84B11] shrink-0" />
              <span>Apa itu TrainSmart?</span>
            </h2>
            <p className="text-sm sm:text-base text-[#48524C] leading-relaxed">
              Banyak pemula berhenti ke gym di bulan pertama bukan karena malas,
              melainkan karena bingung harus melatih otot apa, gerakan mana yang
              aman, dan apakah latihan mereka benar-benar berkembang.
            </p>
            <p className="text-sm sm:text-base text-[#48524C] leading-relaxed">
              TrainSmart hadir sebagai pendamping latihan harian yang
              menggabungkan perencanaan jadwal cerdas, edukasi gerakan visual,
              dan evaluasi beban dalam satu tempat.
            </p>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#DCE1D8] rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#141916] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#047857]" />
              <span>Tujuan Utama Platform Kami</span>
            </h3>
            <ul className="space-y-3.5">
              {PURPOSES.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-[#48524C] leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C84B11] hover:underline"
              >
                <span>Daftar & Akses Perpustakaan 53 Gerakan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. FITUR UNGGULAN                                                 */}
      {/* ================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 border-b border-[#DCE1D8]">
        <div className="max-w-2xl mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141916] flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#C84B11] shrink-0" />
            <span>Fitur yang Membantu Anda Konsisten</span>
          </h2>
          <p className="text-sm sm:text-base text-[#48524C]">
            Dirancang sederhana agar mudah dipakai langsung di tengah sesi
            latihan gym tanpa mengganggu fokus Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white border border-[#DCE1D8] rounded-2xl p-6 shadow-xs flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-[#FFF1EA] border border-[#F4C4AC] text-[#C84B11] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#141916]">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-[#48524C] leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. PERSONAL TRAINER TERDAFTAR                                     */}
      {/* ================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 border-b border-[#DCE1D8]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141916] flex items-center gap-2.5">
              <Award className="w-6 h-6 text-[#C84B11] shrink-0" />
              <span>Personal Trainer Kami</span>
            </h2>
            <p className="text-sm sm:text-base text-[#48524C]">
              Butuh bimbingan langsung? Setelah mendaftar sebagai Member, Anda
              dapat mengajukan bimbingan ke salah satu Personal Trainer resmi
              kami.
            </p>
          </div>
          <Link
            href="/register"
            className="text-sm font-semibold text-[#C84B11] hover:underline inline-flex items-center gap-1.5 shrink-0"
          >
            <span>Daftar & Pilih Trainer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoadingTrainers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 bg-white border border-[#DCE1D8] rounded-2xl p-5"
              />
            ))}
          </div>
        ) : trainers.length === 0 ? (
          <div className="bg-white border border-[#DCE1D8] rounded-2xl p-8 text-center text-sm text-[#48524C]">
            Daftar Personal Trainer akan segera tersedia. Anda tetap dapat
            memulai latihan mandiri sekarang.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trainers.map((trainer) => (
              <div
                key={trainer.id}
                className="bg-white border border-[#DCE1D8] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#141916] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {getInitials(trainer.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[#141916] truncate">
                      {trainer.name}
                    </h3>
                    <p className="text-xs font-medium text-[#C84B11] mt-0.5">
                      {trainer.specialization || "Personal Trainer Bersertifikat"}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DCE1D8] flex items-center justify-between text-xs text-[#48524C]">
                  <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                    <Users className="w-3.5 h-3.5 text-[#626E67]" />
                    {trainer.clients_count || 0} Klien Aktif
                  </span>
                  <Link
                    href="/register"
                    className="font-semibold text-[#141916] hover:text-[#C84B11] inline-flex items-center gap-1"
                  >
                    <span>Ajukan Bimbingan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 5. CLOSING CTA & FOOTER                                           */}
      {/* ================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-[#141916] text-white rounded-2xl p-7 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Siap Memulai Jadwal Latihan Pertama Anda?
            </h2>
            <p className="text-sm sm:text-base text-[#D1D7CD]">
              Buat akun gratis dalam 1 menit, pilih hari latihan Anda, dan ikuti
              panduan sesi hari ini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/register"
              className="h-12 px-6 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors"
            >
              <Dumbbell className="w-4 h-4" />
              <span>Daftar Gratis</span>
            </Link>
            <Link
              href="/login"
              className="h-12 px-5 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold rounded-xl text-sm inline-flex items-center gap-2 transition-colors"
            >
              <span>Masuk</span>
            </Link>
          </div>
        </div>

        <footer className="mt-10 pt-6 border-t border-[#DCE1D8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#626E67]">
          <div className="flex items-center gap-2.5 font-semibold text-[#141916]">
            <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 shadow-xs">
              <Image
                src="/icon.png"
                alt="TrainSmart"
                width={24}
                height={24}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <span>TrainSmart</span>
          </div>
          <p>Panduan Latihan Gym & Pencatat Hipertrofi Indonesia.</p>
        </footer>
      </section>
    </main>
  );
}
