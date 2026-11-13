"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Award, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft,
  X 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getTrainers } from "@/lib/api";
import { User } from "@/types/workout";

export default function SelectTrainerPage() {
  const { user, chooseTrainer } = useAuth();
  const [trainers, setTrainers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  useEffect(() => {
    getTrainers().then((data) => {
      setTrainers(data);
      setIsLoading(false);
    });
  }, []);

  const handleSelect = async (trainerId: number | null) => {
    setIsUpdating(trainerId ?? -1);
    const res = await chooseTrainer(trainerId);
    setIsUpdating(null);
    if (res.success) {
      setActionMsg(res.message);
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-8 relative">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs uppercase tracking-widest mb-1 font-bold">
            <Award className="w-4 h-4" />
            <span>Personal Trainer Directory</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Pilih Personal Trainer Pendamping
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Tingkatkan hasil latihan Anda dengan bimbingan pelatih profesional. Pelatih yang Anda pilih akan dapat memantau progres beban, repetisi, dan RIR Anda secara langsung.
          </p>
        </div>

        {actionMsg && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs flex items-center space-x-2 shadow-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="font-semibold">{actionMsg}</span>
          </div>
        )}

        {/* Current Trainer Banner */}
        <div className="mb-10 p-6 bg-gradient-to-r from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-3xl relative overflow-hidden backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                Status Bimbingan Saat Ini
              </span>
              {user?.trainer ? (
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>{user.trainer.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">
                      Pelatih Aktif Anda
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Spesialisasi: {user.trainer.specialization || "General Hypertrophy"}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-base font-bold text-zinc-300">
                    Belum Memilih Personal Trainer
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Anda saat ini berlatih secara mandiri. Pilih salah satu trainer bersertifikasi di bawah untuk evaluasi progres berkala.
                  </p>
                </div>
              )}
            </div>

            {user?.trainer && (
              <button
                onClick={() => handleSelect(null)}
                disabled={isUpdating !== null}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 self-start sm:self-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Lepas Trainer</span>
              </button>
            )}
          </div>
        </div>

        {/* Available Trainers Grid */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Daftar Pelatih Tersedia</span>
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 text-xs">Memuat daftar trainer...</div>
          ) : trainers.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              Belum ada Personal Trainer yang terdaftar di sistem.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainers.map((trainer) => {
                const isCurrent = user?.trainer_id === trainer.id;

                return (
                  <div
                    key={trainer.id}
                    className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                      isCurrent
                        ? "bg-blue-950/20 border-blue-500/50 shadow-xl shadow-blue-500/5"
                        : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg text-white">{trainer.name}</span>
                        {isCurrent && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-zinc-950 font-bold text-[10px] font-mono">
                            DIPILIH
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80 mb-4">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-0.5">
                          Fokus & Keahlian:
                        </span>
                        <p className="text-xs font-semibold text-amber-400">
                          {trainer.specialization || "Hypertrophy & Progressive Overload"}
                        </p>
                      </div>

                      <div className="text-xs text-zinc-400 space-y-1.5 mb-6">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{trainer.email}</span>
                        </div>
                        {trainer.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{trainer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{trainer.clients_count || 0} Member sedang dibimbing</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <div className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Trainer Anda Saat Ini</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelect(trainer.id)}
                          disabled={isUpdating === trainer.id}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
                        >
                          {isUpdating === trainer.id
                            ? "Memproses..."
                            : user?.trainer
                            ? "Ganti ke Trainer Ini"
                            : "Pilih Sebagai Trainer Saya"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
