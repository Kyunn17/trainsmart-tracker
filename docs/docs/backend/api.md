---
sidebar_position: 2
title: Backend Architecture (Laravel)
---

# Backend API - TrainSmart ⚙️

Folder `/backend` berisi seluruh *source code* berbasis **Laravel** yang berfungsi sebagai pusat pengolahan data, manajemen database, dan penyedia REST API untuk aplikasi Fitness Tracker.

## Teknologi yang Digunakan
* **PHP & Laravel Framework:** Mengatur *routing*, *controller*, dan logika bisnis utama.
* **Eloquent ORM:** Menghubungkan aplikasi dengan *database* MySQL secara elegan (relasi `Category`, `Exercise`, `User`, `WorkoutLog`).
* **Laravel Sanctum:** Mengamankan API dengan otentikasi token berbasis bearer.

## Sistem Autentikasi & Otorisasi 3 Peran (Roles)

TrainSmart membagi hak akses ke dalam 3 peran:

### 1. Admin (`admin`)
* Memiliki kontrol penuh atas seluruh ekosistem aplikasi.
* **Endpoints**:
  * `GET /api/admin/stats` : Ringkasan metrik sistem (total user, trainers, clients, total tonase angkatan).
  * `GET /api/admin/users` : Melihat dan memfilter seluruh pengguna.
  * `PATCH /api/admin/users/{id}` : Mengubah peran user (`admin`, `trainer`, `client`) dan menetapkan trainer.
  * `DELETE /api/admin/users/{id}` : Menghapus user dari sistem.

### 2. Personal Trainer (`trainer`)
* Membimbing klien dan memantau perkembangan progressive overload.
* **Endpoints**:
  * `GET /api/trainer/clients` : Mengambil daftar klien yang berada di bawah bimbingan.
  * `POST /api/trainer/clients` : Menambahkan klien baru via email.
  * `DELETE /api/trainer/clients/{clientId}` : Melepas klien dari bimbingan.
  * `GET /api/trainer/clients/{clientId}/progress` : Melihat analisis detail progres latihan & RIR klien.

### 3. Client / Member (`client`)
* Menjalankan program latihan hipertrofi dan memilih Personal Trainer.
* **Endpoints**:
  * `GET /api/splits/recommendations?days={2..6}` : Mengembalikan seluruh opsi split (18 katalog total) untuk frekuensi hari terpilih, terurut berdasarkan `recommendation_level` (`recommended`, `alternative`, `not_recommended`), lengkap dengan sesi berurutan dan `muscle_frequency` per otot.
  * `GET /api/splits/{id}` : Detail split, daftar sesi template, dan daftar gerakan terkurasi berbasis `muscle_region`.
  * `GET /api/user/plan` & `POST /api/user/plan` : Mengambil atau menyimpan program & jadwal mingguan beserta *advisory warnings* dan `muscle_frequency`.
  * `POST /api/user/plan/validate-schedule` : Validasi jadwal *dry-run* berbasis template sesi (`no_lower_body_session`, `no_chest_session`, `no_back_session`, `no_rest_day`, serta `consecutive_muscle_overlap` sadar sub-region bahu).
  * `GET /api/trainers` : Melihat daftar seluruh Personal Trainer bersertifikasi beserta keahliannya.
  * `POST /api/client/select-trainer` : Memilih atau mengganti Personal Trainer.
  * `GET /api/client/my-progress` : Melihat riwayat progres beban dan tonase pribadi.
  * `POST /api/workout-logs` : Menyimpan catatan sesi latihan aktif ke database.