"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  Trash2,
  CheckCircle2,
  Award,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  getTrainers,
} from "@/lib/api";
import { User, UserRole } from "@/types/workout";

interface AdminStats {
  total_users: number;
  total_trainers: number;
  total_clients: number;
  total_logs: number;
  total_exercises: number;
  total_tonnage_kg: number;
}

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
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
    let active = true;
    const roleParam = selectedRoleFilter === "all" ? undefined : selectedRoleFilter;
    Promise.all([
      getAdminStats(),
      getAdminUsers(roleParam),
      getTrainers(),
    ]).then(([sData, uData, tData]) => {
      if (!active) return;
      setStats(sData);
      setUsers(uData);
      setAllTrainers(tData);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
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

  const handleTrainerChange = async (
    userId: number,
    trainerId: number | null
  ) => {
    const res = await updateAdminUser(userId, { trainer_id: trainerId });
    if (res.success) {
      showToast("Personal Trainer klien berhasil dialihkan.");
      loadData(selectedRoleFilter);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (
      !confirm(
        `Yakin ingin menghapus akun ${userName}? Data latihan terkait akan ikut terhapus.`
      )
    )
      return;
    const res = await deleteAdminUser(userId);
    if (res.success) {
      showToast(res.message);
      loadData(selectedRoleFilter);
    }
  };

  if (user?.role !== "admin") {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-white border border-[#DCE1D8] rounded-2xl text-center shadow-xs">
          <div className="w-14 h-14 bg-[#FFF1F2] text-[#BE123C] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#FECDD3]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-[#141916] mb-2">
            Akses Terbatas: Khusus Admin
          </h1>
          <p className="text-[#48524C] text-sm mb-6 leading-relaxed">
            Halaman ini hanya dapat diakses oleh Administrator utama. Anda saat ini masuk sebagai{" "}
            <strong className="text-[#141916] uppercase">
              {user?.role || "Tamu"}
            </strong>
            .
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Toast */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#141916] border border-[#48524C] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Navigation Breadcrumb */}
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#48524C] hover:text-[#C84B11] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 pb-6 border-b border-[#DCE1D8]">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-[#BE123C]" />
            <span>Admin Master Panel</span>
          </h1>
          <p className="text-sm text-[#48524C] mt-1.5">
            Kelola seluruh pengguna, atur peran akun, hubungkan trainer, dan pantau metrik ekosistem TrainSmart.
          </p>
        </div>

        {/* System Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-8">
            <div className="p-4 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
              <span className="text-xs font-medium text-[#626E67] block mb-1">
                Total Pengguna
              </span>
              <span className="text-2xl font-bold text-[#141916] font-mono tabular-nums">
                {stats.total_users}
              </span>
            </div>
            <div className="p-4 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
              <span className="text-xs font-medium text-[#1D4ED8] block mb-1">
                Trainer (PT)
              </span>
              <span className="text-2xl font-bold text-[#1D4ED8] font-mono tabular-nums">
                {stats.total_trainers}
              </span>
            </div>
            <div className="p-4 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
              <span className="text-xs font-medium text-[#047857] block mb-1">
                Member (Klien)
              </span>
              <span className="text-2xl font-bold text-[#047857] font-mono tabular-nums">
                {stats.total_clients}
              </span>
            </div>
            <div className="p-4 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
              <span className="text-xs font-medium text-[#C84B11] block mb-1">
                Total Set Masuk
              </span>
              <span className="text-2xl font-bold text-[#C84B11] font-mono tabular-nums">
                {stats.total_logs}
              </span>
            </div>
            <div className="p-4 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs col-span-2 sm:col-span-1">
              <span className="text-xs font-medium text-[#BE123C] block mb-1">
                Total Tonase
              </span>
              <span className="text-2xl font-bold text-[#BE123C] font-mono tabular-nums">
                {stats.total_tonnage_kg.toLocaleString()}{" "}
                <span className="text-xs font-semibold">kg</span>
              </span>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div className="bg-white border border-[#DCE1D8] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 sm:p-6 bg-[#ECEFE9]/50 border-b border-[#DCE1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#141916] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#BE123C]" />
                <span>Manajemen Hak Akses & Peran Pengguna</span>
              </h2>
              <p className="text-xs text-[#48524C] mt-0.5">
                Ubah peran pengguna secara langsung atau atur relasi antara Personal Trainer dan Klien.
              </p>
            </div>

            {/* Filter buttons */}
            <div
              className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#DCE1D8] self-start sm:self-auto"
              role="tablist"
              aria-label="Filter peran pengguna"
            >
              {[
                { key: "all", label: "Semua" },
                { key: "client", label: "Client" },
                { key: "trainer", label: "Trainer" },
                { key: "admin", label: "Admin" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={selectedRoleFilter === item.key}
                  onClick={() => {
                    setIsLoading(true);
                    setSelectedRoleFilter(item.key);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedRoleFilter === item.key
                      ? "bg-[#141916] text-white"
                      : "text-[#48524C] hover:text-[#141916] hover:bg-[#ECEFE9]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-6 space-y-3 animate-pulse" aria-busy="true">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="h-12 bg-[#ECEFE9] rounded-xl" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-[#48524C] text-sm">
              Tidak ada data pengguna untuk filter ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE1D8] bg-[#F5F6F3] text-[#626E67] uppercase text-xs font-semibold tracking-wider">
                    <th className="py-3.5 px-5">Nama & Email</th>
                    <th className="py-3.5 px-4">Peran</th>
                    <th className="py-3.5 px-4">Personal Trainer Pendamping</th>
                    <th className="py-3.5 px-4 text-center">Set Latihan</th>
                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE1D8]">
                  {users.map((u) => {
                    const isSelf = u.id === user.id;

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-[#F5F6F3]/70 transition-colors"
                      >
                        <td className="py-4 px-5">
                          <span className="font-semibold text-[#141916] block">
                            {u.name}
                          </span>
                          <span className="text-xs text-[#626E67]">
                            {u.email}
                          </span>
                          {u.specialization && (
                            <span className="text-xs text-[#1D4ED8] flex items-center gap-1 mt-1">
                              <Award className="w-3.5 h-3.5 shrink-0" />
                              <span>{u.specialization}</span>
                            </span>
                          )}
                        </td>

                        {/* Role Dropdown */}
                        <td className="py-4 px-4">
                          <select
                            aria-label={`Ubah peran untuk ${u.name}`}
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value as UserRole)
                            }
                            disabled={isSelf}
                            className={`h-9 px-3 rounded-lg font-semibold text-xs outline-none border transition-colors ${
                              u.role === "admin"
                                ? "bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]"
                                : u.role === "trainer"
                                ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]"
                                : "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]"
                            } ${
                              isSelf
                                ? "opacity-60 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          >
                            <option value="client" className="bg-white text-[#141916]">
                              Client
                            </option>
                            <option value="trainer" className="bg-white text-[#141916]">
                              Trainer
                            </option>
                            <option value="admin" className="bg-white text-[#141916]">
                              Admin
                            </option>
                          </select>
                        </td>

                        {/* Trainer Assignment */}
                        <td className="py-4 px-4">
                          {u.role === "client" ? (
                            <select
                              aria-label={`Pilih trainer untuk ${u.name}`}
                              value={u.trainer_id ?? ""}
                              onChange={(e) =>
                                handleTrainerChange(
                                  u.id,
                                  e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : null
                                )
                              }
                              className="h-9 px-3 bg-white border border-[#C5CCC0] rounded-lg text-xs text-[#141916] outline-none focus:border-[#C84B11]"
                            >
                              <option value="">-- Tanpa Trainer --</option>
                              {allTrainers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          ) : u.role === "trainer" ? (
                            <span className="text-[#48524C] text-xs font-medium">
                              Membimbing{" "}
                              <strong className="font-mono tabular-nums text-[#141916]">
                                {u.clients?.length || 0}
                              </strong>{" "}
                              klien
                            </span>
                          ) : (
                            <span className="text-[#626E67] text-xs">—</span>
                          )}
                        </td>

                        {/* Workout logs count */}
                        <td className="py-4 px-4 text-center font-mono tabular-nums font-semibold text-[#141916]">
                          {u.workout_logs_count || 0}
                        </td>

                        {/* Delete Action */}
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            disabled={isSelf}
                            className="h-9 w-9 inline-flex items-center justify-center text-[#626E67] hover:text-[#BE123C] hover:bg-[#FFF1F2] border border-transparent hover:border-[#FECDD3] rounded-lg transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            aria-label={
                              isSelf
                                ? "Tidak bisa menghapus diri sendiri"
                                : `Hapus ${u.name}`
                            }
                            title={
                              isSelf
                                ? "Tidak bisa menghapus diri sendiri"
                                : "Hapus Pengguna"
                            }
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
