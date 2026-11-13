"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Users, 
  Dumbbell, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Sparkles,
  Award,
  ArrowLeft 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  getAdminStats, 
  getAdminUsers, 
  updateAdminUser, 
  deleteAdminUser, 
  getTrainers 
} from "@/lib/api";
import { User, UserRole } from "@/types/workout";

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allTrainers, setAllTrainers] = useState<User[]>([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = async (roleFilter?: string) => {
    setIsLoading(true);
    const [sData, uData, tData] = await Promise.all([
      getAdminStats(),
      getAdminUsers(roleFilter === "all" ? undefined : roleFilter),
      getTrainers(),
    ]);
    setStats(sData);
    setUsers(uData);
    setAllTrainers(tData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData(selectedRoleFilter);
  }, [selectedRoleFilter]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    const res = await updateAdminUser(userId, { role: newRole });
    if (res.success) {
      showToast(res.message);
      loadData(selectedRoleFilter);
    }
  };

  const handleTrainerChange = async (userId: number, trainerId: number | null) => {
    const res = await updateAdminUser(userId, { trainer_id: trainerId });
    if (res.success) {
      showToast("Personal Trainer klien berhasil dialihkan.");
      loadData(selectedRoleFilter);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Yakin ingin menghapus akun ${userName}? Data latihan terkait akan ikut terhapus.`)) return;
    const res = await deleteAdminUser(userId);
    if (res.success) {
      showToast(res.message);
      loadData(selectedRoleFilter);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Akses Terbatas: Khusus Admin</h1>
          <p className="text-zinc-400 text-xs mb-6">
            Halaman ini hanya dapat diakses oleh Administrator utama. Anda saat ini login sebagai{" "}
            <strong className="text-white uppercase">{user?.role || "Tamu"}</strong>.
          </p>
          <Link
            href="/"
            className="inline-block w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-8 relative">
      <div className="max-w-6xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-rose-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-rose-400" />
            <span>{toast}</span>
          </div>
        )}

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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 font-mono text-xs uppercase tracking-widest mb-1 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>Full Control Management Center</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Admin Master Panel</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Kelola seluruh pengguna, alihkan peran, hubungkan trainer & pantau metrik ekosistem TrainSmart.
            </p>
          </div>
        </div>

        {/* System Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Total Pengguna</span>
              <span className="text-2xl font-black text-white font-mono">{stats.total_users}</span>
            </div>
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
              <span className="text-[10px] uppercase font-mono text-blue-400 block mb-1">Trainer (PT)</span>
              <span className="text-2xl font-black text-blue-400 font-mono">{stats.total_trainers}</span>
            </div>
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
              <span className="text-[10px] uppercase font-mono text-emerald-400 block mb-1">Member (Klien)</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{stats.total_clients}</span>
            </div>
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
              <span className="text-[10px] uppercase font-mono text-amber-400 block mb-1">Total Set Masuk</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{stats.total_logs}</span>
            </div>
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-mono text-rose-400 block mb-1">Total Tonase</span>
              <span className="text-2xl font-black text-rose-400 font-mono">
                {stats.total_tonnage_kg.toLocaleString()} <span className="text-xs">kg</span>
              </span>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-zinc-800 gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-rose-400" />
                <span>Manajemen Hak Akses & Peran Pengguna</span>
              </h2>
              <span className="text-xs text-zinc-400">
                Ubah peran user secara langsung atau atur relasi antara Personal Trainer dan Klien.
              </span>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 self-start sm:self-auto">
              {["all", "client", "trainer", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRoleFilter(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    selectedRoleFilter === r
                      ? "bg-zinc-800 text-white font-bold"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-10 text-center text-zinc-500 text-xs">Memuat data pengguna...</div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 text-xs">Tidak ada data pengguna.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-mono text-[10px]">
                    <th className="pb-3 px-2">Nama & Email</th>
                    <th className="pb-3 px-2">Peran (Role)</th>
                    <th className="pb-3 px-2">Personal Trainer Pendamping</th>
                    <th className="pb-3 px-2 text-center">Set Latihan</th>
                    <th className="pb-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {users.map((u) => {
                    const isSelf = u.id === user.id;

                    return (
                      <tr key={u.id} className="hover:bg-zinc-950/40 transition-colors">
                        <td className="py-3 px-2">
                          <span className="font-bold text-white block">{u.name}</span>
                          <span className="text-[11px] text-zinc-400">{u.email}</span>
                          {u.specialization && (
                            <span className="text-[10px] text-blue-400 block mt-0.5">
                              ⭐ {u.specialization}
                            </span>
                          )}
                        </td>

                        {/* Role Dropdown */}
                        <td className="py-3 px-2">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            disabled={isSelf}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs uppercase font-mono outline-none border transition-colors ${
                              u.role === "admin"
                                ? "bg-rose-950/60 border-rose-500/40 text-rose-300"
                                : u.role === "trainer"
                                ? "bg-blue-950/60 border-blue-500/40 text-blue-300"
                                : "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                            } ${isSelf ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <option value="client">Client</option>
                            <option value="trainer">Trainer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        {/* Trainer Assignment (Only for Client) */}
                        <td className="py-3 px-2">
                          {u.role === "client" ? (
                            <select
                              value={u.trainer_id ?? ""}
                              onChange={(e) =>
                                handleTrainerChange(
                                  u.id,
                                  e.target.value ? parseInt(e.target.value) : null
                                )
                              }
                              className="px-2 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-200 outline-none focus:border-amber-400"
                            >
                              <option value="">-- Tanpa Trainer --</option>
                              {allTrainers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          ) : u.role === "trainer" ? (
                            <span className="text-zinc-500 text-[11px]">
                              Membimbing {u.clients?.length || 0} klien
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Workout logs count */}
                        <td className="py-3 px-2 text-center font-mono text-zinc-300">
                          {u.workout_logs_count || 0}
                        </td>

                        {/* Delete Action */}
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            disabled={isSelf}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-20"
                            title={isSelf ? "Tidak bisa menghapus diri sendiri" : "Hapus Pengguna"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
