# LLM Context: TrainSmart Monorepo

> **Purpose:** This document is designed as a complete, comprehensive context primer for Large Language Models (ChatGPT, Claude, Gemini, etc.) to understand the architecture, domain logic, design system, data contracts, and workflows of the **TrainSmart** application.

---

## 1. Project Overview & Domain

**TrainSmart** is a Hypertrophy & Gym Workout Tracker designed around evidence-based bodybuilding and strength training principles. It provides a structured system to ensure **Progressive Overload** by tracking:
- Target weight (KG) and repetitions
- **RIR (Reps In Reserve)**: 
  - `0`: Muscular failure
  - `1–2`: Hypertrophic sweet-spot (Near-failure with form preservation)
  - `3+`: Sub-maximal / warm-up sets
- Rest timers (default 2 minutes) for ATP/phosphocreatine recovery
- Total tonnage/volume accumulation ($kg \times reps$)
- 3-tier user role hierarchy: **Member/Client**, **Personal Trainer (PT)**, and **Administrator**

---

## 2. Monorepo Architecture

This project is configured as a Turborepo monorepo:

```text
my-monorepo/
├── frontend/             # Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons
├── backend/              # Laravel 11/12 REST API, Laravel Sanctum, SQLite/MySQL
├── docs/                 # Docusaurus documentation workspace
├── package.json          # Root workspace configuration (Turborepo)
├── turbo.json            # Turborepo task pipeline
└── .agents/ & .agent/    # AI Agent skills, hooks, and impeccable skill configuration
```

### Monorepo Scripts (`npm run <script>`)
- `dev`: `turbo run dev`
- `build`: `turbo run build`
- `lint`: `turbo run lint`
- `dev:frontend`: `npm run dev --workspace=frontend` (Next.js on `http://localhost:3000`)
- `dev:backend`: `php backend/artisan serve` (Laravel API on `http://127.0.0.1:8000`)
- `dev:docs`: `npm run dev --workspace=docs`

---

## 3. Frontend Architecture (Next.js)

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 (`@import "tailwindcss";` in `app/globals.css`), inline `@theme` tokens
- **Icons:** `lucide-react`
- **Typography:** `Geist` (Sans) and `Geist_Mono` (tabular numerals for logs and timers)
- **State Management:** React Context (`AuthContext.tsx`) + Local State / Server Components

### Directory Structure (`frontend/app`)
- `app/layout.tsx`: Root HTML shell, Geist fonts, `AuthProvider`, sticky `Navbar`.
- `app/page.tsx`: Main dashboard with workout split cards (`Push`, `Pull`, `Legs`), hypertrophy metrics, and recent logs list.
- `app/workout/[id]/page.tsx`: Dynamic category workout session page with split information.
- `app/components/WorkoutPlanner.tsx`: Two-phase workout interface:
  - **Phase 1 (Preparation):** Adjust target set count per exercise, edit technique cues (tempo, bench angle), add custom exercise variations, view session summary.
  - **Phase 2 (Gym Execution Tracker):** Sequential set logging, weight/reps inputs, RIR selector, rest timer countdown with SVG progress ring (minimizable to sticky top bar), exercise quick-switch rail, live session duration timer, and workout summary save modal.
- `app/components/Navbar.tsx`: Sticky navigation bar with role-based routing and a dedicated horizontal scrollable strip for mobile viewports.
- `app/login/page.tsx`: Email/password authentication form.
- `app/register/page.tsx`: Account creation with interactive role selection (`client` vs `trainer`), trainer selection dropdown, or trainer specialization input.
- `app/client/progress/page.tsx`: Client-facing hypertrophy analytics: total sets, total tonnage, average RIR, active coach banner, and complete set log history.
- `app/client/trainer/page.tsx`: Directory of available Personal Trainers with specialization details and 1-click trainer assignment/removal.
- `app/trainer/page.tsx`: Trainer portal for client roster management, adding clients via email, and inspecting individual client progressive overload reports.
- `app/admin/page.tsx`: System dashboard with platform KPIs (total users, trainers, clients, sets, tonnage) and user management table to reassign roles or assign trainers.

### Frontend API Layer (`frontend/lib/api.ts`)
- Configured against `NEXT_PUBLIC_API_URL` (default: `http://127.0.0.1:8000/api`).
- Uses Bearer tokens persisted in `localStorage` under key `trainsmart_token`.

---

## 4. Design System ("Athletic Chalk & Slate" - Impeccable Skill)

The UI adheres strictly to **Operate-mode** design principles (optimized for bright gym environments and mobile scanning):
- **Canvas / Background:** `#F5F6F3` (`--bg-canvas`) — low-glare daylight contrast
- **Surface / Cards:** `#FFFFFF` (`--bg-surface`) with structural `#DCE1D8` borders
- **Secondary Surfaces:** `#ECEFE9` (`--bg-subtle`) for stat strips and table headers
- **Text:** `#141916` (Primary, high-contrast), `#48524C` (Secondary), `#626E67` (Metadata)
- **Semantic Colors:**
  - **Push / Primary Accent:** Terracotta `#C84B11` (`#FFF1EA` soft bg, `#F4C4AC` border)
  - **Pull / Trainers / Information:** Deep Cobalt `#1D4ED8` (`#EFF6FF` soft bg, `#BFDBFE` border)
  - **Legs / Completed / Success:** Deep Pine Emerald `#047857` (`#ECFDF5` soft bg, `#A7F3D0` border)
  - **Admin / Failure / Destructive:** Deep Crimson `#BE123C` (`#FFF1F2` soft bg, `#FECDD3` border)
