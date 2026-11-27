"use client";

import { useState } from "react";
import { X, Upload, AlertCircle, Info, Trash2 } from "lucide-react";
import { Exercise } from "@/types/workout";
import {
  createCustomExercise,
  updateCustomExercise,
  uploadCustomExerciseImage,
  deleteCustomExerciseImage,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ExerciseThumbnail from "@/app/components/ExerciseThumbnail";

export const MUSCLE_REGION_MAP: Record<string, Array<{ value: string; label: string }>> = {
  chest: [
    { value: "upper_chest", label: "Upper Chest (Dada Atas)" },
    { value: "middle_chest", label: "Middle Chest (Dada Tengah)" },
    { value: "lower_chest", label: "Lower Chest (Dada Bawah)" },
  ],
  shoulders: [
    { value: "front_delt", label: "Front Delt (Bahu Depan)" },
    { value: "lateral_delt", label: "Lateral Delt (Bahu Samping)" },
    { value: "rear_delt", label: "Rear Delt (Bahu Belakang)" },
  ],
  triceps: [{ value: "triceps", label: "Triceps" }],
  back: [
    { value: "lats", label: "Lats / Upper Back" },
    { value: "mid_back", label: "Mid Back (Rows)" },
  ],
  biceps: [{ value: "biceps", label: "Biceps" }],
  quads: [{ value: "quads", label: "Quads (Paha Depan)" }],
  hamstrings: [{ value: "hamstrings", label: "Hamstrings (Paha Belakang)" }],
  glutes: [{ value: "glutes", label: "Glutes (Bokong)" }],
  calves: [{ value: "calves", label: "Calves (Betis)" }],
  core: [{ value: "core", label: "Core / Perut" }],
};

const MUSCLE_OPTIONS = [
  { value: "chest", label: "Dada (Chest)" },
  { value: "back", label: "Punggung (Back)" },
  { value: "shoulders", label: "Bahu (Shoulders)" },
  { value: "biceps", label: "Bisep (Biceps)" },
  { value: "triceps", label: "Trisep (Triceps)" },
  { value: "quads", label: "Paha Depan (Quads)" },
  { value: "hamstrings", label: "Hamstring" },
  { value: "glutes", label: "Glutes" },
  { value: "calves", label: "Betis (Calves)" },
  { value: "core", label: "Perut / Core" },
];

const EQUIPMENT_OPTIONS = [
  { value: "dumbbell", label: "Dumbbell" },
  { value: "barbell", label: "Barbell" },
  { value: "machine", label: "Mesin Gym" },
  { value: "cable", label: "Cable" },
  { value: "bodyweight", label: "Berat Badan" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "resistance_band", label: "Resistance Band" },
  { value: "other", label: "Lainnya" },
];

const SESSION_TYPE_OPTIONS = [
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "legs", label: "Legs" },
  { value: "upper", label: "Upper" },
  { value: "lower", label: "Lower" },
  { value: "full_body", label: "Full Body" },
  { value: "anterior", label: "Anterior" },
  { value: "posterior", label: "Posterior" },
  { value: "arms_delts", label: "Arms & Delts" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "arms", label: "Arms" },
];

interface CustomExerciseModalProps {
  isOpen: boolean;
  initialName?: string;
  editingExercise?: Exercise | null;
  onClose: () => void;
  onSaved: (exercise: Exercise, message: string) => void;
}

export default function CustomExerciseModal(props: CustomExerciseModalProps) {
  if (!props.isOpen) return null;

  const modalKey = props.editingExercise
    ? `edit-${props.editingExercise.id}`
    : `create-${props.initialName || "new"}`;

  return <CustomExerciseModalInner key={modalKey} {...props} />;
}

