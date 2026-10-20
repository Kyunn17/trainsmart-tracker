"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Dumbbell, 
  Timer, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Flame, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  ArrowLeft, 
  Trophy, 
  Info,
  Clock,
  Zap,
  StickyNote
} from "lucide-react";
import { Category, Exercise, SetData, WorkoutLogEntry } from "@/types/workout";
import { saveWorkoutLogs, createExercise } from "@/lib/api";

interface Props {
  initialCategory: Category;
}

export default function WorkoutPlanner({ initialCategory }: Props) {
  // Normalize exercises with hypertrophy fields
  const [activeExercises, setActiveExercises] = useState<Exercise[]>(() => {
    return initialCategory.exercises.map((ex) => ({
      ...ex,
      targetSets: ex.targetSets || 3,
      notes: ex.notes || "",
      setsData: Array.from({ length: ex.targetSets || 3 }, () => ({
        weight: "",
        reps: "",
        rir: 1, // Default 1-2 RIR (optimal hypertrophy target)
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
  const [restTimeLeft, setRestTimeLeft] = useState(120); // 120s default rest for hypertrophy
  const [initialRestDuration, setInitialRestDuration] = useState(120);

  // Notes & UI drawer
  const [activeSetNoteModal, setActiveSetNoteModal] = useState<{ exerciseIndex: number; setIndex: number } | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");

  // Workout Summary & Save Modal
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
          showToast("⏰ Waktu istirahat selesai! Siap untuk set berikutnya.");
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
    setActiveExercises((prev) => prev.filter((g) => g.id !== idGerakan));
    showToast("Gerakan dihapus dari sesi ini.");
  };

  // Add custom exercise
  const handleTambahGerakan = async () => {
    if (!namaGerakanBaru.trim()) return;
    setIsAddingExercise(true);

    try {
      const res = await createExercise(initialCategory.id, namaGerakanBaru.trim());
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
      showToast(`Gerakan "${newExercise.name}" ditambahkan!`);
    } catch {
      // Local fallback
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
    } finally {
      setIsAddingExercise(false);
    }
  };

  // Input change for set
  const updateSetField = (
    idGerakan: number,
    setIndex: number,
    field: keyof SetData,
    value: any
  ) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === idGerakan) {
          const updatedSets = ex.setsData ? [...ex.setsData] : [];
          const currentSet = updatedSets[setIndex]
            ? { ...updatedSets[setIndex] }
            : { weight: "", reps: "", rir: 1, notes: "", isCompleted: false };

          (currentSet as any)[field] = value;
          updatedSets[setIndex] = currentSet;

          return { ...ex, setsData: updatedSets };
        }
        return ex;
      })
    );
  };

  // Exercise notes update
  const updateExerciseNotes = (idGerakan: number, notes: string) => {
    setActiveExercises((prev) =>
      prev.map((ex) => (ex.id === idGerakan ? { ...ex, notes } : ex))
    );
  };

  // Toggle set completed with hypertrophy validation
  const toggleSetCompleted = (idGerakan: number, setIndex: number) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === idGerakan) {
          const currentSets = ex.setsData ? [...ex.setsData] : [];
          const currentSet = currentSets[setIndex]
            ? { ...currentSets[setIndex] }
            : { weight: "", reps: "", rir: 1, notes: "", isCompleted: false };

          if (!currentSet.isCompleted) {
            // Require previous set completion
            if (setIndex > 0 && !currentSets[setIndex - 1]?.isCompleted) {
              showToast("⚠️ Selesaikan set sebelumnya terlebih dahulu!");
              return ex;
            }

            // Require weight & reps
            if (!currentSet.weight || !currentSet.reps) {
              showToast("⚠️ Masukkan beban (KG) dan repetisi sebelum mencentang!");
              return ex;
            }

            currentSet.isCompleted = true;
            currentSets[setIndex] = currentSet;

            // Trigger rest timer
            startRestTimer(120);
            showToast(`🔥 Set ${setIndex + 1} Selesai! Istirahat 2 menit untuk pemulihan otot.`);
          } else {
            // Uncheck
            currentSet.isCompleted = false;
            currentSets[setIndex] = currentSet;
          }

          return { ...ex, setsData: currentSets };
        }
        return ex;
      })
    );
  };

  // Calculate live session statistics
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
          return sAcc + parseFloat(s.weight) * parseInt(s.reps);
        }
        return sAcc;
      }, 0) || 0)
    );
  }, 0);

  // Save session to backend
  const handleSaveWorkout = async () => {
    const logsToSave: WorkoutLogEntry[] = [];

    activeExercises.forEach((ex) => {
      ex.setsData?.forEach((s, idx) => {
        if (s.isCompleted && s.weight && s.reps) {
          logsToSave.push({
            exercise_id: ex.id,
            set_number: idx + 1,
            weight: parseFloat(s.weight),
            reps: parseInt(s.reps),
            rir: s.rir ?? 1,
            notes: s.notes || ex.notes || null,
          });
        }
      });
    });

    if (logsToSave.length === 0) {
      showToast("⚠️ Belum ada set yang diselesaikan untuk disimpan!");
      return;
    }

    setIsSaving(true);
    const res = await saveWorkoutLogs(logsToSave);
    setIsSaving(false);

    if (res.success) {
      setSaveSuccess(res.message);
      showToast("🎉 Latihan berhasil disimpan ke database!");
    } else {
      showToast(`❌ ${res.message}`);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentExercise = activeExercises[currentIndex] || activeExercises[0];

  return (
    <div className="relative">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce bg-zinc-900 border border-amber-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-sm backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* REST TIMER POPUP MODAL */}
      {isResting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-center space-x-2 text-amber-400 mb-2 font-mono text-xs uppercase tracking-widest">
              <Timer className="w-4 h-4 animate-spin" />
              <span>Hypertrophy Rest Period</span>
            </div>

            {/* Glowing circular progress indicator */}
            <div className="my-6 relative flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border-4 border-zinc-800 flex flex-col items-center justify-center relative">
                <span className="text-5xl font-black tracking-tight text-white font-mono">
                  {formatTime(restTimeLeft)}
                </span>
                <span className="text-xs text-zinc-500 mt-1">Sisa Detik</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800 mb-6 text-left">
              <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Tips Hipertrofi:</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Istirahat 2-3 menit pada gerakan compound memungkinkan pemulihan cadangan phosphocreatine (ATP) penuh agar beban set selanjutnya tetap optimal.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => setIsResting(false)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm"
              >
                Lewati Istirahat (Siap Set)
              </button>
              <button
                onClick={() => setRestTimeLeft((prev) => prev + 30)}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition-colors text-xs flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah 30 Detik</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY & FINISH MODAL */}
      {isSummaryOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Sesi Selesai! Kerja Bagus 🔥</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Ringkasan progres hipertrofi untuk sesi {initialCategory.name}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center">
                <span className="text-xs text-zinc-400 block mb-1">Total Set</span>
                <span className="text-xl font-bold text-amber-400">{totalCompletedSets}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center">
                <span className="text-xs text-zinc-400 block mb-1">Total Volume</span>
                <span className="text-xl font-bold text-emerald-400">{totalVolumeKg.toLocaleString()} kg</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-center">
                <span className="text-xs text-zinc-400 block mb-1">Durasi</span>
                <span className="text-xl font-bold text-blue-400">{formatTime(workoutSeconds)}</span>
              </div>
            </div>

            {/* Exercise Breakdown */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Catatan Set & Hipertrofi
              </h4>
              {activeExercises.map((ex) => {
                const doneSets = ex.setsData?.filter((s) => s.isCompleted) || [];
                if (doneSets.length === 0) return null;
                return (
                  <div key={ex.id} className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-white">{ex.name}</span>
                      <span className="text-xs text-amber-400 font-mono">{doneSets.length} Set</span>
                    </div>
                    {ex.notes && (
                      <p className="text-xs text-zinc-400 italic mb-2">📝 {ex.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {doneSets.map((s, idx) => (
                        <span key={idx} className="text-xs bg-zinc-900 border border-zinc-700/60 px-2.5 py-1 rounded-md text-zinc-300">
                          Set {idx + 1}: <strong className="text-white">{s.weight}kg</strong> × {s.reps} reps (RIR {s.rir})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {saveSuccess ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl text-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-300 font-semibold text-sm">{saveSuccess}</p>
                <Link
                  href="/"
                  className="mt-4 inline-block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Kembali ke Dashboard
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleSaveWorkout}
                  disabled={isSaving}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Menyimpan ke Database..." : "Simpan Sesi ke Database"}</span>
                </button>
                <button
                  onClick={() => setIsSummaryOpen(false)}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
              <StickyNote className="w-4 h-4 text-amber-400" />
              <span>Catatan Set {activeSetNoteModal.setIndex + 1}</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-3">
              Catat sensasi otot, tempo (misal 3-1-1), pompa otot, atau drop set.
            </p>
            <textarea
              rows={3}
              placeholder="Contoh: Terasa kontraksi maksimal di puncak, drop set 2 reps terakhir..."
              value={tempNoteText}
              onChange={(e) => setTempNoteText(e.target.value)}
              className="w-full p-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-sm outline-none focus:border-amber-500 mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const ex = activeExercises[activeSetNoteModal.exerciseIndex];
                  updateSetField(ex.id, activeSetNoteModal.setIndex, "notes", tempNoteText);
                  setActiveSetNoteModal(null);
                  showToast("Catatan set tersimpan!");
                }}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-sm"
              >
                Simpan
              </button>
              <button
                onClick={() => setActiveSetNoteModal(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-sm"
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
        <div className="space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Dumbbell className="w-5 h-5 text-amber-400" />
                <span>Susunan Gerakan & Target Set</span>
              </h2>
              <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full font-mono">
                {activeExercises.length} Gerakan
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Sesuaikan target set dan tambahkan catatan teknik (tempo, posisi bangku, fokus regangan) sebelum mulai memompa otot.
            </p>
          </div>

          <div className="space-y-3.5">
            {activeExercises.map((exercise, idx) => (
              <div
                key={exercise.id}
                className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl transition-all hover:border-zinc-700 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                        {idx + 1}
                      </span>
                      <h3 className="font-semibold text-base text-white">{exercise.name}</h3>
                    </div>

                    {/* Exercise-level hypertrophy cues note */}
                    <input
                      type="text"
                      placeholder="Catatan form/tempo: misal 'Tempo 3-0-1, bangku kemiringan 30°'..."
                      value={exercise.notes || ""}
                      onChange={(e) => updateExerciseNotes(exercise.id, e.target.value)}
                      className="w-full text-xs bg-zinc-950/70 border border-zinc-800/80 rounded-lg px-3 py-1.5 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-4 self-end md:self-auto">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-zinc-400 font-medium">Target:</span>
                      <div className="flex items-center border border-zinc-700 rounded-xl bg-zinc-950 overflow-hidden">
                        <button
                          onClick={() => ubahTargetSet(exercise.id, (exercise.targetSets || 3) - 1)}
                          className="px-2.5 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-amber-400 font-mono">
                          {exercise.targetSets || 3} Set
                        </span>
                        <button
                          onClick={() => ubahTargetSet(exercise.id, (exercise.targetSets || 3) + 1)}
                          className="px-2.5 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => hapusGerakan(exercise.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Hapus Gerakan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick add custom exercise */}
          <div className="flex space-x-2 p-1.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
            <input
              type="text"
              placeholder="Tambah variasi gerakan baru (misal: Cable Lateral Raise)..."
              value={namaGerakanBaru}
              onChange={(e) => setNamaGerakanBaru(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTambahGerakan()}
              className="flex-1 px-4 py-2.5 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
            <button
              onClick={handleTambahGerakan}
              disabled={isAddingExercise || !namaGerakanBaru.trim()}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-medium rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingExercise ? "Menambahkan..." : "Tambah"}</span>
            </button>
          </div>

          {/* Start tracking CTA button */}
          <button
            onClick={() => {
              if (activeExercises.length === 0) {
                showToast("Pilih minimal 1 gerakan sebelum memulai latihan.");
                return;
              }
              setIsTracking(true);
            }}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:opacity-95 text-zinc-950 font-black rounded-2xl transition-all shadow-xl shadow-amber-500/20 text-base flex items-center justify-center space-x-2 group cursor-pointer"
          >
            <Flame className="w-5 h-5 fill-zinc-950 group-hover:scale-110 transition-transform" />
            <span>MULAI SESI HIPERTROFI SEKARANG</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* ========================================================================= */
        /* FASE 2: MODE TRACKER EKSEKUSI DI GYM                                     */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <span className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                <Flame className="w-5 h-5" />
              </span>
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-zinc-500">Live Session</span>
                <div className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>{initialCategory.name} Day</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                    ⏱ {formatTime(workoutSeconds)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSummaryOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan & Catat ({totalCompletedSets}/{totalPlannedSets})</span>
              </button>
              <button
                onClick={() => setIsTracking(false)}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors"
                title="Batal atau ubah daftar gerakan"
              >
                Batal
              </button>
            </div>
          </div>

          {/* Exercise Card */}
          {activeExercises.length > 0 && currentExercise ? (
            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2 mb-5">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
                      GERAKAN {currentIndex + 1} DARI {activeExercises.length}
                    </span>
                    <span className="text-xs text-zinc-500">• Hypertrophy Focus</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {currentExercise.name}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startRestTimer(120)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-xl text-xs font-medium flex items-center space-x-1 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mulai Timer Rest (2m)</span>
                  </button>
                </div>
              </div>

              {/* Form & Hypertrophy Cue Note */}
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800/80 mb-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center space-x-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                    <span>Catatan Bentuk & Posisi:</span>
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Ketik catatan gerakan (misal: 'Sudut bangku #3, regangan penuh di bawah')..."
                  value={currentExercise.notes || ""}
                  onChange={(e) => updateExerciseNotes(currentExercise.id, e.target.value)}
                  className="w-full text-xs bg-transparent text-zinc-300 placeholder:text-zinc-600 outline-none"
                />
              </div>

              {/* Sets Table */}
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-zinc-400 px-2 uppercase tracking-wider">
                  <span className="col-span-1 text-center">SET</span>
                  <span className="col-span-3 text-center">BEBAN (KG)</span>
                  <span className="col-span-3 text-center">REPETISI</span>
                  <span className="col-span-3 text-center" title="Reps In Reserve: Berapa repetisi sebelum gagal otot?">
                    RIR <Info className="inline w-3 h-3 text-zinc-500" />
                  </span>
                  <span className="col-span-2 text-center">STATUS</span>
                </div>

                {Array.from({ length: currentExercise.targetSets || 3 }).map((_, setIndex) => {
                  const setItem = currentExercise.setsData?.[setIndex] || {
                    weight: "",
                    reps: "",
                    rir: 1,
                    notes: "",
                    isCompleted: false,
                  };

                  const isLocked = setItem.isCompleted;
                  const isPreviousNotDone =
                    setIndex > 0 && !currentExercise.setsData?.[setIndex - 1]?.isCompleted;
                  const isDisabled = isLocked || isPreviousNotDone;

                  return (
                    <div
                      key={setIndex}
                      className={`grid grid-cols-12 gap-2 items-center p-3 rounded-2xl border transition-all ${
                        isLocked
                          ? "bg-zinc-950/40 border-emerald-500/30"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {/* Set Number */}
                      <div className="col-span-1 text-center">
                        <span
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold font-mono ${
                            isLocked ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-400"
                          }`}
                        >
                          {setIndex + 1}
                        </span>
                      </div>

                      {/* Weight (KG) */}
                      <div className="col-span-3">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            placeholder="0"
                            value={setItem.weight}
                            onChange={(e) =>
                              updateSetField(currentExercise.id, setIndex, "weight", e.target.value)
                            }
                            disabled={isDisabled}
                            className={`w-full py-2.5 px-2 text-center rounded-xl font-mono text-sm outline-none transition-colors ${
                              isDisabled
                                ? "bg-zinc-900/40 text-zinc-500 cursor-not-allowed"
                                : "bg-zinc-900 border border-zinc-700/80 text-white focus:border-amber-400"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Reps */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="0"
                          value={setItem.reps}
                          onChange={(e) =>
                            updateSetField(currentExercise.id, setIndex, "reps", e.target.value)
                          }
                          disabled={isDisabled}
                          className={`w-full py-2.5 px-2 text-center rounded-xl font-mono text-sm outline-none transition-colors ${
                            isDisabled
                              ? "bg-zinc-900/40 text-zinc-500 cursor-not-allowed"
                              : "bg-zinc-900 border border-zinc-700/80 text-white focus:border-amber-400"
                          }`}
                        />
                      </div>

                      {/* RIR (Reps in Reserve: 0 = Failure, 1 = 1 left, 2 = 2 left) */}
                      <div className="col-span-3">
                        <select
                          value={setItem.rir ?? 1}
                          onChange={(e) =>
                            updateSetField(currentExercise.id, setIndex, "rir", parseInt(e.target.value))
                          }
                          disabled={isDisabled}
                          className={`w-full py-2.5 px-1.5 text-center rounded-xl font-mono text-xs outline-none transition-colors ${
                            isDisabled
                              ? "bg-zinc-900/40 text-zinc-500 cursor-not-allowed"
                              : "bg-zinc-900 border border-zinc-700/80 text-amber-400 font-semibold focus:border-amber-400"
                          }`}
                        >
                          <option value={0}>0 (Failure 🔥)</option>
                          <option value={1}>1 (Sangat Keras)</option>
                          <option value={2}>2 (Optimal)</option>
                          <option value={3}>3 (Sedang)</option>
                          <option value={4}>4+ (Pemanasan)</option>
                        </select>
                      </div>

                      {/* Check Button & Note Icon */}
                      <div className="col-span-2 flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            setActiveSetNoteModal({ exerciseIndex: currentIndex, setIndex });
                            setTempNoteText(setItem.notes || "");
                          }}
                          className={`p-2 rounded-xl transition-colors ${
                            setItem.notes ? "text-amber-400 bg-amber-400/10" : "text-zinc-600 hover:text-zinc-400"
                          }`}
                          title="Tambah Catatan Set"
                        >
                          <StickyNote className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => toggleSetCompleted(currentExercise.id, setIndex)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                            isLocked
                              ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20"
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {isLocked ? "✓" : "Log"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prev / Next Exercise Pagination */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 font-semibold rounded-xl text-xs flex items-center space-x-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Gerakan Sebelumnya</span>
                </button>

                <div className="flex space-x-1.5">
                  {activeExercises.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === currentIndex ? "w-6 bg-amber-400" : "bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(activeExercises.length - 1, prev + 1))}
                  disabled={currentIndex === activeExercises.length - 1}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 font-semibold rounded-xl text-xs flex items-center space-x-1 transition-colors"
                >
                  <span>Gerakan Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-3xl">
              <p className="text-zinc-400">Semua gerakan telah diselesaikan!</p>
              <button
                onClick={() => setIsSummaryOpen(true)}
                className="mt-4 px-6 py-3 bg-emerald-500 font-bold text-zinc-950 rounded-xl"
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