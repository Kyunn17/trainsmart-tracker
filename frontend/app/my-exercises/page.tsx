"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FolderHeart,
  Plus,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  AlertCircle,
  Dumbbell,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { deleteCustomExercise, getMyExercises } from "@/lib/api";
import { Exercise } from "@/types/workout";
import ExerciseThumbnail from "@/app/components/ExerciseThumbnail";
import CustomExerciseModal from "@/app/components/CustomExerciseModal";

export default function MyExercisesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [meta, setMeta] = useState({ total: 0, pending_count: 0, max_pending: 5 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [reloadTick, setReloadTick] = useState(0);

  const triggerReload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    getMyExercises()
      .then((res) => {
        if (!active) return;
        setExercises(res.data);
        setMeta(res.meta);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat daftar gerakan custom."
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, user, reloadTick]);

  const handleDelete = async (ex: Exercise) => {
    const confirmMsg =
      (ex.workout_logs_count || 0) > 0
        ? `Gerakan "${ex.name}" sudah dipakai di ${ex.workout_logs_count} set riwayat latihan. Gerakan akan diarsipkan (riwayat tetap aman). Lanjutkan?`
        : `Hapus permanen gerakan custom "${ex.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(ex.id);
    const res = await deleteCustomExercise(ex.id);
    setDeletingId(null);

    if (res.success) {
      setNotice(res.message);
      triggerReload();
    } else {
      setError(res.message);
    }
  };

  if (!authLoading && !user) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916] flex items-center justify-center p-6">
        <div className="bg-white border border-[#DCE1D8] rounded-2xl p-8 max-w-md text-center space-y-4">
          <Dumbbell className="w-8 h-8 text-[#C84B11] mx-auto" />
          <h1 className="text-xl font-bold">Masuk untuk Kelola Gerakan Custom</h1>
          <p className="text-sm text-[#48524C]">
            Fitur gerakan custom bersifat pribadi per akun. Silakan masuk terlebih dahulu.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-11 px-6 bg-[#C84B11] text-white font-semibold rounded-xl text-sm"
          >
            Masuk ke Akun
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/exercises"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#48524C] hover:text-[#141916] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Perpustakaan Gerakan</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-6 border-b border-[#DCE1D8]">
          <div>
            <h1 className="text-3xl font-bold text-[#141916] tracking-tight flex items-center gap-2.5">
              <FolderHeart className="w-7 h-7 text-[#C84B11]" />
              <span>Gerakan Custom Saya</span>
            </h1>
            <p className="text-sm text-[#48524C] mt-1.5">
              Kelola gerakan pribadi Anda. Setelah disetujui (ACC) oleh Admin, gerakan langsung muncul di perpustakaan dan pencatatan set Anda.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {user?.role !== "admin" && (
              <span className="px-3 py-2 bg-white border border-[#DCE1D8] rounded-xl text-xs font-mono tabular-nums font-semibold text-[#48524C]">
                Menunggu ACC: {meta.pending_count}/{meta.max_pending}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setEditingExercise(null);
                setIsModalOpen(true);
              }}
              className="h-11 px-4 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Gerakan</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="mb-5 p-4 bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] rounded-2xl text-sm font-medium">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-5 p-4 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] rounded-2xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white border border-[#DCE1D8] rounded-2xl" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="p-10 bg-white border border-[#DCE1D8] rounded-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#ECEFE9] text-[#48524C] flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#141916] mb-1">
              Belum Ada Gerakan Custom
            </h2>
            <p className="text-sm text-[#48524C] mb-5 max-w-md mx-auto">
              Punya variasi gerakan favorit yang belum ada di daftar resmi? Ajukan gerakan pribadi Anda di sini.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingExercise(null);
                setIsModalOpen(true);
              }}
              className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Gerakan Pertama</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((ex) => {
              const statusBadge =
                ex.approval_status === "approved" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Disetujui & Aktif
                  </span>
                ) : ex.approval_status === "rejected" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5" />
                    Ditolak
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    Menunggu ACC Admin
                  </span>
                );

              return (
                <div
                  key={ex.id}
                  className="bg-white border border-[#DCE1D8] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <ExerciseThumbnail
                      src={ex.images?.[0]?.url}
                      alt={ex.name}
                      className="w-16 h-16 rounded-xl shrink-0"
                      sizes="64px"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-[#141916]">
                          {ex.name}
                        </h2>
                        <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[11px] font-bold">
                          Custom
                        </span>
                        {statusBadge}
                      </div>
                      <p className="text-xs text-[#626E67] capitalize">
                        {ex.primary_muscle || "-"}
                        {ex.muscle_region ? ` (${ex.muscle_region.replace("_", " ")})` : ""} •{" "}
                        {(ex.equipment || "-").replace("_", " ")} •{" "}
                        <span className="font-mono tabular-nums">
                          {ex.workout_logs_count || 0} set tercatat
                        </span>
                      </p>
                      {ex.approval_status === "rejected" && ex.rejection_reason && (
                        <p className="text-xs text-[#BE123C] bg-[#FFF1F2] border border-[#FECDD3] rounded-lg px-2.5 py-1.5 mt-1">
                          Alasan ditolak: {ex.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExercise(ex);
                        setIsModalOpen(true);
                      }}
                      className="h-10 px-3.5 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>
                        {ex.approval_status === "rejected"
                          ? "Edit & Ajukan Ulang"
                          : "Edit"}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === ex.id}
                      onClick={() => handleDelete(ex)}
                      className="h-10 px-3.5 bg-white hover:bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {(ex.workout_logs_count || 0) > 0 ? "Arsipkan" : "Hapus"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CustomExerciseModal
        isOpen={isModalOpen}
        editingExercise={editingExercise}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExercise(null);
        }}
        onSaved={(_ex, msg) => {
          setNotice(msg);
          triggerReload();
        }}
      />
    </main>
  );
}
