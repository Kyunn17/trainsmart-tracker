"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Timer,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Flame,
  ChevronRight,
  ChevronLeft,
  Save,
  Trophy,
  Info,
  Clock,
  Zap,
  StickyNote,
  AlertCircle,
  Minimize2,
  Maximize2,
  X,
} from "lucide-react";
import { Category, Exercise, SetData, WorkoutLogEntry } from "@/types/workout";
import { saveWorkoutLogs, createExercise } from "@/lib/api";

interface Props {
  initialCategory: Category;
}

type ToastState = {
  type: "info" | "warning" | "success" | "error";
  message: string;
} | null;

export default function WorkoutPlanner({ initialCategory }: Props) {
  const [activeExercises, setActiveExercises] = useState<Exercise[]>(() => {
    return initialCategory.exercises.map((ex) => ({
      ...ex,
      targetSets: ex.targetSets || 3,
      notes: ex.notes || "",
      setsData: Array.from({ length: ex.targetSets || 3 }, () => ({
        weight: "",
        reps: "",
        rir: 1,
        notes: "",
        isCompleted: false,
      })),
    }));
  });

  const [isTracking, setIsTracking] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [namaGerakanBaru, setNamaGerakanBaru] = useState("");
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  // Active workout timer
  const [workoutSeconds, setWorkoutSeconds] = useState(0);

  // Rest Timer state
  const [isResting, setIsResting] = useState(false);
  const [isRestMinimized, setIsRestMinimized] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(120);
  const [initialRestDuration, setInitialRestDuration] = useState(120);

  // Notes & UI modal
  const [activeSetNoteModal, setActiveSetNoteModal] = useState<{
    exerciseIndex: number;
    setIndex: number;
  } | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");

  // Workout Summary & Save Modal
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (
    message: string,
    type: "info" | "warning" | "success" | "error" = "info"
  ) => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  // Escape key closes active modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activeSetNoteModal) {
        setActiveSetNoteModal(null);
      } else if (isSummaryOpen) {
        setIsSummaryOpen(false);
      } else if (isResting && !isRestMinimized) {
        setIsRestMinimized(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSetNoteModal, isSummaryOpen, isResting, isRestMinimized]);

  // Workout duration timer
  useEffect(() => {
    if (!isTracking) return;
    const interval = setInterval(() => {
      setWorkoutSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTracking]);

  // Rest timer countdown
  useEffect(() => {
    if (!isResting) return;
    const timer = setInterval(() => {
      setRestTimeLeft((prev) => {
        if (prev <= 1) {
          setIsResting(false);
          setIsRestMinimized(false);
          setToast({
            type: "success",
            message: "Waktu istirahat selesai. Siap untuk set berikutnya.",
          });
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isResting]);

  const startRestTimer = (seconds: number = 120) => {
    setInitialRestDuration(seconds);
    setRestTimeLeft(seconds);
    setIsResting(true);
    setIsRestMinimized(false);
  };

  const adjustRestTime = (delta: number) => {
    setRestTimeLeft((prev) => {
      const next = prev + delta;
      if (next <= 0) {
        setIsResting(false);
        setIsRestMinimized(false);
        return 120;
      }
      if (next > initialRestDuration) {
        setInitialRestDuration(next);
      }
      return next;
    });
  };

  // Modify target sets
  const ubahTargetSet = (idGerakan: number, setBaru: number) => {
    if (setBaru < 1 || setBaru > 10) return;
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === idGerakan) {
          const currentSets = ex.setsData || [];
          let newSetsData = [...currentSets];
          if (setBaru > currentSets.length) {
            const tambah = setBaru - currentSets.length;
            newSetsData = [
              ...newSetsData,
              ...Array.from({ length: tambah }, () => ({
                weight: "",
                reps: "",
                rir: 1,
                notes: "",
                isCompleted: false,
              })),
            ];
          } else if (setBaru < currentSets.length) {
            newSetsData = newSetsData.slice(0, setBaru);
          }
          return { ...ex, targetSets: setBaru, setsData: newSetsData };
        }
        return ex;
      })
    );
  };

  // Delete exercise
  const hapusGerakan = (idGerakan: number) => {
    setActiveExercises((prev) => {
      const filtered = prev.filter((g) => g.id !== idGerakan);
      if (currentIndex >= filtered.length && filtered.length > 0) {
        setCurrentIndex(filtered.length - 1);
      }
      return filtered;
    });
    showToast("Gerakan dihapus dari sesi ini.", "info");
  };

  // Add custom exercise
  const handleTambahGerakan = async () => {
    if (!namaGerakanBaru.trim()) return;
    setIsAddingExercise(true);

    try {
      const res = await createExercise(
        initialCategory.id,
        namaGerakanBaru.trim()
      );
      const newId = res?.data?.id || Date.now();

      const newExercise: Exercise = {
        id: newId,
        category_id: initialCategory.id,
        name: namaGerakanBaru.trim(),
        targetSets: 3,
        notes: "",
        setsData: Array.from({ length: 3 }, () => ({
          weight: "",
          reps: "",
          rir: 1,
          notes: "",
          isCompleted: false,
        })),
      };

      setActiveExercises((prev) => [...prev, newExercise]);
      setNamaGerakanBaru("");
      showToast(`Gerakan "${newExercise.name}" ditambahkan.`, "success");
    } catch {
      const newExercise: Exercise = {
        id: Date.now(),
        category_id: initialCategory.id,
        name: namaGerakanBaru.trim(),
        targetSets: 3,
        notes: "",
        setsData: Array.from({ length: 3 }, () => ({
          weight: "",
          reps: "",
          rir: 1,
          notes: "",
          isCompleted: false,
        })),
      };
      setActiveExercises((prev) => [...prev, newExercise]);
      setNamaGerakanBaru("");
      showToast(`Gerakan "${newExercise.name}" ditambahkan secara lokal.`, "info");
    } finally {
      setIsAddingExercise(false);
    }
  };

  const updateSetField = (
    idGerakan: number,
    setIndex: number,
    field: keyof SetData,
    value: string | number | boolean
  ) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === idGerakan) {
          const updatedSets = ex.setsData ? [...ex.setsData] : [];
          const currentSet = updatedSets[setIndex]
            ? { ...updatedSets[setIndex] }
            : { weight: "", reps: "", rir: 1, notes: "", isCompleted: false };

          updatedSets[setIndex] = {
            ...currentSet,
            [field]: value,
          };

          return { ...ex, setsData: updatedSets };
        }
        return ex;
      })
    );
  };

  const updateExerciseNotes = (idGerakan: number, notes: string) => {
    setActiveExercises((prev) =>
      prev.map((ex) => (ex.id === idGerakan ? { ...ex, notes } : ex))
    );
  };

  // Toggle set completed with sequential & input validation
  const toggleSetCompleted = (idGerakan: number, setIndex: number) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === idGerakan) {
          const currentSets = ex.setsData ? [...ex.setsData] : [];
          const currentSet = currentSets[setIndex]
            ? { ...currentSets[setIndex] }
            : { weight: "", reps: "", rir: 1, notes: "", isCompleted: false };

          if (!currentSet.isCompleted) {
            if (setIndex > 0 && !currentSets[setIndex - 1]?.isCompleted) {
              showToast("Selesaikan set sebelumnya terlebih dahulu.", "warning");
              return ex;
            }

            if (!currentSet.weight || !currentSet.reps) {
              showToast(
                "Masukkan beban (KG) dan repetisi sebelum mencentang set.",
                "warning"
              );
              return ex;
            }

            currentSet.isCompleted = true;
            currentSets[setIndex] = currentSet;

            startRestTimer(120);
            showToast(
              `Set ${setIndex + 1} selesai. Timer istirahat 2 menit dimulai.`,
              "success"
            );
          } else {
            currentSet.isCompleted = false;
            currentSets[setIndex] = currentSet;
          }

          return { ...ex, setsData: currentSets };
        }
        return ex;
      })
    );
  };

  const totalCompletedSets = activeExercises.reduce((acc, ex) => {
    return acc + (ex.setsData?.filter((s) => s.isCompleted).length || 0);
  }, 0);

  const totalPlannedSets = activeExercises.reduce((acc, ex) => {
    return acc + (ex.targetSets || 0);
  }, 0);

  const totalVolumeKg = activeExercises.reduce((acc, ex) => {
    return (
      acc +
      (ex.setsData?.reduce((sAcc, s) => {
        if (s.isCompleted && s.weight && s.reps) {
          return sAcc + parseFloat(s.weight) * parseInt(s.reps, 10);
        }
        return sAcc;
      }, 0) || 0)
    );
  }, 0);

  const handleSaveWorkout = async () => {
    const logsToSave: WorkoutLogEntry[] = [];

    activeExercises.forEach((ex) => {
      ex.setsData?.forEach((s, idx) => {
        if (s.isCompleted && s.weight && s.reps) {
          logsToSave.push({
            exercise_id: ex.id,
            set_number: idx + 1,
            weight: parseFloat(s.weight),
            reps: parseInt(s.reps, 10),
            rir: s.rir ?? 1,
            notes: s.notes || ex.notes || null,
          });
        }
      });
    });

    if (logsToSave.length === 0) {
      showToast(
        "Belum ada set yang diselesaikan untuk disimpan.",
        "warning"
      );
      return;
    }

    setIsSaving(true);
    const res = await saveWorkoutLogs(logsToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveSuccess(res.message);
      showToast("Latihan berhasil disimpan ke database.", "success");
    } else {
      showToast(res.message || "Gagal menyimpan latihan.", "error");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentExercise = activeExercises[currentIndex] || activeExercises[0];
  const progressPct =
    totalPlannedSets > 0
      ? Math.round((totalCompletedSets / totalPlannedSets) * 100)
      : 0;

  // Rest ring math
  const ringRadius = 64;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const restRatio =
    initialRestDuration > 0
      ? Math.max(0, Math.min(1, restTimeLeft / initialRestDuration))
      : 0;
  const ringDashOffset = ringCircumference * (1 - restRatio);

  return (
    <div className="relative">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#141916] text-white px-4 py-3 rounded-xl shadow-lg border border-[#48524C] flex items-center gap-2.5 text-sm max-w-[92vw]"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
          ) : toast.type === "warning" || toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-[#FDBA74] shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 p-1 text-[#C5CCC0] hover:text-white rounded-md cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MINIMIZED REST TIMER BANNER */}
      {isResting && isRestMinimized && (
        <div className="mb-4 p-3.5 bg-[#FFF1EA] border border-[#F4C4AC] rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C84B11] text-white flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#C84B11] block">
                Timer Istirahat Berjalan
              </span>
              <span className="text-lg font-bold font-mono tabular-nums text-[#141916]">
                {formatTime(restTimeLeft)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustRestTime(30)}
              className="h-9 px-3 bg-white hover:bg-[#ECEFE9] border border-[#F4C4AC] text-[#141916] rounded-xl text-xs font-semibold cursor-pointer"
            >
              +30d
            </button>
            <button
              type="button"
              onClick={() => {
                setIsResting(false);
                setIsRestMinimized(false);
              }}
              className="h-9 px-3 bg-[#C84B11] hover:bg-[#A83D0B] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Lewati
            </button>
            <button
              type="button"
              onClick={() => setIsRestMinimized(false)}
              className="h-9 w-9 bg-white hover:bg-[#ECEFE9] border border-[#DCE1D8] text-[#48524C] rounded-xl flex items-center justify-center cursor-pointer"
              aria-label="Perbesar timer istirahat"
              title="Perbesar timer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* REST TIMER MODAL */}
      {isResting && !isRestMinimized && (
        <div
          className="fixed inset-0 bg-[#141916]/60 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rest-timer-title"
        >
          <div className="bg-white border border-[#DCE1D8] p-6 sm:p-8 rounded-2xl text-center max-w-sm w-full shadow-xl relative">
            <button
              type="button"
              onClick={() => setIsRestMinimized(true)}
              className="absolute top-4 right-4 h-9 w-9 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#48524C] rounded-xl flex items-center justify-center cursor-pointer"
              aria-label="Perkecil timer istirahat"
              title="Perkecil"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-2 text-[#C84B11] font-semibold text-xs px-3 py-1 rounded-lg bg-[#FFF1EA] border border-[#F4C4AC]">
              <Timer className="w-4 h-4" />
              <span id="rest-timer-title">Waktu Istirahat Set</span>
            </div>

            {/* SVG Circular Countdown */}
            <div className="my-6 relative flex items-center justify-center">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={ringRadius}
                  fill="none"
                  stroke="#ECEFE9"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={ringRadius}
                  fill="none"
                  stroke="#C84B11"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  className="transition-[stroke-dashoffset] duration-700 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold tracking-tight text-[#141916] font-mono tabular-nums">
                  {formatTime(restTimeLeft)}
                </span>
                <span className="text-xs text-[#626E67] mt-1">Sisa Waktu</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] mb-5 text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C84B11] mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Tips Hipertrofi</span>
              </div>
              <p className="text-xs text-[#48524C] leading-relaxed">
                Istirahat 2–3 menit membantu pemulihan ATP agar kualitas repetisi pada set berikutnya tetap terjaga.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsResting(false);
                  setIsRestMinimized(false);
                }}
                className="w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer"
              >
                Lewati Istirahat (Siap Set)
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => adjustRestTime(-15)}
                  className="h-10 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl transition-colors text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>15 Detik</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustRestTime(30)}
                  className="h-10 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl transition-colors text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>30 Detik</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY & FINISH MODAL */}
      {isSummaryOpen && (
        <div
          className="fixed inset-0 bg-[#141916]/65 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSummaryOpen(false);
          }}
        >
          <div className="bg-white border border-[#DCE1D8] p-6 sm:p-7 rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setIsSummaryOpen(false)}
              className="absolute top-4 right-4 h-9 w-9 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#48524C] rounded-xl flex items-center justify-center cursor-pointer"
              aria-label="Tutup ringkasan"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#FFF1EA] border border-[#F4C4AC] rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#C84B11]">
                <Trophy className="w-7 h-7" />
              </div>
              <h2
                id="summary-modal-title"
                className="text-2xl font-bold text-[#141916]"
              >
                Ringkasan Sesi Latihan
              </h2>
              <p className="text-[#48524C] text-sm mt-1">
                Evaluasi total set dan volume untuk sesi {initialCategory.name}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] text-center">
                <span className="text-xs text-[#626E67] block mb-1">
                  Total Set
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-[#C84B11]">
                  {totalCompletedSets}
                </span>
              </div>
              <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] text-center">
                <span className="text-xs text-[#626E67] block mb-1">
                  Total Volume
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-[#047857]">
                  {totalVolumeKg.toLocaleString()} kg
                </span>
              </div>
              <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] text-center">
                <span className="text-xs text-[#626E67] block mb-1">
                  Durasi
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-[#1D4ED8]">
                  {formatTime(workoutSeconds)}
                </span>
              </div>
            </div>

            {/* Exercise Breakdown */}
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#626E67]">
                Rincian Set Terselesaikan
              </h3>
              {totalCompletedSets === 0 ? (
                <div className="p-4 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl text-sm text-[#48524C] text-center">
                  Belum ada set yang ditandai selesai pada sesi ini.
                </div>
              ) : (
                activeExercises.map((ex) => {
                  const doneSets =
                    ex.setsData?.filter((s) => s.isCompleted) || [];
                  if (doneSets.length === 0) return null;
                  return (
                    <div
                      key={ex.id}
                      className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] text-sm"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-semibold text-[#141916]">
                          {ex.name}
                        </span>
                        <span className="text-xs text-[#C84B11] font-mono tabular-nums font-semibold">
                          {doneSets.length} Set
                        </span>
                      </div>
                      {ex.notes && (
                        <p className="text-xs text-[#48524C] mb-2 flex items-center gap-1.5">
                          <StickyNote className="w-3.5 h-3.5 text-[#C84B11] shrink-0" />
                          <span>{ex.notes}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {doneSets.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-mono tabular-nums bg-white border border-[#DCE1D8] px-2.5 py-1 rounded-lg text-[#48524C]"
                          >
                            Set {idx + 1}:{" "}
                            <strong className="text-[#141916]">
                              {s.weight} kg
                            </strong>{" "}
                            × {s.reps} (RIR {s.rir})
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {saveSuccess ? (
              <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-[#047857] mx-auto mb-2" />
                <p className="text-[#047857] font-semibold text-sm">
                  {saveSuccess}
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center justify-center w-full h-11 bg-[#141916] hover:bg-[#48524C] text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Kembali ke Dashboard
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleSaveWorkout}
                  disabled={isSaving || totalCompletedSets === 0}
                  className="w-full h-11 bg-[#047857] hover:bg-[#065F46] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? "Menyimpan ke Database..."
                      : "Simpan Sesi ke Database"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSummaryOpen(false)}
                  className="w-full h-10 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#48524C] hover:text-[#141916] rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Lanjut Latihan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL FOR INDIVIDUAL SET NOTE */}
      {activeSetNoteModal && (
        <div
          className="fixed inset-0 bg-[#141916]/60 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="set-note-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveSetNoteModal(null);
          }}
        >
          <div className="bg-white border border-[#DCE1D8] p-6 rounded-2xl max-w-sm w-full shadow-xl">
            <h3
              id="set-note-title"
              className="text-base font-bold text-[#141916] mb-1.5 flex items-center gap-2"
            >
              <StickyNote className="w-4 h-4 text-[#C84B11]" />
              <span>Catatan Set {activeSetNoteModal.setIndex + 1}</span>
            </h3>
            <p className="text-xs text-[#48524C] mb-3">
              Catat sensasi otot, tempo (misal 3-1-1), atau teknik tambahan seperti drop set.
            </p>
            <textarea
              rows={3}
              placeholder="Contoh: Kontraksi maksimal di puncak, drop set 2 reps terakhir..."
              value={tempNoteText}
              onChange={(e) => setTempNoteText(e.target.value)}
              className="w-full p-3 bg-white border border-[#C5CCC0] rounded-xl text-[#141916] placeholder:text-[#626E67] text-sm outline-none focus:border-[#C84B11] mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const ex = activeExercises[activeSetNoteModal.exerciseIndex];
                  updateSetField(
                    ex.id,
                    activeSetNoteModal.setIndex,
                    "notes",
                    tempNoteText
                  );
                  setActiveSetNoteModal(null);
                  showToast("Catatan set tersimpan.", "success");
                }}
                className="flex-1 h-10 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-semibold rounded-xl text-sm cursor-pointer"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setActiveSetNoteModal(null)}
                className="px-4 h-10 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#48524C] font-semibold rounded-xl text-sm cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {!isTracking ? (
        /* ========================================================================= */
        /* FASE 1: PERSIAPAN & CUSTOMISASI JADWAL HIPERTROFI                          */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Exercise List + Quick Add */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#141916] flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[#C84B11]" />
                  <span>Susunan Gerakan & Target Set</span>
                </h2>
                <p className="text-sm text-[#48524C] mt-0.5">
                  Atur jumlah set dan tambahkan catatan teknik sebelum memulai sesi aktif.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold text-[#C84B11] bg-[#FFF1EA] border border-[#F4C4AC] px-3 py-1 rounded-lg shrink-0">
                {activeExercises.length} Gerakan
              </span>
            </div>

            {activeExercises.length === 0 ? (
              <div className="p-8 bg-white border border-[#DCE1D8] rounded-2xl text-center">
                <p className="text-sm font-semibold text-[#141916]">
                  Daftar gerakan kosong
                </p>
                <p className="text-xs text-[#48524C] mt-1">
                  Tambahkan minimal satu variasi gerakan di bawah untuk memulai latihan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeExercises.map((exercise, idx) => (
                  <div
                    key={exercise.id}
                    className="p-4 sm:p-5 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs hover:border-[#C5CCC0] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#ECEFE9] border border-[#DCE1D8] flex items-center justify-center text-xs font-bold font-mono tabular-nums text-[#141916] shrink-0">
                            {idx + 1}
                          </span>
                          <h3 className="font-semibold text-base text-[#141916] truncate">
                            {exercise.name}
                          </h3>
                        </div>

                        <input
                          type="text"
                          aria-label={`Catatan teknik untuk ${exercise.name}`}
                          placeholder="Catatan form/tempo (misal: Tempo 3-0-1, kemiringan bangku 30°)"
                          value={exercise.notes || ""}
                          onChange={(e) =>
                            updateExerciseNotes(exercise.id, e.target.value)
                          }
                          className="w-full h-10 text-sm bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl px-3.5 text-[#141916] placeholder:text-[#626E67] focus:bg-white focus:border-[#C84B11] outline-none transition-colors"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#48524C]">
                            Target Set
                          </span>
                          <div className="flex items-center border border-[#C5CCC0] rounded-xl bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                ubahTargetSet(
                                  exercise.id,
                                  (exercise.targetSets || 3) - 1
                                )
                              }
                              className="w-10 h-10 flex items-center justify-center text-[#48524C] hover:text-[#141916] hover:bg-[#ECEFE9] transition-colors cursor-pointer"
                              aria-label={`Kurangi target set ${exercise.name}`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 text-sm font-bold text-[#141916] font-mono tabular-nums min-w-[3.5rem] text-center">
                              {exercise.targetSets || 3}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                ubahTargetSet(
                                  exercise.id,
                                  (exercise.targetSets || 3) + 1
                                )
                              }
                              className="w-10 h-10 flex items-center justify-center text-[#48524C] hover:text-[#141916] hover:bg-[#ECEFE9] transition-colors cursor-pointer"
                              aria-label={`Tambah target set ${exercise.name}`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => hapusGerakan(exercise.id)}
                          className="w-10 h-10 flex items-center justify-center text-[#626E67] hover:text-[#BE123C] hover:bg-[#FFF1F2] border border-transparent hover:border-[#FECDD3] rounded-xl transition-colors cursor-pointer"
                          aria-label={`Hapus ${exercise.name}`}
                          title="Hapus Gerakan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add custom exercise */}
            <div className="flex flex-col sm:flex-row gap-2.5 p-3 bg-white border border-[#DCE1D8] rounded-2xl shadow-xs">
              <input
                type="text"
                aria-label="Nama variasi gerakan baru"
                placeholder="Tambah variasi gerakan baru (misal: Cable Lateral Raise)..."
                value={namaGerakanBaru}
                onChange={(e) => setNamaGerakanBaru(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTambahGerakan()}
                className="flex-1 h-11 px-3.5 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl text-sm text-[#141916] outline-none focus:bg-white focus:border-[#C84B11] placeholder:text-[#626E67]"
              />
              <button
                type="button"
                onClick={handleTambahGerakan}
                disabled={isAddingExercise || !namaGerakanBaru.trim()}
                className="h-11 px-5 bg-[#141916] hover:bg-[#48524C] disabled:opacity-40 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingExercise ? "Menambahkan..." : "Tambah Gerakan"}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Session Summary & Primary Start CTA */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 bg-white border border-[#DCE1D8] rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#141916]">
                Ringkasan Sesi
              </h3>
              <p className="text-xs text-[#626E67] mt-0.5">
                Siap dieksekusi untuk split {initialCategory.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl">
                <span className="text-xs text-[#626E67] block">
                  Total Gerakan
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-[#141916] mt-0.5 block">
                  {activeExercises.length}
                </span>
              </div>
              <div className="p-3.5 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl">
                <span className="text-xs text-[#626E67] block">
                  Total Target Set
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-[#C84B11] mt-0.5 block">
                  {totalPlannedSets}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-[#FFF1EA] border border-[#F4C4AC] rounded-xl text-xs text-[#48524C] leading-relaxed">
              <strong className="text-[#C84B11] font-semibold block mb-0.5">
                Panduan Eksekusi (1–2 RIR)
              </strong>
              Sisakan 1 hingga 2 repetisi sebelum gagal otot di setiap set kerja untuk stimulus hipertrofi optimal tanpa kelelahan berlebih.
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeExercises.length === 0) {
                  showToast(
                    "Pilih minimal 1 gerakan sebelum memulai latihan.",
                    "warning"
                  );
                  return;
                }
                setCurrentIndex(0);
                setIsTracking(true);
              }}
              className="w-full h-12 bg-[#C84B11] hover:bg-[#A83D0B] text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Flame className="w-4 h-4" />
              <span>Mulai Sesi Latihan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </aside>
        </div>
      ) : (
        /* ========================================================================= */
        /* FASE 2: MODE TRACKER EKSEKUSI DI GYM                                     */
        /* ========================================================================= */
        <div className="space-y-5">
          {/* Sticky Live Session Bar */}
          <div className="sticky top-16 md:top-[68px] z-30 bg-white border border-[#DCE1D8] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1EA] border border-[#F4C4AC] text-[#C84B11] flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#141916]">
                      {initialCategory.name} Session
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[#ECEFE9] text-[#141916] font-mono tabular-nums font-semibold">
                      {formatTime(workoutSeconds)}
                    </span>
                  </div>
                  <div className="text-xs text-[#48524C] font-mono tabular-nums mt-0.5">
                    {totalCompletedSets}/{totalPlannedSets} Set • Volume:{" "}
                    <strong className="text-[#141916]">
                      {totalVolumeKg.toLocaleString()} kg
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => startRestTimer(120)}
                  className="h-10 px-3 bg-[#FFF1EA] hover:bg-[#F4C4AC]/40 border border-[#F4C4AC] text-[#C84B11] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timer Rest (2m)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSummaryOpen(true)}
                  className="h-10 px-4 bg-[#047857] hover:bg-[#065F46] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Selesai & Simpan ({totalCompletedSets}/{totalPlannedSets})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTracking(false)}
                  className="h-10 px-3 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#48524C] hover:text-[#141916] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  title="Kembali ubah susunan gerakan"
                >
                  Susunan
                </button>
              </div>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full h-1.5 bg-[#ECEFE9] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#047857] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Exercise Quick-Switch Rail */}
          {activeExercises.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto pb-1"
              role="tablist"
              aria-label="Daftar gerakan sesi"
            >
              {activeExercises.map((ex, i) => {
                const doneCount =
                  ex.setsData?.filter((s) => s.isCompleted).length || 0;
                const target = ex.targetSets || 3;
                const isDoneAll = doneCount >= target && target > 0;
                const isActive = i === currentIndex;

                return (
                  <button
                    key={ex.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setCurrentIndex(i)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#141916] text-white border-[#141916]"
                        : isDoneAll
                        ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] hover:border-[#047857]"
                        : "bg-white text-[#48524C] border-[#DCE1D8] hover:border-[#C5CCC0] hover:text-[#141916]"
                    }`}
                  >
                    <span className="truncate max-w-[160px]">{ex.name}</span>
                    <span
                      className={`font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? "bg-white/15 text-white"
                          : isDoneAll
                          ? "bg-white text-[#047857]"
                          : "bg-[#ECEFE9] text-[#48524C]"
                      }`}
                    >
                      {doneCount}/{target}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Exercise Logging Card */}
          {activeExercises.length > 0 && currentExercise ? (
            <div className="bg-white border border-[#DCE1D8] rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DCE1D8] gap-3 mb-5">
                <div>
                  <span className="inline-block text-xs font-mono tabular-nums font-semibold text-[#C84B11] bg-[#FFF1EA] border border-[#F4C4AC] px-2.5 py-0.5 rounded-lg mb-2">
                    Gerakan {currentIndex + 1} dari {activeExercises.length}
                  </span>
                  <h2 className="text-2xl font-bold text-[#141916] tracking-tight">
                    {currentExercise.name}
                  </h2>
                </div>
              </div>

              {/* Exercise Cue Note */}
              <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#DCE1D8] mb-6">
                <label
                  htmlFor={`exercise-note-${currentExercise.id}`}
                  className="text-xs font-semibold text-[#48524C] flex items-center gap-1.5 mb-1.5"
                >
                  <StickyNote className="w-3.5 h-3.5 text-[#C84B11]" />
                  <span>Catatan Bentuk & Posisi</span>
                </label>
                <input
                  id={`exercise-note-${currentExercise.id}`}
                  type="text"
                  placeholder="Ketik catatan gerakan (misal: Sudut bangku #3, regangan penuh di bawah)..."
                  value={currentExercise.notes || ""}
                  onChange={(e) =>
                    updateExerciseNotes(currentExercise.id, e.target.value)
                  }
                  className="w-full text-sm bg-white border border-[#DCE1D8] focus:border-[#C84B11] rounded-lg px-3 py-2 text-[#141916] placeholder:text-[#626E67] outline-none"
                />
              </div>

              {/* Sets Table */}
              <div className="space-y-3 mb-6">
                {/* Desktop Column Headers */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-xs font-semibold text-[#626E67] px-3 uppercase tracking-wider">
                  <span className="col-span-1 text-center">Set</span>
                  <span className="col-span-3 text-center">Beban (kg)</span>
                  <span className="col-span-3 text-center">Repetisi</span>
                  <span
                    className="col-span-3 text-center flex items-center justify-center gap-1"
                    title="Reps In Reserve: sisa repetisi sebelum gagal otot"
                  >
                    <span>RIR</span>
                    <Info className="w-3.5 h-3.5 text-[#626E67]" />
                  </span>
                  <span className="col-span-2 text-center">Status</span>
                </div>

                {Array.from({ length: currentExercise.targetSets || 3 }).map(
                  (_, setIndex) => {
                    const setItem = currentExercise.setsData?.[setIndex] || {
                      weight: "",
                      reps: "",
                      rir: 1,
                      notes: "",
                      isCompleted: false,
                    };

                    const isLocked = setItem.isCompleted;
                    const isPreviousNotDone =
                      setIndex > 0 &&
                      !currentExercise.setsData?.[setIndex - 1]?.isCompleted;
                    const isDisabled = isLocked || isPreviousNotDone;

                    return (
                      <div
                        key={setIndex}
                        className={`p-3.5 rounded-2xl border transition-colors ${
                          isLocked
                            ? "bg-[#ECFDF5] border-[#A7F3D0]"
                            : isPreviousNotDone
                            ? "bg-[#F5F6F3] border-[#DCE1D8] opacity-75"
                            : "bg-white border-[#DCE1D8] hover:border-[#C5CCC0]"
                        }`}
                      >
                        {/* Desktop 12-col row */}
                        <div className="hidden sm:grid sm:grid-cols-12 gap-3 items-center">
                          <div className="col-span-1 text-center">
                            <span
                              className={`w-8 h-8 rounded-lg inline-flex items-center justify-center text-xs font-bold font-mono tabular-nums ${
                                isLocked
                                  ? "bg-[#047857] text-white"
                                  : "bg-[#ECEFE9] text-[#141916]"
                              }`}
                            >
                              {setIndex + 1}
                            </span>
                          </div>

                          <div className="col-span-3">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              aria-label={`Beban kg untuk set ${setIndex + 1}`}
                              placeholder="0"
                              value={setItem.weight}
                              onChange={(e) =>
                                updateSetField(
                                  currentExercise.id,
                                  setIndex,
                                  "weight",
                                  e.target.value
                                )
                              }
                              disabled={isDisabled}
                              className={`w-full h-11 px-2 text-center rounded-xl font-mono tabular-nums text-base font-semibold outline-none transition-colors ${
                                isDisabled
                                  ? "bg-[#ECEFE9] border border-[#DCE1D8] text-[#626E67] cursor-not-allowed"
                                  : "bg-white border border-[#C5CCC0] text-[#141916] focus:border-[#C84B11]"
                              }`}
                            />
                          </div>

                          <div className="col-span-3">
                            <input
                              type="number"
                              min="0"
                              aria-label={`Repetisi untuk set ${setIndex + 1}`}
                              placeholder="0"
                              value={setItem.reps}
                              onChange={(e) =>
                                updateSetField(
                                  currentExercise.id,
                                  setIndex,
                                  "reps",
                                  e.target.value
                                )
                              }
                              disabled={isDisabled}
                              className={`w-full h-11 px-2 text-center rounded-xl font-mono tabular-nums text-base font-semibold outline-none transition-colors ${
                                isDisabled
                                  ? "bg-[#ECEFE9] border border-[#DCE1D8] text-[#626E67] cursor-not-allowed"
                                  : "bg-white border border-[#C5CCC0] text-[#141916] focus:border-[#C84B11]"
                              }`}
                            />
                          </div>

                          <div className="col-span-3">
                            <select
                              aria-label={`RIR untuk set ${setIndex + 1}`}
                              value={setItem.rir ?? 1}
                              onChange={(e) =>
                                updateSetField(
                                  currentExercise.id,
                                  setIndex,
                                  "rir",
                                  parseInt(e.target.value, 10)
                                )
                              }
                              disabled={isDisabled}
                              className={`w-full h-11 px-2 text-center rounded-xl font-mono tabular-nums text-xs font-semibold outline-none transition-colors ${
                                isDisabled
                                  ? "bg-[#ECEFE9] border border-[#DCE1D8] text-[#626E67] cursor-not-allowed"
                                  : "bg-white border border-[#C5CCC0] text-[#141916] focus:border-[#C84B11]"
                              }`}
                            >
                              <option value={0}>0 (Failure)</option>
                              <option value={1}>1 (Sangat Keras)</option>
                              <option value={2}>2 (Optimal)</option>
                              <option value={3}>3 (Sedang)</option>
                              <option value={4}>4+ (Pemanasan)</option>
                            </select>
                          </div>

                          <div className="col-span-2 flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSetNoteModal({
                                  exerciseIndex: currentIndex,
                                  setIndex,
                                });
                                setTempNoteText(setItem.notes || "");
                              }}
                              className={`w-10 h-11 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                                setItem.notes
                                  ? "text-[#C84B11] bg-[#FFF1EA] border-[#F4C4AC]"
                                  : "text-[#626E67] bg-white border-[#DCE1D8] hover:text-[#141916] hover:border-[#C5CCC0]"
                              }`}
                              aria-label={`Catatan set ${setIndex + 1}`}
                              title="Tambah Catatan Set"
                            >
                              <StickyNote className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleSetCompleted(currentExercise.id, setIndex)
                              }
                              className={`flex-1 h-11 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center cursor-pointer ${
                                isLocked
                                  ? "bg-[#047857] hover:bg-[#065F46] text-white"
                                  : "bg-[#141916] hover:bg-[#C84B11] text-white"
                              }`}
                              aria-label={
                                isLocked
                                  ? `Batalkan selesai set ${setIndex + 1}`
                                  : `Catat selesai set ${setIndex + 1}`
                              }
                            >
                              {isLocked ? "Selesai" : "Catat"}
                            </button>
                          </div>
                        </div>

                        {/* Mobile 2-row card */}
                        <div className="sm:hidden space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs font-bold font-mono tabular-nums ${
                                  isLocked
                                    ? "bg-[#047857] text-white"
                                    : "bg-[#ECEFE9] text-[#141916]"
                                }`}
                              >
                                {setIndex + 1}
                              </span>
                              <span className="text-sm font-semibold text-[#141916]">
                                Set {setIndex + 1}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSetNoteModal({
                                    exerciseIndex: currentIndex,
                                    setIndex,
                                  });
                                  setTempNoteText(setItem.notes || "");
                                }}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border cursor-pointer ${
                                  setItem.notes
                                    ? "text-[#C84B11] bg-[#FFF1EA] border-[#F4C4AC]"
                                    : "text-[#626E67] bg-white border-[#DCE1D8]"
                                }`}
                                aria-label={`Catatan set ${setIndex + 1}`}
                              >
                                <StickyNote className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSetCompleted(
                                    currentExercise.id,
                                    setIndex
                                  )
                                }
                                className={`h-10 px-4 rounded-xl text-xs font-bold cursor-pointer ${
                                  isLocked
                                    ? "bg-[#047857] text-white"
                                    : "bg-[#141916] text-white"
                                }`}
                              >
                                {isLocked ? "Selesai" : "Catat"}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-[#626E67] mb-1">
                                Beban (kg)
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="0"
                                value={setItem.weight}
                                onChange={(e) =>
                                  updateSetField(
                                    currentExercise.id,
                                    setIndex,
                                    "weight",
                                    e.target.value
                                  )
                                }
                                disabled={isDisabled}
                                className={`w-full h-11 px-2 text-center rounded-xl font-mono tabular-nums text-base font-semibold outline-none ${
                                  isDisabled
                                    ? "bg-[#ECEFE9] border border-[#DCE1D8] text-[#626E67]"
                                    : "bg-white border border-[#C5CCC0] text-[#141916] focus:border-[#C84B11]"
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#626E67] mb-1">
                                Repetisi
                              </label>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={setItem.reps}
                                onChange={(e) =>
                                  updateSetField(
                                    currentExercise.id,
                                    setIndex,
                                    "reps",
                                    e.target.value
                                  )
                                }
                                disabled={isDisabled}
                                className={`w-full h-11 px-2 text-center rounded-xl font-mono tabular-nums text-base font-semibold outline-none ${
                                  isDisabled
                                    ? "bg-[#ECEFE9] border border-[#DCE1D8] text-[#626E67]"
                                    : "bg-white border border-[#C5CCC0] text-[#141916] focus:border-[#C84B11]"
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#626E67] mb-1">
                                RIR
                              </label>
                              <select
                                value={setItem.rir ?? 1}
                                onChange={(e) =>
                                  updateSetField(
                                    currentExercise.id,
                                    setIndex,
                                    "rir",
                                    parseInt(e.target.value, 10)
                                  )
                                }
                                disabled={isDisabled}
                                className={`w-full h-11 px-1.5 text-center rounded-xl font-mono tabular-nums text-xs font-semibold outline-none ${
                                  isDisabled
                                    ? "bg-[#ECEFE9] border border-[#DCE1D8] text-[#626E67]"
                                    : "bg-white border border-[#C5CCC0] text-[#141916] focus:border-[#C84B11]"
                                }`}
                              >
                                <option value={0}>0 (Fail)</option>
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                                <option value={4}>4+</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Prev / Next Exercise Pagination */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#DCE1D8]">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="h-10 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] disabled:opacity-40 text-[#141916] font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <span className="text-xs font-mono tabular-nums font-semibold text-[#626E67]">
                  {currentIndex + 1} / {activeExercises.length}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(activeExercises.length - 1, prev + 1)
                    )
                  }
                  disabled={currentIndex === activeExercises.length - 1}
                  className="h-10 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] disabled:opacity-40 text-[#141916] font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-[#DCE1D8] rounded-2xl">
              <p className="text-[#48524C] text-sm">
                Semua gerakan telah diselesaikan.
              </p>
              <button
                type="button"
                onClick={() => setIsSummaryOpen(true)}
                className="mt-4 h-11 px-6 bg-[#047857] hover:bg-[#065F46] font-semibold text-white rounded-xl text-sm cursor-pointer"
              >
                Lihat Ringkasan & Simpan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
