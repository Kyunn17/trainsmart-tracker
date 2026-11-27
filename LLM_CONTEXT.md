# LLM Context: TrainSmart Monorepo

> **Purpose:** Complete context primer for Large Language Models (ChatGPT, Claude, Gemini, etc.) covering the architecture, domain logic, database schema, API endpoints, frontend routes, and design system of the **TrainSmart** Workout Guide & Hypertrophy Tracker application.

---

## 1. Project Overview & Domain

**TrainSmart** is an Indonesian-language beginner-friendly **Dynamic Workout Guide & Hypertrophy Tracker**. It guides gym beginners from choosing how many days per week they can train through split recommendation, exercise learning (with local start/end demonstration photos), drag-and-drop weekly scheduling, daily workout execution, weekly rule-based evaluation, and Personal Trainer / Admin supervision.

Core domain rules:
- **Hypertrophy & Progressive Overload:** Tracks weight (KG), reps, **RIR (Reps In Reserve: `0` failure, `1–2` optimal hypertrophy, `3+` warm-up)**, tonnage ($kg \times reps$), and 120s rest periods.
- **Role Hierarchy:** `client` (Member), `trainer` (Personal Trainer), and `admin` (Administrator).
- **Language:** All user-facing UI copy, split descriptions/pros/cons, curated exercise instructions/mistakes/tips, schedule warnings, and evaluation suggestions are in **Indonesian** (with standard international gym exercise names).

---

## 2. Monorepo Architecture

```text
my-monorepo/
├── frontend/             # Next.js 16 (App Router), React 19, Tailwind CSS v4, @dnd-kit, Lucide
├── backend/              # Laravel 13 REST API, Laravel Sanctum, MySQL / SQLite (tests)
├── docs/                 # Docusaurus documentation workspace
├── package.json          # Turborepo workspace configuration
├── turbo.json            # Turborepo pipeline
└── .agents/ & .agent/    # AI Agent skills & hooks (impeccable)
```

### Scripts
- `npm run dev:frontend` — Next.js dev server (`http://localhost:3000`)
- `npm run dev:backend` — Laravel API server (`http://127.0.0.1:8000`)
- `npm run build:frontend` — Production Next.js build
- `php backend/artisan migrate` / `php backend/artisan db:seed`
- `php backend/artisan db:seed --class=CuratedExerciseSeeder` — Idempotent seeder for TrainSmart's owned 53-exercise curated library (`backend/database/data/curated_exercises.php`) across 15 muscle sub-regions.
- `Push-Location backend; php artisan test; Pop-Location` — PHPUnit test suite

---

## 3. Database Schema (Laravel Migrations)

### Core & Expanded Tables
- **`users`**: `id`, `name`, `email`, `password`, `role` (`client|trainer|admin`), `trainer_id` (nullable FK → `users`), `phone`, `specialization`.
- **`categories`**: `id`, `name` (legacy Push/Pull/Legs splits, preserved).
- **`exercises`**: `id`, `category_id` (nullable FK), `user_id` (nullable FK → `users`, `null` = official library), `name`, `slug` (unique), `primary_muscle`, `muscle_region` (`upper_chest`, `middle_chest`, `lower_chest`, `front_delt`, `lateral_delt`, `rear_delt`, `triceps`, `lats`, `mid_back`, `biceps`, `quads`, `hamstrings`, `glutes`, `calves`, `core`), `secondary_muscles` (json), `equipment`, `movement_pattern`, `difficulty`, `is_beginner_friendly` (bool), `instructions` (json), `common_mistakes` (json), `tips` (json), `video_url`, `is_active` (bool), `is_custom` (bool), `approval_status` (`pending|approved|rejected`), `rejection_reason`, `source` (`curated|user_custom`), `deleted_at` (`SoftDeletes`). Enforced by `ExercisePolicy`.
- **`exercise_images`**: `id`, `exercise_id` (FK), `path` (relative path in `storage/app/public`, e.g. `exercises/{slug}/0.jpg`), `position` (`0` = start, `1` = end), `alt_text`. Model appends `url`.
- **`splits`**: `id`, `slug` (unique), `name`, `description`, `days_per_week` (`2..6`, indexed), `recommendation_level` (`recommended|alternative|not_recommended`), `min_days`, `max_days`, `pros` (json), `cons` (json), `suitable_for`, `not_recommended_reason` (nullable text), `is_active`, `sort_order`. Appends computed `muscle_frequency` (map of 10 major muscle groups to weekly counts).
  - Seeded idempotently by `SplitSeeder` (18 splits across 2–6 days/week, safely migrating legacy 2-day `full-body` `user_plans` to `full-body-2d`):
    - **2 days:** `full-body-2d` (recommended), `upper-lower-2d` (alternative)
    - **3 days:** `full-body` (recommended), `ul-fb-3d`, `ap-fb-3d`, `ppl-3d` (alternatives)
    - **4 days:** `upper-lower` (recommended), `anterior-posterior-4d`, `ppl-fb-4d` (alternatives), `bro-split-4d` (not_recommended)
    - **5 days:** `ppl-ul` (recommended), `ppl-ap`, `ul-ul-arms-5d` (alternatives), `bro-split-5d` (not_recommended)
    - **6 days:** `ppl-2x` (recommended), `upper-lower-6d`, `anterior-posterior-6d` (alternatives), `bro-split-6d` (not_recommended)
