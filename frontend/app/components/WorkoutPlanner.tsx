"use client"; // INI MANTRA WAJIB! Biar Next.js tau ini komponen interaktif di browser user

import { useState } from "react";

// Taruh interface lu di sini juga biar aman
interface Exercise {
  id: number;
  name: string;
  targetSets?: number; // <--- BUG FIX: Tanda tanya ini nyelamatin nyawa aplikasi lu!
}

interface Category {
  id: number;
  name: string;
  exercises: Exercise[];
}

export default function WorkoutPlanner({ initialCategory }: { initialCategory: Category }) {
  // useState ini nyimpen daftar gerakan dari database ke "memori lokal" HP/Browser user
  const [activeExercises, setActiveExercises] = useState<Exercise[]>(
    initialCategory.exercises.map((ex) => ({
      ...ex,
      targetSets: 3 // Default set kita isi 3 di memori lokal
    }))
  );
  
  const [isTracking, setIsTracking] = useState(false);

  const [namaGerakanBaru, setNamaGerakanBaru] = useState("");

  // Fungsi buat ngehapus gerakan (Logika lu udah SEMPURNA!)
  const hapusGerakanLokal = (idGerakan: number) => {
    const hapusGerakan = activeExercises.filter((gerakan) => gerakan.id !== idGerakan);
    setActiveExercises(hapusGerakan);
  };

  // Fungsi buat ngubah jumlah Set
  const ubahTargetSet = (idGerakan: number, setBaru: number) => {
    setActiveExercises((prev) =>
      prev.map((ex) => (ex.id === idGerakan ? { ...ex, targetSets: setBaru } : ex))
    );
  };

  const tambahGerakanLokal = () =>{
    if (namaGerakanBaru.trim() === "") return;

    const gerakanBaru: Exercise = {
      id: Date.now(), //sementara
      name: namaGerakanBaru,
      targetSets: 3 // default
    };

    setActiveExercises((prev) => [...prev, gerakanBaru]);
    setNamaGerakanBaru("") //set biar kosong setelah input
  }

  return (
    <div className="mt-6">
      {!isTracking ? (
        // --- FASE 1: PERSIAPAN (PLANNER) ---
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Persiapan Latihan</h2>
          
          {activeExercises.map((exercise) => (
            <div key={exercise.id} className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center">
              
              <div>
                <h3 className="font-semibold text-lg text-white">{exercise.name}</h3>
              </div>
              
              {/* Bagian Kanan: Input & Tombol Hapus */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-zinc-400">Set:</span>
                  <input 
                    type="number" 
                    min="1"
                    value={exercise.targetSets} 
                    onChange={(e) => ubahTargetSet(exercise.id, parseInt(e.target.value) || 0)}
                    className="w-16 p-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-center outline-none focus:border-blue-500"
                  />
                </div>

                <button 
                  onClick={() => hapusGerakanLokal(exercise.id)}
                  className="text-red-500 text-sm font-semibold hover:underline px-2 py-1"
                >
                  Hapus
                </button>
              </div>

            </div>
          ))}

          <button 
            onClick={() => setIsTracking(true)}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors"
          >
            Mulai Latihan!
          </button>
          {/* TAMPILAN TAMBAH GERAKAN */}
          <div className="flex space-x-2 mt-4">
            <input 
              type="text" 
              placeholder="Ketik gerakan tambahan..."
              value={namaGerakanBaru}
              onChange={(e) => setNamaGerakanBaru(e.target.value)}
              className="flex-1 p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white outline-none focus:border-blue-500"
            />
            <button 
              onClick={tambahGerakanLokal}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Tambah
            </button>
          </div>
        </div>
      ) : (
        // --- FASE 2: TRACKER (EKSEKUSI) ---
        <div>
          <h2 className="text-xl font-bold text-yellow-500 mb-4">Latihan Dimulai!</h2>
          <p>Nanti UI form input set, reps, beban, dan timer kita coding di sini.</p>
          
          <button 
            onClick={() => setIsTracking(false)}
            className="text-zinc-400 hover:text-white mt-4 underline"
          >
            Batal & Kembali ke Persiapan
          </button>
        </div>
      )}
    </div>
  );
}