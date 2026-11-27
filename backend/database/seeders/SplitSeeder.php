<?php

namespace Database\Seeders;

use App\Models\DailySession;
use App\Models\PlanSchedule;
use App\Models\Split;
use App\Models\SplitSession;
use App\Models\UserPlan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SplitSeeder extends Seeder
{
    /**
     * Build a split session definition using canonical SplitSession::TEMPLATES.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function buildSession(
        string $slug,
        string $name,
        string $sessionType,
        int $defaultDayOfWeek,
        int $sortOrder,
        array $overrides = []
    ): array {
        $template = SplitSession::TEMPLATES[$sessionType] ?? [
            'muscle_regions' => [],
            'muscle_groups' => [],
            'is_heavy' => false,
        ];

        return array_merge([
            'slug' => $slug,
            'name' => $name,
            'session_type' => $sessionType,
            'muscle_groups' => $template['muscle_groups'],
            'muscle_regions' => $template['muscle_regions'],
            'is_heavy' => $template['is_heavy'],
            'default_day_of_week' => $defaultDayOfWeek,
            'sort_order' => $sortOrder,
        ], $overrides);
    }

    public function run(): void
    {
        $splits = [
            // =================================================================
            // 2 HARI / MINGGU
            // =================================================================
            [
                'slug' => 'full-body-2d',
                'name' => 'Full Body A/B',
                'description' => 'Melatih seluruh tubuh dalam dua sesi berjarak (Senin & Kamis), memaksimalkan stimulus 2×/minggu meski jadwal Anda sangat padat.',
                'days_per_week' => 2,
                'recommendation_level' => 'recommended',
                'min_days' => 2,
                'max_days' => 2,
                'pros' => [
                    'Setiap kelompok otot utama tetap terlatih 2× seminggu meski hanya latihan 2 hari.',
                    'Memberikan 5 hari istirahat penuh untuk pemulihan total sistem saraf dan otot.',
                    'Jika satu sesi terlewat, seluruh otot tubuh tetap tersentuh pada sesi berikutnya.',
                ],
                'cons' => [
                    'Durasi tiap sesi cenderung lebih panjang (60–75 menit) karena mencakup tubuh atas dan bawah.',
                    'Volume per kelompok otot per hari lebih ringkas.',
                ],
                'suitable_for' => 'Pemula atau pekerja/mahasiswa dengan jadwal sangat padat yang hanya sempat ke gym 2 kali seminggu.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 1,
                'sessions' => [
                    $this->buildSession('full-body-a', 'Full Body A', 'full_body', 1, 1),
                    $this->buildSession('full-body-b', 'Full Body B', 'full_body', 4, 2),
                ],
            ],
            [
                'slug' => 'upper-lower-2d',
                'name' => 'Upper / Lower (2 Hari)',
                'description' => 'Memisahkan latihan menjadi 1 hari tubuh atas (Upper) dan 1 hari tubuh bawah (Lower) dalam seminggu.',
                'days_per_week' => 2,
                'recommendation_level' => 'alternative',
                'min_days' => 2,
                'max_days' => 2,
                'pros' => [
                    'Sesi harian lebih singkat dan fokus karena tidak menggabungkan kaki dan tubuh atas sekaligus.',
                    'Kelelahan kardiovaskular lebih rendah dibanding Full Body bagi yang belum terbiasa.',
                ],
                'cons' => [
                    'Setiap otot hanya dilatih 1×/minggu, sehingga progres hipertrofi lebih lambat dibanding Full Body A/B.',
                    'Jika absen satu sesi, otot terkait tidak terlatih selama 2 minggu penuh.',
                ],
                'suitable_for' => 'Pemula 2 hari/minggu yang cepat lelah saat menggabungkan squat/deadlift dengan latihan tubuh atas.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 2,
                'sessions' => [
                    $this->buildSession('upper', 'Upper', 'upper', 1, 1),
                    $this->buildSession('lower', 'Lower', 'lower', 4, 2),
                ],
            ],

            // =================================================================
            // 3 HARI / MINGGU
            // =================================================================
            [
                'slug' => 'full-body',
                'name' => 'Full Body ×3',
                'description' => 'Program klasik terbaik untuk pemula: melatih seluruh tubuh 3 kali seminggu dengan jeda minimal 1 hari pemulihan di antara tiap sesi.',
                'days_per_week' => 3,
                'recommendation_level' => 'recommended',
                'min_days' => 3,
                'max_days' => 3,
                'pros' => [
                    'Frekuensi tinggi (3×/minggu per otot) mempercepat penguasaan teknik gerak dan pertumbuhan otot pemula.',
                    'Menyediakan 4 hari istirahat per minggu dengan pola selang-seling yang nyaman.',
                    'Terbukti sangat efektif untuk membangun kekuatan dasar secara merata.',
                ],
                'cons' => [
                    'Membutuhkan manajemen energi di dalam sesi karena melatih otot besar atas & bawah bersamaan.',
                    'Tidak disarankan untuk diletakkan di 3 hari berturut-turut tanpa jeda.',
                ],
                'suitable_for' => 'Pemula sejati yang baru memulai gym 3 hari/minggu dan ingin fondasi kekuatan serta hipertrofi optimal.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 1,
                'sessions' => [
                    $this->buildSession('full-body-a', 'Full Body A', 'full_body', 1, 1),
                    $this->buildSession('full-body-b', 'Full Body B', 'full_body', 3, 2),
                    $this->buildSession('full-body-c', 'Full Body C', 'full_body', 5, 3),
                ],
            ],
            [
                'slug' => 'ul-fb-3d',
                'name' => 'Upper / Lower / Full Body',
                'description' => 'Hybrid 3 hari yang memadukan hari khusus Upper, hari khusus Lower, lalu menutup minggu dengan sesi Full Body.',
                'days_per_week' => 3,
                'recommendation_level' => 'alternative',
                'min_days' => 3,
                'max_days' => 3,
                'pros' => [
                    'Tetap menjaga frekuensi 2×/minggu untuk seluruh kelompok otot dalam hanya 3 hari.',
                    'Memberi kesempatan volume ekstra pada Upper dan Lower secara terpisah di awal minggu.',
                ],
                'cons' => [
                    'Urutan sesi penting: hari Full Body sebaiknya dijeda minimal 1 hari setelah hari Lower.',
                ],
                'suitable_for' => 'Pengguna 3 hari/minggu yang ingin fokus lebih detail di Upper/Lower tanpa kehilangan frekuensi 2×/minggu.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 2,
                'sessions' => [
                    $this->buildSession('upper', 'Upper', 'upper', 1, 1),
                    $this->buildSession('lower', 'Lower', 'lower', 3, 2),
                    $this->buildSession('full-body', 'Full Body', 'full_body', 5, 3),
                ],
            ],
            [
                'slug' => 'ap-fb-3d',
                'name' => 'Anterior / Posterior / Full Body',
                'description' => 'Memisahkan otot sisi depan (Anterior) dan otot sisi belakang (Posterior) di dua sesi pertama, lalu diakhiri sesi Full Body.',
                'days_per_week' => 3,
                'recommendation_level' => 'alternative',
                'min_days' => 3,
                'max_days' => 3,
                'pros' => [
                    'Menjaga frekuensi 2×/minggu per otot sekaligus menyebar beban kaki (Quads di Anterior, Hamstrings/Glutes di Posterior).',
                    'Tidak ada satu hari pun yang terasa terlalu berat hanya di kaki saja.',
                ],
                'cons' => [
                    'Konsep Anterior/Posterior membutuhkan sedikit adaptasi bagi yang baru pertama kali mengenal split.',
                ],
                'suitable_for' => 'Pengguna 3 hari/minggu yang merasa sesi Lower terpisah terlalu melelahkan untuk lutut atau punggung bawah.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 3,
                'sessions' => [
                    $this->buildSession('anterior', 'Anterior', 'anterior', 1, 1),
                    $this->buildSession('posterior', 'Posterior', 'posterior', 3, 2),
                    $this->buildSession('full-body', 'Full Body', 'full_body', 5, 3),
                ],
            ],
            [
                'slug' => 'ppl-3d',
                'name' => 'Push / Pull / Legs (1 Siklus)',
                'description' => 'Membagi latihan menjadi satu putaran Push (otot dorong), Pull (otot tarik), dan Legs (kaki) dalam seminggu.',
                'days_per_week' => 3,
                'recommendation_level' => 'alternative',
                'min_days' => 3,
                'max_days' => 3,
                'pros' => [
                    'Sangat mudah dipahami karena setiap hari hanya fokus pada satu pola gerak spesifik.',
                    'Nyaman dijadwalkan meski 3 hari latihan harus berdekatan sekalipun.',
                ],
                'cons' => [
                    'Setiap otot hanya terlatih 1×/minggu sehingga stimulus hipertrofi lebih rendah dibanding Full Body ×3.',
                ],
                'suitable_for' => 'Pengguna dengan jadwal 3 hari berurutan (misal Jumat–Minggu) atau yang menyukai fokus gerak sangat spesifik.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 4,
                'sessions' => [
                    $this->buildSession('push', 'Push', 'push', 1, 1),
                    $this->buildSession('pull', 'Pull', 'pull', 3, 2),
                    $this->buildSession('legs', 'Legs', 'legs', 5, 3),
                ],
            ],

            // =================================================================
            // 4 HARI / MINGGU
            // =================================================================
            [
                'slug' => 'upper-lower',
                'name' => 'Upper / Lower ×2',
                'description' => 'Standar emas program 4 hari: melatih tubuh bagian atas (Upper) dan bagian bawah (Lower) masing-masing dua kali seminggu.',
                'days_per_week' => 4,
                'recommendation_level' => 'recommended',
                'min_days' => 4,
                'max_days' => 4,
                'pros' => [
                    'Keseimbangan ideal antara frekuensi optimal (2×/minggu per otot) dan 3 hari istirahat penuh.',
                    'Pemulihan antar sesi kaki dan tubuh atas sangat terjaga untuk progressive overload.',
                    'Sangat fleksibel dengan pola 2 hari latihan – 1 hari istirahat – 2 hari latihan.',
                ],
                'cons' => [
                    'Hari Upper dapat terasa cukup padat karena melatih dada, punggung, bahu, bisep, dan trisep sekaligus.',
                ],
                'suitable_for' => 'Pemula hingga menengah yang bisa rutin 4 hari seminggu untuk pertumbuhan otot dan kekuatan seimbang.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 1,
                'sessions' => [
                    $this->buildSession('upper-a', 'Upper A', 'upper', 1, 1),
                    $this->buildSession('lower-a', 'Lower A', 'lower', 2, 2),
                    $this->buildSession('upper-b', 'Upper B', 'upper', 4, 3),
                    $this->buildSession('lower-b', 'Lower B', 'lower', 5, 4),
                ],
            ],
            [
                'slug' => 'anterior-posterior-4d',
                'name' => 'Anterior / Posterior ×2',
                'description' => 'Memecah tubuh menjadi bagian depan (Anterior) dan bagian belakang (Posterior), masing-masing dua kali per minggu.',
                'days_per_week' => 4,
                'recommendation_level' => 'alternative',
                'min_days' => 4,
                'max_days' => 4,
                'pros' => [
                    'Tetap mencapai frekuensi 2×/minggu untuk semua otot tanpa menumpuk semua latihan kaki berat di satu hari.',
                    'Bagus untuk menyeimbangkan otot postur belakang dengan otot depan.',
                ],
                'cons' => [
                    'Setiap hari melatih kombinasi otot atas dan bawah sehingga intensitas sistemik cukup terasa.',
                ],
                'suitable_for' => 'Pengguna 4 hari/minggu yang ingin membagi beban latihan kaki antara paha depan dan rantai posterior.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 2,
                'sessions' => [
                    $this->buildSession('anterior-a', 'Anterior A', 'anterior', 1, 1),
                    $this->buildSession('posterior-a', 'Posterior A', 'posterior', 2, 2),
                    $this->buildSession('anterior-b', 'Anterior B', 'anterior', 4, 3),
                    $this->buildSession('posterior-b', 'Posterior B', 'posterior', 5, 4),
                ],
            ],
            [
                'slug' => 'ppl-fb-4d',
                'name' => 'PPL + Full Body',
                'description' => 'Menggabungkan 3 hari fokus Push, Pull, Legs lalu ditutup 1 hari Full Body di akhir pekan untuk menggenapi frekuensi 2×/minggu.',
                'days_per_week' => 4,
                'recommendation_level' => 'alternative',
                'min_days' => 4,
                'max_days' => 4,
                'pros' => [
                    'Semua kelompok otot tetap terlatih 2×/minggu sambil tetap menikmati sesi Push, Pull, dan Legs yang terisolasi.',
                    'Menyediakan 3 hari istirahat terpisah agar hari Legs dan Full Body memiliki jeda pemulihan.',
                ],
                'cons' => [
                    'Hari Full Body di akhir minggu bisa terasa berat jika jadwal tidak diberi jeda setelah Legs.',
                ],
                'suitable_for' => 'Penggemar pola Push/Pull/Legs yang hanya punya waktu 4 hari per minggu.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 3,
                'sessions' => [
                    $this->buildSession('push', 'Push', 'push', 1, 1),
                    $this->buildSession('pull', 'Pull', 'pull', 2, 2),
                    $this->buildSession('legs', 'Legs', 'legs', 4, 3),
                    $this->buildSession('full-body', 'Full Body', 'full_body', 6, 4),
                ],
            ],
            [
                'slug' => 'bro-split-4d',
                'name' => 'Bro Split (4 Hari)',
                'description' => 'Membagi sesi berdasarkan kelompok otot tunggal: Chest, Back, Legs, serta Shoulders & Arms.',
                'days_per_week' => 4,
                'recommendation_level' => 'not_recommended',
                'min_days' => 4,
                'max_days' => 4,
                'pros' => [
                    'Fokus mental sangat sederhana karena satu hari hanya mengincar satu area tubuh.',
                    'Sensasi pump otot lokal terasa maksimal di setiap sesi.',
                ],
                'cons' => [
                    'Frekuensi latihan hanya 1×/minggu per kelompok otot.',
                    'Volume per sesi terlalu terkonsentrasi sehingga mudah memicu pegal berlebih (DOMS) tanpa hasil hipertrofi optimal bagi pemula.',
                ],
                'suitable_for' => 'Pengguna yang benar-benar menyukai gaya latihan klasik per bagian tubuh dan tidak keberatan progres lebih santai.',
                'not_recommended_reason' => 'Setiap otot hanya dilatih 1 kali per minggu, sehingga laju perkembangan kekuatan dan hipertrofi umumnya lebih lambat bagi pemula dibanding split frekuensi 2×/minggu.',
                'is_active' => true,
                'sort_order' => 4,
                'sessions' => [
                    $this->buildSession('chest', 'Chest', 'chest', 1, 1),
                    $this->buildSession('back', 'Back', 'back', 2, 2),
                    $this->buildSession('legs', 'Legs', 'legs', 4, 3),
                    $this->buildSession('shoulders-arms', 'Shoulders & Arms', 'arms_delts', 5, 4),
                ],
            ],

            // =================================================================
            // 5 HARI / MINGGU
            // =================================================================
            [
                'slug' => 'ppl-ul',
                'name' => 'Push Pull Legs + Upper / Lower',
                'description' => 'Kombinasi hybrid 5 hari terbaik: 3 hari pola gerak (Push, Pull, Legs) ditambah 2 hari Upper & Lower.',
                'days_per_week' => 5,
                'recommendation_level' => 'recommended',
                'min_days' => 5,
                'max_days' => 5,
                'pros' => [
                    'Semua kelompok otot terlatih tepat 2× seminggu dalam jadwal 5 hari.',
                    'Memberi variasi fokus: PPL untuk isolasi detail, Upper/Lower untuk volume majemuk yang efisien.',
                    'Menyediakan 2 hari istirahat penuh setiap minggu untuk pemulihan sistem saraf.',
                ],
                'cons' => [
                    'Menuntut konsistensi 5 hari per minggu agar rotasi mingguan tetap rapi.',
                    'Hari Upper perlu manajemen waktu karena mencakup banyak otot atas sekaligus.',
                ],
                'suitable_for' => 'Pengguna yang bisa latihan 5 hari/minggu dan ingin pertumbuhan otot maksimal yang merata.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 1,
                'sessions' => [
                    $this->buildSession('push', 'Push', 'push', 1, 1),
                    $this->buildSession('pull', 'Pull', 'pull', 2, 2),
                    $this->buildSession('legs', 'Legs', 'legs', 3, 3),
                    $this->buildSession('upper', 'Upper', 'upper', 5, 4),
                    $this->buildSession('lower', 'Lower', 'lower', 6, 5),
                ],
            ],
            [
                'slug' => 'ppl-ap',
                'name' => 'Push Pull Legs + Anterior / Posterior',
                'description' => 'Variasi hybrid 5 hari yang memadukan Push, Pull, Legs dengan sesi Anterior (otot depan) dan Posterior (otot belakang).',
                'days_per_week' => 5,
                'recommendation_level' => 'alternative',
                'min_days' => 5,
                'max_days' => 5,
                'pros' => [
                    'Memecah beban kaki paruh kedua minggu ke Anterior (Quads) dan Posterior (Hamstrings/Glutes).',
                    'Menjaga frekuensi 2× seminggu untuk hampir seluruh kelompok otot utama.',
                    'Sangat baik untuk menyeimbangkan postur sisi depan dan belakang tubuh.',
                ],
                'cons' => [
                    'Membutuhkan jeda istirahat antara hari Legs dan sesi Anterior/Posterior.',
                ],
                'suitable_for' => 'Pengguna 5 hari/minggu yang merasa sesi Lower terpisah kedua terlalu berat.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 2,
                'sessions' => [
                    $this->buildSession('push', 'Push', 'push', 1, 1),
                    $this->buildSession('pull', 'Pull', 'pull', 2, 2),
                    $this->buildSession('legs', 'Legs', 'legs', 3, 3),
                    $this->buildSession('anterior', 'Anterior', 'anterior', 5, 4),
                    $this->buildSession('posterior', 'Posterior', 'posterior', 6, 5),
                ],
            ],
            [
                'slug' => 'ul-ul-arms-5d',
                'name' => 'Upper / Lower ×2 + Arms & Delts',
                'description' => 'Menggunakan fondasi Upper/Lower 4 hari ditambah hari ke-5 khusus untuk lengan (Bisep, Trisep) dan bahu (Delts).',
                'days_per_week' => 5,
                'recommendation_level' => 'alternative',
                'min_days' => 5,
                'max_days' => 5,
                'pros' => [
                    'Mengurangi kepadatan sesi Upper karena latihan isolasi lengan & bahu dipindahkan ke hari khusus.',
                    'Memberi prioritas volume lebih tinggi (3×/minggu) untuk lengan dan bahu samping/belakang.',
                ],
                'cons' => [
                    'Perhatikan pemulihan siku dan bahu apabila hari Upper B dan Arms & Delts diletakkan terlalu berdekatan.',
                ],
                'suitable_for' => 'Pengguna 5 hari/minggu yang ingin fokus ekstra membesarkan lengan dan bahu tanpa mengorbankan frekuensi otot besar.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 3,
                'sessions' => [
                    $this->buildSession('upper-a', 'Upper A', 'upper', 1, 1),
                    $this->buildSession('lower-a', 'Lower A', 'lower', 2, 2),
                    $this->buildSession('upper-b', 'Upper B', 'upper', 4, 3),
                    $this->buildSession('lower-b', 'Lower B', 'lower', 5, 4),
                    $this->buildSession('arms-delts', 'Arms & Delts', 'arms_delts', 6, 5),
                ],
            ],
            [
                'slug' => 'bro-split-5d',
                'name' => 'Bro Split (Chest / Back / Shoulders / Arms / Legs)',
                'description' => 'Program binaraga klasik 5 hari di mana setiap sesi berfokus pada satu kelompok otot besar saja.',
                'days_per_week' => 5,
                'recommendation_level' => 'not_recommended',
                'min_days' => 5,
                'max_days' => 5,
                'pros' => [
                    'Setiap sesi sangat spesifik dan memberi waktu penuh untuk berbagai sudut isolasi satu otot.',
                    'Durasi per hari relatif singkat dan mudah dipahami.',
                ],
                'cons' => [
                    'Setiap kelompok otot hanya dilatih 1×/minggu.',
                    'Jika satu hari terlewat, otot tersebut menunggu hingga minggu depan untuk mendapat stimulus lagi.',
                ],
                'suitable_for' => 'Pengguna berpengalaman atau yang memang ingin menikmati fokus satu otot per hari meski dengan frekuensi 1×/minggu.',
                'not_recommended_reason' => 'Setiap otot hanya dilatih sekali per minggu dengan volume tinggi dalam satu hari, sehingga progres bagi pemula biasanya lebih lambat dan rentan nyeri otot berat (DOMS).',
                'is_active' => true,
                'sort_order' => 4,
                'sessions' => [
                    $this->buildSession('chest', 'Chest', 'chest', 1, 1),
                    $this->buildSession('back', 'Back', 'back', 2, 2),
                    $this->buildSession('shoulders', 'Shoulders', 'shoulders', 3, 3),
                    $this->buildSession('arms', 'Arms', 'arms', 5, 4),
                    $this->buildSession('legs', 'Legs', 'legs', 6, 5),
                ],
            ],

            // =================================================================
            // 6 HARI / MINGGU
            // =================================================================
            [
                'slug' => 'ppl-2x',
                'name' => 'Push / Pull / Legs ×2',
                'description' => 'Program hipertrofi 6 hari yang melatih siklus Push, Pull, dan Legs dua kali penuh setiap minggu dengan 1 hari istirahat.',
                'days_per_week' => 6,
                'recommendation_level' => 'recommended',
                'min_days' => 6,
                'max_days' => 6,
                'pros' => [
                    'Volume mingguan tertinggi yang terbagi rapi dengan frekuensi 2×/minggu per otot.',
                    'Setiap sesi fokus 2–3 kelompok otot yang bekerja sinergis sehingga kelelahan lokal minimal.',
                    'Pola latihan sangat terstruktur dan mudah diingat.',
                ],
                'cons' => [
                    'Hanya menyisakan 1 hari istirahat per minggu; tidur dan nutrisi wajib terjaga.',
                ],
                'suitable_for' => 'Pengguna dengan jadwal fleksibel yang siap berlatih 6 hari seminggu untuk hasil hipertrofi maksimal.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 1,
                'sessions' => [
                    $this->buildSession('push-a', 'Push A', 'push', 1, 1),
                    $this->buildSession('pull-a', 'Pull A', 'pull', 2, 2),
                    $this->buildSession('legs-a', 'Legs A', 'legs', 3, 3),
                    $this->buildSession('push-b', 'Push B', 'push', 4, 4),
                    $this->buildSession('pull-b', 'Pull B', 'pull', 5, 5),
                    $this->buildSession('legs-b', 'Legs B', 'legs', 6, 6),
                ],
            ],
            [
                'slug' => 'upper-lower-6d',
                'name' => 'Upper / Lower ×3',
                'description' => 'Rotasi intensitas tinggi Upper dan Lower bergantian 6 hari per minggu untuk frekuensi 3×/minggu pada setiap kelompok otot.',
                'days_per_week' => 6,
                'recommendation_level' => 'alternative',
                'min_days' => 6,
                'max_days' => 6,
                'pros' => [
                    'Menghadirkan frekuensi 3×/minggu untuk seluruh tubuh dengan sesi yang tetap berfokus separuh badan.',
                    'Sesi A, B, dan C dapat memvariasikan rentang repetisi atau sudut latihan.',
                ],
                'cons' => [
                    'Beban pemulihan sendi bahu, siku, dan punggung bawah sangat tinggi; jumlah set per sesi harus dibatasi (2–3 set/gerakan).',
                ],
                'suitable_for' => 'Pengguna berkapasitas pemulihan sangat baik yang menginginkan frekuensi latihan 3×/minggu.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 2,
                'sessions' => [
                    $this->buildSession('upper-a', 'Upper A', 'upper', 1, 1),
                    $this->buildSession('lower-a', 'Lower A', 'lower', 2, 2),
                    $this->buildSession('upper-b', 'Upper B', 'upper', 3, 3),
                    $this->buildSession('lower-b', 'Lower B', 'lower', 4, 4),
                    $this->buildSession('upper-c', 'Upper C', 'upper', 5, 5),
                    $this->buildSession('lower-c', 'Lower C', 'lower', 6, 6),
                ],
            ],
            [
                'slug' => 'anterior-posterior-6d',
                'name' => 'Anterior / Posterior ×3',
                'description' => 'Melatih otot tubuh depan (Anterior) dan tubuh belakang (Posterior) bergantian selama 6 hari untuk frekuensi 3×/minggu.',
                'days_per_week' => 6,
                'recommendation_level' => 'alternative',
                'min_days' => 6,
                'max_days' => 6,
                'pros' => [
                    'Frekuensi 3×/minggu per otot sambil menghindari sesi kaki tunggal yang terlalu berat tiga kali seminggu.',
                    'Otot depan dan belakang mendapat porsi volume yang sangat seimbang.',
                ],
                'cons' => [
                    'Memerlukan pengaturan beban yang disiplin agar tidak kelelahan menjelang akhir minggu.',
                ],
                'suitable_for' => 'Pengguna 6 hari/minggu yang menginginkan frekuensi 3×/minggu dengan distribusi beban kaki yang terbagi.',
                'not_recommended_reason' => null,
                'is_active' => true,
                'sort_order' => 3,
                'sessions' => [
                    $this->buildSession('anterior-a', 'Anterior A', 'anterior', 1, 1),
                    $this->buildSession('posterior-a', 'Posterior A', 'posterior', 2, 2),
                    $this->buildSession('anterior-b', 'Anterior B', 'anterior', 3, 3),
                    $this->buildSession('posterior-b', 'Posterior B', 'posterior', 4, 4),
                    $this->buildSession('anterior-c', 'Anterior C', 'anterior', 5, 5),
                    $this->buildSession('posterior-c', 'Posterior C', 'posterior', 6, 6),
                ],
            ],
            [
                'slug' => 'bro-split-6d',
                'name' => 'Bro Split (6 Hari)',
                'description' => 'Versi 6 hari dari Bro Split: Chest, Back, Legs A (Quads/Calves), Shoulders, Arms, dan Legs B (Hamstrings/Glutes/Core).',
                'days_per_week' => 6,
                'recommendation_level' => 'not_recommended',
                'min_days' => 6,
                'max_days' => 6,
                'pros' => [
                    'Beban kaki terbagi menjadi dua hari terpisah sehingga setiap sesi kaki lebih fokus.',
                    'Sesi tubuh atas sangat spesifik pada satu area per kunjungan gym.',
                ],
                'cons' => [
                    'Dengan komitmen 6 hari/minggu ke gym, sebagian besar otot (Dada, Punggung, Bahu, Lengan) tetap hanya terlatih 1×/minggu.',
                    'Efisiensi jauh lebih rendah dibanding Push/Pull/Legs ×2 yang sama-sama 6 hari.',
                ],
                'suitable_for' => 'Pengguna yang sudah paham preferensi latihan satu otot per hari dan tetap ingin melatih kaki dalam 2 sesi terpisah.',
                'not_recommended_reason' => 'Berlatih 6 hari per minggu tetapi hanya melatih dada, punggung, bahu, dan lengan 1×/minggu membuat potensi hipertrofi jauh kurang efisien dibanding Push/Pull/Legs ×2.',
                'is_active' => true,
                'sort_order' => 4,
                'sessions' => [
                    $this->buildSession('chest', 'Chest', 'chest', 1, 1),
                    $this->buildSession('back', 'Back', 'back', 2, 2),
                    $this->buildSession('legs-quads', 'Legs A (Quads & Calves)', 'legs', 3, 3, [
                        'muscle_groups' => ['quads', 'calves'],
                        'muscle_regions' => ['quads', 'calves'],
                        'is_heavy' => true,
                    ]),
                    $this->buildSession('shoulders', 'Shoulders', 'shoulders', 4, 4),
                    $this->buildSession('arms', 'Arms & Core', 'arms', 5, 5),
                    $this->buildSession('legs-posterior', 'Legs B (Hamstrings, Glutes & Core)', 'legs', 6, 6, [
                        'muscle_groups' => ['hamstrings', 'glutes', 'core'],
                        'muscle_regions' => ['hamstrings', 'glutes', 'core'],
                        'is_heavy' => true,
                    ]),
                ],
            ],
        ];

        $seededSplits = [];

        foreach ($splits as $splitData) {
            $sessions = $splitData['sessions'];
            unset($splitData['sessions']);

            $split = Split::updateOrCreate(
                ['slug' => $splitData['slug']],
                $splitData
            );

            $seededSessions = [];
            foreach ($sessions as $sessionData) {
                $seededSessions[$sessionData['slug']] = SplitSession::updateOrCreate(
                    [
                        'split_id' => $split->id,
                        'slug' => $sessionData['slug'],
                    ],
                    $sessionData
                );
            }

            $seededSplits[$split->slug] = [
                'split' => $split,
                'sessions' => $seededSessions,
            ];
        }

        // Safe migration for existing 2-day users previously linked to `full-body` (now 3-day specific)
        $this->migrateLegacyTwoDayFullBodyPlans($seededSplits);
    }

    /**
     * Remap any existing active/inactive 2-day UserPlan rows that referenced the old `full-body`
     * (which previously covered min_days=2, max_days=3) to the dedicated `full-body-2d` split.
     * Preserves all user_plans, plan_schedules, and daily_sessions history without orphan FKs.
     *
     * @param  array<string, array{split: Split, sessions: array<string, SplitSession>}>  $seededSplits
     */
    private function migrateLegacyTwoDayFullBodyPlans(array $seededSplits): void
    {
        $legacyFullBody = $seededSplits['full-body'] ?? null;
        $newFullBody2d = $seededSplits['full-body-2d'] ?? null;

        if (!$legacyFullBody || !$newFullBody2d) {
            return;
        }

        $oldSplitId = $legacyFullBody['split']->id;
        $newSplitId = $newFullBody2d['split']->id;

        $plansToMigrate = UserPlan::query()
            ->where('split_id', $oldSplitId)
            ->where('days_per_week', 2)
            ->get();

        if ($plansToMigrate->isEmpty()) {
            return;
        }

        $oldA = $legacyFullBody['sessions']['full-body-a']?->id;
        $oldB = $legacyFullBody['sessions']['full-body-b']?->id;
        $oldC = $legacyFullBody['sessions']['full-body-c']?->id;

        $newA = $newFullBody2d['sessions']['full-body-a']?->id;
        $newB = $newFullBody2d['sessions']['full-body-b']?->id;

        DB::transaction(function () use ($plansToMigrate, $newSplitId, $oldA, $oldB, $oldC, $newA, $newB) {
            foreach ($plansToMigrate as $plan) {
                $plan->update(['split_id' => $newSplitId]);

                if ($oldA && $newA) {
                    PlanSchedule::where('user_plan_id', $plan->id)
                        ->where('split_session_id', $oldA)
                        ->update(['split_session_id' => $newA]);

                    DailySession::where('user_plan_id', $plan->id)
                        ->where('split_session_id', $oldA)
                        ->update(['split_session_id' => $newA]);
                }

                $targetBIds = array_values(array_filter([$oldB, $oldC]));
                if (!empty($targetBIds) && $newB) {
                    PlanSchedule::where('user_plan_id', $plan->id)
                        ->whereIn('split_session_id', $targetBIds)
                        ->update(['split_session_id' => $newB]);

                    DailySession::where('user_plan_id', $plan->id)
                        ->whereIn('split_session_id', $targetBIds)
                        ->update(['split_session_id' => $newB]);
                }
            }
        });
    }
}
