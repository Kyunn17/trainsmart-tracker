import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, ShieldCheck } from "lucide-react";

export default function CreditsPage() {
  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-5">
          <Link
            href="/exercises"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#48524C] hover:text-[#C84B11] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Perpustakaan Gerakan</span>
          </Link>
        </div>

        <div className="bg-white border border-[#DCE1D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#141916] tracking-tight">
                Lisensi & Atribusi Dataset Gerakan
              </h1>
              <p className="text-sm text-[#48524C] mt-1">
                Transparansi sumber data dan foto demonstrasi gerakan yang digunakan di TrainSmart.
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#141916] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C84B11]" />
                <span>free-exercise-db</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                The Unlicense (Public Domain)
              </span>
            </div>

            <p className="text-sm text-[#48524C] leading-relaxed">
              Seluruh metadata gerakan (nama gerakan, target otot, peralatan, langkah instruksi) dan foto posisi awal/akhir disimpan secara lokal dari repositori sumber terbuka{" "}
              <strong className="text-[#141916]">yuhonas/free-exercise-db</strong>. Dataset ini dirilis di bawah lisensi{" "}
              <strong className="text-[#141916]">The Unlicense</strong> (dedikasi domain publik) yang mengizinkan penyalinan, modifikasi, dan penyimpanan lokal tanpa ketergantungan host eksternal.
            </p>

            <a
              href="https://github.com/yuhonas/free-exercise-db"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C84B11] hover:underline"
            >
              <span>Kunjungi repositori yuhonas/free-exercise-db</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