- **`split_sessions`**: `id`, `split_id` (FK), `slug`, `name`, `session_type`, `muscle_groups` (json), `muscle_regions` (json, used by `CuratedExerciseSeeder` for automatic exercise-to-session mapping), `is_heavy` (bool), `default_day_of_week` (1–7), `sort_order`.
  - Canonical 13 session templates defined in `SplitSession::TEMPLATES`: `full_body`, `upper`, `lower`, `push`, `pull`, `legs`, `anterior`, `posterior`, `arms_delts`, `chest`, `back`, `shoulders`, `arms`.
- **`exercise_split_session`**: pivot linking `split_session_id` ↔ `exercise_id` with `is_default_recommended`, `default_sets`, `default_rep_range`, `sort_order`.
- **`user_plans`**: `id`, `user_id` (FK), `split_id` (FK), `days_per_week`, `is_active`, `onboarding_completed_at`.
- **`plan_schedules`**: `id`, `user_plan_id` (FK), `day_of_week` (`1`=Mon..`7`=Sun), `split_session_id` (nullable FK; `null` = Rest Day).
- **`daily_sessions`**: `id`, `user_id` (FK), `user_plan_id` (nullable FK), `split_session_id` (nullable FK), `session_date` (date, unique per user), `status` (`pending|done|skipped|rest`), `trainer_note`, `changed_by` (FK → `users`), `changed_by_role`, `completed_at`.
- **`coaching_requests`**: `id`, `client_id` (FK), `trainer_id` (FK), `status` (`pending|accepted|rejected`), `message`, `responded_at`.
- **`workout_logs`**: `id`, `user_id`, `exercise_id`, `daily_session_id` (nullable FK → `daily_sessions`), `set_number`, `weight`, `reps`, `rir`, `rpe`, `notes`, `created_at`.

---

## 4. Complete API Route Reference (`backend/routes/api.php`)

### Public Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Register user (`client` or `trainer`), returns Sanctum token |
| `POST` | `/api/login` | Login and issue Sanctum token |
| `GET` | `/api/categories` / `/api/menu-latihan` | Legacy split categories with exercises |
| `GET` | `/api/categories/{id}` | Single legacy category |
| `GET` | `/api/splits/recommendations?days={2..6}` | All active split options for `days_per_week` ordered by `recommendation_level` (`recommended` first), with `sessions` and computed `muscle_frequency` |
| `GET` | `/api/splits/{id}` | Split details + sessions + recommended exercises with images (`?all_exercises=1` for all) |
| `GET` | `/api/exercises` | Paginated search/filter (`search`, `muscle`, `equipment`, `difficulty`, `beginner_only`, `session_type`, `per_page`) |
| `GET` | `/api/exercises/{idOrSlug}` | Full exercise guide, images, and mapped split sessions |
| `GET` | `/api/trainers` | Public directory of registered Personal Trainers |
| `GET` | `/api/workout-logs` | Recent workout history |
| `POST` | `/api/workout-logs` | Batch save set logs (accepts optional `daily_session_id` to mark session `done`) |

