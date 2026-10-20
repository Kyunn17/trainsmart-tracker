---
sidebar_position: 2
title: Backend Architecture (Laravel)
---

# Backend API - TrainSmart ⚙️

Folder `/backend` berisi seluruh *source code* berbasis **Laravel** yang berfungsi sebagai pusat pengolahan data, manajemen database, dan penyedia REST API untuk aplikasi Fitness Tracker.

## Teknologi yang Digunakan
* **PHP & Laravel Framework:** Mengatur *routing*, *controller*, dan logika bisnis utama.
* **Eloquent ORM:** Menghubungkan aplikasi dengan *database* MySQL secara elegan (misalnya relasi antara `Category` dan `Exercises`).
* **L5-Swagger / Scalar:** Menghasilkan dokumentasi API otomatis yang terhubung ke Docusaurus.

## Endpoint Utama
Beberapa *endpoint* penting yang disediakan oleh backend ini:
* `GET /api/menu-latihan` : Mengambil data kategori latihan beserta daftar gerakannya.
* `GET /api/reviews` : Mengambil data ulasan atau catatan latihan pengguna.
* `POST /api/reviews` : Menyimpan data catatan latihan baru ke *database*.