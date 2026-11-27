---
sidebar_position: 3
title: Frontend UI (Next.js)
---

# Frontend Application - TrainSmart 💻

Folder `/frontend` berisi antarmuka pengguna (*User Interface*) yang dibangun menggunakan **Next.js**. Bagian inilah yang diakses langsung oleh pengguna untuk berinteraksi dengan aplikasi.

## Teknologi yang Digunakan
* **Next.js (React Framework):** Memanfaatkan fitur *App Router* untuk navigasi halaman yang cepat dan optimal.
* **Tailwind CSS:** Digunakan untuk mendesain tampilan antarmuka yang modern, responsif, dan *mobile-friendly*.
* **Fetch API / Axios:** Menghubungkan frontend ke backend Laravel untuk mengambil dan mengirim data latihan.

## Fitur Utama
* **Onboarding & Katalog Split (`/onboarding`):** Pemilihan jumlah hari latihan (`2–6` hari), pengelompokan split berdasarkan tingkat rekomendasi (`Direkomendasikan`, `Alternatif`, `Kurang Direkomendasikan` tanpa pemblokiran), estimasi frekuensi otot mingguan otomatis, serta perbandingan dua split berdampingan.
* **Schedule Builder (`ScheduleBuilder.tsx`):** Penjadwalan mingguan Senin–Minggu dengan `@dnd-kit` drag-and-drop maupun dropdown aksesibel, tombol `"Gunakan Rekomendasi"` yang menghindari bentrok sesi berat beruntun, ringkasan frekuensi otot mingguan *real-time*, dan *advisory warnings* berbasis template sesi.
* **Dashboard Latihan:** Menampilkan daftar menu latihan harian yang ditarik secara *real-time* dari API Laravel.
* **Form Pencatatan:** Memungkinkan pengguna menginput progres latihan mereka dengan mudah.