### Authenticated Endpoints (`auth:sanctum`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/me` / `/api/user` | Any | Current user profile |
| `POST` | `/api/logout` | Any | Revoke current token |
| `GET` | `/api/user/plan` | Any | Active `UserPlan`, 7-day `schedules`, advisory `warnings`, and computed `muscle_frequency` |
| `POST` | `/api/user/plan` | Any | Save active plan + 7-day schedule (returns `201` + advisory `warnings` + `muscle_frequency`) |
| `POST` | `/api/user/plan/validate-schedule` | Any | Dry-run data-driven schedule advisory validation (`no_rest_day`, `days_count_mismatch`, `no_lower_body_session`, `no_chest_session`, `no_back_session`, region-aware `consecutive_muscle_overlap`) |
| `GET` | `/api/daily-sessions/today` | Any | Materialize/fetch today's session + 7-day `week_overview` |
| `GET` | `/api/daily-sessions/{id}` | Owner | Single daily session with exercises & images |
| `PATCH` | `/api/daily-sessions/{id}/status` | Owner | Update status (`409` if overridden by trainer) |
| `GET` | `/api/evaluation/weekly?period=last_week\|current_week` | Any | Weekly adherence, tonnage delta, avg RIR, and 1–2 rule-based suggestions |
| `POST` | `/api/client/select-trainer` | Client | Direct unassign/assign trainer |
| `GET` | `/api/client/my-progress` | Client | Client personal progress summary & logs |
| `GET` | `/api/client/coaching-requests` | Client | View sent coaching requests |
| `POST` | `/api/client/coaching-requests` | Client | Send coaching request to a trainer |
| `GET` | `/api/trainer/clients` | Trainer, Admin | Linked client roster |
| `POST` | `/api/trainer/clients` | Trainer, Admin | Connect client by email |
| `DELETE` | `/api/trainer/clients/{id}` | Trainer, Admin | Disconnect client |
| `GET` | `/api/trainer/clients/{id}/progress` | Trainer, Admin | View linked client's progress |
| `GET` | `/api/trainer/clients/{id}/today` | Trainer, Admin | View linked client's today schedule/status |
| `PATCH` | `/api/trainer/clients/{id}/daily-sessions/{date}` | Trainer, Admin | Override client status (`rest|skipped|pending|done`) with required `trainer_note` |
| `GET` | `/api/trainer/coaching-requests` | Trainer, Admin | View incoming coaching requests |
| `PATCH` | `/api/trainer/coaching-requests/{id}` | Trainer, Admin | Accept or reject coaching request (`accepted` links `trainer_id`) |
| `GET` | `/api/admin/stats` | Admin | Platform metrics |
| `GET` / `PATCH` / `DELETE` | `/api/admin/users` | Admin | User/role/trainer management |
| `GET` / `POST` / `PATCH` | `/api/admin/exercises` | Admin | Manage exercise catalog |
| `POST` / `DELETE` | `/api/admin/exercises/{id}/images` | Admin | Upload (`jpg/jpeg/png/webp`, max 2MB, UUID filename) or delete images |
| `GET` / `POST` / `PATCH` / `DELETE` | `/api/my-exercises` | Any | Private custom exercise CRUD (non-admin submissions start `pending` with anti-spam max 5 concurrent pending; safe archive if used in logs) |
| `POST` / `DELETE` | `/api/my-exercises/{id}/images` | Owner/Admin | Upload/delete local images for custom exercises |
| `POST` | `/api/admin/exercises/{id}/review` | Admin | Approve (ACC) or reject (with reason) a user's custom exercise |
| `POST` | `/api/admin/exercises/{id}/promote` | Admin | Promote a custom exercise to the official curated library |
| `GET` / `PATCH` | `/api/admin/splits` | Admin | Manage split metadata |

---

## 5. Frontend Routes & Components (`frontend/app/`)

- `/` (`page.tsx` + `TodayDashboardSection.tsx`): Today's scheduled session card (Start Workout, Done, Skip, Trainer note, exercise preview with `"Cara"` modal, 7-day week strip) + legacy split cards & recent logs.
- `/onboarding` (`onboarding/page.tsx` + `ScheduleBuilder.tsx`): 4-step wizard (`1. Hari Latihan` -> `2. Pilih Split` grouped by `recommendation_level` with badges, computed muscle frequency, honest `not_recommended` explanations, and 2-split comparison -> `3. Daftar Gerakan` -> `4. Atur Jadwal` with `@dnd-kit` drag-and-drop, smart `"Gunakan Rekomendasi"`, live weekly muscle frequency summary, and data-driven advisory warnings).
- `/session/[id]` (`session/[id]/page.tsx`): Launches `WorkoutPlanner` for a specific `DailySession`, showing exercise thumbnails and `"Cara"` detail modal while logging sets.
- `/workout/[id]` (`workout/[id]/page.tsx`): Preserved legacy category workout session using `WorkoutPlanner`.
- `/exercises` (`exercises/page.tsx`): Searchable, filterable Exercise Library (`muscle`, `muscle_region`, `equipment`, `difficulty`, `scope`, `beginner_only`) with `ExerciseThumbnail`, `ExerciseDetailModal`, `"Custom"` badges, and `"Ajukan Gerakan Custom"` modal (`CustomExerciseModal`).
- `/my-exercises` (`my-exercises/page.tsx`): User's private custom exercise manager showing approval statuses (`Menunggu ACC Admin`, `Disetujui & Aktif`, `Ditolak`), edit/re-submit, and safe archive/delete.
- `/evaluation` (`evaluation/page.tsx`): Weekly evaluation dashboard (`Minggu Lalu` / `Minggu Ini`), 4 KPI cards, rule-based suggestions, and 7-day breakdown.
- `/client/progress`, `/client/trainer`, `/trainer`, `/admin`, `/login`, `/register`.

---

## 6. Design System ("Athletic Chalk & Slate") & Guidelines

- **Palette:** Canvas `#F5F6F3`, Surface `#FFFFFF`, Subtle `#ECEFE9`, Borders `#DCE1D8` / `#C5CCC0`, Text `#141916` / `#48524C` / `#626E67`, Primary Terracotta `#C84B11`, Cobalt `#1D4ED8`, Emerald `#047857`, Crimson `#BE123C`, Amber `#B45309`.
- **Rules:** `tabular-nums` on all numbers, `44px` minimum touch targets (`h-11`), Lucide icons only (zero emojis in UI chrome), no decorative glow/blur blobs, no eyebrow labels above headings, `next/image` for exercise photos (`dangerouslyAllowLocalIP: process.env.NODE_ENV === "development"` in `next.config.ts`).
- **Sync Rule:** Always keep `frontend/lib/api.ts`, `frontend/types/workout.ts`, and `backend/routes/api.php` synchronized.
