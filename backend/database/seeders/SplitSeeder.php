<?php

namespace Database\Seeders;

use App\Models\Split;
use App\Models\SplitSession;
use Illuminate\Database\Seeder;

class SplitSeeder extends Seeder
{
    public function run(): void
    {
        $splits = [
            [
                'slug' => 'full-body',
                'name' => 'Full Body',
                'description' => 'Melatih seluruh kelompok otot utama dalam satu sesi latihan, ideal untuk membangun fondasi kekuatan dan konsistensi 2–3 hari per minggu.',
                'min_days' => 2,
                'max_days' => 3,
                'pros' => [
                    'Setiap otot mendapat stimulus rutin 2–3 kali seminggu meski jadwal padat.',
                    'Sangat ramah untuk pemula karena fokus pada gerakan dasar dan teknik.',
                    'Fleksibel: jika terlewat 1 hari, seluruh tubuh tetap terlatih pada sesi berikutnya.',
                ],
                'cons' => [
                    'Durasi satu sesi cenderung lebih lama karena semua otot dilatih sekaligus.',
                    'Volume per kelompok otot dalam satu hari lebih terbatas agar tidak cepat lelah.',
                ],
                'suitable_for' => 'Pemula yang baru mulai ke gym atau pekerja/mahasiswa yang hanya sempat latihan 2–3 hari per minggu.',
                'is_active' => true,
                'sort_order' => 1,
                'sessions' => [
                    [
                        'slug' => 'full-body-a',
                        'name' => 'Full Body A',
                        'session_type' => 'full_body',
                        'muscle_groups' => ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'core'],
                        'default_day_of_week' => 1,
                        'sort_order' => 1,
                    ],
                    [
                        'slug' => 'full-body-b',
                        'name' => 'Full Body B',
                        'session_type' => 'full_body',
                        'muscle_groups' => ['chest', 'back', 'biceps', 'triceps', 'glutes', 'calves'],
                        'default_day_of_week' => 3,
                        'sort_order' => 2,
                    ],
                    [
                        'slug' => 'full-body-c',
                        'name' => 'Full Body C',
                        'session_type' => 'full_body',
                        'muscle_groups' => ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'core'],
                        'default_day_of_week' => 5,
                        'sort_order' => 3,
                    ],
                ],
            ],
            [
                'slug' => 'upper-lower',
                'name' => 'Upper / Lower',
                'description' => 'Membagi latihan menjadi tubuh bagian atas (Upper) dan bagian bawah (Lower), masing-masing dilatih dua kali seminggu.',
                'min_days' => 4,
                'max_days' => 4,
                'pros' => [
                    'Keseimbangan ideal antara frekuensi latihan (2×/minggu per otot) dan hari istirahat.',
                    'Setiap sesi fokus setengah tubuh sehingga energi tetap terjaga hingga akhir latihan.',
                    'Pemulihan antar sesi kaki dan tubuh atas lebih optimal untuk progressive overload.',
                ],
                'cons' => [
                    'Hari Upper bisa terasa padat karena mencakup dada, punggung, bahu, dan lengan.',
                    'Kurang cocok jika Anda hanya bisa latihan 2 hari dalam seminggu.',
                ],
                'suitable_for' => 'Pemula hingga menengah yang bisa konsisten 4 hari seminggu dan ingin hasil seimbang atas-bawah.',
                'is_active' => true,
                'sort_order' => 2,
                'sessions' => [
                    [
                        'slug' => 'upper-a',
                        'name' => 'Upper A',
                        'session_type' => 'upper',
                        'muscle_groups' => ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
                        'default_day_of_week' => 1,
                        'sort_order' => 1,
                    ],
                    [
                        'slug' => 'lower-a',
                        'name' => 'Lower A',
                        'session_type' => 'lower',
                        'muscle_groups' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
                        'default_day_of_week' => 2,
                        'sort_order' => 2,
                    ],
                    [
                        'slug' => 'upper-b',
                        'name' => 'Upper B',
                        'session_type' => 'upper',
                        'muscle_groups' => ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
                        'default_day_of_week' => 4,
                        'sort_order' => 3,
                    ],
                    [
                        'slug' => 'lower-b',
                        'name' => 'Lower B',
                        'session_type' => 'lower',
                        'muscle_groups' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
                        'default_day_of_week' => 5,
                        'sort_order' => 4,
                    ],
                ],
            ],
            [
                'slug' => 'ppl-ul',
                'name' => 'Push Pull Legs + Upper / Lower',
                'description' => 'Kombinasi hybrid 5 hari: 3 hari terpisah berdasarkan pola gerak (Push, Pull, Legs) ditambah 2 hari Upper & Lower.',
                'min_days' => 5,
                'max_days' => 5,
                'pros' => [
                    'Semua kelompok otot tetap terlatih 2× seminggu dalam jadwal 5 hari.',
                    'Memberi variasi fokus: hari PPL untuk isolasi lebih detail, hari UL untuk volume padat.',
                    'Menyediakan 2 hari istirahat penuh setiap minggu untuk pemulihan sistem saraf.',
                ],
                'cons' => [
                    'Menuntut konsistensi 5 hari per minggu agar rotasi tetap seimbang.',
                    'Hari Upper perlu manajemen waktu karena melatih beberapa otot besar sekaligus.',
                ],
                'suitable_for' => 'Pengguna yang bisa latihan 5 hari/minggu dan ingin fokus ekstra pada pembentukan otot secara merata.',
                'is_active' => true,
                'sort_order' => 3,
                'sessions' => [
                    [
                        'slug' => 'push',
                        'name' => 'Push',
                        'session_type' => 'push',
                        'muscle_groups' => ['chest', 'shoulders', 'triceps'],
                        'default_day_of_week' => 1,
                        'sort_order' => 1,
                    ],
                    [
                        'slug' => 'pull',
                        'name' => 'Pull',
                        'session_type' => 'pull',
                        'muscle_groups' => ['back', 'biceps'],
                        'default_day_of_week' => 2,
                        'sort_order' => 2,
                    ],
                    [
                        'slug' => 'legs',
                        'name' => 'Legs',
                        'session_type' => 'legs',
                        'muscle_groups' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
                        'default_day_of_week' => 3,
                        'sort_order' => 3,
                    ],
                    [
                        'slug' => 'upper',
                        'name' => 'Upper',
                        'session_type' => 'upper',
                        'muscle_groups' => ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
                        'default_day_of_week' => 5,
                        'sort_order' => 4,
                    ],
                    [
                        'slug' => 'lower',
                        'name' => 'Lower',
                        'session_type' => 'lower',
                        'muscle_groups' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
                        'default_day_of_week' => 6,
                        'sort_order' => 5,
                    ],
                ],
            ],
            [
                'slug' => 'ppl-ap',
                'name' => 'Push Pull Legs + Anterior / Posterior',
                'description' => 'Variasi 5 hari yang memadukan Push, Pull, Legs dengan hari Anterior (otot bagian depan tubuh) dan Posterior (otot bagian belakang tubuh).',
                'min_days' => 5,
                'max_days' => 5,
                'pros' => [
                    'Mengurangi kelelahan otot kaki beruntun dengan membagi Quads (Anterior) dan Hamstrings/Glutes (Posterior).',
                    'Frekuensi 2× seminggu untuk hampir seluruh kelompok otot utama.',
                    'Cocok untuk menyeimbangkan postur antara otot bagian depan dan belakang tubuh.',
                ],
                'cons' => [
                    'Struktur sesi Anterior/Posterior agak baru bagi pemula sehingga perlu sedikit adaptasi.',
                    'Butuh jeda istirahat yang rapi antara hari Legs dan Anterior/Posterior.',
                ],
                'suitable_for' => 'Pengguna 5 hari/minggu yang merasa sesi Upper atau Lower tradisional terlalu berat dalam satu waktu.',
                'is_active' => true,
                'sort_order' => 4,
                'sessions' => [
                    [
                        'slug' => 'push',
                        'name' => 'Push',
                        'session_type' => 'push',
                        'muscle_groups' => ['chest', 'shoulders', 'triceps'],
                        'default_day_of_week' => 1,
                        'sort_order' => 1,
                    ],
                    [
                        'slug' => 'pull',
                        'name' => 'Pull',
                        'session_type' => 'pull',
                        'muscle_groups' => ['back', 'biceps'],
                        'default_day_of_week' => 2,
                        'sort_order' => 2,
                    ],
                    [
                        'slug' => 'legs',
                        'name' => 'Legs',
                        'session_type' => 'legs',
                        'muscle_groups' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
                        'default_day_of_week' => 3,
                        'sort_order' => 3,
                    ],
                    [
                        'slug' => 'anterior',
                        'name' => 'Anterior',
                        'session_type' => 'anterior',
                        'muscle_groups' => ['chest', 'shoulders', 'biceps', 'quads', 'core'],
                        'default_day_of_week' => 5,
                        'sort_order' => 4,
                    ],
                    [
                        'slug' => 'posterior',
                        'name' => 'Posterior',
                        'session_type' => 'posterior',
                        'muscle_groups' => ['back', 'triceps', 'hamstrings', 'glutes', 'calves'],
                        'default_day_of_week' => 6,
                        'sort_order' => 5,
                    ],
                ],
            ],
            [
                'slug' => 'ppl-2x',
                'name' => 'Push Pull Legs (2× Seminggu)',
                'description' => 'Program hipertrofi 6 hari yang melatih siklus Push, Pull, dan Legs dua kali penuh setiap minggu dengan 1 hari istirahat.',
                'min_days' => 6,
                'max_days' => 6,
                'pros' => [
                    'Volume mingguan tertinggi untuk hipertrofi maksimal di setiap kelompok otot.',
                    'Setiap sesi hanya fokus 2–3 kelompok otot yang bekerja sinergis.',
                    'Pola latihan sangat terstruktur dan mudah diingat.',
                ],
                'cons' => [
                    'Hanya menyisakan 1 hari istirahat per minggu, berisiko kelelahan jika tidur/nutrisi kurang.',
                    'Membutuhkan komitmen waktu ke gym hampir setiap hari.',
                ],
                'suitable_for' => 'Pengguna dengan jadwal fleksibel yang siap berlatih 6 hari seminggu untuk fokus pertumbuhan otot maksimal.',
                'is_active' => true,
                'sort_order' => 5,
                'sessions' => [
                    [
                        'slug' => 'push-a',
                        'name' => 'Push A',
                        'session_type' => 'push',
                        'muscle_groups' => ['chest', 'shoulders', 'triceps'],
                        'default_day_of_week' => 1,
                        'sort_order' => 1,
                    ],
                    [
                        'slug' => 'pull-a',
                        'name' => 'Pull A',
                        'session_type' => 'pull',
                        'muscle_groups' => ['back', 'biceps'],
                        'default_day_of_week' => 2,
                        'sort_order' => 2,
                    ],
                    [
                        'slug' => 'legs-a',
                        'name' => 'Legs A',
                        'session_type' => 'legs',
                        'muscle_groups' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
                        'default_day_of_week' => 3,
                        'sort_order' => 3,
                    ],
                    [
                        'slug' => 'push-b',
                        'name' => 'Push B',
                        'session_type' => 'push',
                        'muscle_groups' => ['chest', 'shoulders', 'triceps'],
                        'default_day_of_week' => 4,
                        'sort_order' => 4,
                    ],
                    [
                        'slug' => 'pull-b',
                        'name' => 'Pull B',
                        'session_type' => 'pull',
                        'muscle_groups' => ['back', 'biceps'],
                        'default_day_of_week' => 5,
                        'sort_order' => 5,
                    ],
                    [
                        'slug' => 'legs-b',
                        'name' => 'Legs B',
                        'session_type' => 'legs',
                        'muscle_groups' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
                        'default_day_of_week' => 6,
                        'sort_order' => 6,
                    ],
                ],
            ],
        ];

        foreach ($splits as $splitData) {
            $sessions = $splitData['sessions'];
            unset($splitData['sessions']);

            $split = Split::updateOrCreate(
                ['slug' => $splitData['slug']],
                $splitData
            );

            foreach ($sessions as $sessionData) {
                SplitSession::updateOrCreate(
                    [
                        'split_id' => $split->id,
                        'slug' => $sessionData['slug'],
                    ],
                    $sessionData
                );
            }
        }
    }
}
