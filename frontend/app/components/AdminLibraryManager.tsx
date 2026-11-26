"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  Edit3,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import {
  createAdminExercise,
  deleteAdminExerciseImage,
  getAdminExercises,
  getAdminSplits,
  promoteAdminCustomExercise,
  reviewAdminCustomExercise,
  updateAdminExercise,
  updateAdminSplit,
  uploadAdminExerciseImage,
} from "@/lib/api";
import {
  AdminExercisePayload,
  Exercise,
  Split,
} from "@/types/workout";
import ExerciseThumbnail from "@/app/components/ExerciseThumbnail";

interface AdminLibraryManagerProps {
  activeTab: "exercises" | "splits";
  onNotify: (msg: string) => void;
}

export default function AdminLibraryManager({
  activeTab,
  onNotify,
}: AdminLibraryManagerProps) {
  // Exercises state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exMeta, setExMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    pending_custom_count: 0,
  });
  const [exSearch, setExSearch] = useState("");
  const [exStatus, setExStatus] = useState<
    "all" | "active" | "inactive" | "pending_custom" | "rejected_custom" | "custom" | "official"
  >("all");
  const [exPage, setExPage] = useState(1);
  const [isLoadingEx, setIsLoadingEx] = useState(true);
  const [exReloadTick, setExReloadTick] = useState(0);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  // Exercise Modal
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isExModalOpen, setIsExModalOpen] = useState(false);
  const [exForm, setExForm] = useState<{
    name: string;
    primary_muscle: string;
    equipment: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    is_beginner_friendly: boolean;
    instructionsText: string;
    mistakesText: string;
    tipsText: string;
    is_active: boolean;
  }>({
    name: "",
    primary_muscle: "chest",
    equipment: "dumbbell",
    difficulty: "beginner",
    is_beginner_friendly: true,
    instructionsText: "",
    mistakesText: "",
    tipsText: "",
    is_active: true,
  });
  const [isSavingEx, setIsSavingEx] = useState(false);
  const [exError, setExError] = useState<string | null>(null);

  // Image upload inside exercise modal
  const [uploadPos, setUploadPos] = useState<0 | 1>(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  // Splits state
  const [splits, setSplits] = useState<Split[]>([]);
  const [isLoadingSplits, setIsLoadingSplits] = useState(true);
  const [editingSplit, setEditingSplit] = useState<Split | null>(null);
  const [splitForm, setSplitForm] = useState({
    name: "",
    description: "",
    min_days: 2,
    max_days: 3,
    suitable_for: "",
    prosText: "",
    consText: "",
    is_active: true,
  });
  const [isSavingSplit, setIsSavingSplit] = useState(false);

  // Load exercises
  useEffect(() => {
    if (activeTab !== "exercises") return;
    let active = true;
    getAdminExercises({
      search: exSearch,
      status: exStatus,
      page: exPage,
      per_page: 15,
    })
      .then((res) => {
        if (!active) return;
        setExercises(res.data);
        setExMeta({
          current_page: res.meta.current_page,
          last_page: res.meta.last_page,
          total: res.meta.total,
          pending_custom_count: res.meta.pending_custom_count || 0,
        });
      })
      .finally(() => {
        if (active) setIsLoadingEx(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, exSearch, exStatus, exPage, exReloadTick]);

  // Load splits
  useEffect(() => {
    if (activeTab !== "splits") return;
    let active = true;
    getAdminSplits()
      .then((data) => {
        if (active) setSplits(data);
      })
      .finally(() => {
        if (active) setIsLoadingSplits(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab]);

  const openCreateExercise = () => {
    setEditingExercise(null);
    setExForm({
      name: "",
      primary_muscle: "chest",
      equipment: "dumbbell",
      difficulty: "beginner",
      is_beginner_friendly: true,
      instructionsText: "",
      mistakesText: "",
      tipsText: "",
      is_active: true,
    });
    setExError(null);
    setUploadFile(null);
    setIsExModalOpen(true);
  };

  const openEditExercise = (ex: Exercise) => {
    setEditingExercise(ex);
    setExForm({
      name: ex.name,
      primary_muscle: ex.primary_muscle || "chest",
      equipment: ex.equipment || "dumbbell",
      difficulty: (ex.difficulty as "beginner" | "intermediate" | "advanced") || "beginner",
      is_beginner_friendly: Boolean(ex.is_beginner_friendly),
      instructionsText: (ex.instructions || []).join("\n"),
      mistakesText: (ex.common_mistakes || []).join("\n"),
      tipsText: (ex.tips || []).join("\n"),
      is_active: ex.is_active !== false,
    });
    setExError(null);
    setUploadFile(null);
    setIsExModalOpen(true);
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setExError(null);
    setIsSavingEx(true);

    const splitLines = (txt: string) =>
      txt
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

    const payload: AdminExercisePayload = {
      name: exForm.name.trim(),
      primary_muscle: exForm.primary_muscle,
      equipment: exForm.equipment,
      difficulty: exForm.difficulty,
      is_beginner_friendly: exForm.is_beginner_friendly,
      instructions: splitLines(exForm.instructionsText),
      common_mistakes: splitLines(exForm.mistakesText),
      tips: splitLines(exForm.tipsText),
      is_active: exForm.is_active,
    };

    const res = editingExercise
      ? await updateAdminExercise(editingExercise.id, payload)
      : await createAdminExercise(payload);

    setIsSavingEx(false);

    if (!res.success) {
      setExError(res.message);
      return;
    }

    onNotify(res.message);
    setIsExModalOpen(false);
    setIsLoadingEx(true);
    setExReloadTick((t) => t + 1);
  };

  const handleToggleExerciseActive = async (ex: Exercise) => {
    const res = await updateAdminExercise(ex.id, {
      is_active: !(ex.is_active !== false),
    });
    if (res.success) {
      onNotify(res.message);
      setIsLoadingEx(true);
      setExReloadTick((t) => t + 1);
    }
  };

  const handleReviewCustom = async (ex: Exercise, action: "approve" | "reject") => {
    let reason: string | undefined;
    if (action === "reject") {
      const input = window.prompt(
        `Masukkan alasan penolakan untuk gerakan "${ex.name}":`
      );
      if (!input || !input.trim()) return;
      reason = input.trim();
    }

    setReviewingId(ex.id);
    const res = await reviewAdminCustomExercise(ex.id, action, reason);
    setReviewingId(null);

    if (res.success) {
      onNotify(res.message);
      setIsLoadingEx(true);
      setExReloadTick((t) => t + 1);
    }
  };

  const handlePromoteCustom = async (ex: Exercise) => {
    if (
      !window.confirm(
        `Promosikan "${ex.name}" ke Library Resmi agar dapat dipakai semua pengguna TrainSmart?`
      )
    ) {
      return;
    }

    setReviewingId(ex.id);
    const res = await promoteAdminCustomExercise(ex.id);
    setReviewingId(null);

    if (res.success) {
      onNotify(res.message);
      setIsLoadingEx(true);
      setExReloadTick((t) => t + 1);
    }
  };

  const handleUploadImage = async () => {
    if (!editingExercise || !uploadFile) return;
    setExError(null);
    setIsUploadingImg(true);

    const res = await uploadAdminExerciseImage(
      editingExercise.id,
      uploadFile,
      uploadPos
    );

    setIsUploadingImg(false);

    if (!res.success || !res.data) {
      setExError(res.message);
      return;
    }

    onNotify(res.message);
    setUploadFile(null);
    const updatedImages = [
      ...(editingExercise.images || []).filter((img) => img.position !== uploadPos),
      res.data,
    ].sort((a, b) => a.position - b.position);

    setEditingExercise({ ...editingExercise, images: updatedImages });
    setExReloadTick((t) => t + 1);
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!editingExercise) return;
    const res = await deleteAdminExerciseImage(editingExercise.id, imageId);
    if (res.success) {
      onNotify(res.message);
      setEditingExercise({
        ...editingExercise,
        images: (editingExercise.images || []).filter((i) => i.id !== imageId),
      });
      setExReloadTick((t) => t + 1);
    }
  };

  const openEditSplit = (split: Split) => {
    setEditingSplit(split);
    setSplitForm({
      name: split.name,
      description: split.description,
      min_days: split.min_days,
      max_days: split.max_days,
      suitable_for: split.suitable_for,
      prosText: (split.pros || []).join("\n"),
      consText: (split.cons || []).join("\n"),
      is_active: split.is_active,
    });
  };

  const handleSaveSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSplit) return;
    setIsSavingSplit(true);

    const splitLines = (txt: string) =>
      txt
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

    const res = await updateAdminSplit(editingSplit.id, {
      name: splitForm.name,
      description: splitForm.description,
      min_days: Number(splitForm.min_days),
      max_days: Number(splitForm.max_days),
      suitable_for: splitForm.suitable_for,
      pros: splitLines(splitForm.prosText),
      cons: splitLines(splitForm.consText),
      is_active: splitForm.is_active,
    });

    setIsSavingSplit(false);

    if (res.success && res.data) {
      onNotify(res.message);
      setSplits((prev) =>
        prev.map((s) => (s.id === res.data!.id ? res.data! : s))
      );
      setEditingSplit(null);
    }
  };

  if (activeTab === "splits") {
    return (
      <div className="bg-white border border-[#DCE1D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 bg-[#ECEFE9]/50 border-b border-[#DCE1D8]">
          <h2 className="text-base font-bold text-[#141916] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C84B11]" />
            <span>Manajemen Program Split Rekomendasi</span>
          </h2>
          <p className="text-xs text-[#48524C] mt-0.5">
            Atur deskripsi, rentang hari latihan, kelebihan/kekurangan, dan status aktif setiap program split.
          </p>
        </div>

        {isLoadingSplits ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#ECEFE9] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#DCE1D8]">
            {splits.map((split) => (
              <div
                key={split.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-[#141916]">
                      {split.name}
                    </h3>
                    <span className="text-xs font-mono tabular-nums px-2 py-0.5 rounded-md bg-[#ECEFE9] text-[#141916]">
                      {split.min_days}–{split.max_days} hari
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                        split.is_active
                          ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                          : "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]"
                      }`}
                    >
                      {split.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#48524C] max-w-2xl">
                    {split.description}
                  </p>
                  {split.sessions && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {split.sessions.map((s) => (
                        <span
                          key={s.id}
                          className="text-xs px-2 py-0.5 rounded bg-[#F5F6F3] border border-[#DCE1D8] text-[#48524C]"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openEditSplit(split)}
                  className="h-10 px-4 bg-[#141916] hover:bg-[#C84B11] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Split</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Edit Split Modal */}
        {editingSplit && (
          <div
            className="fixed inset-0 bg-[#141916]/65 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditingSplit(null);
            }}
          >
            <div className="bg-white border border-[#DCE1D8] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl relative">
              <button
                type="button"
                onClick={() => setEditingSplit(null)}
                className="absolute top-4 right-4 h-9 w-9 bg-[#ECEFE9] rounded-xl flex items-center justify-center text-[#48524C] cursor-pointer"
                aria-label="Tutup modal edit split"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xl font-bold text-[#141916] mb-4">
                Edit Split: {editingSplit.name}
              </h3>

              <form onSubmit={handleSaveSplit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#141916] mb-1">
                    Nama Split
                  </label>
                  <input
                    type="text"
                    value={splitForm.name}
                    onChange={(e) =>
                      setSplitForm({ ...splitForm, name: e.target.value })
                    }
                    className="w-full h-10 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#141916] mb-1">
                      Min Hari
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={6}
                      value={splitForm.min_days}
                      onChange={(e) =>
                        setSplitForm({
                          ...splitForm,
                          min_days: Number(e.target.value),
                        })
                      }
                      className="w-full h-10 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#141916] mb-1">
                      Max Hari
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={6}
                      value={splitForm.max_days}
                      onChange={(e) =>
                        setSplitForm({
                          ...splitForm,
                          max_days: Number(e.target.value),
                        })
                      }
                      className="w-full h-10 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm font-mono tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141916] mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    rows={2}
                    value={splitForm.description}
                    onChange={(e) =>
                      setSplitForm({
                        ...splitForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-white border border-[#C5CCC0] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141916] mb-1">
                    Cocok Untuk
                  </label>
                  <input
                    type="text"
                    value={splitForm.suitable_for}
                    onChange={(e) =>
                      setSplitForm({
                        ...splitForm,
                        suitable_for: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141916] mb-1">
                    Kelebihan (1 per baris)
                  </label>
                  <textarea
                    rows={3}
                    value={splitForm.prosText}
                    onChange={(e) =>
                      setSplitForm({ ...splitForm, prosText: e.target.value })
                    }
                    className="w-full p-3 bg-white border border-[#C5CCC0] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141916] mb-1">
                    Kekurangan (1 per baris)
                  </label>
                  <textarea
                    rows={2}
                    value={splitForm.consText}
                    onChange={(e) =>
                      setSplitForm({ ...splitForm, consText: e.target.value })
                    }
                    className="w-full p-3 bg-white border border-[#C5CCC0] rounded-xl text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-[#141916]">
                  <input
                    type="checkbox"
                    checked={splitForm.is_active}
                    onChange={(e) =>
                      setSplitForm({
                        ...splitForm,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  <span>Program Split Aktif</span>
                </label>

                <button
                  type="submit"
                  disabled={isSavingSplit}
                  className="w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm cursor-pointer"
                >
                  {isSavingSplit ? "Menyimpan..." : "Simpan Perubahan Split"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* EXERCISES TAB */
  return (
    <div className="bg-white border border-[#DCE1D8] rounded-2xl overflow-hidden shadow-xs">
      <div className="p-5 sm:p-6 bg-[#ECEFE9]/50 border-b border-[#DCE1D8] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#141916] flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#C84B11]" />
            <span>Manajemen Perpustakaan Gerakan ({exMeta.total})</span>
          </h2>
          <p className="text-xs text-[#48524C] mt-0.5">
            Tambah gerakan baru, perbarui panduan, unggah foto posisi awal/akhir, atau nonaktifkan gerakan.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateExercise}
          className="h-10 px-4 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 self-start lg:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Gerakan Baru</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-[#DCE1D8] flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#626E67] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Cari nama gerakan atau otot..."
            value={exSearch}
            onChange={(e) => {
              setIsLoadingEx(true);
              setExSearch(e.target.value);
              setExPage(1);
            }}
            className="w-full h-10 pl-9 pr-3 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl text-sm outline-none focus:bg-white focus:border-[#C84B11]"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setIsLoadingEx(true);
            setExStatus(exStatus === "pending_custom" ? "all" : "pending_custom");
            setExPage(1);
          }}
          className={`h-10 px-3.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
            exStatus === "pending_custom"
              ? "bg-[#C84B11] text-white border-[#C84B11]"
              : exMeta.pending_custom_count > 0
              ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
              : "bg-white text-[#48524C] border-[#C5CCC0]"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Menunggu ACC ({exMeta.pending_custom_count})</span>
        </button>

        <select
          aria-label="Filter status aktif gerakan"
          value={exStatus}
          onChange={(e) => {
            setIsLoadingEx(true);
            setExStatus(
              e.target.value as
                | "all"
                | "active"
                | "inactive"
                | "pending_custom"
                | "rejected_custom"
                | "custom"
                | "official"
            );
            setExPage(1);
          }}
          className="h-10 px-3 bg-white border border-[#C5CCC0] rounded-xl text-xs font-semibold text-[#141916]"
        >
          <option value="all">Semua Gerakan</option>
          <option value="official">Library Resmi</option>
          <option value="pending_custom">Custom: Menunggu ACC</option>
          <option value="custom">Semua Custom User</option>
          <option value="rejected_custom">Custom: Ditolak</option>
          <option value="active">Hanya Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {isLoadingEx ? (
        <div className="p-6 space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-[#ECEFE9] rounded-xl" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#48524C]">
          Tidak ada gerakan untuk filter yang dipilih.
        </div>
      ) : (
        <div className="divide-y divide-[#DCE1D8]">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ExerciseThumbnail
                  src={ex.images?.[0]?.url}
                  alt={ex.name}
                  className="w-12 h-12 rounded-xl shrink-0"
                  sizes="48px"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-[#141916] truncate">
                      {ex.name}
                    </span>
                    {ex.is_custom && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                        Custom
                      </span>
                    )}
                    {ex.is_custom && ex.approval_status === "pending" && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                        Menunggu ACC
                      </span>
                    )}
                    {ex.is_custom && ex.approval_status === "rejected" && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]">
                        Ditolak
                      </span>
                    )}
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        ex.is_active !== false
                          ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                          : "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]"
                      }`}
                    >
                      {ex.is_active !== false ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-xs text-[#626E67] capitalize mt-0.5">
                    {ex.primary_muscle || "-"} • {ex.equipment || "-"} •{" "}
                    {ex.difficulty || "beginner"} •{" "}
                    <span className="font-mono tabular-nums">
                      {ex.images?.length || 0} foto
                    </span>
                    {ex.creator && (
                      <span className="normal-case">
                        {" "}
                        • Oleh {ex.creator.name} ({ex.creator.role})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {ex.is_custom && ex.approval_status !== "approved" && (
                  <button
                    type="button"
                    disabled={reviewingId === ex.id}
                    onClick={() => handleReviewCustom(ex, "approve")}
                    className="h-9 px-3 bg-[#047857] hover:bg-[#065F46] text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ACC</span>
                  </button>
                )}
                {ex.is_custom && ex.approval_status === "pending" && (
                  <button
                    type="button"
                    disabled={reviewingId === ex.id}
                    onClick={() => handleReviewCustom(ex, "reject")}
                    className="h-9 px-3 bg-white hover:bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>
                )}
                {ex.is_custom && (
                  <button
                    type="button"
                    disabled={reviewingId === ex.id}
                    onClick={() => handlePromoteCustom(ex)}
                    className="h-9 px-3 bg-[#FFF1EA] hover:bg-[#F4C4AC]/50 text-[#C84B11] border border-[#F4C4AC] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Jadikan bagian dari Library Resmi untuk semua user"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Jadikan Resmi</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEditExercise(ex)}
                  className="h-9 px-3 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit & Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleExerciseActive(ex)}
                  className={`h-9 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                    ex.is_active !== false
                      ? "bg-white hover:bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]"
                      : "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                  }`}
                >
                  {ex.is_active !== false ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {exMeta.last_page > 1 && (
        <div className="p-4 border-t border-[#DCE1D8] flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={exMeta.current_page <= 1}
            onClick={() => {
              setIsLoadingEx(true);
              setExPage((p) => Math.max(1, p - 1));
            }}
            className="h-9 px-3 bg-[#ECEFE9] disabled:opacity-40 rounded-lg font-semibold cursor-pointer"
          >
            Sebelumnya
          </button>
          <span className="font-mono tabular-nums text-[#48524C]">
            Halaman {exMeta.current_page} / {exMeta.last_page}
          </span>
          <button
            type="button"
            disabled={exMeta.current_page >= exMeta.last_page}
            onClick={() => {
              setIsLoadingEx(true);
              setExPage((p) => Math.min(exMeta.last_page, p + 1));
            }}
            className="h-9 px-3 bg-[#ECEFE9] disabled:opacity-40 rounded-lg font-semibold cursor-pointer"
          >
            Berikutnya
          </button>
        </div>
      )}

      {/* Create / Edit Exercise Modal */}
      {isExModalOpen && (
        <div
          className="fixed inset-0 bg-[#141916]/65 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsExModalOpen(false);
          }}
        >
          <div className="bg-white border border-[#DCE1D8] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl relative space-y-5">
            <button
              type="button"
              onClick={() => setIsExModalOpen(false)}
              className="absolute top-4 right-4 h-9 w-9 bg-[#ECEFE9] rounded-xl flex items-center justify-center text-[#48524C] cursor-pointer"
              aria-label="Tutup modal gerakan"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-[#141916]">
              {editingExercise
                ? `Edit Gerakan: ${editingExercise.name}`
                : "Tambah Gerakan Baru"}
            </h3>

            {exError && (
              <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-xs text-[#BE123C]">
                {exError}
              </div>
            )}

            <form onSubmit={handleSaveExercise} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#141916] mb-1">
                  Nama Gerakan
                </label>
                <input
                  type="text"
                  value={exForm.name}
                  onChange={(e) =>
                    setExForm({ ...exForm, name: e.target.value })
                  }
                  className="w-full h-10 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#141916] mb-1">
                    Otot Utama
                  </label>
                  <select
                    value={exForm.primary_muscle}
                    onChange={(e) =>
                      setExForm({ ...exForm, primary_muscle: e.target.value })
                    }
                    className="w-full h-10 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm"
                  >
                    {[
                      "chest",
                      "back",
                      "shoulders",
                      "biceps",
                      "triceps",
                      "quads",
                      "hamstrings",
                      "glutes",
                      "calves",
                      "core",
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141916] mb-1">
                    Alat
                  </label>
                  <select
                    value={exForm.equipment}
                    onChange={(e) =>
                      setExForm({ ...exForm, equipment: e.target.value })
                    }
                    className="w-full h-10 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm"
                  >
                    {[
                      "dumbbell",
                      "barbell",
                      "machine",
                      "cable",
                      "bodyweight",
                      "kettlebell",
                      "bands",
                      "other",
                    ].map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141916] mb-1">
                    Level
                  </label>
                  <select
                    value={exForm.difficulty}
                    onChange={(e) =>
                      setExForm({
                        ...exForm,
                        difficulty: e.target.value as
                          | "beginner"
                          | "intermediate"
                          | "advanced",
                      })
                    }
                    className="w-full h-10 px-3 bg-white border border-[#C5CCC0] rounded-xl text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141916] mb-1">
                  Langkah Eksekusi (1 langkah per baris)
                </label>
                <textarea
                  rows={3}
                  value={exForm.instructionsText}
                  onChange={(e) =>
                    setExForm({ ...exForm, instructionsText: e.target.value })
                  }
                  className="w-full p-3 bg-white border border-[#C5CCC0] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#141916] mb-1">
                    Kesalahan Umum (1 per baris)
                  </label>
                  <textarea
                    rows={2}
                    value={exForm.mistakesText}
                    onChange={(e) =>
                      setExForm({ ...exForm, mistakesText: e.target.value })
                    }
                    className="w-full p-3 bg-white border border-[#C5CCC0] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#141916] mb-1">
                    Tips Pemula (1 per baris)
                  </label>
                  <textarea
                    rows={2}
                    value={exForm.tipsText}
                    onChange={(e) =>
                      setExForm({ ...exForm, tipsText: e.target.value })
                    }
                    className="w-full p-3 bg-white border border-[#C5CCC0] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#141916]">
                  <input
                    type="checkbox"
                    checked={exForm.is_beginner_friendly}
                    onChange={(e) =>
                      setExForm({
                        ...exForm,
                        is_beginner_friendly: e.target.checked,
                      })
                    }
                  />
                  <span>Ramah Pemula</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#141916]">
                  <input
                    type="checkbox"
                    checked={exForm.is_active}
                    onChange={(e) =>
                      setExForm({ ...exForm, is_active: e.target.checked })
                    }
                  />
                  <span>Aktif di Katalog</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSavingEx}
                className="w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSavingEx
                    ? "Menyimpan..."
                    : editingExercise
                    ? "Simpan Perubahan Gerakan"
                    : "Buat Gerakan"}
                </span>
              </button>
            </form>

            {/* Image Management (only when editing existing exercise) */}
            {editingExercise && (
              <div className="pt-4 border-t border-[#DCE1D8] space-y-3">
                <h4 className="text-sm font-bold text-[#141916]">
                  Foto Demonstrasi (JPG/PNG/WebP, maks 2 MB)
                </h4>

                {editingExercise.images && editingExercise.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {editingExercise.images.map((img) => (
                      <div
                        key={img.id}
                        className="p-2 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl space-y-2"
                      >
                        <ExerciseThumbnail
                          src={img.url}
                          alt={img.alt_text || editingExercise.name}
                          className="w-full h-32 rounded-lg"
                          sizes="240px"
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#48524C]">
                            {img.position === 0 ? "Posisi Awal (0)" : "Posisi Akhir (1)"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="p-1 text-[#BE123C] hover:bg-[#FFF1F2] rounded cursor-pointer"
                            aria-label="Hapus gambar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    aria-label="Posisi gambar"
                    value={uploadPos}
                    onChange={(e) =>
                      setUploadPos(Number(e.target.value) as 0 | 1)
                    }
                    className="h-10 px-3 bg-white border border-[#C5CCC0] rounded-xl text-xs font-semibold"
                  >
                    <option value={0}>Posisi Awal (0)</option>
                    <option value={1}>Posisi Akhir (1)</option>
                  </select>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      setUploadFile(e.target.files?.[0] || null)
                    }
                    className="flex-1 text-xs text-[#48524C]"
                  />
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={!uploadFile || isUploadingImg}
                    className="h-10 px-4 bg-[#141916] hover:bg-[#C84B11] disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImg ? "Mengunggah..." : "Unggah Foto"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