- **Touch Targets:** Minimum `44px` (`h-11`) for numeric inputs, buttons, and steppers.
- **Rules Enforced:** Tabular numbers (`tabular-nums`) for all weights, sets, timers, and volumes; zero raw emojis in UI chrome (replaced with Lucide icons); zero ambient decorative glow/blur blobs; accessible focus rings (`:focus-visible`).

---

## 5. Backend Architecture (Laravel REST API)

- **Framework:** Laravel 11/12
- **Authentication:** Laravel Sanctum (Bearer Token)
- **Authorization:** `CheckRole` Middleware (`role:admin`, `role:trainer,admin`)
- **Database Tables / Models:**
  - `users`: `id`, `name`, `email`, `password`, `role` (`client` | `trainer` | `admin`), `phone`, `specialization`, `trainer_id` (foreign key self-reference to `users.id`)
  - `categories`: `id`, `name` (`Push`, `Pull`, `Legs`, etc.)
  - `exercises`: `id`, `category_id`, `name`
  - `workout_logs`: `id`, `user_id`, `exercise_id`, `set_number`, `weight`, `reps`, `rir`, `rpe`, `notes`, `created_at`

### Complete API Route Reference (`backend/routes/api.php`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/register` | Public | None | Register new user as `client` or `trainer` |
| `POST` | `/api/login` | Public | None | Authenticate and issue Sanctum token |
| `GET` | `/api/categories` | Public | None | Get all workout splits with exercise lists |
| `GET` | `/api/categories/{id}` | Public | None | Get single workout split by ID |
| `GET` | `/api/trainers` | Public | None | Get list of all registered Personal Trainers |
| `GET` | `/api/workout-logs` | Public | None | Get recent workout history |
| `POST` | `/api/workout-logs` | Optional | None | Batch save completed set logs |
| `GET` | `/api/me` or `/api/user` | Required | Any | Get current authenticated user profile |
| `POST` | `/api/logout` | Required | Any | Revoke active Sanctum token |
| `POST` | `/api/client/select-trainer` | Required | Client | Assign or remove personal trainer |
| `GET` | `/api/client/my-progress` | Required | Client | Analytics: total sets, tonnage, average RIR, logs |
| `GET` | `/api/trainer/clients` | Required | Trainer, Admin | Get assigned client roster |
| `POST` | `/api/trainer/clients` | Required | Trainer, Admin | Connect a client by email address |
| `DELETE` | `/api/trainer/clients/{id}` | Required | Trainer, Admin | Disconnect a client from trainer roster |
| `GET` | `/api/trainer/clients/{id}/progress`| Required | Trainer, Admin | Inspect detailed client workout logs & stats |
| `GET` | `/api/admin/stats` | Required | Admin | Global counts (users, trainers, logs, tonnage) |
| `GET` | `/api/admin/users` | Required | Admin | List users with optional `?role=` filter |
| `PATCH` | `/api/admin/users/{id}` | Required | Admin | Update user role or assigned trainer |
| `DELETE` | `/api/admin/users/{id}` | Required | Admin | Delete user account and cascade logs |
| `POST` | `/api/admin/exercises` | Required | Admin | Create exercise under a category |

---

## 6. TypeScript Data Contracts (`frontend/types/workout.ts`)

```typescript
export type UserRole = "admin" | "trainer" | "client";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  trainer_id?: number | null;
  phone?: string | null;
  specialization?: string | null;
  trainer?: User | null;
  clients?: User[];
  clients_count?: number;
  workout_logs_count?: number;
}

export interface SetData {
  weight: string;
  reps: string;
  rir: number; // 0 = failure, 1-2 = optimal hypertrophy, 3+ = warm-up
  rpe?: number;
  notes?: string;
  isCompleted: boolean;
}

export interface Exercise {
  id: number;
  category_id?: number;
  name: string;
  targetSets?: number;
  setsData?: SetData[];
  notes?: string;
}

export interface Category {
  id: number;
  name: string;
  exercises: Exercise[];
}

export interface WorkoutLogEntry {
  id?: number;
  user_id?: number | null;
  exercise_id: number;
  exercise?: Exercise;
  set_number: number;
  weight: number | string;
  reps: number | string;
  rir?: number | null;
  rpe?: number | null;
  notes?: string | null;
  created_at?: string;
}
```

---

## 7. Guidelines for LLMs Modifying this Codebase

1. **Preserve API Compatibility:** Keep endpoints, parameter names, and token-handling in sync between `frontend/lib/api.ts` and `backend/routes/api.php`.
2. **Adhere to the Design System:** 
   - Never reintroduce dark background classes (`bg-zinc-950`, `bg-zinc-900`) or raw emojis in UI buttons/cards.
   - Use Lucide icons consistently.
   - Maintain minimum `44px` touch targets for input controls.
   - Use `tabular-nums` on all numeric data displays.
3. **Hypertrophy Domain Truths:**
   - Always treat RIR (Reps in Reserve) as the primary proximity-to-failure metric.
   - Keep default rest periods at 120 seconds (2 minutes).
   - Ensure sets are validated sequentially (Set 1 must be logged before Set 2).
4. **Next.js & Monorepo Constraints:**
   - Always run frontend commands from the root with `--workspace=frontend` or inside the `frontend/` directory.
   - Respect client boundaries (`"use client"`) for pages containing interactive hooks (`useState`, `useEffect`, `useAuth`).
