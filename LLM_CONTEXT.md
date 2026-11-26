# LLM Context: TrainSmart Monorepo

> **Purpose:** Complete context primer for Large Language Models (ChatGPT, Claude, Gemini, etc.) covering the architecture, domain logic, database schema, API endpoints, frontend routes, and design system of the **TrainSmart** Workout Guide & Hypertrophy Tracker application.

---

## 1. Project Overview & Domain

**TrainSmart** is an Indonesian-language beginner-friendly **Dynamic Workout Guide & Hypertrophy Tracker**. It guides gym beginners from choosing how many days per week they can train through split recommendation, exercise learning (with local start/end demonstration photos), drag-and-drop weekly scheduling, daily workout execution, weekly rule-based evaluation, and Personal Trainer / Admin supervision.

Core domain rules:
- **Hypertrophy & Progressive Overload:** Tracks weight (KG), reps, **RIR (Reps In Reserve: `0` failure, `1–2` optimal hypertrophy, `3+` warm-up)**, tonnage ($kg \times reps$), and 120s rest periods.
- **Role Hierarchy:** `client` (Member), `trainer` (Personal Trainer), and `admin` (Administrator).
- **Language:** All user-facing UI copy, split descriptions/pros/cons, schedule warnings, and evaluation suggestions are in **Indonesian**. Exercise dataset names and raw instructions come from `free-exercise-db` (English standard gym names) paired with Indonesian coaching tips/mistakes.

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
- `php backend/artisan exercises:import` — Idempotent importer for `free-exercise-db` (240 exercises + 480 local images across 10 muscle groups)
- `Push-Location backend; php artisan test; Pop-Location` — PHPUnit test suite

---

## 3. Database Schema (Laravel Migrations)

### Core & Expanded Tables
- **`users`**: `id`, `name`, `email`, `password`, `role` (`client|trainer|admin`), `trainer_id` (nullable FK → `users`), `phone`, `specialization`.
- **`categories`**: `id`, `name` (legacy Push/Pull/Legs splits, preserved).
- **`exercises`**: `id`, `category_id` (nullable FK), `name`, `slug` (unique), `primary_muscle` (`chest`, `back`, `shoulders`, `biceps`, `triceps`, `quads`, `hamstrings`, `glutes`, `calves`, `core`), `secondary_muscles` (json), `equipment`, `movement_pattern`, `difficulty` (`beginner|intermediate|advanced`), `is_beginner_friendly` (bool), `instructions` (json), `common_mistakes` (json), `tips` (json), `video_url`, `is_active` (bool), `source`.
- **`exercise_images`**: `id`, `exercise_id` (FK), `path` (relative path in `storage/app/public`, e.g. `exercises/{slug}/0.jpg`), `position` (`0` = start, `1` = end), `alt_text`. Model appends `url`.
- **`splits`**: `id`, `slug` (unique), `name`, `description`, `min_days`, `max_days`, `pros` (json), `cons` (json), `suitable_for`, `is_active`, `sort_order`.
  - Seeded by `SplitSeeder`: `full-body` (2–3 days), `upper-lower` (4 days), `ppl-ul` (5 days), `ppl-ap` (5 days), `ppl-2x` (6 days).
- **`split_sessions`**: `id`, `split_id` (FK), `slug`, `name`, `session_type`, `muscle_groups` (json), `default_day_of_week` (1–7), `sort_order`.
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
| `GET` | `/api/splits/recommendations?days={2..6}` | Split recommendations (FormRequest validated `2..6`) |
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
| `GET` | `/api/user/plan` | Any | Active `UserPlan`, 7-day `schedules`, and advisory `warnings` |
| `POST` | `/api/user/plan` | Any | Save active plan + 7-day schedule (returns `201` + advisory `warnings`) |
| `POST` | `/api/user/plan/validate-schedule` | Any | Dry-run schedule advisory validation |
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
| `GET` / `PATCH` | `/api/admin/splits` | Admin | Manage split metadata |

---

## 5. Frontend Routes & Components (`frontend/app/`)

- `/` (`page.tsx` + `TodayDashboardSection.tsx`): Today's scheduled session card (Start Workout, Done, Skip, Trainer note, exercise preview with `"Cara"` modal, 7-day week strip) + legacy split cards & recent logs.
- `/onboarding` (`onboarding/page.tsx` + `ScheduleBuilder.tsx`): 4-step wizard (`1. Hari Latihan` -> `2. Pilih Split` -> `3. Daftar Gerakan` -> `4. Atur Jadwal` with `@dnd-kit` drag-and-drop, `"Gunakan Rekomendasi"`, and live advisory warnings).
- `/session/[id]` (`session/[id]/page.tsx`): Launches `WorkoutPlanner` for a specific `DailySession`, showing exercise thumbnails and `"Cara"` detail modal while logging sets.
- `/workout/[id]` (`workout/[id]/page.tsx`): Preserved legacy category workout session using `WorkoutPlanner`.
- `/exercises` (`exercises/page.tsx`): Searchable, filterable Exercise Library (`muscle`, `equipment`, `difficulty`, `beginner_only`) with `ExerciseThumbnail` (`next/image`) and `ExerciseDetailModal`.
- `/credits` (`credits/page.tsx`): Attribution page for `yuhonas/free-exercise-db` (The Unlicense / Public Domain).
- `/evaluation` (`evaluation/page.tsx`): Weekly evaluation dashboard (`Minggu Lalu` / `Minggu Ini`), 4 KPI cards, rule-based suggestions, and 7-day breakdown.
- `/client/progress`, `/client/trainer`, `/trainer`, `/admin`, `/login`, `/register`.

---

## 6. Design System ("Athletic Chalk & Slate") & Guidelines

- **Palette:** Canvas `#F5F6F3`, Surface `#FFFFFF`, Subtle `#ECEFE9`, Borders `#DCE1D8` / `#C5CCC0`, Text `#141916` / `#48524C` / `#626E67`, Primary Terracotta `#C84B11`, Cobalt `#1D4ED8`, Emerald `#047857`, Crimson `#BE123C`, Amber `#B45309`.
- **Rules:** `tabular-nums` on all numbers, `44px` minimum touch targets (`h-11`), Lucide icons only (zero emojis in UI chrome), no decorative glow/blur blobs, no eyebrow labels above headings, `next/image` for exercise photos (`dangerouslyAllowLocalIP: process.env.NODE_ENV === "development"` in `next.config.ts`).
- **Sync Rule:** Always keep `frontend/lib/api.ts`, `frontend/types/workout.ts`, and `backend/routes/api.php` synchronized.