function CustomExerciseModalInner({
  initialName = "",
  editingExercise = null,
  onClose,
  onSaved,
}: CustomExerciseModalProps) {
  const { user } = useAuth();
  const initialMuscle = editingExercise?.primary_muscle || "chest";

  const [name, setName] = useState(editingExercise?.name ?? initialName);
  const [primaryMuscle, setPrimaryMuscle] = useState(initialMuscle);
  const [muscleRegion, setMuscleRegion] = useState(
    editingExercise?.muscle_region ||
      MUSCLE_REGION_MAP[initialMuscle]?.[0]?.value ||
      initialMuscle
  );
  const [equipment, setEquipment] = useState(
    editingExercise?.equipment || "dumbbell"
  );
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >(
    (editingExercise?.difficulty as "beginner" | "intermediate" | "advanced") ||
      "beginner"
  );
  const [sessionTypes, setSessionTypes] = useState<string[]>(() =>
    editingExercise
      ? Array.from(
          new Set(
            (editingExercise.split_sessions || []).map((s) => s.session_type)
          )
        )
      : []
  );
  const [instructionsText, setInstructionsText] = useState(
    (editingExercise?.instructions || []).join("\n")
  );
  const [notes, setNotes] = useState((editingExercise?.tips || []).join("\n"));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImages, setCurrentImages] = useState(
    editingExercise?.images || []
  );
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regionChoices = MUSCLE_REGION_MAP[primaryMuscle] || [];

  const handleMuscleChange = (nextMuscle: string) => {
    setPrimaryMuscle(nextMuscle);
    const nextRegions = MUSCLE_REGION_MAP[nextMuscle] || [];
    setMuscleRegion(nextRegions[0]?.value || nextMuscle);
  };

  const toggleSessionType = (type: string) => {
    setSessionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const instructions = instructionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      primary_muscle: primaryMuscle,
      muscle_region: muscleRegion,
      equipment,
      difficulty,
      instructions,
      notes: notes.trim(),
      session_types: sessionTypes,
      image: imageFile,
    };

    const res = editingExercise
      ? await updateCustomExercise(editingExercise.id, payload)
      : await createCustomExercise(payload);

    setIsSaving(false);

    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }

    onSaved(res.data, res.message);
    onClose();
  };

  const handleEditImageUpload = async (position: 0 | 1) => {
    if (!editingExercise || !imageFile) return;
    setError(null);
    setIsUploadingImg(true);
    const res = await uploadCustomExerciseImage(
      editingExercise.id,
      imageFile,
      position
    );
    setIsUploadingImg(false);
    if (!res.success || !res.data) {
      setError(res.message);
      return;
    }
    setImageFile(null);
    setCurrentImages((prev) =>
      [...prev.filter((img) => img.position !== position), res.data!].sort(
        (a, b) => a.position - b.position
      )
    );
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!editingExercise) return;
    const res = await deleteCustomExerciseImage(editingExercise.id, imageId);
    if (res.success) {
      setCurrentImages((prev) => prev.filter((img) => img.id !== imageId));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#141916]/65 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-exercise-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-[#DCE1D8] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl relative space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 h-10 w-10 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#48524C] rounded-xl flex items-center justify-center cursor-pointer"
          aria-label="Tutup modal gerakan custom"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h2
            id="custom-exercise-modal-title"
            className="text-xl font-bold text-[#141916] pr-10"
          >
            {editingExercise
              ? "Edit Gerakan Custom"
              : "Ajukan Gerakan Custom Baru"}
          </h2>
          <p className="text-xs text-[#48524C] mt-1">
            Gerakan custom bersifat pribadi dan hanya terlihat di akun Anda sendiri.
          </p>
        </div>

        {user?.role !== "admin" && !editingExercise && (
          <div className="p-3 bg-[#FFF1EA] border border-[#F4C4AC] rounded-xl flex items-start gap-2.5 text-xs text-[#48524C]">
            <Info className="w-4 h-4 text-[#C84B11] shrink-0 mt-0.5" />
            <span>
              Pengajuan gerakan baru akan diverifikasi (ACC) oleh Admin terlebih dahulu agar daftar gerakan tetap rapi dan bebas spam (maks. 5 pengajuan menunggu sekaligus).
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl flex items-start gap-2 text-xs text-[#BE123C]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#141916] mb-1">
              Nama Gerakan <span className="text-[#BE123C]">*</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              placeholder="Misal: Landmine Chest Press"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 bg-white border border-[#C5CCC0] focus:border-[#C84B11] rounded-xl text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#141916] mb-1">
                Kelompok Otot Utama <span className="text-[#BE123C]">*</span>
              </label>
              <select
                value={primaryMuscle}
                onChange={(e) => handleMuscleChange(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#C5CCC0] focus:border-[#C84B11] rounded-xl text-sm outline-none"
              >
                {MUSCLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#141916] mb-1">
                Sub-Bagian Otot
              </label>
              <select
                value={muscleRegion}
                onChange={(e) => setMuscleRegion(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#C5CCC0] focus:border-[#C84B11] rounded-xl text-sm outline-none"
              >
                {regionChoices.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#141916] mb-1">
                Alat Latihan <span className="text-[#BE123C]">*</span>
              </label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#C5CCC0] focus:border-[#C84B11] rounded-xl text-sm outline-none"
              >
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#141916] mb-1">
                Tingkat Kesulitan
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value as "beginner" | "intermediate" | "advanced"
                  )
                }
                className="w-full h-11 px-3 bg-white border border-[#C5CCC0] focus:border-[#C84B11] rounded-xl text-sm outline-none"
              >
                <option value="beginner">Pemula</option>
                <option value="intermediate">Menengah</option>
                <option value="advanced">Lanjutan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141916] mb-1.5">
              Cocok untuk Sesi Split (Opsional)
            </label>
            <div className="flex flex-wrap gap-2">
              {SESSION_TYPE_OPTIONS.map((opt) => {
                const active = sessionTypes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleSessionType(opt.value)}
                    className={`h-9 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? "bg-[#FFF1EA] border-[#C84B11] text-[#C84B11]"
                        : "bg-[#F5F6F3] border-[#DCE1D8] text-[#48524C] hover:text-[#141916]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141916] mb-1">
              Langkah Eksekusi (Opsional, 1 baris per langkah)
            </label>
            <textarea
              rows={3}
              placeholder="Contoh:&#10;Atur posisi kaki selebar bahu&#10;Dorong beban lurus ke depan atas secara terkontrol"
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              className="w-full p-3 bg-white border border-[#C5CCC0] focus:border-[#C84B11] rounded-xl text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141916] mb-1">
              Catatan / Tips Pribadi (Opsional)
            </label>
            <input
              type="text"
              maxLength={600}
              placeholder="Misal: Pakai grip netral agar bahu lebih nyaman"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-11 px-3.5 bg-white border border-[#C5CCC0] focus:border-[#C84B11] rounded-xl text-sm outline-none"
            />
          </div>

          {!editingExercise ? (
            <div>
              <label className="block text-xs font-semibold text-[#141916] mb-1">
                Foto Gerakan (Opsional, JPG/PNG/WEBP maks. 2 MB)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-[#48524C] file:mr-3 file:h-9 file:px-3 file:rounded-lg file:border file:border-[#DCE1D8] file:bg-[#ECEFE9] file:text-[#141916] file:font-semibold file:cursor-pointer"
              />
            </div>
          ) : (
            <div className="pt-3 border-t border-[#DCE1D8] space-y-2.5">
              <p className="text-xs font-semibold text-[#141916]">
                Foto Gerakan (Opsional)
              </p>
              {currentImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {currentImages.map((img) => (
                    <div
                      key={img.id}
                      className="border border-[#DCE1D8] rounded-xl p-2 flex items-center justify-between gap-2"
                    >
                      <ExerciseThumbnail
                        src={img.url}
                        alt={img.alt_text || editingExercise.name}
                        className="w-12 h-12 rounded-lg shrink-0"
                        sizes="48px"
                      />
                      <span className="text-xs text-[#48524C] truncate flex-1">
                        {img.position === 0 ? "Posisi Awal" : "Posisi Akhir"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(img.id)}
                        className="h-8 w-8 text-[#BE123C] hover:bg-[#FFF1F2] rounded-lg flex items-center justify-center cursor-pointer"
                        aria-label="Hapus foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="text-xs text-[#48524C] flex-1 min-w-[180px]"
                />
                <button
                  type="button"
                  disabled={!imageFile || isUploadingImg}
                  onClick={() => handleEditImageUpload(0)}
                  className="h-9 px-3 bg-[#141916] disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingImg ? "Mengunggah..." : "Unggah Foto"}</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl text-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="h-11 px-5 bg-[#C84B11] hover:bg-[#A83D0B] disabled:opacity-50 text-white font-semibold rounded-xl text-sm cursor-pointer"
            >
              {isSaving
                ? "Menyimpan..."
                : editingExercise
                ? "Simpan Perubahan"
                : "Kirim Pengajuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
