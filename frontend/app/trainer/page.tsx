"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  TrendingUp,
  Trash2,
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  StickyNote,
  CalendarClock,
  Check,
  Inbox,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getTrainerClients,
  addTrainerClient,
  removeTrainerClient,
  getClientProgress,
  getTrainerCoachingRequests,
  respondCoachingRequest,
  getTrainerClientToday,
  overrideTrainerClientDailySession,
} from "@/lib/api";
import {
  User,
  ClientProgressResponse,
  WorkoutLogEntry,
  CoachingRequest,
  TrainerClientTodayResponse,
  DailySessionStatus,
} from "@/types/workout";

export default function TrainerDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [clients, setClients] = useState<User[]>([]);
  const [requests, setRequests] = useState<CoachingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const [newClientEmail, setNewClientEmail] = useState("");
  const [addMsg, setAddMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Client Progress Modal
  const [selectedClientProgress, setSelectedClientProgress] =
    useState<ClientProgressResponse | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Client Today Schedule & Override Modal
  const [todayModal, setTodayModal] =
    useState<TrainerClientTodayResponse | null>(null);
  const [isLoadingToday, setIsLoadingToday] = useState(false);
  const [overrideStatus, setOverrideStatus] =
    useState<DailySessionStatus>("rest");
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideDate, setOverrideDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [overrideMsg, setOverrideMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  const refreshAll = async () => {
    setIsLoading(true);
    const [cData, rData] = await Promise.all([
      getTrainerClients(),
      getTrainerCoachingRequests(),
    ]);
    setClients(cData);
    setRequests(rData);
    setIsLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "trainer" && user.role !== "admin") {
      return;
    }
    let active = true;
    Promise.all([getTrainerClients(), getTrainerCoachingRequests()]).then(
      ([cData, rData]) => {
        if (!active) return;
        setClients(cData);
        setRequests(rData);
        setIsLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedClientProgress || isLoadingProgress) {
        setSelectedClientProgress(null);
        setIsLoadingProgress(false);
      }
      if (todayModal || isLoadingToday) {
        setTodayModal(null);
        setIsLoadingToday(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedClientProgress, isLoadingProgress, todayModal, isLoadingToday]);

  const handleRespondRequest = async (
    requestId: number,
    decision: "accepted" | "rejected"
  ) => {
    setRespondingId(requestId);
    const res = await respondCoachingRequest(requestId, decision);
    setRespondingId(null);
    if (res.success) {
      await refreshAll();
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg(null);
    if (!newClientEmail.trim()) return;

    setIsAdding(true);
    const res = await addTrainerClient(newClientEmail.trim());
    setIsAdding(false);

    if (res.success) {
      setAddMsg({ type: "success", text: res.message });
      setNewClientEmail("");
      refreshAll();
    } else {
      setAddMsg({ type: "error", text: res.message });
    }
  };

  const handleRemoveClient = async (clientId: number, clientName: string) => {
    if (!confirm(`Lepas ${clientName} dari daftar bimbingan Anda?`)) return;
    const res = await removeTrainerClient(clientId);
    if (res.success) {
      refreshAll();
    }
  };

  const handleViewProgress = async (clientId: number) => {
    setIsLoadingProgress(true);
    const res = await getClientProgress(clientId);
    setSelectedClientProgress(res);
    setIsLoadingProgress(false);
  };

  const handleOpenTodayModal = async (clientId: number) => {
    setIsLoadingToday(true);
    setOverrideMsg(null);
    const res = await getTrainerClientToday(clientId);
    setTodayModal(res);
    if (res?.data) {
      setOverrideStatus(res.data.status);
      setOverrideNote(res.data.trainer_note || "");
      setOverrideDate(res.data.session_date);
    } else {
      setOverrideStatus("rest");
      setOverrideNote("");
      setOverrideDate(new Date().toISOString().slice(0, 10));
    }
    setIsLoadingToday(false);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayModal) return;
    setOverrideMsg(null);
    setIsSavingOverride(true);

    const res = await overrideTrainerClientDailySession(
      todayModal.client.id,
      overrideDate,
      overrideStatus,
      overrideNote
    );

    setIsSavingOverride(false);

    if (!res.success) {
      setOverrideMsg({ type: "error", text: res.message });
      return;
    }

    setOverrideMsg({ type: "success", text: res.message });
    const refreshed = await getTrainerClientToday(todayModal.client.id);
    if (refreshed) setTodayModal(refreshed);
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  if (!authLoading && user && user.role !== "trainer" && user.role !== "admin") {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-white border border-[#DCE1D8] rounded-2xl text-center shadow-xs">
          <h1 className="text-xl font-bold text-[#141916] mb-2">
            Akses Terbatas: Khusus Trainer
          </h1>
          <p className="text-[#48524C] text-sm mb-6">
            Halaman ini hanya tersedia untuk akun Personal Trainer atau Admin.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white rounded-xl text-sm font-semibold"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#DCE1D8] gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-[#1D4ED8]" />
              <span>Klien Bimbingan {user?.name || "Personal Trainer"}</span>
            </h1>
            <p className="text-sm text-[#48524C] mt-1.5">
              Kelola permintaan bimbingan masuk, pantau progres, dan sesuaikan status latihan harian klien.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {pendingRequests.length > 0 && (
              <span className="px-3.5 py-2 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-mono tabular-nums font-semibold rounded-xl">
                {pendingRequests.length} Permintaan Baru
              </span>
            )}
            <span className="px-3.5 py-2 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-mono tabular-nums font-semibold rounded-xl">
              {clients.length} Klien Aktif
            </span>
          </div>
        </div>

        {/* Incoming Coaching Requests */}
        {pendingRequests.length > 0 && (
          <section
            aria-labelledby="incoming-requests-heading"
            className="p-6 bg-white border border-[#FDE68A] rounded-2xl shadow-xs space-y-4"
          >
            <h2
              id="incoming-requests-heading"
              className="text-base font-bold text-[#141916] flex items-center gap-2"
            >
              <Inbox className="w-5 h-5 text-[#B45309]" />
              <span>Permintaan Bimbingan Masuk ({pendingRequests.length})</span>
            </h2>

            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-bold text-sm text-[#141916]">
                      {req.client?.name || `Klien #${req.client_id}`}
                    </p>
                    <p className="text-xs text-[#626E67]">
                      {req.client?.email}
                      {req.client?.phone ? ` • ${req.client.phone}` : ""}
                    </p>
                    {req.message && (
                      <p className="text-xs text-[#48524C] mt-1.5 bg-white border border-[#DCE1D8] px-3 py-1.5 rounded-lg inline-block">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRespondRequest(req.id, "accepted")}
                      disabled={respondingId === req.id}
                      className="h-10 px-4 bg-[#047857] hover:bg-[#065F46] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Terima</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespondRequest(req.id, "rejected")}
                      disabled={respondingId === req.id}
                      className="h-10 px-4 bg-white hover:bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Add Client Form Card */}
        <div className="p-6 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
          <h2 className="text-base font-bold text-[#141916] mb-1 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#1D4ED8]" />
            <span>Tambah Klien Langsung ke Roster</span>
          </h2>
          <p className="text-sm text-[#48524C] mb-4">
            Masukkan alamat email member yang sudah terdaftar di TrainSmart untuk menghubungkan akun mereka.
          </p>

          {addMsg && (
            <div
              role="status"
              className={`mb-4 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                addMsg.type === "success"
                  ? "bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857]"
                  : "bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C]"
              }`}
            >
              {addMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{addMsg.text}</span>
            </div>
          )}

          <form
            onSubmit={handleAddClient}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <input
              type="email"
              aria-label="Email klien"
              placeholder="Masukkan email klien (misal: budi@trainsmart.com)..."
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              className="flex-1 h-11 px-4 bg-[#F5F6F3] border border-[#DCE1D8] focus:bg-white focus:border-[#1D4ED8] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none transition-colors"
              required
            />
            <button
              type="submit"
              disabled={isAdding}
              className="h-11 px-6 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isAdding ? "Menghubungkan..." : "Hubungkan Klien"}</span>
            </button>
          </form>
        </div>

        {/* Client Roster Grid */}
        <section aria-labelledby="client-roster-heading">
          <h2
            id="client-roster-heading"
            className="text-lg font-bold text-[#141916] mb-4 flex items-center gap-2"
          >
            <Award className="w-5 h-5 text-[#C84B11]" />
            <span>Daftar Klien Anda</span>
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="p-5 bg-white border border-[#DCE1D8] rounded-2xl animate-pulse space-y-4"
                >
                  <div className="h-5 w-40 bg-[#ECEFE9] rounded" />
                  <div className="h-16 bg-[#ECEFE9] rounded-xl" />
                  <div className="h-10 bg-[#ECEFE9] rounded-xl" />
                </div>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="p-10 text-center bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#ECEFE9] text-[#48524C] flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#141916] mb-1">
                Belum Ada Klien Terdaftar
              </h3>
              <p className="text-sm text-[#48524C] max-w-md mx-auto">
                Tambahkan klien melalui email di atas atau terima permintaan bimbingan dari member.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map((client) => {
                const latestLog = client.workout_logs?.[0];
                return (
                  <div
                    key={client.id}
                    className="p-5 bg-white border border-[#DCE1D8] rounded-2xl hover:border-[#C5CCC0] transition-colors flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="font-bold text-[#141916] text-lg truncate">
                          {client.name}
                        </h3>
                        <span className="text-xs font-mono tabular-nums font-semibold px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] shrink-0">
                          {client.workout_logs_count || 0} Set
                        </span>
                      </div>

                      <div className="text-sm text-[#48524C] space-y-1.5 mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[#626E67] shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-[#626E67] shrink-0" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>

                      {latestLog ? (
                        <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] mb-4 text-sm">
                          <span className="text-xs font-medium text-[#626E67] block mb-1">
                            Aktivitas Terakhir
                          </span>
                          <span className="font-semibold text-[#141916] block">
                            {latestLog.exercise?.name || "Latihan"}
                          </span>
                          <span className="text-[#C84B11] font-mono tabular-nums font-semibold text-xs block mt-0.5">
                            {latestLog.weight} kg × {latestLog.reps} reps (RIR{" "}
                            {latestLog.rir})
                          </span>
                          {latestLog.notes && (
                            <p className="text-xs text-[#48524C] mt-1.5 flex items-center gap-1.5 truncate">
                              <StickyNote className="w-3.5 h-3.5 text-[#C84B11] shrink-0" />
                              <span className="truncate">{latestLog.notes}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] mb-4 text-xs text-[#626E67]">
                          Belum ada catatan latihan yang masuk.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#DCE1D8]">
                      <button
                        type="button"
                        onClick={() => handleOpenTodayModal(client.id)}
                        className="flex-1 h-10 px-3 bg-[#FFF1EA] hover:bg-[#F4C4AC]/50 border border-[#F4C4AC] text-[#C84B11] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CalendarClock className="w-4 h-4" />
                        <span>Jadwal Hari Ini</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewProgress(client.id)}
                        className="flex-1 h-10 px-3 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Progres</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveClient(client.id, client.name)
                        }
                        className="h-10 w-10 flex items-center justify-center text-[#626E67] hover:text-[#BE123C] hover:bg-[#FFF1F2] border border-[#DCE1D8] hover:border-[#FECDD3] rounded-xl transition-colors cursor-pointer"
                        aria-label={`Lepas ${client.name}`}
                        title="Lepas Klien"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Client Today Schedule & Trainer Override Modal */}
        {(isLoadingToday || todayModal) && (
          <div
            className="fixed inset-0 bg-[#141916]/65 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trainer-today-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setTodayModal(null);
                setIsLoadingToday(false);
              }
            }}
          >
            <div className="bg-white border border-[#DCE1D8] p-6 sm:p-7 rounded-2xl max-w-lg w-full shadow-xl relative space-y-5">
              <button
                type="button"
                onClick={() => {
                  setTodayModal(null);
                  setIsLoadingToday(false);
                }}
                className="absolute top-4 right-4 h-9 w-9 text-[#48524C] hover:text-[#141916] rounded-xl bg-[#ECEFE9] hover:bg-[#DCE1D8] flex items-center justify-center cursor-pointer"
                aria-label="Tutup modal jadwal hari ini"
              >
                <X className="w-4 h-4" />
              </button>

              {isLoadingToday ? (
                <div className="space-y-3 py-6 animate-pulse">
                  <div className="h-6 w-48 bg-[#ECEFE9] rounded" />
                  <div className="h-24 bg-[#ECEFE9] rounded-xl" />
                </div>
              ) : (
                todayModal && (
                  <>
                    <div className="pr-8">
                      <h3
                        id="trainer-today-modal-title"
                        className="text-xl font-bold text-[#141916]"
                      >
                        Jadwal Hari Ini: {todayModal.client.name}
                      </h3>
                      <p className="text-sm text-[#48524C] mt-1">
                        {todayModal.has_plan
                          ? `Program: ${todayModal.split_name || "-"} • Sesi: ${
                              todayModal.data?.split_session?.name ||
                              "Hari Istirahat"
                            }`
                          : "Klien belum menyusun jadwal latihan mingguan."}
                      </p>
                    </div>

                    {overrideMsg && (
                      <div
                        role="status"
                        className={`p-3 rounded-xl text-xs font-medium border ${
                          overrideMsg.type === "success"
                            ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]"
                            : "bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]"
                        }`}
                      >
                        {overrideMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleSaveOverride} className="space-y-4">
                      <div>
                        <label
                          htmlFor="override-status"
                          className="block text-sm font-semibold text-[#141916] mb-1.5"
                        >
                          Ubah Status Hari Ini
                        </label>
                        <select
                          id="override-status"
                          value={overrideStatus}
                          onChange={(e) =>
                            setOverrideStatus(
                              e.target.value as DailySessionStatus
                            )
                          }
                          className="w-full h-11 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] outline-none focus:border-[#1D4ED8]"
                        >
                          <option value="rest">Istirahat (Rest)</option>
                          <option value="skipped">Lewati (Skipped)</option>
                          <option value="pending">
                            Belum Selesai (Pending)
                          </option>
                          <option value="done">Selesai (Done)</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="override-note"
                          className="block text-sm font-semibold text-[#141916] mb-1.5"
                        >
                          Catatan Alasan untuk Klien (Wajib)
                        </label>
                        <textarea
                          id="override-note"
                          rows={3}
                          placeholder="Contoh: Istirahat hari ini untuk pemulihan bahu, lanjut besok dengan beban ringan."
                          value={overrideNote}
                          onChange={(e) => setOverrideNote(e.target.value)}
                          className="w-full p-3 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none focus:border-[#1D4ED8]"
                          required
                        />
                        <p className="text-xs text-[#626E67] mt-1">
                          Status yang diubah Trainer akan mengunci status klien pada tanggal ini dan menampilkan catatan Anda di dashboard mereka.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingOverride}
                        className="w-full h-11 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 text-white font-semibold rounded-xl text-sm cursor-pointer"
                      >
                        {isSavingOverride
                          ? "Menyimpan Perubahan..."
                          : "Simpan Status & Catatan Trainer"}
                      </button>
                    </form>
                  </>
                )
              )}
            </div>
          </div>
        )}

        {/* Client Progress Modal */}
        {(isLoadingProgress || selectedClientProgress) && (
          <div
            className="fixed inset-0 bg-[#141916]/65 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-progress-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedClientProgress(null);
                setIsLoadingProgress(false);
              }
            }}
          >
            <div className="bg-white border border-[#DCE1D8] p-6 sm:p-7 rounded-2xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto relative">
              <button
                type="button"
                onClick={() => {
                  setSelectedClientProgress(null);
                  setIsLoadingProgress(false);
                }}
                className="absolute top-4 right-4 h-9 w-9 text-[#48524C] hover:text-[#141916] rounded-xl bg-[#ECEFE9] hover:bg-[#DCE1D8] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup analisis progres"
              >
                <X className="w-4 h-4" />
              </button>

              {isLoadingProgress ? (
                <div className="space-y-4 py-4 animate-pulse" aria-busy="true">
                  <div className="h-6 w-56 bg-[#ECEFE9] rounded" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-20 bg-[#ECEFE9] rounded-xl" />
                    <div className="h-20 bg-[#ECEFE9] rounded-xl" />
                    <div className="h-20 bg-[#ECEFE9] rounded-xl" />
                  </div>
                  <div className="h-40 bg-[#ECEFE9] rounded-xl" />
                </div>
              ) : (
                selectedClientProgress && (
                  <>
                    <div className="mb-6 pr-8">
                      <h3
                        id="client-progress-modal-title"
                        className="text-2xl font-bold text-[#141916]"
                      >
                        Progres Latihan: {selectedClientProgress.client.name}
                      </h3>
                      <p className="text-sm text-[#48524C] mt-1">
                        Evaluasi volume angkatan dan intensitas RIR untuk menjaga progres hipertrofi.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] text-center">
                        <span className="text-xs text-[#626E67] block mb-1">
                          Total Set
                        </span>
                        <span className="text-xl font-bold font-mono tabular-nums text-[#C84B11]">
                          {selectedClientProgress.summary.total_sets}
                        </span>
                      </div>
                      <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] text-center">
                        <span className="text-xs text-[#626E67] block mb-1">
                          Total Volume
                        </span>
                        <span className="text-xl font-bold font-mono tabular-nums text-[#047857]">
                          {selectedClientProgress.summary.total_volume_kg.toLocaleString()}{" "}
                          kg
                        </span>
                      </div>
                      <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] text-center">
                        <span className="text-xs text-[#626E67] block mb-1">
                          Rata-rata RIR
                        </span>
                        <span className="text-xl font-bold font-mono tabular-nums text-[#1D4ED8]">
                          {selectedClientProgress.summary.average_rir ?? "-"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#626E67] mb-3">
                        Riwayat Eksekusi Set & Catatan Form
                      </h4>

                      {selectedClientProgress.data.length === 0 ? (
                        <div className="p-6 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl text-sm text-[#48524C] text-center">
                          Klien belum melakukan pencatatan latihan.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                          {selectedClientProgress.data.map(
                            (log: WorkoutLogEntry) => (
                              <div
                                key={log.id}
                                className="p-3.5 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl text-sm flex items-center justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-[#141916]">
                                      {log.exercise?.name ||
                                        `Gerakan #${log.exercise_id}`}
                                    </span>
                                    <span className="text-xs text-[#C84B11] font-mono tabular-nums font-semibold bg-[#FFF1EA] border border-[#F4C4AC] px-2 py-0.5 rounded-md">
                                      Set {log.set_number}
                                    </span>
                                  </div>
                                  {log.notes && (
                                    <p className="text-[#48524C] text-xs mt-1 flex items-center gap-1.5">
                                      <StickyNote className="w-3.5 h-3.5 text-[#C84B11] shrink-0" />
                                      <span>{log.notes}</span>
                                    </p>
                                  )}
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-mono tabular-nums font-bold text-[#047857] text-sm block">
                                    {log.weight} kg × {log.reps} reps
                                  </span>
                                  <span className="text-xs text-[#626E67] font-mono tabular-nums">
                                    RIR: {log.rir ?? "-"}{" "}
                                    {log.rpe ? `• RPE: ${log.rpe}` : ""}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
