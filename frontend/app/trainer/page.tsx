"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Trash2, 
  Award, 
  Dumbbell, 
  Flame, 
  CheckCircle2, 
  AlertCircle,
  X,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  getTrainerClients, 
  addTrainerClient, 
  removeTrainerClient, 
  getClientProgress 
} from "@/lib/api";
import { User, ClientProgressResponse } from "@/types/workout";

export default function TrainerDashboard() {
  const { user } = useAuth();
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add client modal / state
  const [newClientEmail, setNewClientEmail] = useState("");
  const [addMsg, setAddMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Client progress inspection modal
  const [selectedClientProgress, setSelectedClientProgress] = useState<ClientProgressResponse | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  const loadClients = async () => {
    setIsLoading(true);
    const data = await getTrainerClients();
    setClients(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

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
      loadClients();
    } else {
      setAddMsg({ type: "error", text: res.message });
    }
  };

  const handleRemoveClient = async (clientId: number, clientName: string) => {
    if (!confirm(`Lepas ${clientName} dari daftar bimbingan Anda?`)) return;
    const res = await removeTrainerClient(clientId);
    if (res.success) {
      loadClients();
    }
  };

  const handleViewProgress = async (clientId: number) => {
    setIsLoadingProgress(true);
    const res = await getClientProgress(clientId);
    setSelectedClientProgress(res);
    setIsLoadingProgress(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-8 relative">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-zinc-800 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 font-mono text-xs uppercase tracking-widest mb-1 font-bold">
              <Users className="w-4 h-4" />
              <span>Trainer Portal • Roster Management</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Klien Bimbingan {user?.name || "Personal Trainer"}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Pantau progres latihan, beban angkatan, dan kepatuhan hipertrofi setiap klien Anda.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold rounded-full">
              {clients.length} Klien Aktif
            </span>
          </div>
        </div>

        {/* Add Client Form Card */}
        <div className="mb-8 p-6 bg-gradient-to-r from-zinc-900/90 to-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-md">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span>Tambah Klien Baru ke Roster Anda</span>
          </h2>
          <p className="text-xs text-zinc-400 mb-4">
            Masukkan alamat email member yang sudah terdaftar di TrainSmart untuk menghubungkan mereka dengan akun Anda.
          </p>

          {addMsg && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                addMsg.type === "success"
                  ? "bg-emerald-950/50 border border-emerald-500/50 text-emerald-300"
                  : "bg-red-950/50 border border-red-500/50 text-red-300"
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

          <form onSubmit={handleAddClient} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              placeholder="Masukkan email klien (misal: budi@trainsmart.com)..."
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none focus:border-blue-400"
              required
            />
            <button
              type="submit"
              disabled={isAdding}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isAdding ? "Menghubungkan..." : "Hubungkan Klien"}</span>
            </button>
          </form>
        </div>

        {/* Client Roster Grid */}
        <div>
          <h2 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Daftar Klien Anda</span>
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 text-xs">Memuat data klien...</div>
          ) : clients.length === 0 ? (
            <div className="p-10 text-center bg-zinc-900/40 border border-zinc-800 rounded-3xl">
              <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">Belum Ada Klien Terdaftar</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Tambahkan klien pertama Anda menggunakan form email di atas, atau minta klien memilih Anda di menu akun mereka.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map((client) => {
                const latestLog = client.workout_logs?.[0];
                return (
                  <div
                    key={client.id}
                    className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-base">{client.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {client.workout_logs_count || 0} Set Dicatat
                        </span>
                      </div>

                      <div className="text-xs text-zinc-400 space-y-1 mb-4">
                        <p>📧 {client.email}</p>
                        {client.phone && <p>📱 {client.phone}</p>}
                      </div>

                      {latestLog ? (
                        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 mb-4 text-xs">
                          <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">
                            Aktivitas Terakhir:
                          </span>
                          <span className="font-semibold text-zinc-200">
                            {latestLog.exercise?.name || "Latihan"}
                          </span>
                          <span className="text-amber-400 font-mono block mt-0.5">
                            {latestLog.weight} kg × {latestLog.reps} reps (RIR {latestLog.rir})
                          </span>
                          {latestLog.notes && (
                            <p className="text-zinc-500 italic mt-1 truncate">"{latestLog.notes}"</p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 mb-4 text-xs text-zinc-500 italic">
                          Belum ada catatan latihan yang masuk.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pt-3 border-t border-zinc-800">
                      <button
                        onClick={() => handleViewProgress(client.id)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Lihat Analisis Progres</span>
                      </button>

                      <button
                        onClick={() => handleRemoveClient(client.id, client.name)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors"
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
        </div>

        {/* Client Progress Modal */}
        {selectedClientProgress && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setSelectedClientProgress(null)}
                className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-6">
                <span className="text-xs text-blue-400 font-mono font-bold uppercase">
                  Progressive Overload Report
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  Progres Latihan: {selectedClientProgress.client.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Evaluasi volume angkatan dan intensitas RIR untuk menjaga hipertrofi tetap progresif.
                </p>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center">
                  <span className="text-[11px] text-zinc-400 block mb-1">Total Set Selesai</span>
                  <span className="text-xl font-bold text-amber-400">
                    {selectedClientProgress.summary.total_sets}
                  </span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center">
                  <span className="text-[11px] text-zinc-400 block mb-1">Total Volume Angkatan</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {selectedClientProgress.summary.total_volume_kg.toLocaleString()} kg
                  </span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center">
                  <span className="text-[11px] text-zinc-400 block mb-1">Rata-Rata RIR</span>
                  <span className="text-xl font-bold text-blue-400">
                    {selectedClientProgress.summary.average_rir ?? "-"}
                  </span>
                </div>
              </div>

              {/* Set-by-set Log Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Riwayat Eksekusi Set & Catatan Form
                </h4>

                {selectedClientProgress.data.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic text-center py-6">
                    Klien belum melakukan pencatatan latihan.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {selectedClientProgress.data.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white">
                              {log.exercise?.name || `Gerakan #${log.exercise_id}`}
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded-md">
                              Set {log.set_number}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-zinc-400 italic text-[11px] mt-1">
                              📝 "{log.notes}"
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {log.weight} kg × {log.reps} reps
                          </span>
                          <span className="block text-[10px] text-zinc-400 font-mono">
                            RIR: {log.rir ?? "-"} {log.rpe ? `• RPE: ${log.rpe}` : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
