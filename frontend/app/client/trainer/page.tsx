"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Phone,
  Mail,
  Users,
  ArrowLeft,
  X,
  Clock,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createCoachingRequest,
  getClientCoachingRequests,
  getTrainers,
} from "@/lib/api";
import { CoachingRequest, User } from "@/types/workout";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export default function SelectTrainerPage() {
  const { user, chooseTrainer } = useAuth();
  const [trainers, setTrainers] = useState<User[]>([]);
  const [requests, setRequests] = useState<CoachingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [requestMessages, setRequestMessages] = useState<Record<number, string>>(
    {}
  );

  useEffect(() => {
    let active = true;
    Promise.all([getTrainers(), getClientCoachingRequests()]).then(
      ([tData, rData]) => {
        if (!active) return;
        setTrainers(tData);
        setRequests(rData);
        setIsLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const handleUnassign = async () => {
    setIsUpdating(-1);
    const res = await chooseTrainer(null);
    setIsUpdating(null);
    if (res.success) {
      setActionMsg({ type: "success", text: res.message });
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const handleSendRequest = async (trainerId: number) => {
    setIsUpdating(trainerId);
    const res = await createCoachingRequest(
      trainerId,
      requestMessages[trainerId]
    );
    setIsUpdating(null);

    setActionMsg({
      type: res.success ? "success" : "error",
      text: res.message,
    });
    setTimeout(() => setActionMsg(null), 4000);

    if (res.success) {
      const updated = await getClientCoachingRequests();
      setRequests(updated);
    }
  };

  const pendingTrainerIds = new Set(
    requests.filter((r) => r.status === "pending").map((r) => r.trainer_id)
  );

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#48524C] hover:text-[#C84B11] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>

        <div className="mb-8 pb-6 border-b border-[#DCE1D8]">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-[#C84B11]" />
            <span>Pilih Personal Trainer Pendamping</span>
          </h1>
          <p className="text-sm text-[#48524C] mt-1.5 max-w-2xl">
            Ajukan permintaan bimbingan kepada pelatih pilihan Anda. Setelah pelatih menerima permintaan, ia dapat memantau progres dan menyesuaikan status latihan harian Anda.
          </p>
        </div>

        {actionMsg && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2.5 shadow-xs border ${
              actionMsg.type === "success"
                ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]"
                : "bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{actionMsg.text}</span>
          </div>
        )}

        {/* Current Trainer Banner */}
        <div className="mb-8 p-5 sm:p-6 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#626E67] block mb-1">
                Status Bimbingan Saat Ini
              </span>
              {user?.trainer ? (
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold text-[#141916]">
                      {user.trainer.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-semibold">
                      Pelatih Aktif
                    </span>
                  </div>
                  <p className="text-sm text-[#48524C] mt-1">
                    Spesialisasi:{" "}
                    <strong className="font-medium text-[#141916]">
                      {user.trainer.specialization || "General Hypertrophy"}
                    </strong>
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-base font-bold text-[#141916]">
                    Belum Memilih Personal Trainer
                  </h2>
                  <p className="text-sm text-[#48524C] mt-0.5">
                    Anda saat ini berlatih secara mandiri. Kirim permintaan bimbingan ke salah satu pelatih di bawah ini.
                  </p>
                </div>
              )}
            </div>

            {user?.trainer && (
              <button
                type="button"
                onClick={handleUnassign}
                disabled={isUpdating !== null}
                className="h-10 px-4 bg-[#ECEFE9] hover:bg-[#FFF1F2] hover:text-[#BE123C] border border-[#DCE1D8] hover:border-[#FECDD3] text-[#48524C] rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Lepas Trainer</span>
              </button>
            )}
          </div>
        </div>

        {/* Available Trainers Grid */}
        <section aria-labelledby="trainers-list-heading">
          <h2
            id="trainers-list-heading"
            className="text-lg font-bold text-[#141916] mb-4 flex items-center gap-2"
          >
            <Users className="w-5 h-5 text-[#C84B11]" />
            <span>Daftar Pelatih Tersedia</span>
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="p-6 bg-white border border-[#DCE1D8] rounded-2xl animate-pulse space-y-4"
                >
                  <div className="h-12 bg-[#ECEFE9] rounded-xl" />
                  <div className="h-16 bg-[#ECEFE9] rounded-xl" />
                  <div className="h-10 bg-[#ECEFE9] rounded-xl" />
                </div>
              ))}
            </div>
          ) : trainers.length === 0 ? (
            <div className="p-10 text-center bg-white border border-[#DCE1D8] rounded-2xl text-sm text-[#48524C]">
              Belum ada Personal Trainer yang terdaftar di sistem.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {trainers.map((trainer) => {
                const isCurrent = user?.trainer_id === trainer.id;
                const isPending = pendingTrainerIds.has(trainer.id);

                return (
                  <div
                    key={trainer.id}
                    className={`p-6 rounded-2xl border transition-colors flex flex-col justify-between bg-white shadow-xs ${
                      isCurrent
                        ? "border-[#1D4ED8] bg-[#EFF6FF]/40"
                        : "border-[#DCE1D8] hover:border-[#C5CCC0]"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isCurrent
                                ? "bg-[#1D4ED8] text-white"
                                : "bg-[#ECEFE9] text-[#141916]"
                            }`}
                          >
                            {getInitials(trainer.name)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-[#141916] leading-tight">
                              {trainer.name}
                            </h3>
                            <span className="text-xs text-[#626E67] font-mono tabular-nums">
                              {trainer.clients_count || 0} Member aktif
                            </span>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="px-2.5 py-1 rounded-lg bg-[#1D4ED8] text-white font-semibold text-xs shrink-0">
                            Aktif
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] mb-4">
                        <span className="text-xs text-[#626E67] font-medium block mb-0.5">
                          Fokus & Keahlian
                        </span>
                        <p className="text-sm font-semibold text-[#C84B11]">
                          {trainer.specialization ||
                            "Hypertrophy & Progressive Overload"}
                        </p>
                      </div>

                      <div className="text-sm text-[#48524C] space-y-2 mb-5">
                        <div className="flex items-center gap-2.5">
                          <Mail className="w-4 h-4 text-[#626E67] shrink-0" />
                          <span className="truncate">{trainer.email}</span>
                        </div>
                        {trainer.phone && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="w-4 h-4 text-[#626E67] shrink-0" />
                            <span>{trainer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {isCurrent ? (
                        <div className="w-full h-11 bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] font-semibold rounded-xl text-sm flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Trainer Anda Saat Ini</span>
                        </div>
                      ) : isPending ? (
                        <div className="w-full h-11 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] font-semibold rounded-xl text-sm flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Menunggu Persetujuan Trainer</span>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            aria-label={`Pesan singkat untuk ${trainer.name}`}
                            placeholder="Pesan opsional (misal: Ingin fokus hipertrofi 4x/minggu)"
                            value={requestMessages[trainer.id] || ""}
                            onChange={(e) =>
                              setRequestMessages((prev) => ({
                                ...prev,
                                [trainer.id]: e.target.value,
                              }))
                            }
                            className="w-full h-10 px-3 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl text-xs text-[#141916] placeholder:text-[#626E67] outline-none focus:bg-white focus:border-[#C84B11]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendRequest(trainer.id)}
                            disabled={isUpdating === trainer.id}
                            className="w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            <span>
                              {isUpdating === trainer.id
                                ? "Mengirim Permintaan..."
                                : "Ajukan Bimbingan"}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
