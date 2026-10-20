---
sidebar_position: 4
title: State Management & UI Architecture
---

# Frontend State Management & Data Flow 💻

Aplikasi antarmuka TrainSmart menggunakan arsitektur **Hybrid Next.js 15 (App Router)**:

1. **Server Components (RSC)**: 
   - Halaman `/` (`app/page.tsx`) dan `/workout/[id]` (`app/workout/[id]/page.tsx`) bertindak sebagai Server Components.
   - Bertanggung jawab mengambil data awal dari REST API Laravel (`/api/categories` dan `/api/categories/{id}`) secara cepat tanpa over-fetching.

2. **Client Components (Interactive)**:
   - Komponen `WorkoutPlanner.tsx` menangani state lokal interaktif selama pengguna berolahraga di gym.
   - Mengelola state:
     - `activeExercises`: Daftar gerakan yang disesuaikan pengguna.
     - `setsData`: Input beban, repetisi, RIR, catatan set individual, dan status penyelesaian (`isCompleted`).
     - `restTimeLeft` & `isResting`: Timer istirahat otomatis antar set untuk pemulihan glikogen dan ATP.
     - `workoutSeconds`: Durasi aktif sesi latihan.

3. **Sinkronisasi Database**:
   - Setelah selesai seluruh latihan, pengguna mengklik tombol **"Selesaikan & Catat"**.
   - Ringkasan dihitung (Total Volume Tonase $Kg \times Reps$, Total Set) dan dikirim sekaligus ke endpoint Laravel `POST /api/workout-logs`.
